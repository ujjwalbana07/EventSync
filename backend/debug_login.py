from sqlalchemy.orm import Session
import database, models, crud

def debug_login():
    db = database.SessionLocal()
    email = "admin@cmis.com"
    password = "password"
    
    user = crud.get_user_by_email(db, email)
    if not user:
        print(f"User {email} NOT FOUND.")
        return

    print(f"User found: {user.email}")
    print(f"Stored Hash: {user.hashed_password}")
    
    is_valid = crud.verify_password(password, user.hashed_password)
    print(f"Password '{password}' valid? {is_valid}")

    if not is_valid:
        # Try resetting it again explicitly here using crud's context
        print("Attempting to fix hash...")
        new_hash = crud.get_password_hash(password)
        user.hashed_password = new_hash
        db.commit()
        print("Hash updated using crud.get_password_hash. Retrying...")
        is_valid_retry = crud.verify_password(password, user.hashed_password)
        print(f"Retry valid? {is_valid_retry}")

if __name__ == "__main__":
    debug_login()
