// src/services/index.ts
// Exportar todos los servicios para facilitar las importaciones

// Servicio principal de API
export { default as ApiService } from './ApiService';
export type * from './ApiService';

// Servicio de autenticación
export { default as AuthService } from './AuthService';

// Servicio de logros
export { default as AchievementService } from './AchievementService';
export { default as RealAchievementService } from './RealAchievementService';

// Servicio de sesiones
export { default as SessionService } from './SessionService';

// Servicio de configuraciones
export { default as SettingsService } from './SettingsService';

// Servicio de audio
export { default as AudioService } from './AudioService';

// Servicio de refuerzo adaptativo
export { default as AdaptiveReinforcementService } from './AdaptiveReinforcementService';

// Servicio de progreso completo
export { default as ProgressService } from './ProgressService';
export type { 
  CompleteProgressData, 
  ProgressAnalytics 
} from './ProgressService';