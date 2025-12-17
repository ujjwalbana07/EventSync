import requests

def test_login():
    url = "http://localhost:8000/auth/login"
    data = {"username": "admin@cmis.com", "password": "password"}
    
    try:
        response = requests.post(url, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_login()
