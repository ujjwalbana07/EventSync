from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import auth, crud, schemas, database

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not crud.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        if user.verification_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account not verified. Please check your email for the verification link.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, # Forbidden, not just bad request
                detail="Account verified but pending Admin approval.",
            )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "name": user.name}

@router.post("/forgot-password")
async def forgot_password(email: str, db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, email=email)
    if user:
        # Generate a temporary reset token (for now reusing verification logic or just a UUID)
        # Ideally, we should store this in the DB with an expiry.
        # For this MVP, we will print it/send it but validation might be tricky if we don't store it.
        # Let's assume there is a reset_token column or we use a JWT.
        # Check if model has reset_token? I recall verification_token. 
        # Let's just create a new token and update the user if possible, or just send a JWT.
        
        # Simplified: Generate a specialized JWT for password reset
        expires = timedelta(minutes=15)
        reset_token = auth.create_access_token(data={"sub": user.email, "type": "reset"}, expires_delta=expires)
        
        await email_utils.send_reset_password_email(user.email, reset_token)
        
    # Always return success to prevent email enumeration
    return {"message": "If that email exists, a password reset link has been sent."}

import uuid
import email_utils

@router.post("/register")
async def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if not user.role:
        user.role = "student"
    
    # Generate Verification Token
    token = str(uuid.uuid4())
    
    print(f"\n[DEBUG] Registration Request for: {user.email}")
    print(f"[DEBUG] Password Type: {type(user.password)}")
    print(f"[DEBUG] Password Length: {len(user.password)}")
    if len(user.password) > 72:
        print(f"[DEBUG] WARNING: Password exceeds 72 bytes! Value (truncated): {user.password[:20]}...")
    
    # Create Inactive User
    new_user = crud.create_user(db=db, user=user, verification_token=token)
    
    # Send Verification Email (Real)
    email_sent = await email_utils.send_verification_email(user.email, token)
    
    if email_sent:
        return {"message": "Account created. Please check your email inbox to verify your account."}
    else:
        # Fallback for dev/missing creds: print to console so they aren't blocked
        verification_link = f"http://localhost:8000/auth/verify?token={token}"
        print(f"\n[EMAIL SEND FAILED - FALLBACK] To: {user.email}")
        print(f"[FALLBACK] Verification Link: {verification_link}\n")
        return {"message": "Account created. Email sending failed (check console for link if in dev mode)."}

@router.get("/verify")
def verify_email(token: str, db: Session = Depends(database.get_db)):
    user = crud.get_user_by_token(db, token=token)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    crud.verify_user_email(db, user)
    
    return {"message": "Email verified successfully! Your account is now pending Administrator approval. You will be able to login once approved."}
