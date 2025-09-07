# 🧠 NeuroApp - Aplicación Educativa para Usuarios Neurodivergentes

NeuroApp es una aplicación móvil educativa diseñada específicamente para usuarios neurodivergentes, que ofrece actividades interactivas, gamificación y un sistema de progreso personalizado.

## 📱 Manual de Usuario - Aplicación Móvil

### 🔐 **Pantallas de Autenticación**

#### **LoginScreen** - Pantalla de Inicio de Sesión
**Ubicación:** `src/screens/LoginScreen.tsx`

**Funcionalidades:**
- **Inicio de sesión:** Los usuarios pueden ingresar con email/username y contraseña
- **Navegación a registro:** Botón para crear una nueva cuenta
- **Validación de campos:** Verificación de datos antes del envío
- **Manejo de errores:** Mensajes claros en caso de credenciales incorrectas
- **Persistencia:** Guarda la sesión del usuario automáticamente

**Elementos de la interfaz:**
- Campo de email/username
- Campo de contraseña
- Botón "Iniciar Sesión"
- Enlace "¿No tienes cuenta? Regístrate"
- Indicador de carga durante la autenticación

---

#### **OnboardingScreen** - Pantalla de Bienvenida
**Ubicación:** `src/screens/OnboardingScreen.tsx`

**Funcionalidades:**
- **Introducción a la app:** Presenta las características principales
- **Tutorial interactivo:** Guía paso a paso para nuevos usuarios
- **Configuración inicial:** Permite establecer preferencias básicas
- **Navegación fluida:** Transición suave hacia la pantalla principal

**Elementos de la interfaz:**
- Slides informativos con ilustraciones
- Botones de navegación (Anterior/Siguiente)
- Indicadores de progreso
- Botón "Comenzar" al final del tutorial

---

### 🏠 **Pantallas Principales**

#### **MainScreen** - Pantalla Principal
**Ubicación:** `src/screens/MainScreen.tsx`

**Funcionalidades:**
- **Dashboard principal:** Vista general del progreso del usuario
- **Acceso rápido:** Botones para acceder a diferentes secciones
- **Estadísticas resumidas:** Muestra estrellas ganadas, actividades completadas
- **Navegación central:** Hub principal para todas las funcionalidades

**Elementos de la interfaz:**
- Saludo personalizado con nombre del usuario
- Tarjetas de progreso con estadísticas
- Botones de acceso rápido a actividades
- Menú de navegación inferior
- Notificaciones de logros recientes

---

#### **ActivityMenuScreen** - Menú de Actividades
**Ubicación:** `src/screens/ActivityMenuScreen.tsx`

**Funcionalidades:**
- **Selección de actividades:** Lista de todos los tipos de juegos disponibles
- **Vista previa:** Descripción breve de cada actividad
- **Filtrado:** Organización por dificultad o categoría
- **Progreso visual:** Indicadores de completado por actividad

**Tipos de actividades disponibles:**
1. **Selecciona la Opción Correcta** - Preguntas de opción múltiple
2. **Ordena los Pasos** - Secuenciación lógica
3. **Arrastra y Suelta** - Clasificación por categorías
4. **Asocia Elementos** - Conexión de conceptos relacionados
5. **Memoria Visual** - Juegos de memoria y concentración
6. **Reconocimiento de Patrones** - Identificación de secuencias

---

#### **CategoryMenuScreen** - Menú de Categorías
**Ubicación:** `src/screens/CategoryMenuScreen.tsx`

**Funcionalidades:**
- **Navegación por categorías:** Organización temática del contenido
- **Vista de progreso:** Muestra el avance en cada categoría
- **Filtros dinámicos:** Selección por tipo de actividad
- **Acceso directo:** Navegación rápida a lecciones específicas

**Elementos de la interfaz:**
- Tarjetas de categorías con íconos coloridos
- Barras de progreso por categoría
- Contador de lecciones completadas
- Botones de filtro por tipo de actividad

