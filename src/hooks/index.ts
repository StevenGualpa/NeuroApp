// src/hooks/index.ts
// Exportar todos los hooks para facilitar las importaciones

// Hooks de autenticación
export { default as useAuth, useAuthContext, AuthProvider } from './useAuth';
export type { AuthUser, AuthContextType } from './useAuth';

// Hooks de sesiones de juego
export { default as useGameSessions } from './useGameSessions';
export type { 
  SessionData, 
  SessionEndData, 
  SessionUpdateData, 
  SessionStats 
} from './useGameSessions';

// Hooks de progreso de usuario
export { default as useUserProgress } from './useUserProgress';
export type { 
  UserProgress, 
  ProgressData, 
  ProgressSummary 
} from './useUserProgress';

// Hooks de logros
export { default as useRealAchievements } from './useRealAchievements';

// Hooks de configuraciones
export { default as useSettings } from './useSettings';
export type { SettingsMap } from './useSettings';

// Hooks de configuraciones de usuario
export { default as useUserSettings } from './useUserSettings';

// Hooks de estadísticas de usuario
export { default as useUserStats } from './useUserStats';
export type { StatsUpdate } from './useUserStats';

// Hook principal de gameplay
export { default as useGameplay } from './useGameplay';
export type { 
  GameplaySession, 
  GameplayResult 
} from './useGameplay';

// Hook de progreso de actividades
export { default as useActivityProgress } from './useActivityProgress';
export type { 
  ActivityResult, 
  ActivitySession 
} from './useActivityProgress';

// Re-exportar tipos del ApiService para conveniencia
export type {
  User,
  UserStats,
  Achievement,
  UserAchievement,
  GameSession,
  AppSettings,
  Activity,
  Category,
  Lesson,
  Step,
  Option,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
} from '../services/ApiService';