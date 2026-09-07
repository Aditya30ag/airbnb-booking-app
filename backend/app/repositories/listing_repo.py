from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_, not_, exists
from app.models import Listing, ListingImage, Amenity, ListingAmenity, Booking, BookingStatus, User
from app.schemas.listing import ListingCreate, ListingUpdate
from datetime import date
from typing import Optional
from uuid import UUID
import uuid

def get_listing_by_id(db: Session, listing_id: UUID) -> Optional[Listing]:
    """Get listing with images, amenities, and host eager-loaded manually"""
    listing = db.get(Listing, listing_id)
    if not listing:
        return None
    # Manually attach related data as attributes
    listing.images = db.execute(
        select(ListingImage).where(ListingImage.listing_id == listing_id).order_by(ListingImage.display_order)
    ).scalars().all()
    listing.amenities = db.execute(
        select(Amenity).join(ListingAmenity, Amenity.id == ListingAmenity.amenity_id)
        .where(ListingAmenity.listing_id == listing_id)
    ).scalars().all()
    listing.host = db.get(User, listing.host_id)
    return listing

def search_listings(
    db: Session,
    city: Optional[str] = None,
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    guests: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    property_type: Optional[str] = None,
    amenity_ids: Optional[list[UUID]] = None,
    page: int = 1,
    limit: int = 12,
) -> tuple[list[Listing], int]:
    """Search listings with filters and pagination"""
    query = select(Listing).where(Listing.is_active == True)

    if city:
        query = query.where(Listing.city.ilike(f"%{city}%"))
    
    if guests is not None:
        query = query.where(Listing.max_guests >= guests)
        
    if min_price is not None:
        query = query.where(Listing.price_per_night >= min_price)
        
    if max_price is not None:
        query = query.where(Listing.price_per_night <= max_price)
        
    if property_type:
        query = query.where(Listing.property_type == property_type)
        
    if amenity_ids:
        # Require all specified amenities or at least just join and filter?
        # Assuming we just need listings that have AT LEAST these amenities (IN clause) or ALL.
        # Let's filter by EXISTS for each amenity to be safe, or just join and group by.
        for amenity_id in amenity_ids:
            query = query.where(
                exists().where(
                    and_(
                        ListingAmenity.listing_id == Listing.id,
                        ListingAmenity.amenity_id == amenity_id
                    )
                )
            )

    if check_in and check_out:
        booked_listing_ids_subq = select(Booking.listing_id).where(
            and_(
                Booking.status.in_([BookingStatus.confirmed, BookingStatus.pending]),
                Booking.check_in < check_out,
                Booking.check_out > check_in,
            )
        ).scalar_subquery()
        query = query.where(~Listing.id.in_(booked_listing_ids_subq))

    # Count total
    total_count = db.execute(select(func.count()).select_from(query.subquery())).scalar() or 0

    # Pagination
    query = query.offset((page - 1) * limit).limit(limit)
    listings = list(db.execute(query).scalars().all())

    for listing in listings:
        cover = db.execute(
            select(ListingImage).where(
                ListingImage.listing_id == listing.id,
                ListingImage.is_cover == True
            ).limit(1)
        ).scalars().first()
        listing.cover_image_url = cover.url if cover else None

    return listings, total_count

def create_listing(db: Session, host_id: UUID, data: ListingCreate) -> Listing:
    """Create listing with images and amenities in one transaction"""
    new_listing = Listing(
        id=uuid.uuid4(),
        host_id=host_id,
        title=data.title,
        description=data.description,
        property_type=data.property_type,
        room_type=data.room_type,
        max_guests=data.max_guests,
        bedrooms=data.bedrooms,
        beds=data.beds,
        bathrooms=data.bathrooms,
        price_per_night=data.price_per_night,
        cleaning_fee=data.cleaning_fee,
        address=data.address,
        city=data.city,
        state=data.state,
        country=data.country,
        latitude=data.latitude,
        longitude=data.longitude,
        is_active=True
    )
    db.add(new_listing)
    
    for img in data.images:
        new_img = ListingImage(
            id=uuid.uuid4(),
            listing_id=new_listing.id,
            url=img.url,
            is_cover=img.is_cover,
            display_order=img.display_order
        )
        db.add(new_img)
        
    for amenity_id in data.amenity_ids:
        new_amenity = ListingAmenity(
            listing_id=new_listing.id,
            amenity_id=amenity_id
        )
        db.add(new_amenity)
        
    db.commit()
    return get_listing_by_id(db, new_listing.id)

def update_listing(db: Session, listing_id: UUID, host_id: UUID, data: ListingUpdate) -> Optional[Listing]:
    """Update listing - verify ownership first"""
    listing = db.get(Listing, listing_id)
    if not listing or listing.host_id != host_id:
        return None

    update_data = data.model_dump(exclude_unset=True)
    
    amenity_ids = update_data.pop('amenity_ids', None)
    images = update_data.pop('images', None)
    
    for key, value in update_data.items():
        setattr(listing, key, value)
        
    if amenity_ids is not None:
        db.execute(
            ListingAmenity.__table__.delete().where(ListingAmenity.listing_id == listing_id)
        )
        for am_id in amenity_ids:
            db.add(ListingAmenity(listing_id=listing_id, amenity_id=am_id))
            
    if images is not None:
        db.execute(
            ListingImage.__table__.delete().where(ListingImage.listing_id == listing_id)
        )
        for img in images:
            db.add(ListingImage(
                id=uuid.uuid4(),
                listing_id=listing_id,
                url=img['url'],
                is_cover=img.get('is_cover', False),
                display_order=img.get('display_order', 0)
            ))
            
    db.commit()
    return get_listing_by_id(db, listing_id)

def deactivate_listing(db: Session, listing_id: UUID, host_id: UUID) -> bool:
    """Deactivate listing - verify ownership first"""
    listing = db.get(Listing, listing_id)
    if not listing or listing.host_id != host_id:
        return False
    
    listing.is_active = False
    db.commit()
    return True
