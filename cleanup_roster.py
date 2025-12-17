from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

def cleanup():
    db = SessionLocal()
    try:
        # Find users
        users = db.query(models.User).filter(models.User.name.in_(['BD', 'Gomz'])).all()
        print(f"Found {len(users)} users.")
        
        event_id = 9
        
        for user in users:
            print(f"Processing user: {user.name} (ID: {user.id})")
            
            # 1. Delete Registration for Event 9
            regs = db.query(models.Registration).filter(
                models.Registration.user_id == user.id,
                models.Registration.event_id == event_id
            ).all()
            for reg in regs:
                db.delete(reg)
                print(f"  Deleted registration {reg.id}")
            
            # 2. Delete Active Resumes
            resumes = db.query(models.Resume).filter(
                models.Resume.user_id == user.id,
                models.Resume.is_active == True
            ).all()
            for resume in resumes:
                db.delete(resume)
                print(f"  Deleted resume {resume.id}")
        
        db.commit()
        print("Cleanup complete.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
