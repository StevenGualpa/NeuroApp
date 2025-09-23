// src/contexts/AchievementContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useAchievementSystem } from '../hooks/useAchievementSystem';
import AchievementNotification from '../components/AchievementNotification';
import { useLanguage } from './LanguageContext';

interface AchievementContextType {
  recordGameCompletion: (data: any) => Promise<void>;
  recordHelpUsed: (lessonId: number, stepId: number) => Promise<void>;
  isInitialized: boolean;
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

  const contextValue: AchievementContextType = {
    recordGameCompletion,
    recordHelpUsed,
    isInitialized,
  };

  return (
    <AchievementContext.Provider value={contextValue}>
      {children}
      
      {/* Componente global de notificaciones de logros */}
      <AchievementNotification
        achievement={currentNotification?.achievement || null}
        visible={isNotificationVisible}
        onHide={hideNotification}
        language={language}
        title={currentNotification?.title}
        description={currentNotification?.description}
        encouragementMessage={currentNotification?.encouragementMessage}
      />
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
