import { useState, useCallback, useEffect } from 'react';
import { Alert, Vibration } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AchievementService, Achievement } from '../services/AchievementService';
import { createDefaultGameStats } from '../utils/gameUtils';

interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  firstTrySuccess: boolean;
  dragCount: number;
  efficiency: number;
  [key: string]: any; // Para propiedades específicas de cada juego
}

interface UseGameLogicProps {
  activityType: string;
  calculateStars: (stats: GameStats) => number;
  getPerformanceMessage: (stars: number, perfectRun: boolean, firstTry: boolean) => string;
}

export const useGameLogic = ({ 
  activityType, 
  calculateStars, 
  getPerformanceMessage 
}: UseGameLogicProps) => {
  const navigation = useNavigation();
  
  // Game state
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStats, setGameStats] = useState<GameStats>({
    ...createDefaultGameStats(),
    firstTrySuccess: false,
  });
  const [startTime] = useState<number>(Date.now());
  
  // Animation states
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'success' | 'error' | 'winner' | 'loser'>('success');
  
  // Achievement states
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);

  // Initialize achievements service
  useEffect(() => {
    const initAchievements = async () => {
      try {
        await AchievementService.initializeAchievements();
      } catch (error) {
        console.error('Error initializing achievements:', error);
      }
    };
    initAchievements();
  }, []);

  // Feedback animation
  const showFeedbackAnimation = useCallback((type: 'success' | 'error' | 'winner' | 'loser') => {
    setAnimationType(type);
    setShowAnimation(true);
    
    // Add haptic feedback
    if (type === 'success') {
      Vibration.vibrate(50);
    } else if (type === 'error') {
      Vibration.vibrate([0, 100, 50, 100]);
    } else if (type === 'winner') {
      Vibration.vibrate([0, 100, 50, 100, 50, 100]);
    }
  }, []);

  // Handle achievement notifications queue
  const processAchievementQueue = useCallback(() => {
    if (achievementQueue.length > 0 && !showAchievementNotification) {
      const nextAchievement = achievementQueue[0];
      setNewAchievement(nextAchievement);
      setShowAchievementNotification(true);
      setAchievementQueue(prev => prev.slice(1));
    }
  }, [achievementQueue, showAchievementNotification]);

  const handleAchievementNotificationHide = useCallback(() => {
    setShowAchievementNotification(false);
    setNewAchievement(null);
    
    setTimeout(() => {
      processAchievementQueue();
    }, 1000);
  }, [processAchievementQueue]);

  // Record game completion
  const recordGameCompletion = useCallback(async (finalStats: GameStats) => {
    try {
      const gameData = {
        stars: finalStats.stars,
        isPerfect: finalStats.perfectRun,
        completionTime: finalStats.completionTime,
        errors: finalStats.errors,
        activityType,
        showedImprovement: finalStats.errors > 0 && finalStats.stars > 1,
        usedHelp: false,
        tookTime: finalStats.completionTime > 60000,
      };

      const newlyUnlocked = await AchievementService.recordGameCompletion(gameData);
      
      if (newlyUnlocked.length > 0) {
        setAchievementQueue(prev => [...prev, ...newlyUnlocked]);
        
        if (!showAchievementNotification) {
          setTimeout(() => {
            processAchievementQueue();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error recording game completion:', error);
      Alert.alert(
        'Error',
        'No se pudieron guardar los logros. Tu progreso se ha guardado localmente.',
        [{ text: 'OK' }]
      );
    }
  }, [activityType, showAchievementNotification, processAchievementQueue]);

  // Complete game
  const completeGame = useCallback(async () => {
    const endTime = Date.now();
    const completionTime = endTime - startTime;
    
    const finalStats: GameStats = {
      ...gameStats,
      completionTime,
      stars: calculateStars({ ...gameStats, completionTime })
    };

    setGameStats(finalStats);
    
    // Record game completion for achievements
    await recordGameCompletion(finalStats);
    
    // Show winner animation first
    showFeedbackAnimation('winner');
  }, [gameStats, startTime, calculateStars, recordGameCompletion, showFeedbackAnimation]);

  // Handle animation finish
  const handleAnimationFinish = useCallback(() => {
    setShowAnimation(false);
    
    if (animationType === 'winner' && !showCompletionModal) {
      // Show completion modal after winner animation
      setTimeout(() => {
        setShowCompletionModal(true);
      }, 500);
    }
  }, [animationType, showCompletionModal]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameCompleted(false);
    setShowCompletionModal(false);
    setScore(0);
    setGameStats({
      ...createDefaultGameStats(),
      firstTrySuccess: false,
    });
  }, []);

  // Handle back press
  const handleBackPress = useCallback(() => {
    if (gameStats.totalAttempts > 0 && !gameCompleted) {
      Alert.alert(
        'Salir del juego',
        '¿Estás seguro de que quieres salir? Perderás tu progreso actual.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [gameStats.totalAttempts, gameCompleted, navigation]);

  // Process achievement queue when it changes
  useEffect(() => {
    processAchievementQueue();
  }, [processAchievementQueue]);

  return {
    // State
    gameCompleted,
    showCompletionModal,
    score,
    gameStats,
    showAnimation,
    animationType,
    newAchievement,
    showAchievementNotification,
    
    // Actions
    setGameCompleted,
    setScore,
    setGameStats,
    showFeedbackAnimation,
    completeGame,
    resetGame,
    handleBackPress,
    handleAnimationFinish,
    handleAchievementNotificationHide,
    
    // Computed
    performanceMessage: getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.firstTrySuccess),
  };
};