import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..deps import get_current_officer, get_current_admin
from .. import models, schemas

router = APIRouter(prefix="/patrol", tags=["Patrol Workflows"])

@router.get("/active", response_model=Optional[schemas.PatrolSessionResponse])
def get_active_session(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_officer)):
    # Helper to see if the logged-in officer has an active session right now
    session = db.query(models.PatrolSession).filter(
        models.PatrolSession.officer_id == current_user.id,
        models.PatrolSession.status == "active"
    ).first()
    return session

@router.post("/start", response_model=schemas.PatrolSessionResponse, status_code=status.HTTP_201_CREATED)
def start_patrol(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_officer)):
    # Check if there is already an active session
    active_session = db.query(models.PatrolSession).filter(
        models.PatrolSession.officer_id == current_user.id,
        models.PatrolSession.status == "active"
    ).first()
    
    if active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Officer already has an active patrol session. End it before starting a new one."
        )
        
    new_session = models.PatrolSession(
        officer_id=current_user.id,
        start_time=datetime.datetime.utcnow(),
        status="active"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.post("/scan", response_model=schemas.ScanLogResponse, status_code=status.HTTP_201_CREATED)
def scan_checkpoint(
    scan_item: schemas.ScanLogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_officer)
):
    # 1. Get active session
    session = db.query(models.PatrolSession).filter(
        models.PatrolSession.officer_id == current_user.id,
        models.PatrolSession.status == "active"
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active patrol session. Start a patrol session first."
        )
        
    # 2. Find location matching nfc_tag_id
    location = db.query(models.Location).filter(
        models.Location.nfc_tag_id == scan_item.nfc_tag_id
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unknown or unregistered NFC tag. Please verify and register the tag first."
        )
        
    # 3. Deduplication logic (prevent double scan in last 10 seconds)
    recent_scan = db.query(models.ScanLog).filter(
        models.ScanLog.patrol_session_id == session.id,
        models.ScanLog.location_id == location.id
    ).order_by(models.ScanLog.timestamp.desc()).first()
    
    if recent_scan:
        time_diff = (datetime.datetime.utcnow() - recent_scan.timestamp).total_seconds()
        if time_diff < 10.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Checkpoint '{location.name}' was scanned just {int(time_diff)} seconds ago. Double-tap blocked."
            )
            
    # 4. Next sequence_order
    seq = db.query(models.ScanLog).filter(
        models.ScanLog.patrol_session_id == session.id
    ).count() + 1
    
    # 5. Insert scan log
    log = models.ScanLog(
        patrol_session_id=session.id,
        location_id=location.id,
        officer_id=current_user.id,
        timestamp=datetime.datetime.utcnow(),
        sequence_order=seq
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    
    # Attach location object explicitly for the schema output validation
    log.location = location
    return log

@router.post("/end", response_model=schemas.PatrolSessionResponse)
def end_patrol(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_officer)):
    session = db.query(models.PatrolSession).filter(
        models.PatrolSession.officer_id == current_user.id,
        models.PatrolSession.status == "active"
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active patrol session to end."
        )
        
    session.end_time = datetime.datetime.utcnow()
    session.status = "completed"
    db.commit()
    db.refresh(session)
    return session

@router.get("", response_model=List[schemas.PatrolSessionResponse])
def get_patrol_sessions(db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    return db.query(models.PatrolSession).order_by(models.PatrolSession.start_time.desc()).all()

@router.get("/map-data", response_model=List[dict])
def get_map_data(patrol_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    logs = db.query(models.ScanLog).filter(
        models.ScanLog.patrol_session_id == patrol_id
    ).order_by(models.ScanLog.sequence_order.asc()).all()
    
    route = []
    for log in logs:
        route.append({
            "sequence_order": log.sequence_order,
            "timestamp": log.timestamp.isoformat() + "Z" if log.timestamp else None,
            "location_name": log.location.name if log.location else "Unknown Checkpoint",
            "latitude": log.location.latitude if log.location else 0.0,
            "longitude": log.location.longitude if log.location else 0.0,
            "nfc_tag_id": log.location.nfc_tag_id if log.location else "N/A"
        })
    return route
