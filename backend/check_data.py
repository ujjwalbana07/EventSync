
import database, models

def check_data():
    db = database.SessionLocal()
    event = db.query(models.Event).filter(models.Event.title == "Full Stack Hackathon").first()
    if event:
        print(f"Event Found: {event.title}")
        print(f"Sponsor: {event.sponsor_company}")
        print(f"Registrations: {len(event.registrations)}")
    else:
        print("Event NOT Found")
    
    bd = db.query(models.User).filter(models.User.email == "bd@cmis.com").first()
    if bd:
        resume = db.query(models.Resume).filter(models.Resume.user_id == bd.id, models.Resume.is_active == True).first()
        print(f"BD Resume Active: {resume is not None}")
        if resume:
            print(f"BD Resume Content Length: {len(resume.content_text) if resume.content_text else 0}")

if __name__ == "__main__":
    check_data()
