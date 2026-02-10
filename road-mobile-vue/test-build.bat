@echo off
REM =========================================
REM Script de test pour debugger startAPK.bat
REM =========================================

echo.
echo ========== TEST ETAPE 1 : BUILD VUE ==========
echo.
call npm run build
echo.
echo Code retour : %ERRORLEVEL%
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Le build Vue a echoue avec le code %ERRORLEVEL%
    echo.
    echo Causes possibles :
    echo   - Erreurs TypeScript
    echo   - Erreurs de syntaxe
    echo   - Dependances manquantes
    echo.
    echo Conseil : Executez "npm run build" manuellement pour voir les erreurs
) else (
    echo ✅ Le build Vue a reussi
    echo.
    echo Le script devrait continuer...
)

echo.
echo Appuyez sur une touche pour quitter...
pause > nul
