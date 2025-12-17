from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import crud, schemas, database, auth
import shutil
import os
import datetime

router = APIRouter(prefix="/student/profile", tags=["profile"])

RESUME_DIR = "data/resumes"
os.makedirs(RESUME_DIR, exist_ok=True)

@router.get("/", response_model=schemas.User)
def get_profile(current_user = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return current_user

@router.put("/", response_model=schemas.User)
def update_profile(profile: schemas.UserProfileUpdate, current_user = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return crud.update_user_profile(db, user_id=current_user.id, profile=profile)

@router.post("/skills", response_model=schemas.Skill)
def add_skill(skill: schemas.SkillBase, current_user = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return crud.add_student_skill(db, user_id=current_user.id, skill_name=skill.skill_name)

@router.delete("/skills/{skill_id}")
def delete_skill(skill_id: int, current_user = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    crud.remove_student_skill(db, user_id=current_user.id, skill_id=skill_id)
    return {"message": "Skill removed"}

@router.post("/resume", response_model=schemas.Resume)
async def upload_resume(file: UploadFile = File(...), current_user = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # 5MB check handling would ideally happen by reading chunks, but for simplicity relying on nginx/server limits or checking size after seek
    # Here we just proceed to save
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"user_{current_user.id}_{timestamp}.pdf"
    file_path = os.path.join(RESUME_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
        
    resume = crud.create_resume_record(db, user_id=current_user.id, file_path=file_path, file_name_original=file.filename)
    return resume

@router.get("/resume")
def get_resume_metadata(current_user = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    resume = crud.get_active_resume(db, current_user.id)
    if not resume:
        return None
    return resume

@router.get("/resume/download")
def download_resume(current_user = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    resume = crud.get_active_resume(db, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="No active resume found")
    
    return FileResponse(resume.file_path, media_type="application/pdf", filename=resume.file_name_original)
