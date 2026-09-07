import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.dependencies import get_db, require_auth
from app.models.user import User, RoleEnum, AuthIdentity
from app.schemas.user import UserResponse, UserCreate, UserLogin
from typing import Optional, List
from uuid import UUID

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    email_clean = data.email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid email address is required"
        )
    if not data.full_name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name cannot be empty"
        )
        
    existing = db.execute(select(User).where(User.email == email_clean)).scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    role = RoleEnum.host if data.is_host else RoleEnum.guest
    user = User(
        id=uuid.uuid4(),
        email=email_clean,
        full_name=data.full_name.strip(),
        avatar_url=data.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={email_clean}",
        role=role,
        is_host=data.is_host
    )
    db.add(user)
    db.flush()
    
    identity = AuthIdentity(
        id=uuid.uuid4(),
        user_id=user.id,
        provider="email",
        provider_user_id=email_clean
    )
    db.add(identity)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        is_host=user.is_host,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role)
    )

@router.post("/login", response_model=UserResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    email_clean = data.email.strip().lower()
    user = db.execute(select(User).where(User.email == email_clean)).scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email. Please check the spelling or sign up."
        )
    
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        is_host=user.is_host,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role)
    )

@router.get("/me", response_model=UserResponse)
def get_me(user_id: UUID = Depends(require_auth), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        is_host=user.is_host,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role)
    )

@router.post("/become-host", response_model=UserResponse)
def become_host(user_id: UUID = Depends(require_auth), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    user.is_host = True
    user.role = RoleEnum.host
    db.commit()
    db.refresh(user)
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        is_host=user.is_host,
        role=user.role.value if hasattr(user.role, 'value') else str(user.role)
    )

@router.get("/demo-users", response_model=List[UserResponse])
def get_demo_users(db: Session = Depends(get_db)):
    users = db.execute(select(User).order_by(User.created_at.asc()).limit(10)).scalars().all()
    return [
        UserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            avatar_url=u.avatar_url,
            is_host=u.is_host,
            role=u.role.value if hasattr(u.role, 'value') else str(u.role)
        )
        for u in users
    ]
