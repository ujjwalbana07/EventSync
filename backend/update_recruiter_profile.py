import database, models
from sqlalchemy.orm import Session

def update_recruiter():
    db = database.SessionLocal()
    user = db.query(models.User).filter(models.User.email == "recruiter@cmis.com").first()
    if user:
        user.name = "Tyler Morgan"
        user.headline = "Senior Technical Recruiter at Global Tech Corp"
        user.linkedin_url = "https://www.linkedin.com/in/tylermorgan"
        user.interests = "University Recruiting, Software Engineering, AI/ML, Diversity & Inclusion"
        db.commit()
        print("Updated Recruiter Profile: Tyler Morgan")
    else:
        print("Recruiter user not found!")

if __name__ == "__main__":
    update_recruiter()
