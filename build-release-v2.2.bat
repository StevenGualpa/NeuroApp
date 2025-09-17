@echo off
echo ========================================
echo    NeuroApp v2.2 - Build Release APK
echo ========================================
echo.

echo [INFO] Iniciando build de NeuroApp v2.2...
echo [INFO] Nuevas funcionalidades:
echo        - Soporte completo de imagenes del servidor
echo        - Configuraciones simplificadas (modo mantenimiento)
echo        - Mejoras en todas las actividades
echo        - Limpieza de proyecto
echo.

echo [1/5] Limpiando proyecto...
cd android
call gradlew clean
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la limpieza del proyecto
    pause
    exit /b 1
)

echo.
echo [2/5] Limpiando cache de Metro y Watchman...
cd ..
call npx react-native clean --include metro,watchman

echo.
echo [3/5] Verificando dependencias...
echo [INFO] Verificando node_modules...
if not exist "node_modules" (
    echo [WARN] node_modules no encontrado, instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Fallo en la instalacion de dependencias
        pause
        exit /b 1
    )
)

echo.
echo [4/5] Construyendo APK de release v2.2...
call npx react-native build-android --mode=release
if %errorlevel% neq 0 (
    echo ERROR: Fallo en la construccion de la APK
    echo [HELP] Posibles soluciones:
    echo        1. Verificar que Android SDK este instalado
    echo        2. Ejecutar: npx react-native doctor
    echo        3. Limpiar cache: npx react-native clean
    pause
    exit /b 1
)

echo.
echo [5/5] Verificando y renombrando APK generada...
if exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo ✅ APK generada exitosamente!
    
    REM Crear nombre con timestamp
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
    set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
    set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"
    
    REM Copiar APK con nuevo nombre
    copy "android\app\build\outputs\apk\release\app-release.apk" "NeuroApp-v2.2-%timestamp%.apk"
    
    echo 📍 Ubicacion original: android\app\build\outputs\apk\release\app-release.apk
    echo 📍 Copia con timestamp: NeuroApp-v2.2-%timestamp%.apk
    
    for %%A in ("android\app\build\outputs\apk\release\app-release.apk") do (
        set size=%%~zA
    )
    
    REM Convertir bytes a MB
    set /a sizeMB=!size!/1024/1024
    echo 📏 Tamaño: !sizeMB! MB (!size! bytes)
    
    echo.
    echo ========================================
    echo       BUILD v2.2 COMPLETADO CON EXITO
    echo ========================================
    echo.
    echo 🎉 NeuroApp v2.2 Features:
    echo    ✅ Soporte completo de imagenes
    echo    ✅ Configuraciones simplificadas
    echo    ✅ 6 actividades con imagenes
    echo    ✅ Fallback robusto a emojis
    echo    ✅ Logging mejorado
    echo.
    echo 📱 Para instalar en dispositivo:
    echo    adb install NeuroApp-v2.2-%timestamp%.apk
    echo.
    echo 🔄 Para instalar sobre version anterior:
    echo    adb install -r NeuroApp-v2.2-%timestamp%.apk
    echo.
) else (
    echo ❌ ERROR: No se encontro la APK generada
    echo [DEBUG] Verificando estructura de carpetas...
    if exist "android\app\build\outputs\apk" (
        echo [DEBUG] Carpeta apk existe, listando contenido:
        dir "android\app\build\outputs\apk" /s
    ) else (
        echo [DEBUG] Carpeta apk no existe
    )
    pause
    exit /b 1
)

echo 📋 Proximos pasos recomendados:
echo    1. Probar la APK en dispositivo de prueba
echo    2. Verificar funcionalidad de imagenes
echo    3. Probar configuraciones en mantenimiento
echo    4. Validar todas las actividades
echo.

pause