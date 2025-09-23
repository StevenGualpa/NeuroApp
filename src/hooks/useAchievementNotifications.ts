// src/hooks/useAchievementNotifications.ts
import { useState, useCallback } from 'react';
import { Achievement } from '../services/ApiService';
import AchievementConditionsService from '../services/AchievementConditionsService';

interface AchievementNotificationData {
  achievement: Achievement;
  title: string;
  description: string;
  encouragementMessage: string;
}

interface UseAchievementNotificationsReturn {
  // Estado
  currentNotification: AchievementNotificationData | null;
  isVisible: boolean;
  
  // Funciones
  showAchievementNotification: (achievementId: number, language?: 'es' | 'en') => void;
  hideNotification: () => void;
  clearNotification: () => void;
}

export const useAchievementNotifications = (): UseAchievementNotificationsReturn => {
  const [currentNotification, setCurrentNotification] = useState<AchievementNotificationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  /**
   * Mostrar notificación de logro desbloqueado
   */
  const showAchievementNotification = useCallback((achievementId: number, language: 'es' | 'en' = 'es') => {
    const achievement = AchievementConditionsService.getAchievementById(achievementId);
    
    if (!achievement) {
      console.error(`❌ [AchievementNotifications] No se encontró el logro con ID: ${achievementId}`);
      return;
    }

    // Obtener textos en el idioma correcto
    const title = AchievementConditionsService.getAchievementTitle(achievementId, language);
    const description = AchievementConditionsService.getAchievementDescription(achievementId, language);
    const encouragementMessage = AchievementConditionsService.getEncouragementMessage(achievementId, language);

    const notificationData: AchievementNotificationData = {
      achievement,
      title,
      description,
      encouragementMessage,
    };

    console.log(`🏆 [AchievementNotifications] Mostrando notificación para: ${title}`);
    
    setCurrentNotification(notificationData);
    setIsVisible(true);
  }, []);

  /**
   * Ocultar notificación actual
   */
  const hideNotification = useCallback(() => {
    setIsVisible(false);
  }, []);

  /**
   * Limpiar notificación completamente
   */
  const clearNotification = useCallback(() => {
    setCurrentNotification(null);
    setIsVisible(false);
  }, []);

  return {
    currentNotification,
    isVisible,
    showAchievementNotification,
    hideNotification,
    clearNotification,
  };
};
