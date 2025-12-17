import sys
import os
import json
import time
import urllib.request
import urllib.parse
import urllib.error

# Ensure we can import app modules
sys.path.append("/app")
from database import SessionLocal
from models import User

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@cmis.com"
ADMIN_PASS = "admin"
TEST_EMAIL = "approval_internal_test@example.com"
TEST_PASS = "Pass123!"

def make_request(method, url, data=None, headers={}):
    try:
        if data:
            data = json.dumps(data).encode('utf-8')
            headers['Content-Type'] = 'application/json'
        
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(req) as response:
            return response.getcode(), response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

def get_token(email):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            return user.verification_token, user.id
        return None, None
    finally:
        db.close()

def run_test():
    print(f"--- 1. Registering {TEST_EMAIL} ---")
    code, body = make_request("POST", f"{BASE_URL}/auth/register", {
        "email": TEST_EMAIL,
        "password": TEST_PASS,
        "name": "Internal Test User",
        "role": "student"
    })
    
    # It might fail if user exists, handle that
    if code != 200:
        if "already registered" in body:
            print("User already exists, proceeding...")
        else:
            print(f"Registration failed: {code} {body}")
            return
    else:
        print("Registration successful.")

    print("--- 2. Fetching Token from DB ---")
    token, user_id = get_token(TEST_EMAIL)
    print(f"Token: {token}")
    
    if not token:
        # Check if already verified
        db = SessionLocal()
        u = db.query(User).filter(User.email == TEST_EMAIL).first()
        if u.is_active:
             print("User already active! Test invalid.")
        else:
             print("User inactive but no token? Maybe already verified but not approved.")
        db.close()

    if token:
        print("--- 3. Verifying Email ---")
        code, body = make_request("GET", f"{BASE_URL}/auth/verify?token={token}")
        print(f"Verification: {code} {body}")
        if "pending Administrator approval" not in body:
             print("FAILED: Message mismatch.")
             # return # Continue to see if it works anyway

    print("--- 4. Login Check (Should be 403) ---")
    # Login form data is x-www-form-urlencoded
    data = urllib.parse.urlencode({"username": TEST_EMAIL, "password": TEST_PASS}).encode()
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"FAILED: Login succeeded unexpectedly! {resp.getcode()}")
            return
    except urllib.error.HTTPError as e:
        print(f"Login Response: {e.code} {e.read().decode('utf-8')}")
        if e.code == 403:
            print("SUCCESS: 403 Forbidden received.")
        else:
            print("FAILED: Wrong status code.")

    print("--- 5. Admin Approve ---")
    # Login Admin
    data = urllib.parse.urlencode({"username": ADMIN_EMAIL, "password": ADMIN_PASS}).encode()
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, method="POST")
    admin_token = ""
    try:
        with urllib.request.urlopen(req) as resp:
            body = json.loads(resp.read().decode())
            admin_token = body["access_token"]
    except Exception as e:
        print(f"Admin Login Failed: {e}")
        return

    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Approve
    print(f"Approving User {user_id}")
    code, body = make_request("POST", f"{BASE_URL}/admin/users/{user_id}/authorize?is_active=true", headers=headers)
    print(f"Approval: {code} {body}")

    print("--- 6. Final Login Success Check ---")
    data = urllib.parse.urlencode({"username": TEST_EMAIL, "password": TEST_PASS}).encode()
    req = urllib.request.Request(f"{BASE_URL}/auth/login", data=data, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"SUCCESS: Login Validated! Code: {resp.getcode()}")
    except urllib.error.HTTPError as e:
        print(f"FAILED: Final login failed. {e.code} {e.read().decode()}")

if __name__ == "__main__":
    run_test()
