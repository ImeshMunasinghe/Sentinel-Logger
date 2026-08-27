import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    user_id: int

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None


from pydantic import BaseModel, ConfigDict, field_validator

# User schemas
class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    role: str
    badge_id: Optional[str] = None

class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number.")
        return v

class UserResponse(UserBase):
    id: int
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)


# Location schemas
class LocationBase(BaseModel):
    name: str
    nfc_tag_id: str
    latitude: float
    longitude: float
    description: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class LocationResponse(LocationBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# Scan Log schemas
class ScanLogBase(BaseModel):
    patrol_session_id: int
    location_id: int
    officer_id: int
    timestamp: datetime.datetime
    sequence_order: int

class ScanLogCreate(BaseModel):
    nfc_tag_id: str

class ScanLogResponse(ScanLogBase):
    id: int
    location: Optional[LocationResponse] = None
    model_config = ConfigDict(from_attributes=True)


# Patrol Session schemas
class PatrolSessionBase(BaseModel):
    officer_id: int
    start_time: datetime.datetime
    end_time: Optional[datetime.datetime] = None
    status: str

class PatrolSessionCreate(BaseModel):
    pass

class PatrolSessionResponse(PatrolSessionBase):
    id: int
    officer: UserResponse
    model_config = ConfigDict(from_attributes=True)

class PatrolSessionDetail(PatrolSessionResponse):
    scan_logs: List[ScanLogResponse] = []
    model_config = ConfigDict(from_attributes=True)


# Analytics response schemas
class AnalyticsStatsResponse(BaseModel):
    total_patrols_today: int
    total_patrols_week: int
    average_duration_seconds: float
    scans_per_officer: List[dict]  # list of {"officer_id": int, "username": str, "scans": int}
    most_visited_locations: List[dict]  # list of {"location_id": int, "name": str, "visits": int}
    least_visited_locations: List[dict]
    active_patrols_count: int
    missed_checkpoints: List[dict]  # list of {"location_id": int, "name": str, "days_since_last_scan": Optional[int]}
