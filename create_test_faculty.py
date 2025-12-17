from sqlalchemy.orm import Session
from database import SessionLocal
import models
from crud import get_password_hash

def create_test_faculty():
    db = SessionLocal()
    try:
        email = "test_faculty@cmis.com"
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(
                email=email,
                name="Test Faculty",
                hashed_password=get_password_hash("password"),
                role="faculty",
                is_active=True
            )
            db.add(user)
            db.commit()
            print(f"Created user {email}")
        else:
            print(f"User {email} already exists")
            # Update password to be sure
            user.hashed_password = get_password_hash("password")
            db.commit()
            print("Updated password.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_faculty()
