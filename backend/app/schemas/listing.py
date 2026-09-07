from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from .user import UserResponse

class AmenityResponse(BaseModel):
    id: UUID
    name: str
    icon: Optional[str] = None
    category: Optional[str] = None
    model_config = ConfigDict(from_attributes=True, extra='ignore')

class ListingImageCreate(BaseModel):
    url: str
    is_cover: bool = False
    display_order: int = 0
    model_config = ConfigDict(extra='ignore')

class ListingImageResponse(BaseModel):
    id: UUID
    url: str
    is_cover: bool
    display_order: int
    model_config = ConfigDict(from_attributes=True, extra='ignore')

class ListingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    property_type: Optional[str] = None
    room_type: Optional[str] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[int] = None
    price_per_night: Decimal
    cleaning_fee: Decimal = Decimal('0')
    address: Optional[str] = None
    city: str
    state: Optional[str] = None
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    amenity_ids: list[UUID] = []
    images: list[ListingImageCreate] = []
    model_config = ConfigDict(extra='ignore')

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    room_type: Optional[str] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[int] = None
    price_per_night: Optional[Decimal] = None
    cleaning_fee: Optional[Decimal] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    amenity_ids: Optional[list[UUID]] = None
    images: Optional[list[ListingImageCreate]] = None
    model_config = ConfigDict(extra='ignore')

class ListingCardResponse(BaseModel):
    id: UUID
    title: str
    city: str
    state: Optional[str] = None
    country: str
    property_type: Optional[str] = None
    price_per_night: Decimal
    cleaning_fee: Decimal
    rating_avg: float
    review_count: int
    is_active: bool
    cover_image_url: Optional[str] = None
    host_id: UUID
    model_config = ConfigDict(from_attributes=True, extra='ignore')

class ListingDetailResponse(BaseModel):
    id: UUID
    host_id: UUID
    title: str
    description: Optional[str] = None
    property_type: Optional[str] = None
    room_type: Optional[str] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[int] = None
    price_per_night: Decimal
    cleaning_fee: Decimal
    address: Optional[str] = None
    city: str
    state: Optional[str] = None
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rating_avg: float
    review_count: int
    is_active: bool
    created_at: datetime
    images: list[ListingImageResponse] = []
    amenities: list[AmenityResponse] = []
    host: UserResponse
    model_config = ConfigDict(from_attributes=True, extra='ignore')

class PaginatedListings(BaseModel):
    items: list[ListingCardResponse]
    total: int
    page: int
    page_size: int
    has_next: bool
    model_config = ConfigDict(extra='ignore')
