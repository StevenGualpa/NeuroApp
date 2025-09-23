# 🧠 NeuroApp - Aplicación Educativa para Usuarios Neurodivergentes

NeuroApp es una aplicación móvil educativa diseñada específicamente para usuarios neurodivergentes, que ofrece actividades interactivas, gamificación, sistema de progreso personalizado y configuraciones avanzadas de accesibilidad.

## 📱 **Versión Actual: 2.4.0**

### 🎉 **NUEVA VERSIÓN 2.4 - ¡DISEÑO UNIFICADO COMPLETO!**

#### 🎨 **INTERFAZ TOTALMENTE RENOVADA**
**La funcionalidad estrella de esta versión**
- ✅ **6 configuraciones activas** completamente funcionales
- ✅ **Sistema de recuperación de contraseña** con modal multi-paso
- ✅ **Soporte multiidioma completo** en toda la aplicación
- ✅ **Sistema de voz adaptativo** con configuración de velocidad y volumen
- ✅ **Control de tiempo de ayuda** personalizable (1-30 segundos)
- ✅ **Voz Amiga** para asistencia en actividades

#### 🖼️ **SOPORTE COMPLETO DE IMÁGENES**
- ✅ **6 actividades mejoradas** con imágenes reales del servidor
- ✅ **Sistema robusto** de fallback a emojis si las imágenes fallan
- ✅ **Detección automática** entre URLs de imágenes y emojis
- ✅ **Logging detallado** para debugging y monitoreo

### 📥 **Descargar APK v2.3**
- **Archivo**: `NeuroApp-v2.3-2024-12-19.apk`
- **Tamaño**: 68.5 MB
- **Versión**: 2.3.0 (código 4)
- **Fecha**: 19 de Diciembre, 2024
- **Requisitos**: Android 5.0+ (API 21)

---

## 🎯 **CARACTERÍSTICAS PRINCIPALES**

### 🔐 **Sistema de Autenticación Completo**
- **Login seguro** con email/username y contraseña
- **Registro de usuarios** con validación completa
- **Recuperación de contraseña** con modal multi-paso:
  - Ingreso de username
  - Verificación de código OTP (3 minutos de validez)
  - Reset de contraseña
  - Confirmación de éxito
- **Persistencia de sesión** automática

### 🎮 **6 Actividades Interactivas**
| Actividad | Descripción | Imágenes | Estado |
|-----------|-------------|----------|--------|
| **Selecciona Opción** | Preguntas de opción múltiple | 50x50px | ✅ |
| **Arrastra y Suelta** | Clasificación por categorías | 32x32px / 20x20px | ✅ |
| **Ordena Pasos** | Secuenciación lógica | 40x40px | ✅ |
| **Memoria Visual** | Juego de memoria con cartas | 60% carta | ✅ |
| **Asocia Elementos** | Conexión de conceptos | 40x40px | ✅ |
| **Reconocimiento Patrones** | Identificación de secuencias | 30x30px / 40x40px | ✅ |

### ⚙️ **Configuraciones Avanzadas**
| Configuración | Categoría | Estado | Descripción |
|---------------|-----------|--------|-------------|
| **🌐 Idioma** | General | ✅ | Español/Inglés completo |
| **⚡ Velocidad de Voz** | Audio | ✅ | Lento/Normal/Rápido |
| **🔊 Volumen** | Audio | ✅ | 0% - 100% |
| **🗣️ Voz Amiga** | Audio | ✅ | Ayuda con voz en actividades |
| **⏱️ Tiempo de Ayuda** | Juegos | ✅ | 1-30 segundos de espera |
| **🎯 Otras configuraciones** | Varias | 🔄 | En desarrollo |

### 🧠 **Sistema de Ayuda Adaptativo**
- **Detección de inactividad** personalizable (1-30 segundos)
- **Análisis de errores** con pistas específicas
- **Escalamiento de ayuda** gradual
- **Audio contextual** con voz configurable
- **Ayuda visual** con efectos de foco

