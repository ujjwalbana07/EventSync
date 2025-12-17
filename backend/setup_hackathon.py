
import os
import datetime
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fpdf import FPDF
import database, models, schemas


from pypdf import PdfReader

# Initialize Password Context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
RESUME_DIR = "data/resumes"

def generate_rich_pdf_resume(filename, user_name, role_title, skills, experience, education):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=16)
    pdf.cell(0, 10, text=f"Resume of {user_name}", new_x="LMARGIN", new_y="NEXT", align="C")
    
    pdf.set_font("Helvetica", size=12)
    pdf.cell(0, 10, text=f"Target Role: {role_title}", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(5)
    
    pdf.set_font("Helvetica", style='B', size=12)
    pdf.cell(0, 10, text="Summary", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", size=10)
    pdf.multi_cell(0, 5, text=f"Motivated {role_title} with a strong background in Computer Science. Passionate about building scalable applications.")
    pdf.ln(5)
    
    pdf.set_font("Helvetica", style='B', size=12)
    pdf.cell(0, 10, text="Skills", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", size=10)
    pdf.multi_cell(0, 5, text=skills)
    pdf.ln(5)

    pdf.set_font("Helvetica", style='B', size=12)
    pdf.cell(0, 10, text="Experience", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", size=10)
    pdf.multi_cell(0, 5, text=experience)
    pdf.ln(5)

    pdf.set_font("Helvetica", style='B', size=12)
    pdf.cell(0, 10, text="Education", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", size=10)
    pdf.multi_cell(0, 5, text=education)

    filepath = os.path.join(RESUME_DIR, filename)
    pdf.output(filepath)
    return filepath

def extract_text_from_pdf(filepath):
    try:
        reader = PdfReader(filepath)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        print(f"Error extracting text from {filepath}: {e}")
        return ""

def get_or_create_user(db: Session, email: str, name: str, password: str = "password"):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        print(f"Creating user {name} ({email})...")
        hashed_password = pwd_context.hash(password)
        user = models.User(
            email=email,
            name=name,
            hashed_password=hashed_password,
            role="student",
            is_active=True,
            major="Computer Science",
            graduation_year=2025
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        print(f"User {name} already exists.")
    return user

def setup_scenario():
    db = database.SessionLocal()
    
    # 1. Create Users
    bd = get_or_create_user(db, "bd@cmis.com", "BD")
    gomz = get_or_create_user(db, "gomz@cmis.com", "Gomz")
    
    # 2. Create Event
    event_title = "Full Stack Hackathon"
    event = db.query(models.Event).filter(models.Event.title == event_title).first()
    if not event:
        print(f"Creating event: {event_title}...")
        event = models.Event(
            title=event_title,
            description="A 24-hour hackathon to build full stack web applications.",
            date_time=datetime.datetime.now() + datetime.timedelta(days=14),
            mode="in_person",
            venue="Main Hall",
            capacity=100,
            registration_cap=100,
            sponsor_company="Global Tech Corp",
            is_active=True,
            is_frozen=False,
            category="competition",
            visibility="public"
        )
        db.add(event)
        db.commit()
        db.refresh(event)
    else:
        print(f"Event {event_title} already exists. Updating sponsor...")
        event.sponsor_company = "Global Tech Corp"
        db.commit()

    # 3. Generate & Upload Resumes
    # BD - Back End Developer
    bd_resume_name = f"resume_bd_{datetime.datetime.now().strftime('%Y%m%d')}.pdf"
    bd_skills = "Python, Django, FastAPI, PostgreSQL, Docker, AWS, Redis, GraphQL"
    bd_exp = "Intern at TechCorp: Built REST APIs for high-volume transactions. Optimized database queries."
    bd_edu = "BS Computer Science, CMIS University (2025)"
    
    bd_resume_path = generate_rich_pdf_resume(bd_resume_name, "BD", "Back End Developer", bd_skills, bd_exp, bd_edu)
    bd_text = extract_text_from_pdf(bd_resume_path)

    existing_resume_bd = db.query(models.Resume).filter(models.Resume.user_id == bd.id, models.Resume.is_active == True).first()
    if not existing_resume_bd:
        print("Uploading BD's resume...")
        db_resume_bd = models.Resume(
            user_id=bd.id,
            file_path=bd_resume_path,
            file_name_original="bd_backend_resume.pdf",
            uploaded_at=datetime.datetime.now(),
            is_active=True,
            content_text=bd_text
        )
        db.add(db_resume_bd)
        db.commit()
    else:
         print("BD already has an active resume. Updating content...")
         existing_resume_bd.content_text = bd_text
         db.commit()

    # Gomz - Front End Developer
    gomz_resume_name = f"resume_gomz_{datetime.datetime.now().strftime('%Y%m%d')}.pdf"
    gomz_skills = "JavaScript, TypeScript, React, Next.js, Tailwind CSS, Figma, Redux, Jest"
    gomz_exp = "Frontend Dev at StartupX: Designed and implemented responsive UI components. Improved site performance by 40%."
    gomz_edu = "BS Software Engineering, CMIS University (2025)"
    
    gomz_resume_path = generate_rich_pdf_resume(gomz_resume_name, "Gomz", "Front End Developer", gomz_skills, gomz_exp, gomz_edu)
    gomz_text = extract_text_from_pdf(gomz_resume_path)
    
    existing_resume_gomz = db.query(models.Resume).filter(models.Resume.user_id == gomz.id, models.Resume.is_active == True).first()
    if not existing_resume_gomz:
        print("Uploading Gomz's resume...")
        db_resume_gomz = models.Resume(
            user_id=gomz.id,
            file_path=gomz_resume_path,
            file_name_original="gomz_frontend_resume.pdf",
            uploaded_at=datetime.datetime.now(),
            is_active=True,
            content_text=gomz_text
        )
        db.add(db_resume_gomz)
        db.commit()
    else:
         print("Gomz already has an active resume. Updating content...")
         existing_resume_gomz.content_text = gomz_text
         db.commit()

    # 4. Register Users for Event
    users_to_register = [bd, gomz]
    for user in users_to_register:
        reg = db.query(models.Registration).filter(
            models.Registration.user_id == user.id,
            models.Registration.event_id == event.id
        ).first()

        
        if not reg:
            print(f"Registering {user.name} for {event_title}...")
            new_reg = models.Registration(
                user_id=user.id,
                event_id=event.id,
                status="confirmed",
                attended=False,
                created_at=datetime.datetime.now()
            )
            db.add(new_reg)
        else:
            print(f"{user.name} already registered.")
            
    db.commit()
    print("Scenario setup complete!")

if __name__ == "__main__":
    setup_scenario()
