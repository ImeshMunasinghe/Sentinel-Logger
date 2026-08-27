from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..deps import get_current_admin
from .. import models, schemas

router = APIRouter(prefix="/locations", tags=["Locations"])

@router.get("", response_model=List[schemas.LocationResponse])
def get_locations(db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    return db.query(models.Location).all()

@router.get("/{location_id}", response_model=schemas.LocationResponse)
def get_location(location_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return loc

@router.post("", response_model=schemas.LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    # Check duplicate tag id
    db_loc = db.query(models.Location).filter(models.Location.nfc_tag_id == location.nfc_tag_id).first()
    if db_loc:
        raise HTTPException(status_code=400, detail="NFC Tag ID already registered")
    
    new_loc = models.Location(
        name=location.name,
        nfc_tag_id=location.nfc_tag_id,
        latitude=location.latitude,
        longitude=location.longitude,
        description=location.description
    )
    db.add(new_loc)
    db.commit()
    db.refresh(new_loc)
    return new_loc

@router.put("/{location_id}", response_model=schemas.LocationResponse)
def update_location(location_id: int, location: schemas.LocationCreate, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Check duplicate tag id excluding this location
    db_loc = db.query(models.Location).filter(
        models.Location.nfc_tag_id == location.nfc_tag_id,
        models.Location.id != location_id
    ).first()
    if db_loc:
        raise HTTPException(status_code=400, detail="NFC Tag ID already in use by another location")
    
    loc.name = location.name
    loc.nfc_tag_id = location.nfc_tag_id
    loc.latitude = location.latitude
    loc.longitude = location.longitude
    loc.description = location.description
    db.commit()
    db.refresh(loc)
    return loc

@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(location_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(loc)
    db.commit()
    return None
