import requests
import subprocess
import time
import json

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@cmis.com"
ADMIN_PASS = "admin"
TEST_EMAIL = "approval_test_2@example.com"
TEST_PASS = "Pass123!"

def run_sql(query):
    # Execute SQL in the postgres container
    # We need to find the token
    cmd = f'docker-compose exec -T db psql -U postgres -d cmis -c "{query}"'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout

def test_workflow():
    print(f"--- 1. Registering {TEST_EMAIL} ---")
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": TEST_EMAIL,
        "password": TEST_PASS,
        "name": "Integration Test User",
        "role": "student"
    })
    if res.status_code != 200:
        print(f"Registration failed: {res.text}")
        return
    print("Registration successful.")

    print("--- 2. Fetching Verification Token from DB ---")
    time.sleep(1) # Wait for DB
    output = run_sql(f"SELECT verification_token FROM users WHERE email = '{TEST_EMAIL}';")
    # Output format is messy, need to parse. Usually:
    #  verification_token 
    # --------------------
    #  <token>
    # (1 row)
    try:
        token = output.split('\n')[2].strip()
        print(f"Token found: {token}")
    except:
        print(f"Failed to get token. Output: {output}")
        return

    print("--- 3. Verifying Email ---")
    res = requests.get(f"{BASE_URL}/auth/verify?token={token}")
    print(f"Verification Response: {res.json()}")
    if "pending Administrator approval" not in res.text:
        print("FAILED: Did not get expected pending message.")
        return

    print("--- 4. Attempting Login (Should Fail 403) ---")
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": TEST_EMAIL, "password": TEST_PASS})
    if res.status_code == 403 and "pending Admin approval" in res.text:
        print("SUCCESS: Login blocked with 403 as expected.")
    else:
        print(f"FAILED: Login response: {res.status_code} {res.text}")
        return

    print("--- 5. Admin List/Approve ---")
    # Login as Admin
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": ADMIN_EMAIL, "password": ADMIN_PASS})
    admin_token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Check Pending List
    res = requests.get(f"{BASE_URL}/admin/users/pending", headers=headers)
    pending_users = res.json()
    print(f"Pending Users: {len(pending_users)}")
    user_id = None
    for u in pending_users:
        if u["email"] == TEST_EMAIL:
            user_id = u["id"]
            break
            
    if not user_id:
        print("FAILED: Test user not found in pending list.")
        return

    # Approve
    print(f"Approving User ID: {user_id}")
    res = requests.post(f"{BASE_URL}/admin/users/{user_id}/authorize?is_active=true", headers=headers)
    if res.status_code == 200:
        print("Approved successfully.")
    else:
        print(f"Approval failed: {res.text}")
        return

    print("--- 6. Attempting Login Again (Should Succeed) ---")
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": TEST_EMAIL, "password": TEST_PASS})
    if res.status_code == 200:
        print("SUCCESS: User logged in successfully!")
    else:
        print(f"FAILED: Login failed after approval. {res.text}")

if __name__ == "__main__":
    test_workflow()
