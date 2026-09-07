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
    raw_images = db.execute(
        select(ListingImage).where(ListingImage.listing_id == listing_id).order_by(ListingImage.display_order)
    ).scalars().all()
    valid_images = [img for img in raw_images if img.url and img.url.strip()]
    if not valid_images:
        fallback_img = ListingImage(
            id=uuid.uuid4(),
            listing_id=listing_id,
            url="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
            is_cover=True,
            display_order=0
        )
        listing.images = [fallback_img]
    else:
        listing.images = valid_images

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
        pt_norm = property_type.lower().strip()
        if pt_norm in ("beach", "beach_house", "beachfront"):
            query = query.where(Listing.property_type.in_(["beach", "beach_house", "Beach", "Beachfront", "Beach House"]))
        elif pt_norm in ("mountain", "mountains", "mountain_cabin"):
            query = query.where(Listing.property_type.in_(["mountain", "mountain_cabin", "Mountain", "Mountains", "Mountain Cabin"]))
        elif pt_norm in ("villa", "villas"):
            query = query.where(Listing.property_type.in_(["villa", "Villa", "villas", "Villas"]))
        elif pt_norm in ("cabin", "cabins"):
            query = query.where(Listing.property_type.in_(["cabin", "Cabin", "cabins", "mountain_cabin"]))
        elif pt_norm in ("apartment", "apartments"):
            query = query.where(Listing.property_type.in_(["apartment", "Apartment", "city_apartment", "City Apartment"]))
        elif pt_norm in ("countryside", "country", "farm", "farmhouse"):
            query = query.where(Listing.property_type.in_(["countryside", "Countryside", "farmhouse", "farm"]))
        elif pt_norm in ("tropical", "tropics"):
            query = query.where(Listing.property_type.in_(["tropical", "Tropical"]))
        elif pt_norm in ("bed_and_breakfast", "bed and breakfast", "b&b", "b&bs", "bnb"):
            query = query.where(Listing.property_type.in_(["bed_and_breakfast", "Bed and Breakfast", "b&b", "B&B", "bnb", "B&Bs"]))
        elif pt_norm in ("loft", "lofts"):
            query = query.where(Listing.property_type.in_(["loft", "lofts", "Loft", "Lofts"]))
        elif pt_norm in ("rooms", "room", "private_room", "private room", "private_rooms"):
            query = query.where(or_(Listing.property_type.in_(["rooms", "room", "private_room", "Private Room", "Rooms"]), Listing.room_type == "private_room"))
        elif pt_norm in ("iconic", "iconic_cities", "iconic cities", "iconic_city"):
            query = query.where(Listing.property_type.in_(["iconic", "iconic_cities", "Iconic Cities", "Iconic City", "iconic_city"]))
        else:
            query = query.where(Listing.property_type.ilike(f"%{property_type}%"))
        
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

    # Order by newest first with deterministic tie-breaker to prevent pagination overlap
    query = query.order_by(Listing.created_at.desc(), Listing.id.asc()).offset((page - 1) * limit).limit(limit)
    listings = list(db.execute(query).scalars().all())

    for listing in listings:
        cover = db.execute(
            select(ListingImage).where(
                ListingImage.listing_id == listing.id,
                ListingImage.is_cover == True,
                ListingImage.url != "",
                ListingImage.url.isnot(None)
            ).limit(1)
        ).scalars().first()

        if not cover:
            cover = db.execute(
                select(ListingImage).where(
                    ListingImage.listing_id == listing.id,
                    ListingImage.url != "",
                    ListingImage.url.isnot(None)
                ).order_by(ListingImage.display_order).limit(1)
            ).scalars().first()

        listing.cover_image_url = (
            cover.url.strip() if (cover and cover.url and cover.url.strip())
            else "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80"
        )

    return listings, total_count

CITY_COORDINATES = {
    "goa": (15.4989, 73.8278),
    "udaipur": (24.5854, 73.7125),
    "gurgaon": (28.4595, 77.0266),
    "hyderabad": (17.3850, 78.4867),
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6139, 77.2090),
    "manali": (32.2432, 77.1892),
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "mumbai": (19.0760, 72.8777),
    "jaipur": (26.9124, 75.7873),
    "rishikesh": (30.0869, 78.2676),
    "kerala": (9.9312, 76.2673),
    "kochi": (9.9312, 76.2673),
    "pondicherry": (11.9416, 79.8083),
    "shimla": (31.1048, 77.1734),
    "varkala": (8.7379, 76.7163),
    "havelock": (11.9761, 92.9876),
    "gokarna": (14.5479, 74.3188),
    "gulmarg": (34.0484, 74.3805),
    "leh": (34.1526, 77.5771),
    "dharamshala": (32.2190, 76.3234),
    "kasol": (32.0100, 77.3152),
    "ooty": (11.4102, 76.6950),
    "coorg": (12.4244, 75.7382),
    "wayanad": (11.6854, 76.1320),
    "chikmagalur": (13.3161, 75.7720),
    "panchgani": (17.9237, 73.8007),
    "nashik": (19.9975, 73.7898),
    "kovalam": (8.4004, 76.9787),
    "alibaug": (18.6414, 72.8722),
    "darjeeling": (27.0410, 88.2663),
    "mysore": (12.2958, 76.6394),
    "pune": (18.5204, 73.8567),
    "agra": (27.1767, 78.0081),
    "varanasi": (25.3176, 82.9739),
    "kolkata": (22.5726, 88.3639),
}

def create_listing(db: Session, host_id: UUID, data: ListingCreate) -> Listing:
    """Create listing with images and amenities in one transaction"""
    lat = data.latitude
    lng = data.longitude
    if lat is None or lng is None:
        city_lower = (data.city or "").lower().strip()
        coords = CITY_COORDINATES.get(city_lower, (15.4989, 73.8278))
        lat = coords[0]
        lng = coords[1]

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
        latitude=lat,
        longitude=lng,
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
