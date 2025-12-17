from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from database import SessionLocal
import models, email_utils
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_and_send_feedback_emails():
    logger.info("Checking for completed events to send feedback emails...")
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        # Find events that have ended, not active, and feedback email not sent
        # Or just ended? Requirement: "After end time". 
        # Let's assume active events that have passed end_date_time.
        events = db.query(models.Event).filter(
            models.Event.end_date_time < now,
            models.Event.feedback_email_sent == False,
            models.Event.end_date_time.isnot(None)
        ).all()
        
        for event in events:
            logger.info(f"Sending feedback emails for event: {event.title}")
            confirmed_registrations = db.query(models.Registration).filter(
                models.Registration.event_id == event.id,
                models.Registration.status == "confirmed"
            ).all()
            
            for reg in confirmed_registrations:
                if reg.student and reg.student.email:
                     # Using utility to send email
                     # We need to ensure email_utils has send_feedback_request_email
                     try:
                        email_utils.send_feedback_request_email(
                            email=reg.student.email,
                            event_title=event.title,
                            student_name=reg.student.name,
                            registration_id=reg.id
                        )
                     except Exception as e:
                         logger.error(f"Failed to send email to {reg.student.email}: {e}")
            
            event.feedback_email_sent = True
            db.commit()
            
    except Exception as e:
        logger.error(f"Scheduler error: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every 5 minutes
    scheduler.add_job(check_and_send_feedback_emails, 'interval', minutes=5)
    scheduler.start()
    logger.info("Feedback Scheduler started.")