---

#### **LessonListScreen** - Lista de Lecciones
**Ubicación:** `src/screens/LessonListScreen.tsx`

**Funcionalidades:**
- **Exploración de lecciones:** Lista completa de lecciones por categoría
- **Indicadores de estado:** Muestra lecciones completadas, en progreso y bloqueadas
- **Información detallada:** Descripción, dificultad y duración estimada
- **Acceso controlado:** Sistema de desbloqueo progresivo

**Elementos de la interfaz:**
- Lista scrolleable de lecciones
- Íconos de estado (completado, en progreso, bloqueado)
- Indicadores de dificultad (fácil, medio, difícil)
- Estrellas ganadas por lección
- Botón de acceso a cada lección

---

#### **LessonScreen** - Pantalla de Lección
**Ubicación:** `src/screens/LessonScreen.tsx`

**Funcionalidades:**
- **Vista detallada:** Información completa de la lección seleccionada
- **Lista de pasos:** Todos los ejercicios incluidos en la lección
- **Progreso de lección:** Seguimiento del avance paso a paso
- **Navegación de pasos:** Acceso directo a ejercicios específicos

**Elementos de la interfaz:**
- Título y descripción de la lección
- Lista de pasos con indicadores de completado
- Barra de progreso general
- Botón "Comenzar" o "Continuar"
- Estadísticas de la lección

---

### 🎮 **Pantallas de Juegos**

#### **SelectOptionScreen** - Selecciona la Opción Correcta
**Ubicación:** `src/screens/SelectOptionScreen.tsx`

**Funcionalidades:**
- **Preguntas de opción múltiple:** Presenta una pregunta con varias opciones
- **Feedback inmediato:** Respuesta visual y auditiva a las selecciones
- **Sistema de ayuda:** Pistas automáticas después de errores o inactividad
- **Gamificación:** Sistema de estrellas basado en rendimiento
- **Progreso en tiempo real:** Seguimiento de intentos y errores

**Mecánica del juego:**
1. Se presenta una pregunta con 2-4 opciones
2. El usuario selecciona una opción tocándola
3. Feedback inmediato (correcto/incorrecto)
4. Si es incorrecto, puede intentar nuevamente
5. Sistema de ayuda destaca la respuesta correcta tras varios errores
6. Completado cuando selecciona la respuesta correcta

**Sistema de puntuación:**
- ⭐⭐⭐ Respuesta correcta en el primer intento
- ⭐⭐ Respuesta correcta en 2-3 intentos
- ⭐ Respuesta correcta con más intentos o ayuda

---

#### **OrderStepsScreen** - Ordena los Pasos
**Ubicación:** `src/screens/OrderStepsScreen.tsx`

**Funcionalidades:**
- **Secuenciación lógica:** Organizar elementos en el orden correcto
- **Drag & Drop:** Interfaz intuitiva de arrastrar y soltar
- **Validación automática:** Verificación del orden al completar
- **Pistas visuales:** Ayudas para identificar la secuencia correcta

**Mecánica del juego:**
1. Se presentan elementos desordenados
2. El usuario arrastra cada elemento a su posición correcta
3. Validación automática al colocar todos los elementos
4. Feedback visual para posiciones correctas/incorrectas
5. Posibilidad de reordenar hasta conseguir la secuencia correcta

---

#### **DragDropScreen** - Arrastra y Suelta
**Ubicación:** `src/screens/DragDropScreen.tsx`

**Funcionalidades:**
- **Clasificación por categorías:** Organizar elementos en grupos
- **Zonas de destino:** Áreas específicas para cada categoría
- **Validación por zona:** Verificación de colocación correcta
- **Feedback táctil:** Vibración y efectos visuales

**Mecánica del juego:**
1. Se muestran elementos mezclados y zonas de destino
2. El usuario arrastra cada elemento a la zona correspondiente
3. Validación inmediata al soltar en cada zona
4. Elementos incorrectos regresan a su posición original
5. Completado cuando todos los elementos están correctamente clasificados

