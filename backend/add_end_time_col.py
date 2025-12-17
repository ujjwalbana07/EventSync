from database import SessionLocal, engine
from sqlalchemy import text

def add_columns():
    db = SessionLocal()
    try:
        # Check if columns exist first to be safe, or just try/except
        try:
            db.execute(text("ALTER TABLE events ADD COLUMN end_date_time TIMESTAMP"))
            print("Added end_date_time column")
        except Exception as e:
            print(f"end_date_time error (maybe exists): {e}")
            db.rollback()

        try:
            db.execute(text("ALTER TABLE events ADD COLUMN feedback_email_sent BOOLEAN DEFAULT FALSE"))
            print("Added feedback_email_sent column")
        except Exception as e:
            print(f"feedback_email_sent error (maybe exists): {e}")
            db.rollback()
            
        try:
            db.execute(text("UPDATE events SET feedback_email_sent = FALSE WHERE feedback_email_sent IS NULL"))
            print("Set default values for feedback_email_sent")
        except Exception as e:
             print(f"Update default error: {e}")
             db.rollback()

        db.commit()
        print("Migration complete")
    finally:
        db.close()

if __name__ == "__main__":
    add_columns()
