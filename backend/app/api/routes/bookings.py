from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_auth
from app.repositories.booking_repo import (
    create_booking, get_booking_by_id, get_my_trips, confirm_booking, cancel_booking
)
from app.schemas.booking import BookingCreate, BookingResponse
from app.models.listing import Listing
from app.models.booking import Booking, BookingStatus
from typing import List
from uuid import UUID

router = APIRouter(prefix="/api", tags=["bookings"])

@router.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_new_booking(
    data: BookingCreate,
    current_user_id: UUID = Depends(require_auth),
    db: Session = Depends(get_db)
):
    # Verify listing exists and guest is NOT the host of the listing
    listing = db.get(Listing, data.listing_id)
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found")
    
    if listing.host_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hosts cannot book their own listings"
        )
    
    return create_booking(db, current_user_id, data)

@router.get("/bookings/my-trips", response_model=List[BookingResponse])
def my_trips(
    current_user_id: UUID = Depends(require_auth),
    db: Session = Depends(get_db)
):
    # Filter strictly by guest_id = current_user_id
    return get_my_trips(db, current_user_id)

@router.get("/bookings/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: UUID,
    current_user_id: UUID = Depends(require_auth),
    db: Session = Depends(get_db)
):
    booking = get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    
    # Require booking.guest_id == current_user.id OR booking.host_id == current_user.id
    if booking.guest_id != current_user_id and booking.host_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this resource"
        )
    return booking

@router.patch("/bookings/{booking_id}/confirm", response_model=BookingResponse)
def confirm(
    booking_id: UUID,
    current_user_id: UUID = Depends(require_auth),
    db: Session = Depends(get_db)
):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    
    if booking.guest_id != current_user_id and booking.host_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this resource"
        )

    updated = confirm_booking(db, booking_id, current_user_id)
    return updated

@router.patch("/bookings/{booking_id}/cancel", response_model=BookingResponse)
def cancel(
    booking_id: UUID,
    current_user_id: UUID = Depends(require_auth),
    db: Session = Depends(get_db)
):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    
    # Require booking.guest_id == current_user.id ONLY
    if booking.guest_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this resource"
        )
    
    if booking.status in (BookingStatus.cancelled, BookingStatus.completed):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel booking with status '{booking.status}'"
        )

    updated = cancel_booking(db, booking_id, current_user_id)
    return updated
