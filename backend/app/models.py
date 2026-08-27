import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, nullable=False)  # 'admin' or 'officer'
    badge_id = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    patrol_sessions = relationship("PatrolSession", back_populates="officer")
    scan_logs = relationship("ScanLog", back_populates="officer")


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    nfc_tag_id = Column(String, unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(String)

    # Relationships
    scan_logs = relationship("ScanLog", back_populates="location")


class PatrolSession(Base):
    __tablename__ = "patrol_sessions"

    id = Column(Integer, primary_key=True, index=True)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, default="active")  # 'active', 'completed', 'abandoned'

    # Relationships
    officer = relationship("User", back_populates="patrol_sessions")
    scan_logs = relationship("ScanLog", back_populates="patrol_session", cascade="all, delete-orphan")


class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(Integer, primary_key=True, index=True)
    patrol_session_id = Column(Integer, ForeignKey("patrol_sessions.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    officer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    sequence_order = Column(Integer, nullable=False)

    # Relationships
    patrol_session = relationship("PatrolSession", back_populates="scan_logs")
    location = relationship("Location", back_populates="scan_logs")
    officer = relationship("User", back_populates="scan_logs")
