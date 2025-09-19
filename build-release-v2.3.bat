@echo off
echo ========================================
echo    NeuroApp - Build Release v2.3.0
echo ========================================
echo.

echo [1/6] Limpiando proyecto anterior...
cd android
call gradlew clean
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la limpieza del proyecto
    pause
    exit /b 1
)
cd ..

echo.
echo [2/6] Verificando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la instalacion de dependencias
    pause
    exit /b 1
)

echo.
echo [3/6] Limpiando cache de Metro...
call npx react-native start --reset-cache --port 8081 &
timeout /t 5 /nobreak >nul
taskkill /f /im node.exe >nul 2>&1

echo.
echo [4/6] Generando bundle de JavaScript...
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la generacion del bundle
    pause
    exit /b 1
)

echo.
echo [5/6] Compilando APK de release...
cd android
call gradlew assembleRelease
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la compilacion de la APK
    pause
    exit /b 1
)
cd ..

echo.
echo [6/6] Copiando APK final...
if not exist "releases" mkdir releases
copy "android\app\build\outputs\apk\release\app-release.apk" "releases\NeuroApp-v2.3.0-2024-12-19.apk"
if %errorlevel% neq 0 (
    echo ERROR: Fallo al copiar la APK
    pause
    exit /b 1
)

echo.
echo ========================================
echo    BUILD COMPLETADO EXITOSAMENTE
echo ========================================
echo.
echo APK generada: releases\NeuroApp-v2.3.0-2024-12-19.apk
echo Version: 2.3.0 (Codigo: 4)
echo Fecha: 19 de Diciembre, 2024
echo.
echo Caracteristicas incluidas:
echo - Sistema de recuperacion de contrasena
echo - Soporte multiidioma completo
echo - 6 configuraciones activas
echo - Sistema de voz adaptativo
echo - Tiempo de ayuda personalizable
echo - Voz Amiga configurable
echo.
pause



