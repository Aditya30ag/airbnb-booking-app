from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from uuid import UUID
from app.repositories.review_repo import (
    check_eligibility,
    create_review as repo_create_review,
    update_listing_rating,
    get_reviews_for_listing as repo_get_reviews
)
from app.schemas.review import ReviewCreate, ReviewResponse, PaginatedReviews

def service_create_review(
    db: Session,
    current_user_id: UUID,
    listing_id: UUID,
    data: ReviewCreate
) -> ReviewResponse:
    # 1. Check eligibility
    eligible = check_eligibility(db, current_user_id, listing_id, data.booking_id)
    if not eligible:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not eligible to review this booking. A review can only be submitted for completed bookings by the booking guest, and each booking can only be reviewed once."
        )

    # 2. Create review & update listing rating in transaction
    try:
        review = repo_create_review(db, current_user_id, listing_id, data)
        update_listing_rating(db, listing_id)
        db.commit()
        db.refresh(review)
    except IntegrityError as e:
        db.rollback()
        # Unique constraint on booking_id
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A review for this booking already exists."
        ) from e
    except Exception as e:
        db.rollback()
        raise e

    return ReviewResponse(
        id=review.id,
        reviewer_name=getattr(review, 'reviewer_name', 'Anonymous'),
        reviewer_avatar=getattr(review, 'reviewer_avatar', None),
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
    )

def service_get_reviews(
    db: Session,
    listing_id: UUID,
    page: int = 1,
    limit: int = 10
) -> PaginatedReviews:
    reviews, total = repo_get_reviews(db, listing_id, page=page, limit=limit)
    items = [
        ReviewResponse(
            id=r.id,
            reviewer_name=getattr(r, 'reviewer_name', 'Anonymous'),
            reviewer_avatar=getattr(r, 'reviewer_avatar', None),
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
        )
        for r in reviews
    ]
    has_next = (page * limit) < total
    return PaginatedReviews(
        items=items,
        total=total,
        page=page,
        limit=limit,
        has_next=has_next
    )
