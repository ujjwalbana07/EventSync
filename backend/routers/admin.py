from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import datetime
import crud, schemas, database, auth, models

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/analytics")
def get_analytics(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    total_users = db.query(models.User).count()
    total_events = db.query(models.Event).count()
    total_registrations = db.query(models.Registration).count()
    
    # Breakdown by role
    students = db.query(models.User).filter(models.User.role == "student").count()
    faculty = db.query(models.User).filter(models.User.role == "faculty").count()
    recruiters = db.query(models.User).filter(models.User.role == "recruiter").count()

    return {
        "users": {
            "total": total_users,
            "students": students,
            "faculty": faculty,
            "recruiters": recruiters
        },
        "events": {
            "total": total_events
        },
        "registrations": {
            "total": total_registrations
        }
    }

@router.post("/registrations/bulk-approve")
def bulk_approve_registrations(
    registration_ids: List[int],
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    # Update all to confirmed
    db.query(models.Registration).filter(
        models.Registration.id.in_(registration_ids)
    ).update({"status": "confirmed"}, synchronize_session=False)
    db.commit()
    return {"message": f"Approved {len(registration_ids)} registrations"}

@router.get("/users/pending")
def get_pending_users(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    return db.query(models.User).filter(models.User.is_active == False, models.User.verification_token == None).all()

@router.get("/users")
def get_all_users(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    """List all users for Admin management"""
    return db.query(models.User).order_by(models.User.id.desc()).all()


@router.post("/users/{user_id}/authorize")
def authorize_user(
    user_id: int,
    is_active: bool = True,
    role: str = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    print(f"[DEBUG] Authorizing User {user_id}. New Active Status: {is_active}")
    user.is_active = is_active
    if role and role in ["student", "faculty", "recruiter", "admin", "judge"]:
        user.role = role
        
    db.commit()
    db.refresh(user)
    print(f"[DEBUG] User {user_id} saved. Is Active: {user.is_active}")
    return {"message": f"User {user.email} updated", "is_active": user.is_active, "role": user.role}

@router.get("/stats")
def get_stats(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    """
    Returns high-level stats for the Admin Dashboard task bar
    """
    # Dynamic Stats
    now = datetime.datetime.utcnow()
    today_start = datetime.datetime(now.year, now.month, now.day)
    
    pending_approvals = db.query(models.User).filter(models.User.is_active == False, models.User.verification_token == None).count()
    new_users_today = db.query(models.User).filter(models.User.created_at >= today_start).count()
    # User expects total active events regardless of date (matching the dashboard list)
    active_events = db.query(models.Event).filter(models.Event.is_active == True).count()
    new_judges = db.query(models.User).filter(models.User.role == "judge").count()
    
    return {
        "pending_requests": pending_approvals,
        "new_users_today": new_users_today,
        "active_events": active_events,
        "new_judges": new_judges
    }

@router.get("/notifications")
def get_notifications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    """
    Returns list of recent system notifications
    """
    notifications = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(10).all()
    
    result = []
    for note in notifications:
        details = note.details or {}
        msg = f"System Action: {note.action}"
        
        if note.action == "USER_REGISTERED":
            email = details.get("email", "Unknown")
            role = details.get("role", "Unknown")
            msg = f"New {role} registered: {email}"
        elif note.action == "EVENT_CREATED":
            title = details.get("title", "Unknown")
            msg = f"Event Created: {title}"
        elif note.action == "EVENT_UPDATED":
            title = details.get("title", "Unknown")
            msg = f"Event Updated: {title}"
        elif note.action == "EVENT_DELETED":
            title = details.get("title", "Unknown")
            msg = f"Event Deleted: {title}"
        elif note.action == "USER_EMAIL_VERIFIED":
             email = details.get("email", "Unknown")
             msg = f"User Verified: {email}"
            
        result.append({
            "id": note.id,
            "message": msg,
            "time": note.created_at.strftime("%H:%M") if note.created_at.date() == func.current_date() else note.created_at.strftime("%b %d"),
            "type": "info" if "DELETED" not in note.action else "alert"
        })
        
    return result

@router.get("/resumes", response_model=List[schemas.ResumeDetail])
def get_all_resumes(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    """
    Returns all active resumes with student details
    """
    return db.query(models.Resume).join(models.User).filter(models.Resume.is_active == True).all()

@router.delete("/resumes/{resume_id}")
def delete_resume(
    resume_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_active_admin)
):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Ideally delete file from disk too, but for now logic is just DB cleanup
    # os.remove(resume.file_path) if os.path.exists
    db.delete(resume)
    db.commit()
    return {"message": "Resume deleted"}