### 🏆 **Gamificación Completa**
- **Sistema de estrellas** (1-3 estrellas por rendimiento)
- **Logros y reconocimientos** por diferentes hitos
- **Progreso visual** con barras e indicadores
- **Celebraciones animadas** para reforzar logros
- **Estadísticas detalladas** de rendimiento

---

## 📱 **MANUAL DE USUARIO**

### 🔐 **Pantallas de Autenticación**

#### **LoginScreen** - Inicio de Sesión
**Ubicación:** `src/screens/LoginScreen.tsx`

**Funcionalidades:**
- **Inicio de sesión** con email/username y contraseña
- **Recuperación de contraseña** con modal multi-paso
- **Validación de campos** en tiempo real
- **Manejo de errores** con mensajes claros
- **Persistencia de sesión** automática

**Elementos de la interfaz:**
- Campo de email/username
- Campo de contraseña
- Botón "Iniciar Sesión"
- Enlace "¿No tienes cuenta? Regístrate"
- Enlace "¿Olvidaste tu contraseña?"
- Indicador de carga

#### **PasswordRecoveryModal** - Recuperación de Contraseña
**Ubicación:** `src/components/PasswordRecoveryModal.tsx`

**Funcionalidades:**
- **Modal multi-paso** con 4 etapas
- **Verificación de código OTP** con validez de 3 minutos
- **Reset de contraseña** seguro
- **Persistencia de código** para reanudar flujo
- **Animaciones suaves** y feedback visual
- **Soporte multiidioma** completo

**Flujo de recuperación:**
1. **Ingreso de username** → Envío de código
2. **Verificación de código** → Validación OTP
3. **Reset de contraseña** → Nueva contraseña
4. **Confirmación** → Éxito y cierre

---

### 🏠 **Pantallas Principales**

#### **MainScreen** - Pantalla Principal
**Ubicación:** `src/screens/MainScreen.tsx`

**Funcionalidades:**
- **Dashboard principal** con vista general del progreso
- **Acceso rápido** a todas las secciones
- **Estadísticas resumidas** (estrellas, actividades completadas)
- **Navegación central** a todas las funcionalidades
- **Tarjetas de menú** sin flechas (diseño limpio)

#### **ActivityMenuScreen** - Menú de Actividades
**Ubicación:** `src/screens/ActivityMenuScreen.tsx`

**Funcionalidades:**
- **Selección de actividades** con vista previa
- **Filtrado por dificultad** y categoría
- **Progreso visual** por actividad
- **Navegación intuitiva** a cada tipo de juego

#### **CategoryMenuScreen** - Menú de Categorías
**Ubicación:** `src/screens/CategoryMenuScreen.tsx`

**Funcionalidades:**
- **Navegación por categorías** temáticas
- **Vista de progreso** por categoría
- **Filtros dinámicos** por tipo de actividad
- **Acceso directo** a lecciones específicas

#### **LessonListScreen** - Lista de Lecciones
**Ubicación:** `src/screens/LessonListScreen.tsx`

**Funcionalidades:**
- **Exploración de lecciones** por categoría
- **Indicadores de estado** (completado, en progreso, bloqueado)
- **Información detallada** de cada lección
- **Sistema de desbloqueo** progresivo

#### **LessonScreen** - Pantalla de Lección
**Ubicación:** `src/screens/LessonScreen.tsx`

**Funcionalidades:**
- **Vista detallada** de la lección seleccionada
- **Lista de pasos** con indicadores de completado
- **Progreso de lección** paso a paso
- **Navegación directa** a ejercicios específicos
- **Soporte multiidioma** en títulos de actividades

---

### 🎮 **Pantallas de Juegos**

#### **SelectOptionScreen** - Selecciona la Opción Correcta
**Ubicación:** `src/screens/SelectOptionScreen.tsx`

**Funcionalidades:**
- **Preguntas de opción múltiple** con 2-4 opciones
- **🖼️ Soporte de imágenes** reales del servidor (50x50px)
- **🛡️ Fallback robusto** a emojis si las imágenes fallan
- **Feedback inmediato** visual y auditivo
- **Sistema de ayuda adaptativo** con tiempo configurable
- **Gamificación** con sistema de estrellas
- **Soporte multiidioma** completo

