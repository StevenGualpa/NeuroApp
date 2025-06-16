// hooks/useGameification.ts
import { useState, useCallback, useRef } from 'react';
import { AchievementService } from '../services/AchievementService';

interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  // Campos específicos por juego
  [key: string]: any;
}

export const useGameification = (gameType: string, calculateStars: (stats: GameStats) => number) => {
  const [gameStats, setGameStats] = useState<GameStats>({
    totalAttempts: 0,
    errors: 0,
    stars: 0,
    completionTime: 0,
    perfectRun: true,
  });
  
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const startTime = useRef<number>(Date.now());

  const updateStats = useCallback((updates: Partial<GameStats>) => {
    setGameStats(prev => ({ ...prev, ...updates }));
  }, []);

  const completeGame = useCallback(async () => {
    const completionTime = Date.now() - startTime.current;
    const finalStats = {
      ...gameStats,
      completionTime,
      stars: calculateStars({ ...gameStats, completionTime }),
    };
    
    setGameStats(finalStats);
    setGameCompleted(true);
    
    // Record achievements
    const gameData = {
      stars: finalStats.stars,
      isPerfect: finalStats.perfectRun,
      completionTime: finalStats.completionTime,
      errors: finalStats.errors,
    };
    
    return await AchievementService.recordGameCompletion(gameData);
  }, [gameStats, calculateStars]);

  const resetGame = useCallback(() => {
    setGameStats({
      totalAttempts: 0,
      errors: 0,
      stars: 0,
      completionTime: 0,
      perfectRun: true,
    });
    setGameCompleted(false);
    setShowStars(false);
    startTime.current = Date.now();
  }, []);

  return {
    gameStats,
    gameCompleted,
    showStars,
    setShowStars,
    updateStats,
    completeGame,
    resetGame,
  };
};