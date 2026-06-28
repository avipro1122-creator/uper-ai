@echo off
title UperAI Vercel Deployer
echo ====================================================
echo             UPERAI VERCEL AUTO-DEPLOYER
echo ====================================================
echo.
echo This script will deploy your website to Vercel.
echo.
echo Please follow the prompts that appear below:
echo (Tip: You can just press Enter to accept the defaults)
echo.
echo ====================================================
echo.

call npm run vercel

echo.
echo ====================================================
echo             DEPLOYMENT ATTEMPT FINISHED
echo ====================================================
echo.
pause
