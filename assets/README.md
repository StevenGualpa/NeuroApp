# Assets - Sistema de Imágenes

Esta carpeta contiene todas las imágenes/pictogramas utilizados en la aplicación NeuroApp.

## Estructura de Carpetas

```
assets/
└── images/
    ├── categorias/     # Imágenes para categorías
    ├── lecciones/      # Imágenes para lecciones
    ├── pasos/          # Imágenes para pasos/instrucciones
    ├── opciones/       # Imágenes para opciones de respuesta
    └── actividades/    # Imágenes para tipos de actividad
```

## Cómo Funciona

### 1. Almacenamiento en Base de Datos
En la base de datos solo se guarda el **nombre del archivo**:
```json
{
  "id": 1,
  "name": "Seguridad en el Hogar",
  "imagen": "seguridad_hogar.png"
}
```

### 2. Construcción de URL Completa
El sistema construye automáticamente la URL completa:
```
Base URL: https://facturago.onrender.com
Ruta: /assets/images/
Archivo: seguridad_hogar.png
URL Final: https://facturago.onrender.com/assets/images/seguridad_hogar.png
```

### 3. Respuesta de la API
```json
{
  "id": 1,
  "name": "Seguridad en el Hogar",
  "imagen": "seguridad_hogar.png",
  "icon": "https://facturago.onrender.com/assets/images/seguridad_hogar.png"
}
```

## Formatos Soportados

- **PNG** - Recomendado para pictogramas con transparencia
- **JPG/JPEG** - Para fotografías
- **SVG** - Para iconos vectoriales
- **WEBP** - Para optimización de tamaño

## Convenciones de Nombres

### Categorías
- `seguridad_hogar.png`
- `normas_viales.png`
- `actividades_escolares.png`
- `alimentacion_saludable.png`

### Lecciones
- `lavado_manos.png`
- `cruzar_calle.png`
- `materiales_escolares.png`
- `grupos_alimentos.png`

### Pasos
- `paso_lavado_1.png`
- `paso_lavado_2.png`
- `instruccion_cruzar.png`

### Opciones
- `opcion_jabon.png`
- `opcion_toalla.png`
- `opcion_agua.png`
- `opcion_semaforo_rojo.png`

## Configuración del Servidor

### Cambiar URL Base (Desarrollo vs Producción)

En tu código Go, puedes cambiar fácilmente la URL base:

```go
// Producción
imageService := services.NewSimpleImageService("https://facturago.onrender.com")

// Desarrollo local
imageService := services.NewSimpleImageService("http://localhost:8080")

// Cambiar dinámicamente
imageService.SetBaseURL("https://mi-nuevo-servidor.com")
```

## Ejemplos de Uso

### 1. Crear Categoría con Imagen
```json
POST /api/categories
{
  "name": "Seguridad en el Hogar",
  "description": "Aprende sobre seguridad doméstica",
  "imagen": "seguridad_hogar.png",
  "color": "#FF5722"
}
```

### 2. Respuesta con URL Procesada
```json
{
  "id": 1,
  "name": "Seguridad en el Hogar",
  "description": "Aprende sobre seguridad doméstica",
  "imagen": "seguridad_hogar.png",
  "icon": "https://facturago.onrender.com/assets/images/seguridad_hogar.png",
  "color": "#FF5722"
}
```

## Servir Archivos Estáticos

Asegúrate de que tu servidor sirva los archivos estáticos desde esta carpeta:

```go
// En Fiber
app.Static("/assets", "./assets")

// En Gin
router.Static("/assets", "./assets")
```

## Recomendaciones

1. **Tamaño**: Mantén las imágenes optimizadas (< 500KB)
2. **Resolución**: 512x512px para pictogramas, 1024x768px para imágenes de lecciones
3. **Nombres**: Usa nombres descriptivos en snake_case
4. **Backup**: Mantén respaldos de todas las imágenes
5. **Versionado**: Considera versionar las imágenes si cambias frecuentemente