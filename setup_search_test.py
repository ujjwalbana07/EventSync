from sqlalchemy.orm import Session
from database import SessionLocal
import models

def register_student():
    db = SessionLocal()
    try:
        # Register 'student' (ID 4) for Event 9
        # Check if exists first
        exists = db.query(models.Registration).filter(
            models.Registration.user_id == 4, 
            models.Registration.event_id == 9
        ).first()
        
        if not exists:
            reg = models.Registration(user_id=4, event_id=9, status="confirmed")
            db.add(reg)
            db.commit()
            print("Registered user 4 for event 9")
        else:
            print("User 4 already registered")
            
    finally:
        db.close()

if __name__ == "__main__":
    register_student()
