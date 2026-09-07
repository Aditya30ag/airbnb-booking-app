from sqlalchemy.orm import Session
from app.repositories.listing_repo import (
    get_listing_by_id, search_listings, create_listing, update_listing, deactivate_listing
)
from app.schemas.listing import (
    ListingCreate, ListingUpdate, ListingDetailResponse, ListingCardResponse, PaginatedListings
)
from app.models.listing import Listing
from fastapi import HTTPException, status
from uuid import UUID
from datetime import date
from typing import Optional

def service_get_listing(db: Session, listing_id: UUID) -> ListingDetailResponse:
    listing = get_listing_by_id(db, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    return ListingDetailResponse.model_validate(listing)

def service_search_listings(
    db: Session, city: Optional[str], check_in: Optional[date], check_out: Optional[date], 
    guests: Optional[int], min_price: Optional[float], max_price: Optional[float],
    property_type: Optional[str], amenity_ids: Optional[list[UUID]], page: int, limit: int
) -> PaginatedListings:
    listings, total = search_listings(
        db, city, check_in, check_out, guests, min_price, max_price,
        property_type, amenity_ids, page, limit
    )
    items = []
    for listing in listings:
        items.append(ListingCardResponse(
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
            cover_image_url=getattr(listing, 'cover_image_url', None),
            host_id=listing.host_id,
        ))
    has_next = (page * limit) < total
    return PaginatedListings(items=items, total=total, page=page, page_size=limit, has_next=has_next)

def service_create_listing(db: Session, host_id: UUID, data: ListingCreate) -> ListingDetailResponse:
    listing = create_listing(db, host_id, data)
    return ListingDetailResponse.model_validate(listing)

def service_update_listing(db: Session, listing_id: UUID, host_id: UUID, data: ListingUpdate) -> ListingDetailResponse:
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if listing.host_id != host_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this resource")
    
    updated = update_listing(db, listing_id, host_id, data)
    return ListingDetailResponse.model_validate(updated)

def service_deactivate_listing(db: Session, listing_id: UUID, host_id: UUID) -> bool:
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    if listing.host_id != host_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this resource")
    
    return deactivate_listing(db, listing_id, host_id)
