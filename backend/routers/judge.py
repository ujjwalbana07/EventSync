from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import crud, schemas, database, auth

router = APIRouter(prefix="/judge", tags=["judge"])

@router.get("/events", response_model=List[schemas.Event])
def read_events(db: Session = Depends(database.get_db), current_user = Depends(auth.get_current_judge)):
    return crud.get_events(db)

@router.get("/events/{event_id}/roster", response_model=List[schemas.Registration])
def read_roster(event_id: int, skill: Optional[str] = None, db: Session = Depends(database.get_db), current_user = Depends(auth.get_current_judge)):
    if skill:
        return crud.get_event_registrations_filtered(db, event_id, skill)
    return crud.get_event_registrations(db, event_id)

@router.post("/events/rate", response_model=schemas.JudgeRating)
def rate_student(rating: schemas.JudgeRatingCreate, db: Session = Depends(database.get_db), current_user = Depends(auth.get_current_judge)):
    return crud.create_judge_rating(db, rating, current_user.id)

@router.get("/students/{student_id}/profile", response_model=schemas.User)
def get_student_profile(student_id: int, db: Session = Depends(database.get_db), current_user = Depends(auth.get_current_judge)):
    user = crud.get_user(db, student_id)
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")
    return user

@router.get("/students/{student_id}/resume")
def download_student_resume(student_id: int, db: Session = Depends(database.get_db), current_user = Depends(auth.get_current_judge)):
    resume = crud.get_active_resume(db, student_id)
    if not resume:
        raise HTTPException(status_code=404, detail="No active resume found")
    
    return FileResponse(resume.file_path, media_type="application/pdf", filename=resume.file_name_original)
