from sqlalchemy.orm import Session
from database import SessionLocal
import models

def cleanup():
    db = SessionLocal()
    try:
        # Hardcode IDs seen in screenshots/logs: 9 (BD), 13 (Gomz), 14 (BD), 15 (Gomz)
        # Also clean by name just in case.
        target_ids = [9, 13, 14, 15]
        
        print(f"cleaning up IDs: {target_ids}")
        
        event_id = 9
        
        # 1. Delete Registrations
        regs = db.query(models.Registration).filter(
            models.Registration.user_id.in_(target_ids),
            models.Registration.event_id == event_id
        ).all()
        for reg in regs:
            db.delete(reg)
            print(f"Deleted registration {reg.id} for user {reg.user_id}")
            
        # 2. Resumes: DO NOT DELETE. User wants them in Admin Dashboard.
        # Ensure 'student' (ID 4?) has one active.
        
        db.commit()
        print("Cleanup complete.")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup()
