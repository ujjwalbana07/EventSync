from database import SessionLocal
import models

def list_users():
    db = SessionLocal()
    users = db.query(models.User).all()
    print("--- User List ---")
    for u in users:
        print(f"ID: {u.id} | Email: {u.email} | Role: {u.role} | Active: {u.is_active}")
    db.close()

if __name__ == "__main__":
    list_users()