#### **OrderStepsScreen** - Ordena los Pasos
**Ubicación:** `src/screens/OrderStepsScreen.tsx`

**Funcionalidades:**
- **Secuenciación lógica** de elementos
- **Interfaz drag & drop** intuitiva
- **Validación automática** del orden
- **Pistas visuales** para identificar secuencias
- **Sistema de ayuda** con tiempo configurable

#### **DragDropScreen** - Arrastra y Suelta
**Ubicación:** `src/screens/DragDropScreen.tsx`

**Funcionalidades:**
- **Clasificación por categorías** con zonas de destino
- **Validación por zona** de colocación
- **Feedback táctil** con vibración
- **Efectos visuales** de confirmación
- **Sistema de ayuda** adaptativo

#### **MatchScreen** - Asocia Elementos
**Ubicación:** `src/screens/MatchScreen.tsx`

**Funcionalidades:**
- **Conexión de conceptos** relacionados
- **Interfaz de emparejamiento** por pares
- **Validación de relaciones** automática
- **Progreso visual** de pares completados
- **Sistema de ayuda** contextual

#### **MemoryGameScreen** - Memoria Visual
**Ubicación:** `src/screens/MemoryGameScreen.tsx`

**Funcionalidades:**
- **Juego de memoria** con cartas idénticas
- **Diferentes niveles** de dificultad
- **Tiempo de memorización** inicial
- **Contador de intentos** en tiempo real
- **Soporte multiidioma** en mensajes de rendimiento

#### **PatternRecognitionScreen** - Reconocimiento de Patrones
**Ubicación:** `src/screens/PatternRecognitionScreen.tsx`

**Funcionalidades:**
- **Identificación de secuencias** en series
- **Completar patrones** con elemento faltante
- **Diferentes tipos** de patrones (numéricos, visuales, lógicos)
- **Dificultad progresiva** por niveles
- **Explicación de patrones** tras respuesta correcta

---

### 📊 **Pantallas de Progreso y Estadísticas**

#### **StatisticsScreen** - Estadísticas del Usuario
**Ubicación:** `src/screens/StatisticsScreen.tsx`

**Funcionalidades:**
- **Métricas detalladas** de rendimiento
- **Gráficos visuales** del progreso
- **Comparación temporal** de evolución
- **Análisis por actividad** específica

#### **AchievementsScreen** - Pantalla de Logros
**Ubicación:** `src/screens/AchievementsScreen.tsx`

**Funcionalidades:**
- **Galería de logros** disponibles y desbloqueados
- **Categorización** por tipo y rareza
- **Progreso de logros** en curso
- **Detalles de requisitos** para desbloquear

---

### ⚙️ **Pantallas de Configuración**

#### **SettingsScreen** - Configuraciones Avanzadas
**Ubicación:** `src/screens/SettingsScreen.tsx`

**Funcionalidades:**
- **6 configuraciones activas** completamente funcionales
- **Sincronización automática** con servicios
- **Persistencia** en AsyncStorage y servidor
- **Botones de prueba** para configuraciones de audio
- **Interfaz intuitiva** con controles específicos

**Configuraciones disponibles:**

##### 🌐 **Idioma (General)**
- **Español/Inglés** con cambio dinámico
- **Sincronización** con AudioService
- **Persistencia** automática

##### ⚡ **Velocidad de Voz (Audio)**
- **Lento** (0.6x) - Para usuarios que necesitan más tiempo
- **Normal** (1.0x) - Velocidad estándar
- **Rápido** (1.4x) - Para usuarios avanzados
- **Aplicación inmediata** en TTS

##### 🔊 **Volumen (Audio)**
- **Rango**: 0% - 100%
- **Paso**: 5% por clic
- **Aplicación**: Inmediata en TTS
- **Prueba**: Botón de test con mensaje de voz

