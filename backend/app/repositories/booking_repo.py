from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models import Booking, BookingStatus, Listing, ListingImage, Review, User
from app.schemas.booking import BookingCreate
from datetime import date
from typing import Optional
from uuid import UUID
from decimal import Decimal
import uuid

def create_booking(db: Session, guest_id: UUID, data: BookingCreate) -> Booking:
    """Create a booking with full price calculation"""
    listing = db.get(Listing, data.listing_id)
    if not listing:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Listing not found")
    
    nights = (data.check_out - data.check_in).days
    if nights <= 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="check_out must be after check_in")
    
    price_per_night = Decimal(str(listing.price_per_night))
    cleaning_fee = Decimal(str(listing.cleaning_fee or 0))
    subtotal = price_per_night * nights
    service_fee = (subtotal * Decimal('0.12')).quantize(Decimal('0.01'))
    total = subtotal + cleaning_fee + service_fee
    
    booking = Booking(
        id=uuid.uuid4(),
        listing_id=data.listing_id,
        guest_id=guest_id,
        host_id=listing.host_id,
        check_in=data.check_in,
        check_out=data.check_out,
        guests=data.guests,
        nights=nights,
        price_per_night=price_per_night,
        subtotal=subtotal,
        cleaning_fee=cleaning_fee,
        service_fee=service_fee,
        total=total,
        status=BookingStatus.pending,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return _attach_booking_meta(db, booking)

def get_booking_by_id(db: Session, booking_id: UUID) -> Optional[Booking]:
    booking = db.get(Booking, booking_id)
    if not booking:
        return None
    return _attach_booking_meta(db, booking)

def get_my_trips(db: Session, guest_id: UUID) -> list:
    bookings = db.execute(
        select(Booking).where(Booking.guest_id == guest_id)
        .order_by(Booking.created_at.desc())
    ).scalars().all()
    return [_attach_booking_meta(db, b) for b in bookings]

def confirm_booking(db: Session, booking_id: UUID, user_id: UUID) -> Optional[Booking]:
    """Confirm a pending booking (guest or host can confirm)"""
    booking = db.get(Booking, booking_id)
    if not booking:
        return None
    # Allow guest or host to confirm
    if booking.guest_id != user_id and booking.host_id != user_id:
        return None
    booking.status = BookingStatus.confirmed
    db.commit()
    db.refresh(booking)
    return _attach_booking_meta(db, booking)

def cancel_booking(db: Session, booking_id: UUID, user_id: UUID) -> Optional[Booking]:
    """Cancel a booking - only guest or host can cancel"""
    booking = db.get(Booking, booking_id)
    if not booking:
        return None
    if booking.guest_id != user_id and booking.host_id != user_id:
        return None
    if booking.status in (BookingStatus.cancelled, BookingStatus.completed):
        return None
    booking.status = BookingStatus.cancelled
    db.commit()
    db.refresh(booking)
    return _attach_booking_meta(db, booking)

def _attach_booking_meta(db: Session, booking: Booking) -> Booking:
    """Attach listing title, city, cover_image_url to a booking object"""
    listing = db.get(Listing, booking.listing_id)
    if listing:
        booking.listing_title = listing.title
        booking.listing_city = listing.city
        booking.listing_country = getattr(listing, 'country', None)
        cover = db.execute(
            select(ListingImage).where(
                ListingImage.listing_id == listing.id,
                ListingImage.is_cover == True
            ).limit(1)
        ).scalars().first()
        booking.listing_cover_image_url = cover.url if cover else None
    else:
        booking.listing_title = None
        booking.listing_city = None
        booking.listing_country = None
        booking.listing_cover_image_url = None
    return booking
