import database, models
from sqlalchemy.orm import Session

def remove_sponsorship():
    db = database.SessionLocal()
    titles_to_remove = [
        "Spring 2025 Tech Showcase",
        "AI & Future of Work Workshop",
        "Tech Talk: Quantum Computing"
    ]
    
    events = db.query(models.Event).filter(models.Event.title.in_(titles_to_remove)).all()
    
    for event in events:
        print(f"Removing sponsorship from: {event.title} (Sponsor: {event.sponsor_company})")
        event.sponsor_company = None
    
    db.commit()
    print("Updates committed.")

if __name__ == "__main__":
    remove_sponsorship()
