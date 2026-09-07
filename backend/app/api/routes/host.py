from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_host
from app.repositories.host_repo import get_host_listings, get_host_bookings, get_host_stats
from app.schemas.host import HostListingResponse, HostBookingResponse, HostStatsResponse
from typing import List
from uuid import UUID
from decimal import Decimal

router = APIRouter(prefix="/api/host", tags=["host"])

@router.get("/listings", response_model=List[HostListingResponse])
def host_listings(
    host_id: UUID = Depends(require_host),
    db: Session = Depends(get_db)
):
    # Strictly filtered by host_id == current_user.id
    listings = get_host_listings(db, host_id)
    result = []
    for listing in listings:
        result.append(HostListingResponse(
            id=listing.id,
            title=listing.title,
            city=listing.city,
            state=listing.state,
            country=listing.country,
            property_type=listing.property_type,
            price_per_night=listing.price_per_night,
            cleaning_fee=listing.cleaning_fee or Decimal('0'),
            rating_avg=listing.rating_avg or 0.0,
            review_count=listing.review_count or 0,
            is_active=listing.is_active,
            cover_image_url=getattr(listing, 'cover_image_url', None),
            booking_count=getattr(listing, 'booking_count', 0),
        ))
    return result

@router.get("/bookings", response_model=List[HostBookingResponse])
def host_bookings(
    host_id: UUID = Depends(require_host),
    db: Session = Depends(get_db)
):
    # Strictly filtered by host_id == current_user.id
    bookings = get_host_bookings(db, host_id)
    result = []
    for b in bookings:
        result.append(HostBookingResponse(
            id=b.id,
            listing_id=b.listing_id,
            guest_id=b.guest_id,
            host_id=b.host_id,
            check_in=b.check_in,
            check_out=b.check_out,
            guests=b.guests,
            nights=b.nights,
            price_per_night=b.price_per_night,
            subtotal=b.subtotal,
            cleaning_fee=b.cleaning_fee,
            service_fee=b.service_fee,
            total=b.total,
            status=b.status.value if hasattr(b.status, 'value') else str(b.status),
            created_at=b.created_at,
            listing_title=getattr(b, 'listing_title', None),
            listing_city=getattr(b, 'listing_city', None),
            listing_cover_image_url=getattr(b, 'listing_cover_image_url', None),
            guest_name=getattr(b, 'guest_name', None),
            guest_email=getattr(b, 'guest_email', None),
            guest_avatar=getattr(b, 'guest_avatar', None),
        ))
    return result

@router.get("/stats", response_model=HostStatsResponse)
def host_stats(
    host_id: UUID = Depends(require_host),
    db: Session = Depends(get_db)
):
    # Strictly computed for host_id == current_user.id
    stats = get_host_stats(db, host_id)
    return HostStatsResponse(**stats)
