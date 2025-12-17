from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import crud, schemas, database, auth, models

router = APIRouter(prefix="/registrations", tags=["registrations"])

@router.get("/me", response_model=List[schemas.Registration])
def read_my_registrations(db: Session = Depends(database.get_db), current_user = Depends(auth.get_current_user)):
    return db.query(models.Registration).filter(models.Registration.user_id == current_user.id).all()

@router.post("/{registration_id}/feedback")
def submit_feedback(registration_id: int, feedback: schemas.FeedbackCreate, db: Session = Depends(database.get_db)):
    reg = db.query(models.Registration).filter(models.Registration.id == registration_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    # Check if already submitted
    if reg.feedback_rating is not None:
         raise HTTPException(status_code=400, detail="Feedback already submitted")

    return crud.create_feedback(db, feedback, registration_id)
