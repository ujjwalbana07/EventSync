import requests
import os

# Create dummy pdf if not exists
if not os.path.exists("demo_resume.pdf"):
    with open("demo_resume.pdf", "wb") as f:
        f.write(b"%PDF-1.4 promo resume content")

BASE_URL = "http://localhost:8000"

def upload_resume():
    # 1. Login
    resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": "student@cmis.com",
        "password": "student"
    })
    if resp.status_code != 200:
        print("Login failed", resp.text)
        return
    
    token = resp.json()["access_token"]
    
    # 2. Upload
    files = {'file': ('demo_resume.pdf', open('demo_resume.pdf', 'rb'), 'application/pdf')}
    headers = {'Authorization': f'Bearer {token}'}
    
    up_resp = requests.post(f"{BASE_URL}/student/profile/resume", files=files, headers=headers)
    print(f"Upload User 1: {up_resp.status_code}")

    # Upload for another user for variety
    # Register/Login second user? Or just use existing if known.
    # Let's try 'bd_student@cmis.com' / 'password' from before
    resp2 = requests.post(f"{BASE_URL}/auth/login", data={
        "username": "bd_student@cmis.com",
        "password": "password"
    })
    if resp2.status_code == 200:
        token2 = resp2.json()["access_token"]
        files2 = {'file': ('bd_resume.pdf', open('demo_resume.pdf', 'rb'), 'application/pdf')}
        headers2 = {'Authorization': f'Bearer {token2}'}
        up_resp2 = requests.post(f"{BASE_URL}/student/profile/resume", files=files2, headers=headers2)
        print(f"Upload User 2: {up_resp2.status_code}")

upload_resume()
