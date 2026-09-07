from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class ReviewCreate(BaseModel):
    booking_id: UUID
    rating: int = Field(..., ge=1, le=5, description="Rating must be between 1 and 5")
    comment: Optional[str] = None
    model_config = ConfigDict(extra='ignore')

class ReviewResponse(BaseModel):
    id: UUID
    reviewer_name: str
    reviewer_avatar: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True, extra='ignore')

class PaginatedReviews(BaseModel):
    items: List[ReviewResponse]
    total: int
    page: int
    limit: int
    has_next: bool
    model_config = ConfigDict(extra='ignore')
