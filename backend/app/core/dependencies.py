from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from app.db.database import SessionLocal
from app.models.user import User, RoleEnum

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user_id(x_user_id: Optional[str] = Header(None)) -> Optional[UUID]:
    """Extract current user ID if header provided, otherwise None."""
    if x_user_id:
        try:
            return UUID(x_user_id)
        except ValueError:
            pass
    return None

def require_auth(x_user_id: Optional[str] = Header(None)) -> UUID:
    """Require valid authenticated user ID."""
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    try:
        return UUID(x_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID"
        )

def require_host(
    user_id: UUID = Depends(require_auth),
    db: Session = Depends(get_db)
) -> UUID:
    """
    Require authenticated user to have host role / is_host=True.
    Checks user in database to ensure is_host == True.
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    if not user.is_host and user.role != RoleEnum.host:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this resource"
        )
    return user_id
