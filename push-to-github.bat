@echo off
title UperAI GitHub Deployer
echo ====================================================
echo             UPERAI GITHUB AUTO-DEPLOYER
echo ====================================================
echo.
echo This script will link your project and push it to GitHub.
echo.

:: Detect Git path
set GIT_PATH="C:\Program Files\Git\cmd\git.exe"
if not exist %GIT_PATH% (
    :: Fallback to default path search
    where git >nul 2>nul
    if %errorlevel% equ 0 (
        set GIT_PATH=git
    ) else (
        echo [ERROR] Git was not found on your system!
        echo Please download and install Git from https://git-scm.com/download/win
        echo after installing, restart this script.
        echo.
        pause
        exit /b
    )
)

echo [INFO] Git detected at: %GIT_PATH%
echo.

:: Prompt for GitHub Username
set /p GH_USER="Enter your GitHub username: "
if "%GH_USER%"=="" (
    echo [ERROR] Username cannot be empty.
    pause
    exit /b
)

echo.
echo [INFO] Preparing branch...
%GIT_PATH% branch -M main

echo [INFO] Linking to GitHub repository: https://github.com/%GH_USER%/UperAI.git...
%GIT_PATH% remote remove origin >nul 2>nul
%GIT_PATH% remote add origin https://github.com/%GH_USER%/UperAI.git

echo.
echo ====================================================
echo IMPORTANT: A browser popup will now open. 
echo Please sign in to GitHub to authorize the upload.
echo ====================================================
echo.

%GIT_PATH% push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ====================================================
    echo [SUCCESS] Your project has been uploaded to GitHub!
    echo You can now connect it to Vercel.
    echo ====================================================
) else (
    echo.
    echo [ERROR] Failed to push to GitHub. 
    echo Please make sure you created the "UperAI" repository online first.
)

echo.
pause
