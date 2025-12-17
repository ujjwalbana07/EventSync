from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import crud, models, schemas, database

# Configuration (Move to env vars in production)
SECRET_KEY = "CHANGE_ME_PLEASE"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email, role=role)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

def get_current_active_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    return current_user

def get_current_judge(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "judge" and current_user.role != "admin": # Admin can see judge stuff too
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    return current_user

def get_current_faculty(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "faculty" and current_user.role != "admin":
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized - Faculty"
        )
    return current_user

def get_current_recruiter(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "recruiter" and current_user.role != "admin":
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized - Recruiter"
        )
    return current_user
