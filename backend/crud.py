from sqlalchemy.orm import Session, joinedload
from passlib.context import CryptContext
import models, schemas
import datetime
from sqlalchemy import func

def create_audit_log(db: Session, user_id: int, action: str, details: dict = None):
    try:
        audit = models.AuditLog(
            user_id=user_id,
            action=action,
            details=details or {}
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        print(f"Failed to create audit log: {e}")
    return audit

def create_audit_log(db: Session, user_id: int, action: str, details: dict = None):
    try:
        audit = models.AuditLog(
            user_id=user_id,
            action=action,
            details=details or {}
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        print(f"Failed to create audit log: {e}")
    return audit

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# --- User Operations ---

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate, verification_token: str = None):
    hashed_password = get_password_hash(user.password)
    
    # New users requiring verification are inactive by default
    is_active = False if verification_token else True
    
    # Role logic: strict input or default? using schema input
    db_user = models.User(
        email=user.email,
        name=user.name,
        role=user.role.value if hasattr(user.role, 'value') else user.role, # Handle Enum or Str
        hashed_password=hashed_password,
        major=user.major,
        graduation_year=user.graduation_year,
        is_active=is_active,
        verification_token=verification_token
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Audit Log moved to verification step for "real" users
    
    return db_user

def get_user_by_token(db: Session, token: str):
    return db.query(models.User).filter(models.User.verification_token == token).first()

def verify_user_email(db: Session, user: models.User):
    # user.is_active = True  <-- CHANGED: Do NOT activate yet. Wait for Admin.
    user.verification_token = None # Clear token to mark email as verified
    db.commit()
    db.refresh(user)
    
    # Audit Log - Log verification
    try:
        audit = models.AuditLog(
            user_id=user.id,
            action="USER_EMAIL_VERIFIED", # Changed action name to be more accurate
            details={"email": user.email, "role": user.role, "name": user.name}
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        print(f"Failed to create audit log: {e}")
    
    return user

def update_user_profile(db: Session, user_id: int, profile: schemas.UserProfileUpdate):
    db_user = get_user(db, user_id)
    if db_user:
        for key, value in profile.dict(exclude_unset=True).items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user

# --- Event Operations ---

def get_events(db: Session, skip: int = 0, limit: int = 100, visibility: str = None):
    query = db.query(models.Event)
    if visibility:
        # Simple logic: if visibility provided, filter. 
        # Real logic should check user permissions vs visibility, but for now:
        query = query.filter(models.Event.visibility == visibility)
    
    query = query.outerjoin(models.Registration).group_by(models.Event.id)
    
    # Select Event and count of registrations
    # Select Event and count of registrations + feedback stats
    results = query.with_entities(
        models.Event,
        func.count(models.Registration.id).label('registrations_count'),
        func.avg(models.Registration.feedback_rating).label('average_rating'),
        func.count(models.Registration.feedback_rating).label('feedback_count')
    ).order_by(models.Event.position.asc(), models.Event.date_time.desc()).offset(skip).limit(limit).all()

    # Map back to Event objects with attributes set
    events = []
    for event, reg_count, avg_rating, fb_count in results:
        event.registrations_count = reg_count
        event.average_rating = float(avg_rating) if avg_rating else 0.0
        event.feedback_count = fb_count
        events.append(event)
        
    return events

def reorder_events(db: Session, event_ids: list[int]):
    for index, e_id in enumerate(event_ids):
        db.query(models.Event).filter(models.Event.id == e_id).update({"position": index})
    db.commit()

def get_event(db: Session, event_id: int):
    # Get event with sessions
    event = db.query(models.Event).options(joinedload(models.Event.sessions)).filter(models.Event.id == event_id).first()
    if event:
        # Get count/stats separately
        stats = db.query(
            func.count(models.Registration.id).label('registrations_count'),
            func.avg(models.Registration.feedback_rating).label('average_rating'),
            func.count(models.Registration.feedback_rating).label('feedback_count')
        ).filter(models.Registration.event_id == event_id).first()
        
        event.registrations_count = stats.registrations_count
        event.average_rating = float(stats.average_rating) if stats.average_rating else 0.0
        event.feedback_count = stats.feedback_count
        
    return event

def create_event(db: Session, event: schemas.EventCreate, user_id: int):
    # Auto-assign next position
    max_pos = db.query(func.max(models.Event.position)).scalar() or 0
    
    event_dict = event.dict()
    if 'registrations_count' in event_dict:
        del event_dict['registrations_count']
    if 'average_rating' in event_dict:
        del event_dict['average_rating']
    if 'feedback_count' in event_dict:
        del event_dict['feedback_count']
        
    db_event = models.Event(**event_dict, created_by_id=user_id, position=max_pos + 1)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def update_event(db: Session, event_id: int, event_update: schemas.EventUpdate):
    db_event = get_event(db, event_id)
    if not db_event:
        return None
    
    update_data = event_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_event, key, value)
    
    db.commit()
    db.refresh(db_event)
    return db_event

def delete_event(db: Session, event_id: int):
    # Clean up dependent relations manually just in case cascade is missing
    db.query(models.Registration).filter(models.Registration.event_id == event_id).delete()
    db.query(models.EventSession).filter(models.EventSession.event_id == event_id).delete()
    
    deleted_count = db.query(models.Event).filter(models.Event.id == event_id).delete()
    db.commit()
    return deleted_count > 0

def create_event_session(db: Session, session: schemas.EventSessionCreate, event_id: int):
    db_session = models.EventSession(
        event_id=event_id,
        title=session.title,
        description=session.description,
        start_time=session.start_time,
        end_time=session.end_time,
        capacity=session.capacity,
        position=session.position
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

# --- Registration Operations ---

def register_user_for_event(db: Session, user_id: int, event_id: int, session_ids: list[int] = None):
    # 1. Check Event
    event = db.query(models.Event).get(event_id)
    if not event: return None
    
    # 2. Check Capacity (Base Event)
    confirmed_count = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.status == "confirmed"
    ).count()
    
    status = "confirmed"
    if event.registration_cap and confirmed_count >= event.registration_cap:
        status = "waitlisted"
        
        # User defined limit or default to 10% of capacity
        limit = event.waitlist_limit
        if limit is None and event.registration_cap:
            limit = int(event.registration_cap * 0.10)
            if limit < 2:
                limit = 2
        
        # If limit is set (including 0 from calculation), enforce it
        if limit is not None:
            waitlist_count = db.query(models.Registration).filter(
               models.Registration.event_id == event_id,
               models.Registration.status == "waitlisted"
            ).count()
            if waitlist_count >= limit:
                return None # Event and waitlist full

    if event.faculty_approval_required and status != "rejected":
        status = "pending"

    # 3. Create Event Registration
    # Check if already exists
    existing = db.query(models.Registration).filter(
        models.Registration.user_id == user_id, 
        models.Registration.event_id == event_id,
        models.Registration.session_id == None
    ).first()

    reg_to_return = existing
    
    if not existing:
        db_reg = models.Registration(
            user_id=user_id, 
            event_id=event_id, 
            status=status,
            session_id=None
        )
        db.add(db_reg)
        db.commit()
        db.refresh(db_reg)
        reg_to_return = db_reg
    
    # 4. Handle Sessions (if granular registration supported)
    if session_ids:
        for sid in session_ids:
            # Check session existence/capacity? Ignoring for brevity
            # Create session registration
            s_reg = models.Registration(
                 user_id=user_id,
                 event_id=event_id,
                 session_id=sid,
                 status="confirmed" # Simplified session logic
            )
            db.add(s_reg)
        db.commit()

    return reg_to_return

def delete_registration(db: Session, user_id: int, event_id: int):
    # Delete primary registration
    db.query(models.Registration).filter(
        models.Registration.user_id == user_id, 
        models.Registration.event_id == event_id
    ).delete()
    db.commit()
    return True

def get_event_registrations(db: Session, event_id: int):
    # Retrieve only main event registrations (session_id is None)
    return db.query(models.Registration).filter(
        models.Registration.event_id == event_id, 
        models.Registration.session_id == None
    ).all()

# --- Other Operations ---

def add_student_skill(db: Session, user_id: int, skill_name: str):
    skill = models.StudentProfileSkill(user_id=user_id, skill_name=skill_name)
    db.add(skill)
    db.commit()
    return skill

def remove_student_skill(db: Session, user_id: int, skill_id: int):
    db.query(models.StudentProfileSkill).filter(models.StudentProfileSkill.id == skill_id).delete()
    db.commit()
    return True

def create_resume_record(db: Session, user_id: int, file_path: str, file_name_original: str):
    db.query(models.Resume).filter(models.Resume.user_id == user_id).update({"is_active": False})
    db_resume = models.Resume(user_id=user_id, file_path=file_path, file_name_original=file_name_original, is_active=True)
    db.add(db_resume)
    db.commit()
    return db_resume

def get_active_resume(db: Session, user_id: int):
    return db.query(models.Resume).filter(models.Resume.user_id == user_id, models.Resume.is_active == True).first()

def create_feedback(db: Session, feedback: schemas.FeedbackCreate, registration_id: int):
    # db_feedback = models.Feedback(**feedback.dict(), registration_id=registration_id)
    # db.add(db_feedback)
    
    # Update Registration directly
    db.query(models.Registration).filter(models.Registration.id == registration_id).update({
        "feedback_rating": feedback.rating,
        "feedback_comments": feedback.comments
    })
    
    db.commit()
    return {"message": "Feedback submitted successfully"}

def create_judge_rating(db: Session, rating: schemas.JudgeRatingCreate, judge_id: int):
    db_rating = models.JudgeRating(**rating.dict(), judge_id=judge_id)
    db.add(db_rating)
    db.commit()
    return db_rating

def get_event_registrations_filtered(db: Session, event_id: int, skill_query: str = None, resume_query: str = None):
    query = db.query(models.Registration).join(models.User).filter(
        models.Registration.event_id == event_id,
        models.Registration.session_id == None
    )
    if skill_query:
        query = query.join(models.StudentProfileSkill, models.User.id == models.StudentProfileSkill.user_id)\
                     .filter(models.StudentProfileSkill.skill_name.ilike(f"%{skill_query}%"))
    
    if resume_query:
        # Search against Name, Major, OR Skills (and resume text if available)
        # We need an OR condition across these joined tables.
        # This requires careful joining.
        from sqlalchemy import or_
        
        # Ensure we have access to Skills and Resume tables in the query if we filter on them
        # Note: Left Outer Joins might be safer if we want to find a user by name even if they have no skills/resume
        # But for 'resume search' implied context, maybe we assume they have a resume? 
        # The prompt says "Search resumes", but users expect to find people.
        # Let's use left joins to be safe and inclusive.
        
        query = query.outerjoin(models.StudentProfileSkill, models.User.id == models.StudentProfileSkill.user_id)\
                     .outerjoin(models.Resume, (models.Resume.user_id == models.User.id) & (models.Resume.is_active == True))
        
        query = query.filter(
            or_(
                models.User.name.ilike(f"%{resume_query}%"),
                models.User.major.ilike(f"%{resume_query}%"),
                models.StudentProfileSkill.skill_name.ilike(f"%{resume_query}%"),
                models.Resume.content_text.ilike(f"%{resume_query}%")
            )
        ).distinct() # distinct needed because joining one-to-many (skills) can produce duplicates
                     
    return query.all()

def get_all_users(db: Session):
    return db.query(models.User).all()

