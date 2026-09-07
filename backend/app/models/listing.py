import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float, Numeric, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base

class ListingAmenity(Base):
    __tablename__ = 'listing_amenities'
    
    listing_id = Column(UUID(as_uuid=True), ForeignKey('listings.id', ondelete='CASCADE'), primary_key=True)
    amenity_id = Column(UUID(as_uuid=True), ForeignKey('amenities.id', ondelete='CASCADE'), primary_key=True)

class Amenity(Base):
    __tablename__ = 'amenities'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    icon = Column(String)
    category = Column(String)

class Listing(Base):
    __tablename__ = 'listings'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    host_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    property_type = Column(String)
    room_type = Column(String)
    max_guests = Column(Integer)
    bedrooms = Column(Integer)
    beds = Column(Integer)
    bathrooms = Column(Integer)
    price_per_night = Column(Numeric(10, 2))
    cleaning_fee = Column(Numeric(10, 2))
    address = Column(String)
    city = Column(String)
    state = Column(String)
    country = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    rating_avg = Column(Float, default=0.0)
    review_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('ix_listings_city', 'city'),
        Index('ix_listings_property_type', 'property_type'),
        Index('ix_listings_price_per_night', 'price_per_night'),
        Index('ix_listings_is_active', 'is_active'),
        Index('ix_listings_host_id', 'host_id'),
    )

class ListingImage(Base):
    __tablename__ = 'listing_images'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), ForeignKey('listings.id', ondelete='CASCADE'), nullable=False)
    url = Column(String, nullable=False)
    is_cover = Column(Boolean, default=False)
    display_order = Column(Integer, default=0)
