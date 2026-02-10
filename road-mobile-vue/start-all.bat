@echo off
echo ================================================
echo  Demarrage complet de l'application
echo ================================================
echo.
echo Ce script va demarrer:
echo 1. Backend Firebase Admin (port 3000)
echo 2. Application Vue.js (port varie)
echo.
echo Les deux serveurs vont s'ouvrir dans des fenetres separees
echo Appuyez sur une touche pour continuer...
pause > nul

cd /d "%~dp0"

echo.
echo [1/2] Demarrage du backend Firebase Admin...
start "Firebase Admin Backend" cmd /k "cd firebase-admin-backend && npm start"

timeout /t 3 > nul

echo [2/2] Demarrage de l'application Vue.js...
start "Vue.js App" cmd /k "npm run dev"

echo.
echo ================================================
echo  Les deux serveurs sont en cours de demarrage
echo ================================================
echo.
echo Backend: http://localhost:3000
echo Frontend: Voir la fenetre Vue.js pour l'URL
echo.
echo Pour arreter les serveurs, fermez les fenetres
echo ou appuyez sur Ctrl+C dans chaque fenetre
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause > nul
