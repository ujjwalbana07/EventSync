import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
import google.generativeai as genai
from pydantic import EmailStr, BaseModel
from typing import List

class EmailSchema(BaseModel):
    email: List[EmailStr]

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "user@example.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "password"),
    MAIL_FROM=os.getenv("MAIL_FROM", "admin@cmis.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "CMIS Admin"),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True") == "True",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False") == "True",
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_verification_email(email: EmailStr, token: str):
    verification_link = f"http://localhost:8000/auth/verify?token={token}"
    
    html = f"""
    <h3>Verify your account</h3>
    <p>Thanks for registering with CMIS.</p>
    <p>Please click the link below to verify your account:</p>
    <p><a href="{verification_link}">{verification_link}</a></p>
    <br>
    <p>If you did not register, please ignore this email.</p>
    """

    message = MessageSchema(
        subject="Verify your CMIS Account",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"Email sent to {email}")
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

async def send_event_registration_email(email: EmailStr, event_title: str, student_name: str = "Student"):
    
    # Try using Gemini for personalized content
    import random
    
    # Get all keys, split by comma, and strip whitespace
    api_keys_str = os.getenv("GEMINI_API_KEYS", "")
    api_keys = [k.strip() for k in api_keys_str.split(",") if k.strip()]
    
    # Fallback to single key if no list provided
    if not api_keys:
        single_key = os.getenv("GEMINI_API_KEY")
        if single_key:
            api_keys.append(single_key)
            
    # Select a random key if available
    api_key = random.choice(api_keys) if api_keys else None
    
    ai_content = None
    
    if api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-flash-latest')
            prompt = f"""
            Write a short, warm, and professional HTML email body for a student named '{student_name}' who just registered for the event '{event_title}'.
            
            Requirements:
            - Congratulate them on registering.
            - Mention the event title clearly.
            - Use a friendly and encouraging tone.
            - Keep it brief (under 100 words).
            - Output ONLY the HTML body content (do not include <html> or <body> tags, just the inner elements like <p>, <h3>, etc).
            - Sign off as 'The CMIS Team'.
            """
            response = model.generate_content(prompt)
            ai_content = response.text
            # Cleanup potential markdown code blocks if Gemini adds them
            ai_content = ai_content.replace("```html", "").replace("```", "")
        except Exception as e:
            print(f"Gemini generation failed with key starting {api_key[:5]}...: {e}")

    if ai_content:
        html = ai_content
    else:
        # Fallback Template
        html = f"""
        <h3>Event Registration Confirmed</h3>
        <p>Hello {student_name},</p>
        <p>You have successfully registered for the event: <strong>{event_title}</strong>.</p>
        <p>We look forward to seeing you there!</p>
        <br>
        <p>Best regards,</p>
        <p>The CMIS Team</p>
        """

    message = MessageSchema(
        subject=f"Registration Confirmed: {event_title}",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"Registration email sent to {email} for event '{event_title}'")
        return True
    except Exception as e:
        print(f"Error sending registration email: {e}")
        return False

async def send_feedback_request_email(email: EmailStr, event_title: str, registration_id: int):
    # Feedback Link (pointing to frontend)
    feedback_link = f"http://localhost:3000/feedback/{registration_id}"
    
    html = f"""
    <h3>We'd love your feedback!</h3>
    <p>You recently attended <strong>{event_title}</strong>.</p>
    <p>Please take a moment to share your thoughts:</p>
    <p><a href="{feedback_link}">Give Feedback</a></p>
    <br>
    <p>Best regards,</p>
    <p>The CMIS Team</p>
    """
    
    message = MessageSchema(
        subject=f"Feedback Request: {event_title}",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"[MOCK EMAIL] Sending feedback request to {email} for event '{event_title}'. Link: {feedback_link}")
        return True
    except Exception as e:
        print(f"Error sending feedback email: {e}")
        return False

async def send_reset_password_email(email: EmailStr, token: str):
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    
    html = f"""
    <h3>Password Reset Request</h3>
    <p>We received a request to reset your password.</p>
    <p>Click the link below to reset it:</p>
    <p><a href="{reset_link}">Reset Password</a></p>
    <br>
    <p>If you didn't ask for this, you can ignore this email.</p>
    """

    message = MessageSchema(
        subject="Reset Your Password",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"Password reset email sent to {email}")
        return True
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False

async def send_guest_invitation_email(email: EmailStr, event_title: str):
    html = f"""
    <h3>You are invited!</h3>
    <p>We are pleased to invite you to: <strong>{event_title}</strong>.</p>
    <p>Please consider this email as your formal invitation.</p>
    <p>We look forward to seeing you there!</p>
    <br>
    <p>Best regards,</p>
    <p>The CMIS Team</p>
    """

    message = MessageSchema(
        subject=f"Invitation: {event_title}",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"Guest invitation sent to {email} for '{event_title}'")
        return True
    except Exception as e:
        print(f"Error sending guest email: {e}")
        return False
