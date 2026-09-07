from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.models import Listing, ListingImage, Booking, BookingStatus, User
from typing import Optional
from uuid import UUID
from decimal import Decimal

def get_host_listings(db: Session, host_id: UUID) -> list:
    """Get all listings owned by host, with cover_image_url and booking_count attached"""
    listings = db.execute(
        select(Listing)
        .where(Listing.host_id == host_id)
        .order_by(Listing.created_at.desc())
    ).scalars().all()
    
    for listing in listings:
        # Attach cover image
        cover = db.execute(
            select(ListingImage)
            .where(ListingImage.listing_id == listing.id, ListingImage.is_cover == True)
            .limit(1)
        ).scalars().first()
        listing.cover_image_url = cover.url if cover else None
        
        # Attach booking count (non-cancelled)
        count = db.execute(
            select(func.count(Booking.id))
            .where(
                Booking.listing_id == listing.id,
                Booking.status != BookingStatus.cancelled
            )
        ).scalar() or 0
        listing.booking_count = count
    
    return listings

def get_host_bookings(db: Session, host_id: UUID) -> list:
    """Get all bookings on host's listings, with guest info attached"""
    bookings = db.execute(
        select(Booking)
        .where(Booking.host_id == host_id)
        .order_by(Booking.created_at.desc())
    ).scalars().all()
    
    for booking in bookings:
        # Attach listing info
        listing = db.get(Listing, booking.listing_id)
        if listing:
            booking.listing_title = listing.title
            booking.listing_city = listing.city
            cover = db.execute(
                select(ListingImage)
                .where(ListingImage.listing_id == listing.id, ListingImage.is_cover == True)
                .limit(1)
            ).scalars().first()
            booking.listing_cover_image_url = cover.url if cover else None
        else:
            booking.listing_title = None
            booking.listing_city = None
            booking.listing_cover_image_url = None
        
        # Attach guest info
        guest = db.get(User, booking.guest_id)
        if guest:
            booking.guest_name = guest.full_name
            booking.guest_email = guest.email
            booking.guest_avatar = guest.avatar_url
        else:
            booking.guest_name = 'Unknown Guest'
            booking.guest_email = None
            booking.guest_avatar = None
    
    return bookings

def get_host_stats(db: Session, host_id: UUID) -> dict:
    """Compute dashboard stats for host"""
    # Total listings
    total_listings = db.execute(
        select(func.count(Listing.id)).where(Listing.host_id == host_id)
    ).scalar() or 0
    
    # Active listings
    active_listings = db.execute(
        select(func.count(Listing.id))
        .where(Listing.host_id == host_id, Listing.is_active == True)
    ).scalar() or 0
    
    # Total bookings
    total_bookings = db.execute(
        select(func.count(Booking.id)).where(Booking.host_id == host_id)
    ).scalar() or 0
    
    # Confirmed bookings
    confirmed_bookings = db.execute(
        select(func.count(Booking.id))
        .where(Booking.host_id == host_id, Booking.status == BookingStatus.confirmed)
    ).scalar() or 0
    
    # Cancelled bookings
    cancelled_bookings = db.execute(
        select(func.count(Booking.id))
        .where(Booking.host_id == host_id, Booking.status == BookingStatus.cancelled)
    ).scalar() or 0
    
    # Pending bookings
    pending_bookings = db.execute(
        select(func.count(Booking.id))
        .where(Booking.host_id == host_id, Booking.status == BookingStatus.pending)
    ).scalar() or 0
    
    # Revenue = sum of totals where status != cancelled
    revenue_result = db.execute(
        select(func.sum(Booking.total))
        .where(
            Booking.host_id == host_id,
            Booking.status != BookingStatus.cancelled
        )
    ).scalar()
    total_revenue = Decimal(str(revenue_result)) if revenue_result else Decimal('0')
    
    return {
        'total_listings': total_listings,
        'active_listings': active_listings,
        'total_bookings': total_bookings,
        'confirmed_bookings': confirmed_bookings,
        'cancelled_bookings': cancelled_bookings,
        'pending_bookings': pending_bookings,
        'total_revenue': total_revenue,
    }
