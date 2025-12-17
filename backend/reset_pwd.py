from database import SessionLocal
import models
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_password(email, new_password):
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        user.hashed_password = pwd_context.hash(new_password)
        db.commit()
        print(f"Password for {email} reset successfully.")
    else:
        print(f"User {email} not found.")
    db.close()

if __name__ == "__main__":
    reset_password("faculty@cmis.com", "faculty")
