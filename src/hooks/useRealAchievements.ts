// src/hooks/useRealAchievements.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { AchievementService } from '../services/AchievementService';
import { Achievement } from '../services/ApiService';

interface GameCompletionData {
  stars: number;
  isPerfect: boolean;
  completionTime: number;
  errors: number;
  activityType: string;
  showedImprovement?: boolean;
  usedHelp?: boolean;
  tookTime?: boolean;
  lessonId?: number;
  stepId?: number;
}

interface UseRealAchievementsReturn {
  // States
  newAchievement: Achievement | null;
  showAchievementNotification: boolean;
  achievementQueue: Achievement[];
  isInitialized: boolean;
  
  // Functions
  recordGameCompletion: (gameData: GameCompletionData) => Promise<void>;
  handleAchievementNotificationHide: () => void;
  initializeAchievements: () => Promise<void>;
}

export const useRealAchievements = (): UseRealAchievementsReturn => {
  // Achievement states
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize achievements service
  const initializeAchievements = useCallback(async () => {
    if (isInitialized) return;
    
    try {
      console.log('🏆 Initializing Real Achievement Service...');
      await AchievementService.initializeAchievements();
      setIsInitialized(true);
      console.log('✅ Real Achievement Service initialized');
    } catch (error) {
      console.error('❌ Error initializing real achievements:', error);
      // Continue without achievements if there's an error
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Process achievement queue
  const processAchievementQueue = useCallback(() => {
    if (achievementQueue.length > 0 && !showAchievementNotification) {
      const nextAchievement = achievementQueue[0];
      setNewAchievement(nextAchievement);
      setShowAchievementNotification(true);
      setAchievementQueue(prev => prev.slice(1));
    }
  }, [achievementQueue, showAchievementNotification]);

  // Handle achievement notification hide
  const handleAchievementNotificationHide = useCallback(() => {
    setShowAchievementNotification(false);
    setNewAchievement(null);
    
    setTimeout(() => {
      processAchievementQueue();
    }, 1000);
  }, [processAchievementQueue]);

  // Record game completion and check for achievements
  const recordGameCompletion = useCallback(async (gameData: GameCompletionData) => {
    if (!isInitialized) {
      console.warn('Achievement service not initialized, skipping recording');
      return;
    }

    try {
      console.log('🎮 Recording game completion with Real Achievement Service...');
      console.log('📊 Game data:', gameData);

      // const newlyUnlocked = await RealAchievementService.recordGameCompletion(gameData);
      const newlyUnlocked: Achievement[] = []; // Temporalmente deshabilitado
      
      if (newlyUnlocked.length > 0) {
        console.log(`🏆 Unlocked ${newlyUnlocked.length} new achievements:`, newlyUnlocked.map(a => a.name));
        setAchievementQueue(prev => [...prev, ...newlyUnlocked]);
        
        if (!showAchievementNotification) {
          setTimeout(() => {
            processAchievementQueue();
          }, 2000);
        }
      } else {
        console.log('📈 No new achievements unlocked, but progress may have been updated');
      }
    } catch (error) {
      console.error('❌ Error recording game completion:', error);
      Alert.alert(
        'Conexión',
        'No se pudieron sincronizar los logros con el servidor. Tu progreso se ha guardado localmente.',
        [{ text: 'OK' }]
      );
    }
  }, [isInitialized, showAchievementNotification, processAchievementQueue]);

  // Initialize on mount
  useEffect(() => {
    initializeAchievements();
  }, [initializeAchievements]);

  // Process achievement queue when it changes
  useEffect(() => {
    processAchievementQueue();
  }, [processAchievementQueue]);

  return {
    // States
    newAchievement,
    showAchievementNotification,
    achievementQueue,
    isInitialized,
    
    // Functions
    recordGameCompletion,
    handleAchievementNotificationHide,
    initializeAchievements,
  };
};

export default useRealAchievements;