from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

class BookingCreate(BaseModel):
    listing_id: UUID
    check_in: date
    check_out: date
    guests: int
    model_config = ConfigDict(extra='ignore')

class BookingResponse(BaseModel):
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
    # Attached fields (manually set, not from ORM directly)
    listing_title: Optional[str] = None
    listing_city: Optional[str] = None
    listing_cover_image_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True, extra='ignore')
