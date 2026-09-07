from pydantic import BaseModel, ConfigDict
from app.schemas.listing import ListingCardResponse

class WishlistResponse(BaseModel):
    items: list[ListingCardResponse]
    count: int
    model_config = ConfigDict(extra='ignore')

class WishlistIdsResponse(BaseModel):
    ids: list[str]
    model_config = ConfigDict(extra='ignore')