##### 🗣️ **Voz Amiga (Audio)**
- **Habilitada/Deshabilitada** para mensajes de ayuda
- **Control granular** de asistencia por voz
- **Sincronización** con sistema de ayuda adaptativo

##### ⏱️ **Tiempo de Ayuda (Juegos)**
- **Rango**: 1-30 segundos
- **Paso**: 1 segundo por clic
- **Aplicación**: Inmediata en todas las actividades
- **Prueba**: Botón de test con confirmación de tiempo

---

## 🔧 **CARACTERÍSTICAS TÉCNICAS**

### 🎯 **Sistema de Ayuda Adaptativo**
**Ubicación:** `src/services/AdaptiveReinforcementService.ts`

**Funcionalidades:**
- **Tiempo de inactividad** configurable (1-30 segundos)
- **Detección de errores** consecutivos
- **Escalamiento de ayuda** gradual
- **Mensajes contextuales** por tipo de actividad
- **Sincronización** con configuraciones de usuario

### 🎵 **Sistema de Audio Avanzado**
**Ubicación:** `src/services/AudioService.ts`

**Funcionalidades:**
- **Text-to-Speech** con configuración completa
- **Control de velocidad** (lento/normal/rápido)
- **Control de volumen** (0-100%)
- **Soporte multiidioma** automático
- **Voz Amiga** configurable
- **Persistencia** de configuraciones

### 🌐 **Soporte Multiidioma Completo**
**Ubicación:** `src/i18n/index.ts`

**Funcionalidades:**
- **Español e Inglés** integrados
- **Cambio dinámico** sin reiniciar app
- **Procesamiento inteligente** de texto bilingüe
- **Sincronización** con AudioService
- **Traducciones completas** en todas las pantallas

### 💾 **Persistencia de Datos**
- **AsyncStorage** para datos offline
- **Sincronización automática** con servidor
- **Recuperación de sesión** tras cerrar app
- **Backup de configuraciones** en servidor

### ♿ **Accesibilidad**
- **Diseño inclusivo** para usuarios neurodivergentes
- **Feedback múltiple** (visual, auditivo, táctil)
- **Navegación simplificada** e intuitiva
- **Personalización completa** de experiencia

---

## 🚀 **INSTALACIÓN Y CONFIGURACIÓN**

### 📱 **Instalación de APK v2.3 (Usuarios Finales)**

#### **🎉 APK v2.3 - RECOMENDADA**
**Archivo**: `NeuroApp-v2.3-2024-12-19.apk` (68.5 MB)

#### **Opción 1: Instalación Directa**
1. Descarga el archivo `NeuroApp-v2.3-2024-12-19.apk`
2. Transfiere a tu dispositivo Android
3. Ve a **Configuración > Seguridad**
4. Habilita **"Fuentes desconocidas"**
5. Abre el archivo APK y toca **"Instalar"**

#### **Opción 2: Instalación con ADB**
```bash
# Instalación nueva
adb install NeuroApp-v2.3-2024-12-19.apk

# Actualización sobre versión anterior
adb install -r NeuroApp-v2.3-2024-12-19.apk
```

#### **Requisitos del Sistema**
- **Android**: 5.0 (API 21) o superior
- **RAM**: Mínimo 2GB recomendado
- **Almacenamiento**: 100MB libres
- **Conexión**: Internet requerida para contenido

---

### 🛠️ **Desarrollo (Para Desarrolladores)**

#### **Requisitos Previos**
- Node.js (versión 18 o superior)
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS)

#### **Instalación para Desarrollo**

1. **Clonar el repositorio:**
```bash
git clone [URL_DEL_REPOSITORIO]
cd NeuroApp
```

2. **Instalar dependencias:**
```bash
npm install
# o
yarn install
```

3. **Configurar iOS (solo macOS):**
```bash
cd ios
bundle install
bundle exec pod install
cd ..
```

4. **Ejecutar la aplicación:**

**Android:**
```bash
npm run android
# o
yarn android
```

**iOS:**
```bash
npm run ios
# o
yarn ios
```

