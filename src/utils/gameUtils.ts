import { GAME_CONFIG } from '../constants';

export interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  matchesFound: number;
  flipCount: number;
  efficiency: number;
}

/**
 * Calculate stars based on game performance
 */
export const calculateStars = (
  errors: number,
  flipCount: number,
  completionTime: number,
  totalPairs: number,
): number => {
  const maxTime = totalPairs * GAME_CONFIG.MAX_TIME_PER_PAIR;
  const minFlips = totalPairs * GAME_CONFIG.MIN_FLIPS_MULTIPLIER;

  const timeBonus = completionTime < maxTime * 0.6 ? 1 : 0;
  const memoryBonus = flipCount <= minFlips * 1.4 ? 1 : 0;

  if (errors === 0 && flipCount <= minFlips * GAME_CONFIG.PERFECT_FLIPS_MULTIPLIER) {
    return 3; // Perfect performance
  } else if (errors <= 2 && flipCount <= minFlips * GAME_CONFIG.GOOD_FLIPS_MULTIPLIER) {
    return 2 + timeBonus;
  } else if (errors <= 4) {
    return 1 + memoryBonus;
  } else {
    return 1;
  }
};

/**
 * Generate performance message based on game results
 */
export const getPerformanceMessage = (
  stars: number,
  perfectRun: boolean,
  flipCount: number,
  totalPairs: number,
): string => {
  const minFlips = totalPairs * GAME_CONFIG.MIN_FLIPS_MULTIPLIER;

  if (perfectRun && stars === 3 && flipCount <= minFlips * GAME_CONFIG.PERFECT_FLIPS_MULTIPLIER) {
    return '¡Memoria perfecta! Increíble 🧠🏆';
  } else if (perfectRun && stars === 3) {
    return '¡Excelente memoria! Sin errores 🌟';
  } else if (stars === 3) {
    return '¡Muy bien hecho! 👏';
  } else if (stars === 2) {
    return '¡Buen trabajo! Sigue practicando 💪';
  } else {
    return '¡Completado! Tu memoria mejorará 📈';
  }
};

/**
 * Calculate game efficiency percentage
 */
export const calculateEfficiency = (totalPairs: number, flipCount: number): number => {
  const minFlips = totalPairs * GAME_CONFIG.MIN_FLIPS_MULTIPLIER;
  return Math.round((minFlips / flipCount) * 100);
};

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Create default game stats
 */
export const createDefaultGameStats = (): GameStats => ({
  totalAttempts: 0,
  errors: 0,
  stars: 0,
  completionTime: 0,
  perfectRun: true,
  matchesFound: 0,
  flipCount: 0,
  efficiency: 100,
});

/**
 * Format time in milliseconds to readable format
 */
export const formatTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${remainingSeconds}s`;
};

/**
 * Check if performance qualifies for bonus achievement
 */
export const checkBonusQualification = (
  stats: GameStats,
  totalPairs: number,
): { qualified: boolean; message?: string } => {
  const minFlips = totalPairs * GAME_CONFIG.MIN_FLIPS_MULTIPLIER;

  if (stats.perfectRun && stats.flipCount <= minFlips * 1.4) {
    return {
      qualified: true,
      message: '🧠 ¡Memoria excepcional!',
    };
  }

  if (stats.errors <= 1 && stats.stars >= 2) {
    return {
      qualified: true,
      message: '⭐ ¡Excelente precisión!',
    };
  }

  return { qualified: false };
};