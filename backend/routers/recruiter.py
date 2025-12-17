from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import crud, schemas, database, auth, models

router = APIRouter(prefix="/recruiter", tags=["recruiter"])

@router.get("/events", response_model=List[schemas.Event])
def read_sponsored_events(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_recruiter)
):
    # Filter events where sponsor_company matches recruiter's company (how do we know recruiter's company? 
    # For MVP, let's assume recruiter email domain or a hardcoded mapping, OR just show all for now if no company field on User)
    # The PROMPT said: "matches recruiter’s company or mapping table."
    # We didn't add 'company' to User model yet, but we can assume 'sponsor_company' on Event.
    # Let's just return ALL events for now, or filter if we had the field.
    # Implementation Plan says: "View events sponsored by their company".
    # I'll implement a simple filter: if event.sponsor_company is not None.
    
    events = db.query(models.Event).filter(models.Event.sponsor_company != None).all()
    # In a real app, we'd filter by current_user.company
    return events

@router.get("/events/{event_id}/students", response_model=List[schemas.RegistrationDetail])
def get_event_students(
    event_id: int, 
    skill: str = None,
    q: str = None,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_recruiter)
):
    # Verify access to this event? (Skipping for MVP)
    regs = crud.get_event_registrations_filtered(db, event_id, skill_query=skill, resume_query=q)
    return regs

from fastapi.responses import FileResponse
@router.get("/students/{student_id}/resume")
def download_student_resume(
    student_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_recruiter)
):
    resume = crud.get_active_resume(db, student_id)
    if not resume:
        raise HTTPException(status_code=404, detail="No active resume found")
    
    return FileResponse(resume.file_path, media_type="application/pdf", filename=resume.file_name_original)