#### **Generar Nueva APK de Release**
```bash
# Opción 1: Usar script automatizado
./build-release.bat

# Opción 2: Comandos manuales
cd android
./gradlew clean
cd ..
npx react-native build-android --mode=release
```

### **Configuración del Backend**
La aplicación se conecta al backend desplegado en: `https://facturago.onrender.com`

Para desarrollo local, modificar la configuración en:
`src/config/api.ts`

---

## 🏗️ **ARQUITECTURA DEL PROYECTO**

### **Estructura del Proyecto**
```
NeuroApp/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── PasswordRecoveryModal.tsx  # Modal de recuperación
│   │   ├── GameIntroAnimation.tsx     # Introducción a juegos
│   │   ├── GameCompletionModal.tsx    # Modal de finalización
│   │   └── MenuGrid.tsx               # Grid de menú
│   ├── screens/            # Pantallas de la aplicación
│   │   ├── LoginScreen.tsx            # Pantalla de login
│   │   ├── MainScreen.tsx             # Pantalla principal
│   │   ├── SettingsScreen.tsx         # Configuraciones
│   │   └── [6 pantallas de juegos]    # Actividades
│   ├── services/           # Servicios y APIs
│   │   ├── AudioService.ts            # Sistema de audio
│   │   ├── AdaptiveReinforcementService.ts  # Ayuda adaptativa
│   │   ├── AuthService.ts             # Autenticación
│   │   └── UserSettingsService.ts     # Configuraciones
│   ├── contexts/           # Contextos de React
│   │   ├── AuthContext.tsx            # Contexto de autenticación
│   │   └── LanguageContext.tsx        # Contexto de idioma
│   ├── i18n/               # Internacionalización
│   │   └── index.ts                   # Traducciones
│   ├── utils/              # Utilidades
│   │   └── activityTranslations.ts    # Traducciones de actividades
│   └── config/             # Configuraciones
│       └── api.ts                     # Endpoints de API
├── android/                # Configuración Android
├── ios/                    # Configuración iOS
└── Backend/                # Código del servidor
```

### **Scripts Disponibles**
- `npm start` - Iniciar Metro bundler
- `npm run android` - Ejecutar en Android
- `npm run ios` - Ejecutar en iOS
- `npm run lint` - Ejecutar linter
- `npm test` - Ejecutar tests

---

## 📊 **COMPARACIÓN DE VERSIONES**

| Característica | v1.2 | v2.2 | v2.3 |
|----------------|------|------|------|
| **Imágenes del servidor** | ❌ | ✅ | ✅ |
| **Actividades con imágenes** | 0 | 6 | 6 |
| **Configuraciones activas** | Todas | Solo idiomas | 6 completas |
| **Recuperación de contraseña** | ❌ | ❌ | ✅ |
| **Soporte multiidioma completo** | ❌ | ❌ | ✅ |
| **Sistema de voz configurable** | ❌ | ❌ | ✅ |
| **Tiempo de ayuda personalizable** | ❌ | ❌ | ✅ |
| **Voz Amiga** | ❌ | ❌ | ✅ |
| **Modal multi-paso** | ❌ | ❌ | ✅ |
| **Sincronización automática** | ❌ | ❌ | ✅ |

---

## 🎯 **ROADMAP FUTURO**

### **Próximas Versiones**
- **v2.4**: Configuraciones de accesibilidad avanzadas
- **v2.5**: Sistema de notificaciones push
- **v2.6**: Modo offline completo
- **v3.0**: Rediseño completo de UI/UX

### **Funcionalidades en Desarrollo**
- **Configuraciones de accesibilidad** (tamaño de fuente, contraste)
- **Sistema de notificaciones** personalizables
- **Modo offline** para actividades sin conexión
- **Análisis de progreso** más detallado
- **Sistema de recompensas** expandido

---

## 📞 **SOPORTE Y CONTACTO**

Para soporte técnico o consultas sobre la aplicación, contactar al equipo de desarrollo.

---

*NeuroApp - Educación inclusiva y accesible para todos* 🧠✨