from sqlalchemy.orm import Session
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from app.models import Review, User, Booking, BookingStatus, Listing
from app.schemas.review import ReviewCreate
from uuid import UUID
import uuid
from typing import Optional, Tuple, List

def check_eligibility(db: Session, reviewer_id: UUID, listing_id: UUID, booking_id: UUID) -> bool:
    """
    Check if reviewer is eligible to review:
    - Booking must exist, status='completed', guest_id=reviewer_id, listing_id=listing_id
    - No existing review for this booking_id
    """
    booking = db.get(Booking, booking_id)
    if not booking:
        return False
    
    if booking.guest_id != reviewer_id or booking.listing_id != listing_id:
        return False

    if booking.status != BookingStatus.completed:
        return False

    # Check if a review already exists for this booking
    existing_review = db.execute(
        select(Review.id).where(Review.booking_id == booking_id)
    ).scalar_one_or_none()

    if existing_review:
        return False

    return True

def create_review(db: Session, reviewer_id: UUID, listing_id: UUID, data: ReviewCreate) -> Review:
    """Create a new review for a listing and booking"""
    review = Review(
        id=uuid.uuid4(),
        listing_id=listing_id,
        reviewer_id=reviewer_id,
        booking_id=data.booking_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.flush()  # Flush within transaction so any constraint error surfaces
    return _attach_reviewer(db, review)

def update_listing_rating(db: Session, listing_id: UUID) -> None:
    """
    Recalculates AVG(rating) and COUNT from reviews table
    Updates listings.rating_avg and listings.review_count
    """
    stats = db.execute(
        select(
            func.coalesce(func.avg(Review.rating), 0.0),
            func.count(Review.id)
        ).where(Review.listing_id == listing_id)
    ).first()

    avg_rating = round(float(stats[0]), 2) if stats else 0.0
    review_count = int(stats[1]) if stats else 0

    listing = db.get(Listing, listing_id)
    if listing:
        listing.rating_avg = avg_rating
        listing.review_count = review_count
        db.add(listing)

def get_reviews_for_listing(
    db: Session,
    listing_id: UUID,
    page: int = 1,
    limit: int = 10
) -> Tuple[List[Review], int]:
    """Get paginated reviews for a listing along with total count"""
    total = db.execute(
        select(func.count(Review.id)).where(Review.listing_id == listing_id)
    ).scalar() or 0

    offset = (page - 1) * limit
    reviews = db.execute(
        select(Review)
        .where(Review.listing_id == listing_id)
        .order_by(Review.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).scalars().all()

    items = [_attach_reviewer(db, r) for r in reviews]
    return items, total

def _attach_reviewer(db: Session, review: Review) -> Review:
    user = db.get(User, review.reviewer_id)
    if user:
        review.reviewer_name = user.full_name
        review.reviewer_avatar = user.avatar_url
    else:
        review.reviewer_name = 'Anonymous'
        review.reviewer_avatar = None
    return review
