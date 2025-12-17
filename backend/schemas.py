from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum

# --- Enums ---
class UserRole(str, Enum):
    STUDENT = "student"
    FACULTY = "faculty"
    RECRUITER = "recruiter"
    ADMIN = "admin"
    JUDGE = "judge"

class EventMode(str, Enum):
    IN_PERSON = "in_person"
    VIRTUAL = "virtual"
    HYBRID = "hybrid"

class EventCategory(str, Enum):
    WORKSHOP = "workshop"
    CAREER_FAIR = "career_fair"
    MIXER = "mixer"
    TECH_TALK = "tech_talk"
    COMPETITION = "competition"
    SPONSOR_EVENT = "sponsor_event"

class RegistrationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    WAITLISTED = "waitlisted"
    REJECTED = "rejected"

# --- Shared Base Models ---

class SkillBase(BaseModel):
    skill_name: str

class Skill(SkillBase):
    id: int
    user_id: int
    class Config:
        orm_mode = True

class ResumeBase(BaseModel):
    pass

class Resume(ResumeBase):
    id: int
    file_path: str
    file_name_original: str
    uploaded_at: datetime
    is_active: bool
    class Config:
        orm_mode = True

class ResumeDetail(Resume):
    student: "User"


# --- User Schemas ---

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.STUDENT
    # Optional profile fields can be set initially or later
    major: Optional[str] = None
    graduation_year: Optional[int] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    headline: Optional[str] = None
    interests: Optional[str] = None
    linkedin_url: Optional[str] = None

class User(UserBase):
    id: int
    role: str
    is_active: bool
    
    # Profile
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    headline: Optional[str] = None
    interests: Optional[str] = None
    linkedin_url: Optional[str] = None

    skills: List[Skill] = []
    resumes: List[Resume] = []

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- Session & Speaker Schemas ---

class SpeakerBase(BaseModel):
    name: str
    bio: Optional[str] = None
    company: Optional[str] = None
    title: Optional[str] = None
    linkedin_url: Optional[str] = None

class Speaker(SpeakerBase):
    id: int
    class Config:
        orm_mode = True

class SpeakerCreate(SpeakerBase):
    pass

class EventSessionBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    capacity: Optional[int] = None
    position: int = 0

class EventSessionCreate(EventSessionBase):
    speaker_ids: List[int] = [] # Optional list of speaker IDs to link

class EventSession(EventSessionBase):
    id: int
    event_id: int
    class Config:
        orm_mode = True

# --- Event Schemas ---

class EventBase(BaseModel):
    title: str
    description: str
    date_time: datetime
    end_date_time: Optional[datetime] = None
    mode: EventMode = EventMode.IN_PERSON
    venue: Optional[str] = None
    room: Optional[str] = None
    capacity: int = 100
    waitlist_limit: Optional[int] = None
    image_url: Optional[str] = None
    category: EventCategory = EventCategory.WORKSHOP
    registration_cap: int = 100
    rsvp_deadline: Optional[datetime] = None
    auto_approval: bool = True
    faculty_approval_required: bool = False
    visibility: str = "public"
    
    registrations_count: Optional[int] = 0
    average_rating: Optional[float] = 0.0
    feedback_count: Optional[int] = 0
    sponsor_company: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(EventBase):
    title: Optional[str] = None
    description: Optional[str] = None
    date_time: Optional[datetime] = None
    mode: Optional[EventMode] = None
    venue: Optional[str] = None
    room: Optional[str] = None
    capacity: Optional[int] = None
    waitlist_limit: Optional[int] = None
    image_url: Optional[str] = None
    category: Optional[EventCategory] = None
    registration_cap: Optional[int] = None
    rsvp_deadline: Optional[datetime] = None
    auto_approval: Optional[bool] = None
    faculty_approval_required: Optional[bool] = None
    visibility: Optional[str] = None
    sponsor_company: Optional[str] = None
    is_frozen: Optional[bool] = None
    is_active: Optional[bool] = None

class Event(EventBase):
    id: int
    created_by_id: Optional[int]
    is_frozen: bool
    is_active: bool
    
    sessions: List[EventSession] = []

    class Config:
        orm_mode = True

# --- Registration Schemas ---

class RegistrationBase(BaseModel):
    pass

class RegistrationCreate(RegistrationBase):
    session_ids: Optional[List[int]] = None # Optional: register for specific sessions

class Registration(RegistrationBase):
    id: int
    user_id: Optional[int] = None
    event_id: int
    session_id: Optional[int] = None
    status: RegistrationStatus
    attended: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

class RegistrationDetail(Registration):
    # Includes full student info
    student: Optional[User] = None
    feedback_rating: Optional[int] = None
    feedback_comments: Optional[str] = None

# --- Feedback & Rating ---

class FeedbackBase(BaseModel):
    rating: int
    comments: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class Feedback(FeedbackBase):
    id: int
    registration_id: int
    created_at: datetime
    class Config:
        orm_mode = True

class JudgeRatingBase(BaseModel):
    score: int
    notes: Optional[str] = None

class JudgeRatingCreate(JudgeRatingBase):
    student_id: int

class JudgeRating(JudgeRatingBase):
    id: int
    judge_id: int
    student_id: int
    event_id: int
    class Config:
        orm_mode = True

class GuestInviteRequest(BaseModel):
    emails: List[str]
