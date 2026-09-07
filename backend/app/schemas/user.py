from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    is_host: bool
    role: str
    
    model_config = ConfigDict(from_attributes=True, extra='ignore')

class UserCreate(BaseModel):
    email: str
    full_name: str
    is_host: bool = False
    avatar_url: Optional[str] = None

class UserLogin(BaseModel):
    email: str

