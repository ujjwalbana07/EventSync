import sys
sys.path.append("/app")
from database import SessionLocal
from models import User, AuditLog
import crud

def run_test():
    db = SessionLocal()
    email = "delete_test@example.com"
    
    print(f"--- Testing Deletion for {email} ---")
    
    # 1. Cleanup first
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print("Cleaning up pre-existing user...")
        db.delete(existing)
        db.commit()

    # 2. Create User
    print("Creating user...")
    user_in = crud.schemas.UserCreate(email=email, password="password", name="Del Test", role="student")
    user = crud.create_user(db, user_in)
    print(f"User created: {user.id}")
    
    # 3. Create Dependency (Audit Log)
    print("Creating audit log dependency...")
    # Manually triggering verification logic which creates log
    crud.verify_user_email(db, user) # This creates an AuditLog row
    print("User email verified (AuditLog created).")

    # 4. Try Delete
    print("Attempting delete...")
    try:
        db.delete(user)
        db.commit()
        print("Delete committed successfully.")
    except Exception as e:
        print(f"Delete FAILED: {e}")
        return

    # 5. Verify Gone
    check = db.query(User).filter(User.email == email).first()
    if check:
        print("FAILED: User still exists in DB!")
    else:
        print("SUCCESS: User deleted from DB.")
        
    # 6. Re-create
    print("Attempting re-registration...")
    try:
        user_new = crud.create_user(db, user_in)
        print(f"SUCCESS: Re-created user {user_new.id}")
    except Exception as e:
        print(f"FAILED to re-create: {e}")

if __name__ == "__main__":
    run_test()
