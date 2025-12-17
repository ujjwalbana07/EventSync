
import database
from sqlalchemy import text

def add_column():
    db = database.SessionLocal()
    try:
        db.execute(text("ALTER TABLE resumes ADD COLUMN content_text TEXT;"))
        db.commit()
        print("Added content_text column to resumes table.")
    except Exception as e:
        print(f"Error (column might already exist): {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_column()
