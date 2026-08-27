import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..deps import get_current_admin
from .. import models, schemas

router = APIRouter(prefix="/analytics", tags=["Analytics Dashboard"])

@router.get("", response_model=schemas.AnalyticsStatsResponse)
def get_analytics(db: Session = Depends(get_db), current_user = Depends(get_current_admin)):
    now = datetime.datetime.utcnow()
    start_of_today = datetime.datetime.combine(now.date(), datetime.time.min)
    start_of_week = start_of_today - datetime.timedelta(days=7)
    
    # 1. Total patrols today
    total_today = db.query(models.PatrolSession).filter(
        models.PatrolSession.start_time >= start_of_today
    ).count()
    
    # 2. Total patrols this week
    total_week = db.query(models.PatrolSession).filter(
        models.PatrolSession.start_time >= start_of_week
    ).count()
    
    # 3. Active patrols right now
    active_patrols = db.query(models.PatrolSession).filter(
        models.PatrolSession.status == "active"
    ).count()
    
    # 4. Average patrol duration of completed sessions
    completed_sessions = db.query(models.PatrolSession).filter(
        models.PatrolSession.status == "completed",
        models.PatrolSession.end_time.isnot(None)
    ).all()
    
    avg_duration = 0.0
    if completed_sessions:
        durations = [(s.end_time - s.start_time).total_seconds() for s in completed_sessions]
        avg_duration = sum(durations) / len(durations)
        
    # 5. Scans per officer
    officers = db.query(models.User).filter(models.User.role == "officer").all()
    scans_officer_list = []
    for officer in officers:
        scans_count = db.query(models.ScanLog).filter(models.ScanLog.officer_id == officer.id).count()
        scans_officer_list.append({
            "officer_id": officer.id,
            "username": officer.username,
            "scans": scans_count
        })
    # Sort scans per officer in descending order
    scans_officer_list.sort(key=lambda x: x["scans"], reverse=True)
    
    # 6. Checkpoint visits (Most / Least Visited)
    locations = db.query(models.Location).all()
    location_visits = []
    for loc in locations:
        visits_count = db.query(models.ScanLog).filter(models.ScanLog.location_id == loc.id).count()
        location_visits.append({
            "location_id": loc.id,
            "name": loc.name,
            "visits": visits_count
        })
        
    # Most and least visited sublists
    most_visited = sorted(location_visits, key=lambda x: x["visits"], reverse=True)[:5]
    least_visited = sorted(location_visits, key=lambda x: x["visits"])[:5]
    
    # 7. Missed Checkpoints (e.g. locations not scanned in the last 3 days)
    threshold_date = now - datetime.timedelta(days=3)
    missed_checkpoints = []
    for loc in locations:
        latest_scan = db.query(models.ScanLog).filter(
            models.ScanLog.location_id == loc.id
        ).order_by(models.ScanLog.timestamp.desc()).first()
        
        if latest_scan:
            days_since = (now - latest_scan.timestamp).days
            if days_since >= 3:
                missed_checkpoints.append({
                    "location_id": loc.id,
                    "name": loc.name,
                    "days_since_last_scan": days_since
                })
        else:
            # Never scanned
            missed_checkpoints.append({
                "location_id": loc.id,
                "name": loc.name,
                "days_since_last_scan": None
            })
            
    return {
        "total_patrols_today": total_today,
        "total_patrols_week": total_week,
        "average_duration_seconds": avg_duration,
        "scans_per_officer": scans_officer_list,
        "most_visited_locations": most_visited,
        "least_visited_locations": least_visited,
        "active_patrols_count": active_patrols,
        "missed_checkpoints": missed_checkpoints
    }
