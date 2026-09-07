from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_auth
from app.schemas.review import ReviewCreate, ReviewResponse, PaginatedReviews
from app.services.review_service import service_create_review, service_get_reviews
from uuid import UUID

router = APIRouter(prefix="/api", tags=["reviews"])

@router.get("/listings/{id}/reviews", response_model=PaginatedReviews)
def get_listing_reviews(
    id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    # Public route: anyone can view reviews
    return service_get_reviews(db=db, listing_id=id, page=page, limit=limit)

@router.get("/reviews", response_model=PaginatedReviews)
def get_reviews_by_query(
    listing_id: UUID = Query(..., description="Listing ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    # Public route: allows fetching reviews with query param listing_id
    return service_get_reviews(db=db, listing_id=listing_id, page=page, limit=limit)

@router.post("/listings/{id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_listing_review(
    id: UUID,
    data: ReviewCreate,
    current_user_id: UUID = Depends(require_auth),
    db: Session = Depends(get_db)
):
    # Requires authentication; booking.guest_id == current_user.id, booking.status == 'completed',
    # and no existing review checked in review_service.
    return service_create_review(db=db, current_user_id=current_user_id, listing_id=id, data=data)
