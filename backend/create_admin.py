from sqlalchemy.orm import Session
from passlib.context import CryptContext
import database, models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    db = database.SessionLocal()
    email = "admin@cmis.com"
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        print(f"Creating admin user {email}...")
        hashed_password = pwd_context.hash("password")
        user = models.User(
            email=email,
            name="Admin User",
            hashed_password=hashed_password,
            role="admin",
            is_active=True
        )
        db.add(user)
        db.commit()
        print("Admin created.")
    else:
        print("Admin user already exists. Updating password to 'password'...")
        user.hashed_password = pwd_context.hash("password")
        user.role = "admin"
        user.is_active = True
        db.commit()
        print("Admin updated.")

if __name__ == "__main__":
    create_admin()
