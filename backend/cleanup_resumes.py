from sqlalchemy.orm import Session
import database, models

def cleanup_resumes():
    db = database.SessionLocal()
    print("Starting resume cleanup...")
    
    # Get all users who have resumes
    users = db.query(models.User).join(models.Resume).all()
    
    total_deactivated = 0
    
    for user in users:
        # Get all active resumes for this user, ordered by upload date desc
        resumes = db.query(models.Resume).filter(
            models.Resume.user_id == user.id,
            models.Resume.is_active == True
        ).order_by(models.Resume.uploaded_at.desc()).all()
        
        if len(resumes) > 1:
            print(f"User {user.email} has {len(resumes)} active resumes. Keeping newest: {resumes[0].file_name_original}")
            # Keep index 0 (newest), deactivate rest
            for r in resumes[1:]:
                print(f" - Deactivating old resume: {r.file_name_original} (ID: {r.id})")
                r.is_active = False
                total_deactivated += 1
        else:
            if resumes:
                print(f"User {user.email} OK: 1 active resume.")
            else:
                 # Should not hit this due to join, but safe to ignore
                 pass

    if total_deactivated > 0:
        db.commit()
        print(f"Cleanup complete. Deactivated {total_deactivated} duplicate resumes.")
    else:
        print("Cleanup complete. No duplicates found.")

if __name__ == "__main__":
    cleanup_resumes()
