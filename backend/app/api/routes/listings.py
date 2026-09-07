from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_host
from app.services.listing_service import (
    service_get_listing, service_search_listings, service_create_listing,
    service_update_listing, service_deactivate_listing
)
from app.schemas.listing import ListingCreate, ListingUpdate, PaginatedListings, ListingDetailResponse, AmenityResponse
from app.models import Amenity, Booking, BookingStatus
from typing import Optional, List
from datetime import date, timedelta
from uuid import UUID
from sqlalchemy import select

router = APIRouter(prefix="/api", tags=["listings"])

# Public endpoints
@router.get("/listings", response_model=PaginatedListings)
def search_listings(
    city: Optional[str] = None,
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    guests: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    property_type: Optional[str] = None,
    amenity_ids: Optional[List[UUID]] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return service_search_listings(
        db, city, check_in, check_out, guests, min_price, max_price,
        property_type, amenity_ids, page, limit
    )

@router.get("/listings/{listing_id}", response_model=ListingDetailResponse)
def get_listing(listing_id: UUID, db: Session = Depends(get_db)):
    return service_get_listing(db, listing_id)

@router.get("/listings/{listing_id}/availability")
def get_listing_availability(listing_id: UUID, db: Session = Depends(get_db)):
    today = date.today()
    future_date = today + timedelta(days=90)
    
    bookings = db.execute(
        select(Booking).where(
            Booking.listing_id == listing_id,
            Booking.status.in_([BookingStatus.confirmed, BookingStatus.pending]),
            Booking.check_out >= today,
            Booking.check_in <= future_date
        )
    ).scalars().all()
    
    blocked_ranges = []
    for b in bookings:
        blocked_ranges.append({
            "start": b.check_in.isoformat(),
            "end": b.check_out.isoformat()
        })
        
    return {"blocked_ranges": blocked_ranges}

@router.get("/amenities", response_model=List[AmenityResponse])
def get_amenities(db: Session = Depends(get_db)):
    amenities = db.execute(select(Amenity)).scalars().all()
    return [AmenityResponse.model_validate(a) for a in amenities]

# Protected endpoints requiring is_host=True
@router.post("/listings", response_model=ListingDetailResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    data: ListingCreate,
    host_id: UUID = Depends(require_host),
    db: Session = Depends(get_db)
):
    return service_create_listing(db, host_id, data)

@router.put("/listings/{listing_id}", response_model=ListingDetailResponse)
def update_listing(
    listing_id: UUID,
    data: ListingUpdate,
    host_id: UUID = Depends(require_host),
    db: Session = Depends(get_db)
):
    return service_update_listing(db, listing_id, host_id, data)

@router.delete("/listings/{listing_id}")
def delete_listing(
    listing_id: UUID,
    host_id: UUID = Depends(require_host),
    db: Session = Depends(get_db)
):
    success = service_deactivate_listing(db, listing_id, host_id)
    return {"success": success}
