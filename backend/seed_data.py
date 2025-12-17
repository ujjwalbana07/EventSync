import requests
import random
import datetime
from sqlalchemy.orm import Session
import database, models, schemas, crud

API_URL = "http://localhost:8000"

def get_token(email, password):
    res = requests.post(f"{API_URL}/auth/login", data={"username": email, "password": password})
    if res.status_code == 200:
        return res.json()["access_token"]
    print(f"Failed to login {email}: {res.text}")
    return None

def ensure_user_exists(db: Session, email, password, name, role):
    user = crud.get_user_by_email(db, email=email)
    if not user:
        print(f"Creating {role}: {email}")
        user_in = schemas.UserCreate(
            email=email,
            password=password,
            name=name,
            role=role,
            major="Computer Science" if role == "student" else None,
            graduation_year=2025 if role == "student" else None
        )
        # Manually create to force is_active=True
        hashed_password = crud.get_password_hash(password)
        db_user = models.User(
            email=user_in.email,
            name=user_in.name,
            role=user_in.role.value if hasattr(user_in.role, 'value') else user_in.role,
            hashed_password=hashed_password,
            major=user_in.major,
            graduation_year=user_in.graduation_year,
            is_active=True, # FORCE ACTIVE
            verification_token=None
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    else:
        print(f"User exists: {email}. Ensuring active.")
        if not user.is_active:
            user.is_active = True
            db.commit()

def seed():
    print("Seeding data...")
    db = database.SessionLocal()
    
    # 1. Ensure Initial Users Exist
    ensure_user_exists(db, "admin@cmis.com", "admin", "Admin User", "admin")
    ensure_user_exists(db, "faculty@cmis.com", "faculty", "Faculty User", "faculty")
    ensure_user_exists(db, "recruiter@cmis.com", "recruiter", "Recruiter User", "recruiter") 
    ensure_user_exists(db, "student@cmis.com", "student", "Student User", "student")
    ensure_user_exists(db, "judge@cmis.com", "judge", "Judge User", "judge")


    # 2. Login as Faculty to create events
    faculty_token = get_token("faculty@cmis.com", "faculty")
    if not faculty_token:
        print("Failed to authenticate as faculty. Exiting.")
        return
    
    auth_header = {"Authorization": f"Bearer {faculty_token}"}

    # 3. Create Events
    events_data = [
        {
            "title": "CMIS Case Competition 2024",
            "description": "The annual case competition.",
            "date_time": (datetime.datetime.now() - datetime.timedelta(days=365)).isoformat(),
            "mode": "in_person",
            "category": "competition",
            "registration_cap": 100,
            "is_frozen": True # Past event
        },
        {
            "title": "Spring 2025 Tech Showcase",
            "description": "Showcasing projects.",
            "date_time": (datetime.datetime.now() + datetime.timedelta(days=30)).isoformat(),
            "mode": "hybrid",
            "category": "career_fair",
            "registration_cap": 200,
            "is_active": True,
            "sponsor_company": "Tech Corp"
        },
        {
            "title": "AI Summit 2025",
            "description": "Future of AI in Business.",
            "date_time": (datetime.datetime.now() + datetime.timedelta(days=90)).isoformat(),
            "mode": "in_person",
            "category": "workshop",
            "registration_cap": 50,
            "visibility": "public" 
        }
    ]

    event_ids = []
    for evt in events_data:
        res = requests.post(f"{API_URL}/events/", json=evt, headers=auth_header)
        if res.status_code == 200:
            print(f"Created event: {evt['title']}")
            eid = res.json()["id"]
            event_ids.append(eid)
            
            # Create Sessions for AI Summit
            if "AI Summit" in evt['title']:
                s1 = {
                    "title": "Keynote: AI in 2025",
                    "start_time": evt['date_time'],
                    "end_time": (datetime.datetime.fromisoformat(evt['date_time']) + datetime.timedelta(hours=1)).isoformat()
                }
                requests.post(f"{API_URL}/events/{eid}/sessions", json=s1, headers=auth_header)
        else:
            print(f"Failed to create event: {res.text}")

    # 4. Registrations (Students)
    student_token = get_token("student@cmis.com", "student")
    if student_token and event_ids:
        h = {"Authorization": f"Bearer {student_token}"}
        # Register for active one
        if len(event_ids) > 1:
            requests.post(f"{API_URL}/events/{event_ids[1]}/register", headers=h)
            print("Student registered for event 2")

    print("Seeding complete.")

if __name__ == "__main__":
    seed()
