from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..deps import get_current_admin
from .. import models, schemas, auth

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    return db.query(models.User).all()

@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u

@router.post("", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = models.User(
        username=user.username,
        password_hash=auth.get_password_hash(user.password),
        full_name=user.full_name,
        role=user.role,
        badge_id=user.badge_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user: schemas.UserCreate, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user = db.query(models.User).filter(models.User.username == user.username, models.User.id != user_id).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    u.username = user.username
    if user.password:
        u.password_hash = auth.get_password_hash(user.password)
    u.full_name = user.full_name
    u.role = user.role
    u.badge_id = user.badge_id
    db.commit()
    db.refresh(u)
    return u

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Self-deletion is forbidden. You cannot delete your own admin account."
        )
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(u)
    db.commit()
    return None