---

#### **MatchScreen** - Asocia Elementos
**Ubicación:** `src/screens/MatchScreen.tsx`

**Funcionalidades:**
- **Conexión de conceptos:** Relacionar elementos que van juntos
- **Interfaz de emparejamiento:** Sistema de selección por pares
- **Validación de relaciones:** Verificación de conexiones correctas
- **Progreso visual:** Indicadores de pares completados

**Mecánica del juego:**
1. Se presentan elementos en dos columnas
2. El usuario selecciona un elemento de cada columna
3. Validación automática de la relación
4. Pares correctos se marcan como completados
5. Pares incorrectos se deseleccionan para nuevo intento

---

#### **MemoryGameScreen** - Memoria Visual
**Ubicación:** `src/screens/MemoryGameScreen.tsx`

**Funcionalidades:**
- **Juego de memoria:** Encontrar pares de cartas idénticas
- **Diferentes niveles:** Variación en número de cartas
- **Tiempo de memorización:** Período inicial para observar las cartas
- **Contador de intentos:** Seguimiento de movimientos realizados

**Mecánica del juego:**
1. Las cartas se muestran brevemente al inicio
2. Se voltean todas las cartas
3. El usuario selecciona dos cartas por turno
4. Si coinciden, permanecen visibles
5. Si no coinciden, se voltean nuevamente
6. Completado cuando todos los pares están encontrados

---

#### **PatternRecognitionScreen** - Reconocimiento de Patrones
**Ubicación:** `src/screens/PatternRecognitionScreen.tsx`

**Funcionalidades:**
- **Identificación de secuencias:** Reconocer patrones en series
- **Completar secuencias:** Encontrar el elemento faltante
- **Diferentes tipos de patrones:** Numéricos, visuales, lógicos
- **Dificultad progresiva:** Patrones más complejos en niveles avanzados

**Mecánica del juego:**
1. Se presenta una secuencia con un elemento faltante
2. Se ofrecen varias opciones para completar el patrón
3. El usuario selecciona la opción que completa la secuencia
4. Validación inmediata de la respuesta
5. Explicación del patrón tras respuesta correcta

---

### 📊 **Pantallas de Progreso y Estadísticas**

#### **StatisticsScreen** - Estadísticas del Usuario
**Ubicación:** `src/screens/StatisticsScreen.tsx`

**Funcionalidades:**
- **Métricas detalladas:** Estadísticas completas de rendimiento
- **Gráficos visuales:** Representación gráfica del progreso
- **Comparación temporal:** Evolución del rendimiento en el tiempo
- **Análisis por actividad:** Desglose de estadísticas por tipo de juego

**Métricas mostradas:**
- Total de actividades completadas
- Estrellas ganadas
- Tiempo total de juego
- Días consecutivos jugando
- Actividad favorita
- Tasa de mejora
- Puntos de exploración

---

#### **AchievementsScreen** - Pantalla de Logros
**Ubicación:** `src/screens/AchievementsScreen.tsx`

**Funcionalidades:**
- **Galería de logros:** Todos los logros disponibles y desbloqueados
- **Categorización:** Logros organizados por tipo y rareza
- **Progreso de logros:** Indicadores de progreso para logros en curso
- **Detalles de logros:** Descripción y requisitos para desbloquear

**Tipos de logros:**
- **Común:** Logros básicos de progreso
- **Raro:** Logros por rendimiento destacado
- **Épico:** Logros por hitos importantes
- **Legendario:** Logros por excelencia excepcional

**Categorías:**
- Progreso general
- Perfección en actividades
- Constancia y dedicación
- Exploración y descubrimiento
- Mejora y superación

---

### ⚙️ **Pantallas de Configuración**

#### **SettingsScreen** - Configuraciones
**Ubicación:** `src/screens/SettingsScreen.tsx`

