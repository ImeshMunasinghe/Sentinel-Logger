import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..deps import get_current_admin
from .. import models, schemas

router = APIRouter(prefix="/logs", tags=["Logs Dashboard"])

@router.get("", response_model=List[schemas.ScanLogResponse])
def get_logs(
    officer_id: Optional[int] = Query(None),
    location_id: Optional[int] = Query(None),
    patrol_id: Optional[int] = Query(None),
    date_from: Optional[datetime.date] = Query(None),
    date_to: Optional[datetime.date] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    query = db.query(models.ScanLog)
    
    if officer_id is not None:
        query = query.filter(models.ScanLog.officer_id == officer_id)
        
    if location_id is not None:
        query = query.filter(models.ScanLog.location_id == location_id)
        
    if patrol_id is not None:
        query = query.filter(models.ScanLog.patrol_session_id == patrol_id)
        
    if date_from is not None:
        # Convert date to start-of-day datetime
        dt_from = datetime.datetime.combine(date_from, datetime.time.min)
        query = query.filter(models.ScanLog.timestamp >= dt_from)
        
    if date_to is not None:
        # Convert date to end-of-day datetime
        dt_to = datetime.datetime.combine(date_to, datetime.time.max)
        query = query.filter(models.ScanLog.timestamp <= dt_to)
        
    # Sort by timestamp desc to show latest logs first in tables
    return query.order_by(models.ScanLog.timestamp.desc()).all()
