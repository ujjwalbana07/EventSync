from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, JSON, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # RBAC: student, faculty, recruiter, admin
    role = Column(String, default="student", index=True) 
    
    # Profile Fields (Student)
    major = Column(String, nullable=True)
    graduation_year = Column(Integer, nullable=True)
    headline = Column(String, nullable=True)
    interests = Column(Text, nullable=True) 
    linkedin_url = Column(String, nullable=True)
    
    # Permissions/Meta
    is_active = Column(Boolean, default=True)
    can_view_analytics = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    verification_token = Column(String, nullable=True)

    # Relationships
    # Relationships
    registrations = relationship("Registration", back_populates="student", cascade="all, delete-orphan")
    judge_ratings = relationship("JudgeRating", back_populates="judge", foreign_keys="JudgeRating.judge_id", cascade="all, delete-orphan")
    skills = relationship("StudentProfileSkill", back_populates="student", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="student", cascade="all, delete-orphan")
    created_events = relationship("Event", back_populates="created_by") # Maintain event history even if creator deleted? Maybe SetNull. Leaving as is (or nullable=True in Event)
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    def __str__(self):
        return f"{self.name} ({self.email})"

class StudentProfileSkill(Base):
    __tablename__ = "student_profile_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_name = Column(String, index=True)

    student = relationship("User", back_populates="skills")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    file_path = Column(String)
    file_name_original = Column(String)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)
    content_text = Column(Text, nullable=True)

    student = relationship("User", back_populates="resumes")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    date_time = Column(DateTime)
    end_date_time = Column(DateTime, nullable=True)
    position = Column(Integer, default=0)
    
    # Logistics
    mode = Column(String, default="in_person") # in_person, virtual, hybrid
    venue = Column(String, nullable=True)
    room = Column(String, nullable=True)
    capacity = Column(Integer, default=100)
    waitlist_limit = Column(Integer, nullable=True)
    image_url = Column(String, nullable=True)
    
    # Categorization & Restrictions
    category = Column(String, default="workshop") # workshop, career_fair, competition, etc.
    registration_cap = Column(Integer, default=100)
    rsvp_deadline = Column(DateTime, nullable=True)
    auto_approval = Column(Boolean, default=True)
    faculty_approval_required = Column(Boolean, default=False)
    visibility = Column(String, default="public") # public, ms_mis, sponsor_tier
    
    # Ownership & Status
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sponsor_company = Column(String, nullable=True)
    is_frozen = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    feedback_email_sent = Column(Boolean, default=False)

    # Relationships
    created_by = relationship("User", back_populates="created_events")
    registrations = relationship("Registration", back_populates="event", cascade="all, delete-orphan")
    ratings = relationship("JudgeRating", back_populates="event")
    sessions = relationship("EventSession", back_populates="event", cascade="all, delete-orphan")

    def __str__(self):
        return self.title

class EventSession(Base):
    __tablename__ = "event_sessions"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    title = Column(String)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    capacity = Column(Integer, nullable=True)
    position = Column(Integer, default=0) # For ordering

    event = relationship("Event", back_populates="sessions")
    session_speakers = relationship("SessionSpeaker", back_populates="session", cascade="all, delete-orphan")
    registrations = relationship("Registration", back_populates="session")

class Speaker(Base):
    __tablename__ = "speakers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    bio = Column(Text, nullable=True)
    company = Column(String, nullable=True)
    title = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)

    session_links = relationship("SessionSpeaker", back_populates="speaker")

    def __str__(self):
        return self.name

class SessionSpeaker(Base):
    __tablename__ = "session_speakers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("event_sessions.id"))
    speaker_id = Column(Integer, ForeignKey("speakers.id"))
    slide_deck_url = Column(String, nullable=True)

    session = relationship("EventSession", back_populates="session_speakers")
    speaker = relationship("Speaker", back_populates="session_links")

class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    session_id = Column(Integer, ForeignKey("event_sessions.id"), nullable=True) # Optional session-specific reg
    
    status = Column(String, default="pending") # pending, confirmed, waitlisted, rejected
    attended = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("User", back_populates="registrations")
    event = relationship("Event", back_populates="registrations")
    session = relationship("EventSession", back_populates="registrations")
    feedback_rating = Column(Integer, nullable=True)
    feedback_comments = Column(Text, nullable=True)

    def __str__(self):
        return f"Reg #{self.id} - {self.status}"



class JudgeRating(Base):
    __tablename__ = "judge_ratings"

    id = Column(Integer, primary_key=True, index=True)
    judge_id = Column(Integer, ForeignKey("users.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    score = Column(Integer)
    notes = Column(Text, nullable=True)

    judge = relationship("User", foreign_keys=[judge_id], back_populates="judge_ratings")
    event = relationship("Event", back_populates="ratings")
    student = relationship("User", foreign_keys=[student_id])

    def __str__(self):
        return f"Rating: {self.score}"

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")

    def __str__(self):
        return f"{self.action} ({self.created_at})"

class NotificationTemplate(Base):
    __tablename__ = "notification_templates"

    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String, unique=True) # registration_confirm, etc.
    subject_template = Column(String)
    body_template = Column(Text)

