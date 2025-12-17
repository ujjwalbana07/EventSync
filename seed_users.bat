@echo off
echo Creating Admin User...
curl -X POST "http://localhost:8000/auth/register" -H "Content-Type: application/json" -d "{\"email\": \"admin@cmis.com\", \"password\": \"admin\", \"name\": \"Admin User\", \"role\": \"admin\"}"
echo.

echo Creating Student User...
curl -X POST "http://localhost:8000/auth/register" -H "Content-Type: application/json" -d "{\"email\": \"student@cmis.com\", \"password\": \"student\", \"name\": \"Student User\", \"role\": \"student\"}"
echo.

echo Creating Judge User...
curl -X POST "http://localhost:8000/auth/register" -H "Content-Type: application/json" -d "{\"email\": \"judge@cmis.com\", \"password\": \"judge\", \"name\": \"Judge User\", \"role\": \"judge\"}"
echo.

echo Done! You can now login with these credentials.
