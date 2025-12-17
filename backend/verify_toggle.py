import sys
sys.path.append("/app")
from database import SessionLocal
from models import User
import requests
import json
import time

# Use localhost inside container
API_URL = "http://localhost:8000/admin/users"
# We need admin token to call API, OR we can call the function directly?
# API requires auth. Let's try calling DB directly first to create a user, then use requests to call API.

def run_test():
    # 1. Setup User
    db = SessionLocal()
    target_email = "toggle_test@example.com"
    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        print(f"Creating {target_email}...")
        import crud, schemas
        u = schemas.UserCreate(email=target_email, password="password", name="Toggle Test", role="student")
        user = crud.create_user(db, u)
    
    user_id = user.id
    # Ensure False initially
    user.is_active = False
    db.commit()
    print(f"Initial State: {user.is_active}")
    db.close()

    # 2. Call API to Toggle ON
    # Need Admin Token
    token_resp = requests.post("http://localhost:8000/auth/login", data={"username": "admin@cmis.com", "password": "admin"})
    if token_resp.status_code != 200:
        print("Admin login failed")
        return
    token = token_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print(f"Calling toggle API for {user_id} -> True")
    resp = requests.post(f"{API_URL}/{user_id}/authorize?is_active=true", headers=headers)
    print(f"API Response: {resp.status_code} {resp.text}")

    # 3. Check DB Persistance
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    print(f"DB State after Toggle ON: {user.is_active}")
    if user.is_active:
        print("SUCCESS: Toggled ON persisted.")
    else:
        print("FAILED: Toggle ON did not stick.")

    # 4. Toggle OFF
    print(f"Calling toggle API for {user_id} -> False")
    resp = requests.post(f"{API_URL}/{user_id}/authorize?is_active=false", headers=headers)
    
    db.refresh(user)
    print(f"DB State after Toggle OFF: {user.is_active}")
    if not user.is_active:
        print("SUCCESS: Toggled OFF persisted.")
    else:
        print("FAILED: Toggle OFF did not stick.")

if __name__ == "__main__":
    run_test()
