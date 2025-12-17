@echo off
if "%~1"=="" (
    echo Usage: snapshot.bat "Your commit message"
    exit /b 1
)
git add .
git commit -m "%~1"
echo Snapshot created successfully.
