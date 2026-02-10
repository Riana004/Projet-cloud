@echo off
echo ========================================
echo  Firebase Admin Backend Server
echo ========================================
echo.
echo Demarrage du serveur sur le port 3000...
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo Installation des dependances...
    call npm install
    echo.
)

echo Starting server...
call npm start
