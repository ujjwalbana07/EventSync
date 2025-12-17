@echo off
if "%~1"=="" (
    echo Usage: rollback.bat <commit_hash>
    echo WARNING: This will discard all uncommitted changes and revert the project to the specified state.
    exit /b 1
)

set /p confirm="Are you sure you want to rollback to %~1? All current changes will be lost. (y/n): "
if /i "%confirm%"=="y" (
    git reset --hard %~1
    echo Rolled back to %~1.
) else (
    echo Rollback cancelled.
)
