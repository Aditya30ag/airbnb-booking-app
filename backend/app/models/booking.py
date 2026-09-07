import uuid
import enum
from sqlalchemy import Column, Boolean, DateTime, Date, Integer, Numeric, ForeignKey, Enum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class BookingStatus(str, enum.Enum):
    pending = 'pending'
    confirmed = 'confirmed'
    cancelled = 'cancelled'
    completed = 'completed'

class Booking(Base):
    __tablename__ = 'bookings'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), ForeignKey('listings.id', ondelete='RESTRICT'), nullable=False)
    guest_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)
    host_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)
    check_in = Column(Date, nullable=False)
    check_out = Column(Date, nullable=False)
    guests = Column(Integer, nullable=False)
    nights = Column(Integer, nullable=False)
    price_per_night = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    cleaning_fee = Column(Numeric(10, 2), nullable=False)
    service_fee = Column(Numeric(10, 2), nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('ix_bookings_listing_dates', 'listing_id', 'check_in', 'check_out'),
        Index('ix_bookings_guest_id', 'guest_id'),
        Index('ix_bookings_host_id', 'host_id'),
        Index('ix_bookings_status', 'status'),
    )
