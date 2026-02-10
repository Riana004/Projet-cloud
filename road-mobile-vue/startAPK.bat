@echo off
REM =========================================
REM Script pour rebuild l'APK et l'installer
REM =========================================

echo.
echo =========================================
echo  BUILD APK - IP Backend: 172.24.243.120
echo =========================================
echo.

echo [1/4] Build du projet Vue...
echo -----------------------------
call npm run build
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERREUR lors du build Vue.
    echo Verifiez les erreurs ci-dessus.
    echo.
    pause
    exit /b 1
)
echo ✓ Build Vue reussi
echo.

echo [2/4] Synchronisation Capacitor...
echo -----------------------------
call npx cap sync android
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERREUR lors de la sync Capacitor.
    echo.
    pause
    exit /b 1
)
echo ✓ Sync Capacitor reussie
echo.

echo [3/4] Build APK Android...
echo -----------------------------
cd android
call gradlew assembleDebug
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERREUR lors du build Android.
    echo.
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ Build APK reussi
echo.

echo [4/4] Installation sur le telephone...
echo -----------------------------
call adb install -r android\app\build\outputs\apk\debug\app-debug.apk
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERREUR lors de l'installation.
    echo Verifiez que le telephone est connecte et le debogage USB active.
    echo.
    pause
    exit /b 1
)

echo.
echo =========================================
echo ✅ APK installe avec succes !
echo =========================================
echo.
echo 📱 L'application devrait se lancer sur votre telephone.
echo 💡 IP Backend configuree : 172.24.243.120
echo.
pause
