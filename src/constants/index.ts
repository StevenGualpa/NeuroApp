// App Constants
export const APP_CONFIG = {
  VERSION: '1.0.0',
  LAST_UPDATE: 'Diciembre 2024',
  PLATFORM: 'React Native',
} as const;

// Animation Constants
export const ANIMATION_DURATION = {
  SHORT: 300,
  MEDIUM: 500,
  LONG: 1000,
  CARD_SHOW_TIME: 4000,
} as const;

// Game Constants
export const GAME_CONFIG = {
  MEMORY_CARD_SHOW_TIME: 4000,
  MAX_TIME_PER_PAIR: 12000, // 12 seconds per pair
  MIN_FLIPS_MULTIPLIER: 2,
  PERFECT_FLIPS_MULTIPLIER: 1.2,
  GOOD_FLIPS_MULTIPLIER: 1.5,
} as const;

// Colors
export const COLORS = {
  PRIMARY: '#4285f4',
  SECONDARY: '#4ECDC4',
  SUCCESS: '#4caf50',
  ERROR: '#ff4757',
  WARNING: '#FFA726',
  BACKGROUND: '#f8faff',
  WHITE: '#ffffff',
  GRAY: '#6b7280',
  LIGHT_GRAY: '#f3f4f6',
  DARK: '#1a1a1a',
} as const;

// Dimensions
export const LAYOUT = {
  BORDER_RADIUS: {
    SMALL: 8,
    MEDIUM: 12,
    LARGE: 16,
    EXTRA_LARGE: 20,
    ROUND: 24,
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 20,
    XXL: 24,
  },
  SHADOW: {
    SMALL: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    MEDIUM: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    LARGE: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 8,
    },
  },
} as const;

// Achievement Categories
export const ACHIEVEMENT_CATEGORIES = {
  ALL: 'all',
  FIRST_STEPS: 'primeros_pasos',
  PROGRESS: 'progreso',
  EFFORT: 'esfuerzo',
  SPECIAL: 'especial',
} as const;

// Achievement Rarities
export const ACHIEVEMENT_RARITIES = {
  CELEBRATION: 'celebracion',
  GREAT: 'genial',
  INCREDIBLE: 'increible',
  SUPER_SPECIAL: 'super_especial',
} as const;

// Activity Types (Solo los 7 implementados)
export const ACTIVITY_TYPES = {
  SELECT_OPTION: 'Selecciona la opción correcta',
  ORDER_STEPS: 'Ordena los pasos',
  DRAG_DROP: 'Arrastra y suelta',
  MATCH_ELEMENTS: 'Asocia elementos',
  REPEAT_SOUNDS: 'Repetir sonidos',
  VISUAL_MEMORY: 'Memoria visual',
  PATTERN_RECOGNITION: 'Reconocimiento de patrones',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACHIEVEMENTS: '@achievements_neurodivergent',
  USER_STATS: '@user_stats_neurodivergent',
  USER_PROGRESS: '@user_progress',
  SETTINGS: '@app_settings',
} as const;

// Menu Options
export const MENU_OPTIONS = [
  {
    key: 'home',
    label: 'Home',
    icon: '🏠',
    color: COLORS.SECONDARY,
    shadowColor: '#26D0CE',
  },
  {
    key: 'actividades',
    label: 'Actividades',
    icon: '🎮',
    color: '#FF6B6B',
    shadowColor: '#FF4757',
  },
  {
    key: 'logros',
    label: 'Logros',
    icon: '🏆',
    color: '#45B7D1',
    shadowColor: '#3742FA',
  },
  {
    key: 'creditos',
    label: 'Créditos',
    icon: '👥',
    color: COLORS.WARNING,
    shadowColor: '#FF9800',
  },
] as const;

// Credits Data
export const CREDITS_DATA = [
  {
    category: 'Desarrollo',
    items: [
      { name: 'Desarrollador Principal', value: 'Steven Gualpa' },
      { name: 'Diseño UI/UX', value: 'Steven Gualpa' },
      { name: 'Programación', value: 'Yolo Team' },
    ],
  },
  {
    category: 'Contenido',
    items: [
      { name: 'Contenido Educativo', value: 'Especialistas en Educación' },
      { name: 'Ilustraciones', value: 'Artistas Gráficos' },
      { name: 'Sonidos', value: 'Equipo de Audio' },
    ],
  },
  {
    category: 'Agradecimientos',
    items: [
      { name: 'Beta Testers', value: 'Comunidad de Usuarios' },
      { name: 'Feedback', value: 'Padres y Educadores' },
      { name: 'Inspiración', value: 'Niños de Todo el Mundo' },
    ],
  },
] as const;