from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import date, datetime

class HostListingResponse(BaseModel):
    """Listing card with extra host-specific fields"""
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
    booking_count: int = 0
    model_config = ConfigDict(from_attributes=True, extra='ignore')

class HostBookingResponse(BaseModel):
    """Booking with guest name + listing info for host view"""
    id: UUID
    listing_id: UUID
    guest_id: UUID
    host_id: UUID
    check_in: date
    check_out: date
    guests: int
    nights: int
    price_per_night: Decimal
    subtotal: Decimal
    cleaning_fee: Decimal
    service_fee: Decimal
    total: Decimal
    status: str
    created_at: datetime
    listing_title: Optional[str] = None
    listing_city: Optional[str] = None
    listing_cover_image_url: Optional[str] = None
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    guest_avatar: Optional[str] = None
    model_config = ConfigDict(from_attributes=True, extra='ignore')

class HostStatsResponse(BaseModel):
    total_listings: int
    active_listings: int
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    pending_bookings: int
    total_revenue: Decimal
    model_config = ConfigDict(extra='ignore')
