import re
import uuid
import logging
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_db
from app.models.user import User
from app.schemas.listing import ListingCardResponse
from app.repositories.listing_repo import get_listing_by_id, search_listings

logger = logging.getLogger(__name__)

# TODO: Add rate limiting (e.g. 20 requests/minute per IP) before production

router = APIRouter(tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    listing_id: Optional[str] = None
    city: Optional[str] = None
    page_context: str = "general"  # "explore" | "listing" | "trips" | "general"

class ChatResponse(BaseModel):
    reply: str
    suggested_listings: Optional[List[ListingCardResponse]] = None

SYSTEM_PROMPT = """
You are StayFinder AI, a helpful travel assistant for the StayFinder accommodation marketplace.
You help guests find the perfect stays across India.

You have access to real listing data from our database. When recommending listings, always 
refer to the actual listings provided in the context - never make up property names or prices.

Guidelines:
- Be friendly, concise, and helpful
- When recommending listings, mention the title, city, price per night, and rating
- If asked about booking, guide users through the process (search → listing → reserve → checkout)
- If asked about something you don't know, be honest
- Respond in the same language the user writes in
- Keep responses under 150 words unless detailed explanation is needed
- If you recommend listings, end with: "Click any listing card to view details and book."
{personalized_note}
Current available listings context:
{listings_context}

Current page: {page_context}
"""

def extract_search_filters(message: str, current_city: Optional[str]):
    msg_lower = message.lower()
    
    # Check for known cities
    cities = [
        "goa", "manali", "mumbai", "jaipur", "udaipur", "rishikesh", 
        "bangalore", "kerala", "pondicherry", "shimla", "delhi", 
        "varkala", "gokarna", "havelock", "gulmarg", "leh", 
        "dharamshala", "kasol", "ooty", "kodaikanal"
    ]
    detected_city = current_city
    for c in cities:
        if c in msg_lower:
            detected_city = c
            break

    # Check for property types / categories
    detected_type = None
    if any(k in msg_lower for k in ["beach", "sea", "ocean", "coastal"]):
        detected_type = "beach"
    elif any(k in msg_lower for k in ["mountain", "hill", "peak", "snow", "himalayan"]):
        detected_type = "mountain"
    elif any(k in msg_lower for k in ["villa", "estate"]):
        detected_type = "villa"
    elif any(k in msg_lower for k in ["cabin", "cottage", "chalet"]):
        detected_type = "cabin"
    elif any(k in msg_lower for k in ["apartment", "flat", "studio", "loft"]):
        detected_type = "apartment"

    # Check for price constraints (e.g. "under 8000", "below 5000", "< 10000", "under ₹8,000")
    detected_max_price = None
    price_match = re.search(r"(?:under|below|less than|within|budget of|<|<=)\s*(?:₹|rs\.?|inr)?\s*(\d+[\d,]*)", msg_lower)
    if price_match:
        try:
            detected_max_price = float(price_match.group(1).replace(",", ""))
        except ValueError:
            pass

    # Check for guest count
    detected_guests = None
    guest_match = re.search(r"(\d+)\s*(?:guests?|people|persons?|adults?)", msg_lower)
    if guest_match:
        try:
            detected_guests = int(guest_match.group(1))
        except ValueError:
            pass

    return detected_city, detected_type, detected_max_price, detected_guests


@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(
    req: ChatRequest,
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    # 1. Optional Auth check for personalized greeting
    personalized_note = ""
    if x_user_id:
        try:
            user_uuid = UUID(x_user_id)
            user = db.get(User, user_uuid)
            if user and user.full_name:
                personalized_note = f"\nThe user is logged in as {user.full_name} ({'Host' if user.is_host else 'Guest'}). Greet them warmly by first name if appropriate."
        except ValueError:
            pass

    # 2. Decide if listings context is needed
    listings_context_lines = []
    suggested_cards: List[ListingCardResponse] = []

    # Case A: User is on a specific listing page
    if req.listing_id:
        try:
            target_lid = UUID(req.listing_id)
            listing = get_listing_by_id(db, target_lid)
            if listing:
                amenity_str = ", ".join([a.name for a in getattr(listing, 'amenities', [])][:6])
                cover_img = getattr(listing, 'cover_image_url', None)
                if not cover_img and getattr(listing, 'images', None):
                    cover_img = listing.images[0].url if listing.images else None

                listings_context_lines.append(
                    f"CURRENTLY VIEWED LISTING: '{listing.title}' in {listing.city}, {listing.country}: "
                    f"₹{listing.price_per_night}/night, {listing.bedrooms or 1}BR, {listing.bathrooms or 1} baths, "
                    f"max {listing.max_guests} guests, rating {listing.rating_avg:.1f}/5 ({listing.review_count} reviews). "
                    f"Property type: {listing.property_type}. Amenities: {amenity_str}. "
                    f"Description: {listing.description[:200] if listing.description else 'Comfortable stay'}..."
                )
                suggested_cards.append(ListingCardResponse(
                    id=listing.id,
                    title=listing.title,
                    city=listing.city,
                    state=listing.state,
                    country=listing.country,
                    property_type=listing.property_type,
                    price_per_night=listing.price_per_night,
                    cleaning_fee=listing.cleaning_fee or 0,
                    rating_avg=listing.rating_avg or 0.0,
                    review_count=listing.review_count or 0,
                    is_active=listing.is_active,
                    cover_image_url=cover_img,
                    host_id=listing.host_id
                ))
        except (ValueError, Exception) as e:
            logger.warning(f"Error fetching specific listing {req.listing_id}: {e}")

    # Case B: Check if message or context implies searching for stays
    msg_l = req.message.lower()
    needs_search = (
        req.page_context in ("explore", "general")
        or any(w in msg_l for w in ["find", "search", "stay", "villa", "hotel", "cabin", "apartment", "beach", "mountain", "goa", "manali", "recommend", "suggest", "look", "book", "place", "trip", "under", "price", "budget"])
    )

    if needs_search:
        det_city, det_type, det_max_price, det_guests = extract_search_filters(req.message, req.city)
        db_listings, total = search_listings(
            db,
            city=det_city,
            property_type=det_type,
            max_price=det_max_price,
            guests=det_guests,
            page=1,
            limit=5
        )
        for l in db_listings:
            # Avoid duplicate if already added via listing_id
            if any(c.id == l.id for c in suggested_cards):
                continue
            listings_context_lines.append(
                f"- {l.title} in {l.city}: ₹{l.price_per_night}/night, {l.bedrooms or 1}BR, rating {l.rating_avg or 0.0:.1f}/5, {l.property_type}"
            )
            suggested_cards.append(ListingCardResponse(
                id=l.id,
                title=l.title,
                city=l.city,
                state=l.state,
                country=l.country,
                property_type=l.property_type,
                price_per_night=l.price_per_night,
                cleaning_fee=l.cleaning_fee or 0,
                rating_avg=l.rating_avg or 0.0,
                review_count=l.review_count or 0,
                is_active=l.is_active,
                cover_image_url=getattr(l, 'cover_image_url', None),
                host_id=l.host_id
            ))

    if listings_context_lines:
        listings_context = "\n".join(listings_context_lines)
    else:
        listings_context = "No specific listings loaded. Answer generally."

    # 3. Build Full System Prompt
    full_prompt = SYSTEM_PROMPT.format(
        listings_context=listings_context,
        page_context=req.page_context,
        personalized_note=personalized_note
    )

    # 4. Call Gemini AI
    reply_text = ""
    api_key = settings.GEMINI_API_KEY
    if api_key and api_key.strip() and api_key.strip() != "your-gemini-api-key-here":
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key.strip())
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content([
                {"role": "user", "parts": [full_prompt]},
                {"role": "user", "parts": [req.message]}
            ])
            reply_text = response.text
        except Exception as err:
            logger.error(f"Gemini API call error: {err}")
            # Fall back to smart built-in response below
            reply_text = ""

    # Graceful fallback if Gemini API key not provided or request failed
    if not reply_text:
        if suggested_cards:
            picks = [f"• **{c.title}** in {c.city} for ₹{int(c.price_per_night):,}/night ({c.rating_avg:.1f}★)" for c in suggested_cards[:3]]
            picks_str = "\n".join(picks)
            reply_text = (
                f"Here are top-rated properties matching your search:\n\n{picks_str}\n\n"
                "Click any listing card below to view details, photos, and book your stay."
            )
        elif "book" in msg_l or "reserve" in msg_l:
            reply_text = (
                "Booking a stay is simple! Just search for your favorite city, select a listing to view photos and available dates, "
                "choose your check-in/check-out schedule, and click **Reserve** to complete your booking."
            )
        elif "cancel" in msg_l or "refund" in msg_l:
            reply_text = (
                "You can review and manage all your reservations under **My Trips** in the user menu. "
                "Active bookings can be cancelled with one click directly from your trips dashboard."
            )
        else:
            reply_text = (
                "Hello! I'm StayFinder AI. I can help you discover amazing villas, beach houses, and mountain chalets across India. "
                "Try asking me for stays in Goa, Manali, Mumbai, or Jaipur within your budget!"
            )

    return ChatResponse(
        reply=reply_text,
        suggested_listings=suggested_cards if suggested_cards else None
    )
