from sqlalchemy.orm import Session
import database, models
from datetime import datetime

def debug_events():
    db = database.SessionLocal()
    now = datetime.utcnow()
    print(f"Current UTC Time: {now}")
    
    events = db.query(models.Event).all()
    print(f"Total Events Found: {len(events)}")
    
    active_future_count = 0
    
    print("\nID | Title | Active? | Date (UTC) | Status vs Now")
    print("-" * 60)
    for e in events:
        status_msg = "PASSED" if e.date_time < now else "UPCOMING"
        if e.is_active and e.date_time >= now:
            active_future_count += 1
            status_msg = "COUNTED"
            
        print(f"{e.id} | {e.title[:20]} | {e.is_active} | {e.date_time} | {status_msg}")

    print("-" * 60)
    print(f"Calculated Count (Active + Future): {active_future_count}")

if __name__ == "__main__":
    debug_events()
