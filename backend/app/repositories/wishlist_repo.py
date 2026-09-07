from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.models import Wishlist, Listing, ListingImage
from typing import Optional
from uuid import UUID
import uuid

def get_wishlist(db: Session, user_id: UUID) -> list:
    """Get all wishlisted listings for a user, with cover_image_url attached"""
    wishlist_items = db.execute(
        select(Wishlist).where(Wishlist.user_id == user_id)
    ).scalars().all()
    
    listings = []
    for item in wishlist_items:
        listing = db.get(Listing, item.listing_id)
        if listing and listing.is_active:
            # Attach cover image
            cover = db.execute(
                select(ListingImage).where(
                    ListingImage.listing_id == listing.id,
                    ListingImage.is_cover == True
                ).limit(1)
            ).scalars().first()
            listing.cover_image_url = cover.url if cover else None
            listings.append(listing)
    return listings

def add_to_wishlist(db: Session, user_id: UUID, listing_id: UUID) -> Wishlist:
    """Add to wishlist, handle duplicate gracefully"""
    # Check if already exists
    existing = db.execute(
        select(Wishlist).where(
            Wishlist.user_id == user_id,
            Wishlist.listing_id == listing_id
        )
    ).scalars().first()
    if existing:
        return existing
    
    new_item = Wishlist(id=uuid.uuid4(), user_id=user_id, listing_id=listing_id)
    db.add(new_item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # Someone else inserted between our check and insert - fetch existing
        existing = db.execute(
            select(Wishlist).where(
                Wishlist.user_id == user_id,
                Wishlist.listing_id == listing_id
            )
        ).scalars().first()
        return existing
    db.refresh(new_item)
    return new_item

def remove_from_wishlist(db: Session, user_id: UUID, listing_id: UUID) -> bool:
    """Remove from wishlist, return True if removed"""
    item = db.execute(
        select(Wishlist).where(
            Wishlist.user_id == user_id,
            Wishlist.listing_id == listing_id
        )
    ).scalars().first()
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True

def is_wishlisted(db: Session, user_id: UUID, listing_id: UUID) -> bool:
    item = db.execute(
        select(Wishlist).where(
            Wishlist.user_id == user_id,
            Wishlist.listing_id == listing_id
        )
    ).scalars().first()
    return item is not None

def get_wishlisted_ids(db: Session, user_id: UUID) -> set:
    """Return set of listing_id UUIDs the user has wishlisted"""
    items = db.execute(
        select(Wishlist.listing_id).where(Wishlist.user_id == user_id)
    ).scalars().all()
    return set(items)
