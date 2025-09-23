// src/hooks/useAchievementSystem.ts
import { useEffect, useCallback } from 'react';
import { useAuthContext } from './useAuth';
import { useAchievementNotifications } from './useAchievementNotifications';
import RealAchievementService from '../services/RealAchievementService';
import { useLanguage } from '../contexts/LanguageContext';

interface GameCompletionData {
  lessonId?: number;
  stepId?: number;
  stars: number;
  completionTime: number;
  errors: number;
  usedHelp?: boolean;
  perfectRun: boolean;
  activityType: string;
}

interface UseAchievementSystemReturn {
  // Funciones principales
  recordGameCompletion: (data: GameCompletionData) => Promise<void>;
  recordHelpUsed: (lessonId: number, stepId: number) => Promise<void>;
  
  // Notificaciones
  currentNotification: any;
  isNotificationVisible: boolean;
  hideNotification: () => void;
  
  // Estado
  isInitialized: boolean;
}

export const useAchievementSystem = (): UseAchievementSystemReturn => {
  const { user } = useAuthContext();
  const { language } = useLanguage();
  const {
    currentNotification,
    isVisible: isNotificationVisible,
    showAchievementNotification,
    hideNotification,
  } = useAchievementNotifications();

  // Estado de inicialización
  const isInitialized = !!user?.id;

  // Inicializar automáticamente cuando el usuario esté disponible
  useEffect(() => {
    console.log('🔄 [AchievementSystem] useEffect ejecutado - user.id:', user?.id);
    
    const initializeAchievements = async () => {
      if (user?.id) {
        console.log('👤 [AchievementSystem] Usuario disponible, verificando estado...');
        const status = RealAchievementService.getServiceStatus();
        console.log('🔍 [AchievementSystem] Verificando estado del servicio:', status);
        
        if (!status.isInitialized) {
          console.log('🔄 [AchievementSystem] Inicializando automáticamente RealAchievementService...');
          try {
            await RealAchievementService.initialize(user.id);
            console.log('✅ [AchievementSystem] Inicialización automática exitosa');
          } catch (error) {
            console.error('❌ [AchievementSystem] Error en inicialización automática:', error);
            console.error('❌ [AchievementSystem] Stack trace:', error.stack);
          }
        } else {
          console.log('✅ [AchievementSystem] RealAchievementService ya está inicializado');
        }
      }
    };

    initializeAchievements();
  }, [user?.id]);

  /**
   * Registrar finalización de juego y procesar logros
   */
  const recordGameCompletion = useCallback(async (data: GameCompletionData) => {
    if (!user?.id) {
      console.warn('🚨 [AchievementSystem] No hay usuario logueado');
      return;
    }

    try {
      console.log('🎮 [AchievementSystem] Registrando finalización de juego:', data);
      
      // Debug: Verificar estado del servicio
      const status = RealAchievementService.getServiceStatus();
      console.log('🔍 [AchievementSystem] Estado del servicio:', status);
      
      if (!status.isInitialized) {
        console.warn('⚠️ [AchievementSystem] RealAchievementService no está inicializado - intentando inicializar...');
        try {
          await RealAchievementService.initialize(user.id);
          console.log('✅ [AchievementSystem] RealAchievementService inicializado exitosamente');
        } catch (initError) {
          console.error('❌ [AchievementSystem] Error inicializando RealAchievementService:', initError);
          return;
        }
      } else if (status.achievementsCount === 0) {
        console.warn('⚠️ [AchievementSystem] RealAchievementService inicializado pero sin achievements - reinicializando...');
        try {
          await RealAchievementService.reinitialize(user.id);
          console.log('✅ [AchievementSystem] RealAchievementService reinicializado exitosamente');
        } catch (reinitError) {
          console.error('❌ [AchievementSystem] Error reinicializando RealAchievementService:', reinitError);
          return;
        }
      }
      
      // Procesar a través del RealAchievementService
      const unlockedAchievements = await RealAchievementService.recordGameCompletion(data);
      
      // Mostrar notificaciones para logros desbloqueados
      if (unlockedAchievements.length > 0) {
        console.log(`🏆 [AchievementSystem] ${unlockedAchievements.length} logros desbloqueados`);
        
        // Mostrar el primer logro desbloqueado
        // (Si hay múltiples, se pueden encolar para mostrarlos secuencialmente)
        const firstAchievement = unlockedAchievements[0];
        showAchievementNotification(firstAchievement.ID, language);
        
        // Si hay más logros, programar para mostrar después
        if (unlockedAchievements.length > 1) {
          setTimeout(() => {
            for (let i = 1; i < unlockedAchievements.length; i++) {
              setTimeout(() => {
                showAchievementNotification(unlockedAchievements[i].ID, language);
              }, i * 5000); // 5 segundos entre notificaciones
            }
          }, 5000);
        }
      } else {
        console.log('📈 [AchievementSystem] No se desbloquearon nuevos logros');
      }
      
    } catch (error) {
      console.error('❌ [AchievementSystem] Error registrando finalización:', error);
      // No mostrar error al usuario, solo log interno
    }
  }, [user?.id, language, showAchievementNotification]);

  /**
   * Registrar uso de ayuda
   */
  const recordHelpUsed = useCallback(async (lessonId: number, stepId: number) => {
    if (!user?.id) {
      console.warn('🚨 [AchievementSystem] No hay usuario logueado');
      return;
    }

    try {
      console.log('💡 [AchievementSystem] Registrando uso de ayuda');
      
      // Debug: Verificar estado del servicio
      const status = RealAchievementService.getServiceStatus();
      console.log('🔍 [AchievementSystem] Estado del servicio:', status);
      
      if (!status.isInitialized) {
        console.warn('⚠️ [AchievementSystem] RealAchievementService no está inicializado - intentando inicializar...');
        try {
          await RealAchievementService.initialize(user.id);
          console.log('✅ [AchievementSystem] RealAchievementService inicializado exitosamente');
        } catch (initError) {
          console.error('❌ [AchievementSystem] Error inicializando RealAchievementService:', initError);
          return;
        }
      }
      
      const unlockedAchievements = await RealAchievementService.processHelpUsed(lessonId, stepId);
      
      if (unlockedAchievements.length > 0) {
        const firstAchievement = unlockedAchievements[0];
        showAchievementNotification(firstAchievement.ID, language);
      }
      
    } catch (error) {
      console.error('❌ [AchievementSystem] Error registrando uso de ayuda:', error);
    }
  }, [user?.id, language, showAchievementNotification]);

  // Efecto para limpiar cuando el usuario cambia
  useEffect(() => {
    if (!user) {
      // Usuario cerró sesión, limpiar datos
      RealAchievementService.clearCache();
    }
  }, [user]);

  return {
    // Funciones principales
    recordGameCompletion,
    recordHelpUsed,
    
    // Notificaciones
    currentNotification,
    isNotificationVisible,
    hideNotification,
    
    // Estado
    isInitialized,
  };
};

export default useAchievementSystem;
