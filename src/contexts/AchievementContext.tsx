// src/contexts/AchievementContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAchievementSystem } from '../hooks/useAchievementSystem';
import AchievementNotification from '../components/AchievementNotification';
import { useLanguage } from './LanguageContext';

interface AchievementContextType {
  recordGameCompletion: (data: any) => Promise<void>;
  recordHelpUsed: (lessonId: number, stepId: number) => Promise<void>;
  isInitialized: boolean;
  onAchievementNotificationHidden: (callback: () => void) => () => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

interface AchievementProviderProps {
  children: ReactNode;
}

export const AchievementProvider: React.FC<AchievementProviderProps> = ({ children }) => {
  const { language } = useLanguage();
  const {
    recordGameCompletion,
    recordHelpUsed,
    currentNotification,
    isNotificationVisible,
    hideNotification,
    isInitialized,
  } = useAchievementSystem();

  // Sistema de eventos para notificar cuando se oculta la notificación
  const notificationHiddenListeners = React.useRef<(() => void)[]>([]);

  const onAchievementNotificationHidden = React.useCallback((callback: () => void) => {
    notificationHiddenListeners.current.push(callback);
    
    // Retornar función para desuscribirse
    return () => {
      const index = notificationHiddenListeners.current.indexOf(callback);
      if (index > -1) {
        notificationHiddenListeners.current.splice(index, 1);
      }
    };
  }, []);

  const handleNotificationHide = React.useCallback(() => {
    hideNotification();
    
    // Notificar a todos los listeners
    notificationHiddenListeners.current.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('❌ [AchievementContext] Error en listener de notificación oculta:', error);
      }
    });
  }, [hideNotification]);

  const contextValue: AchievementContextType = {
    recordGameCompletion,
    recordHelpUsed,
    isInitialized,
    onAchievementNotificationHidden,
  };

  return (
    <AchievementContext.Provider value={contextValue}>
      {children}
      
      {/* Componente global de notificaciones de logros - Renderizado al final para estar encima */}
      {isNotificationVisible && (
        <AchievementNotification
          achievement={currentNotification?.achievement || null}
          visible={isNotificationVisible}
          onHide={handleNotificationHide}
          language={language}
          title={currentNotification?.title}
          description={currentNotification?.description}
          encouragementMessage={currentNotification?.encouragementMessage}
        />
      )}
    </AchievementContext.Provider>
  );
};

export const useAchievementContext = (): AchievementContextType => {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievementContext must be used within an AchievementProvider');
  }
  return context;
};
