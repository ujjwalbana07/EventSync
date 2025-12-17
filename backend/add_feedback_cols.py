from database import SessionLocal, engine
from sqlalchemy import text

def add_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE registrations ADD COLUMN feedback_rating INTEGER"))
            conn.commit()
            print("Added feedback_rating column")
        except Exception as e:
            print(f"Error adding feedback_rating (might exist): {e}")
            
        try:
            conn.execute(text("ALTER TABLE registrations ADD COLUMN feedback_comments TEXT"))
            conn.commit()
            print("Added feedback_comments column")
        except Exception as e:
            print(f"Error adding feedback_comments (might exist): {e}")

if __name__ == "__main__":
    add_columns()
