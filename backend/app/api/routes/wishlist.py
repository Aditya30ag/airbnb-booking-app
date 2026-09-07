from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_auth
from app.repositories.wishlist_repo import (
    get_wishlist, add_to_wishlist, remove_from_wishlist, get_wishlisted_ids
)
from app.schemas.wishlist import WishlistResponse, WishlistIdsResponse
from app.schemas.listing import ListingCardResponse
from uuid import UUID

router = APIRouter(prefix="/api", tags=["wishlist"])

@router.get("/wishlist", response_model=WishlistResponse)
def get_my_wishlist(
    current_user_id: UUID = Depends(require_auth),
    db: Session = Depends(get_db)
):
    # Strictly scoped to current_user_id
    listings = get_wishlist(db, current_user_id)
    items = []
    for listing in listings:
        items.append(ListingCardResponse(
            id=listing.id,
            title=listing.title,
            city=listing.city,
            state=listing.state,
            country=listing.country,
            property_type=listing.property_type,
            price_per_night=listing.price_per_night,
            cleaning_fee=listing.cleaning_fee or 0,
            rating_avg=listing.rating_avg or 0.0,
            review_count=listing.review_count or 0,
            is_active=listing.is_active,
            cover_image_url=getattr(listing, 'cover_image_url', None),
            host_id=listing.host_id,
        ))
    return WishlistResponse(items=items, count=len(items))

@router.get("/wishlist/ids", response_model=WishlistIdsResponse)
def get_wishlist_ids(
    current_user_id: UUID = Depends(require_auth),
    db: Session = Depends(get_db)
):
    # Strictly scoped to current_user_id
    ids = get_wishlisted_ids(db, current_user_id)
    return WishlistIdsResponse(ids=[str(i) for i in ids])

@router.post("/wishlist/{listing_id}", status_code=201)
def add_wishlist_item(
    listing_id: UUID,
    current_user_id: UUID = Depends(require_auth),
    db: Session = Depends(get_db)
):
    # Strictly scoped to current_user_id
    item = add_to_wishlist(db, current_user_id, listing_id)
    return {"id": str(item.id), "listing_id": str(listing_id)}

@router.delete("/wishlist/{listing_id}")
def remove_wishlist_item(
    listing_id: UUID,
    current_user_id: UUID = Depends(require_auth),
    db: Session = Depends(get_db)
):
    # Strictly scoped to current_user_id
    removed = remove_from_wishlist(db, current_user_id, listing_id)
    return {"removed": removed}