**Funcionalidades:**
- **Configuraciones de usuario:** Personalización de la experiencia
- **Configuraciones de accesibilidad:** Adaptaciones para necesidades específicas
- **Configuraciones de audio:** Control de sonidos y narración
- **Configuraciones de idioma:** Cambio entre español e inglés
- **Gestión de cuenta:** Opciones de perfil y privacidad

**Opciones disponibles:**
- **Audio y Sonido:**
  - Activar/desactivar efectos de sonido
  - Activar/desactivar narración por voz
  - Control de volumen
  - Velocidad de narración

- **Accesibilidad:**
  - Tamaño de texto
  - Contraste alto
  - Tiempo de respuesta extendido
  - Ayudas visuales adicionales

- **Idioma:**
  - Español
  - Inglés
  - Cambio dinámico de contenido

- **Perfil:**
  - Editar información personal
  - Cambiar contraseña
  - Configuraciones de privacidad

---

### 🔧 **Características Técnicas**

#### **Sistema de Ayuda Adaptativo**
- **Detección de inactividad:** Ofrece ayuda tras períodos sin interacción
- **Análisis de errores:** Proporciona pistas específicas según el tipo de error
- **Escalamiento de ayuda:** Aumenta gradualmente el nivel de asistencia
- **Audio contextual:** Narración y explicaciones por voz

#### **Sistema de Gamificación**
- **Estrellas por rendimiento:** 1-3 estrellas según la calidad de la ejecución
- **Sistema de logros:** Reconocimientos por diferentes tipos de progreso
- **Progreso visual:** Barras e indicadores de avance
- **Celebraciones:** Animaciones y efectos para reforzar logros

#### **Soporte Multiidioma**
- **Contenido bilingüe:** Español e inglés integrados
- **Cambio dinámico:** Alternancia instantánea entre idiomas
- **Procesamiento inteligente:** Extracción automática de texto según idioma seleccionado

#### **Persistencia de Datos**
- **Almacenamiento local:** AsyncStorage para datos offline
- **Sincronización con servidor:** Backup automático del progreso
- **Recuperación de sesión:** Continuidad tras cerrar la aplicación

#### **Accesibilidad**
- **Diseño inclusivo:** Interfaz adaptada para usuarios neurodivergentes
- **Feedback múltiple:** Visual, auditivo y táctil
- **Navegación simplificada:** Flujos intuitivos y claros
- **Personalización:** Adaptación a necesidades individuales

---

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js (versión 18 o superior)
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS)

### Instalación

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

### Configuración del Backend

La aplicación se conecta al backend desplegado en: `https://facturago.onrender.com`

Para desarrollo local, modificar la configuración en:
`src/config/api.ts`

---

## 🛠️ Desarrollo

### Estructura del Proyecto

```
NeuroApp/
├── src/
│   ├── components/          # Componentes reutilizables
│   ├── screens/            # Pantallas de la aplicación
│   ├── navigation/         # Configuración de navegación
│   ��── hooks/              # Hooks personalizados
│   ├── services/           # Servicios y APIs
│   ├── contexts/           # Contextos de React
│   ├── utils/              # Utilidades y helpers
│   ├── types/              # Definiciones de tipos
│   ├── constants/          # Constantes de la aplicación
│   ├── config/             # Configuraciones
│   ├── i18n/               # Internacionalización
│   └── assets/             # Recursos estáticos
├── android/                # Configuración Android
├── ios/                    # Configuración iOS
└── Backend/                # Código del servidor
```

### Scripts Disponibles

- `npm start` - Iniciar Metro bundler
- `npm run android` - Ejecutar en Android
- `npm run ios` - Ejecutar en iOS
- `npm run lint` - Ejecutar linter
- `npm test` - Ejecutar tests

---

## 📞 Soporte y Contacto

Para soporte técnico o consultas sobre la aplicación, contactar al equipo de desarrollo.

---

*NeuroApp - Educación inclusiva y accesible para todos* 🧠✨