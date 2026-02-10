@echo off
echo ========================================
echo  Firebase Admin Backend Server
echo ========================================
echo.
echo Demarrage du serveur...
echo.
echo   Port         : 3000
echo   IP Backend   : 172.24.243.120
echo   URL Complete : http://172.24.243.120:3000
echo.
echo Pour changer l'IP, editez: ../src/config.ts
echo ========================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo Installation des dependances...
    call npm install
    echo.
)

echo Starting server...
call npm start
