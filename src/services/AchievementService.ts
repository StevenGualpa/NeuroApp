import AsyncStorage from '@react-native-async-storage/async-storage';

export type AchievementCategory = 'all' | 'gameplay' | 'performance' | 'streak' | 'special';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;
  isUnlocked: boolean;
  currentProgress: number;
  maxProgress: number;
  unlockedAt?: string;
  condition: string; // Para identificar cuándo desbloquear
}

export interface UserStats {
  totalGamesPlayed: number;
  perfectGames: number;
  totalStars: number;
  consecutivePerfectGames: number;
  totalPlayTime: number;
  activitiesCompleted: number;
  errorsCount: number;
  fastCompletions: number; // Completados en menos de X tiempo
  threeStarGames: number;
}

const ACHIEVEMENTS_KEY = '@achievements';
const USER_STATS_KEY = '@user_stats';

class AchievementServiceClass {
  private achievements: Achievement[] = [
    // Gameplay Achievements
    {
      id: 'first_game',
      title: '¡Primer Paso!',
      description: 'Completa tu primera actividad',
      icon: '🎯',
      category: 'gameplay',
      rarity: 'common',
      points: 10,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'complete_activity'
    },
    {
      id: 'games_5',
      title: 'Jugador Activo',
      description: 'Completa 5 actividades',
      icon: '🎮',
      category: 'gameplay',
      rarity: 'common',
      points: 25,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 5,
      condition: 'complete_activities_5'
    },
    {
      id: 'games_25',
      title: 'Veterano',
      description: 'Completa 25 actividades',
      icon: '🏅',
      category: 'gameplay',
      rarity: 'rare',
      points: 100,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 25,
      condition: 'complete_activities_25'
    },
    {
      id: 'games_100',
      title: 'Maestro del Juego',
      description: 'Completa 100 actividades',
      icon: '👑',
      category: 'gameplay',
      rarity: 'legendary',
      points: 500,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 100,
      condition: 'complete_activities_100'
    },

    // Performance Achievements
    {
      id: 'first_perfect',
      title: '¡Perfección!',
      description: 'Completa una actividad sin errores',
      icon: '⭐',
      category: 'performance',
      rarity: 'common',
      points: 20,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'perfect_game'
    },
    {
      id: 'perfect_5',
      title: 'Precisión Experta',
      description: 'Completa 5 actividades perfectas',
      icon: '🌟',
      category: 'performance',
      rarity: 'rare',
      points: 75,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 5,
      condition: 'perfect_games_5'
    },
    {
      id: 'three_stars_10',
      title: 'Coleccionista de Estrellas',
      description: 'Obtén 3 estrellas en 10 actividades',
      icon: '✨',
      category: 'performance',
      rarity: 'epic',
      points: 150,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 10,
      condition: 'three_stars_10'
    },
    {
      id: 'speed_demon',
      title: 'Rayo Veloz',
      description: 'Completa una actividad en menos de 30 segundos',
      icon: '⚡',
      category: 'performance',
      rarity: 'rare',
      points: 50,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'fast_completion'
    },

    // Streak Achievements
    {
      id: 'streak_3',
      title: 'En Racha',
      description: 'Completa 3 actividades perfectas seguidas',
      icon: '🔥',
      category: 'streak',
      rarity: 'rare',
      points: 60,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 3,
      condition: 'perfect_streak_3'
    },
    {
      id: 'streak_7',
      title: 'Imparable',
      description: 'Completa 7 actividades perfectas seguidas',
      icon: '🚀',
      category: 'streak',
      rarity: 'epic',
      points: 200,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 7,
      condition: 'perfect_streak_7'
    },

    // Special Achievements
    {
      id: 'early_bird',
      title: 'Madrugador',
      description: 'Completa una actividad antes de las 8 AM',
      icon: '🌅',
      category: 'special',
      rarity: 'rare',
      points: 40,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'early_morning'
    },
    {
      id: 'night_owl',
      title: 'Búho Nocturno',
      description: 'Completa una actividad después de las 10 PM',
      icon: '🦉',
      category: 'special',
      rarity: 'rare',
      points: 40,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'late_night'
    },
    {
      id: 'weekend_warrior',
      title: 'Guerrero de Fin de Semana',
      description: 'Completa 10 actividades en fin de semana',
      icon: '🏖️',
      category: 'special',
      rarity: 'epic',
      points: 120,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 10,
      condition: 'weekend_activities'
    }
  ];

  private defaultUserStats: UserStats = {
    totalGamesPlayed: 0,
    perfectGames: 0,
    totalStars: 0,
    consecutivePerfectGames: 0,
    totalPlayTime: 0,
    activitiesCompleted: 0,
    errorsCount: 0,
    fastCompletions: 0,
    threeStarGames: 0,
  };

  async initializeAchievements(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      if (!stored) {
        await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(this.achievements));
      } else {
        // Merge with new achievements if any
        const storedAchievements: Achievement[] = JSON.parse(stored);
        const mergedAchievements = this.mergeAchievements(storedAchievements);
        this.achievements = mergedAchievements;
        await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(this.achievements));
      }
    } catch (error) {
      console.error('Error initializing achievements:', error);
    }
  }

  private mergeAchievements(stored: Achievement[]): Achievement[] {
    const merged = [...this.achievements];
    
    stored.forEach(storedAchievement => {
      const index = merged.findIndex(a => a.id === storedAchievement.id);
      if (index !== -1) {
        // Update existing achievement with stored progress
        merged[index] = { ...merged[index], ...storedAchievement };
      }
    });

    return merged;
  }

  async getAllAchievements(): Promise<Achievement[]> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return this.achievements;
    } catch (error) {
      console.error('Error getting achievements:', error);
      return this.achievements;
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      const stored = await AsyncStorage.getItem(USER_STATS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return this.defaultUserStats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return this.defaultUserStats;
    }
  }

  async updateUserStats(newStats: Partial<UserStats>): Promise<void> {
    try {
      const currentStats = await this.getUserStats();
      const updatedStats = { ...currentStats, ...newStats };
      await AsyncStorage.setItem(USER_STATS_KEY, JSON.stringify(updatedStats));
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  async recordGameCompletion(gameData: {
    stars: number;
    isPerfect: boolean;
    completionTime: number;
    errors: number;
  }): Promise<Achievement[]> {
    const newlyUnlocked: Achievement[] = [];
    
    try {
      // Update user stats
      const currentStats = await this.getUserStats();
      const updatedStats: UserStats = {
        ...currentStats,
        totalGamesPlayed: currentStats.totalGamesPlayed + 1,
        activitiesCompleted: currentStats.activitiesCompleted + 1,
        totalStars: currentStats.totalStars + gameData.stars,
        errorsCount: currentStats.errorsCount + gameData.errors,
        perfectGames: gameData.isPerfect ? currentStats.perfectGames + 1 : currentStats.perfectGames,
        consecutivePerfectGames: gameData.isPerfect ? currentStats.consecutivePerfectGames + 1 : 0,
        fastCompletions: gameData.completionTime < 30000 ? currentStats.fastCompletions + 1 : currentStats.fastCompletions,
        totalPlayTime: currentStats.totalPlayTime + gameData.completionTime,
        threeStarGames: gameData.stars === 3 ? currentStats.threeStarGames + 1 : currentStats.threeStarGames,
      };

      await this.updateUserStats(updatedStats);

      // Check for newly unlocked achievements
      const achievements = await this.getAllAchievements();
      const updatedAchievements = [...achievements];

      for (let i = 0; i < updatedAchievements.length; i++) {
        const achievement = updatedAchievements[i];
        if (!achievement.isUnlocked) {
          const shouldUnlock = await this.checkAchievementCondition(achievement, updatedStats, gameData);
          if (shouldUnlock) {
            achievement.isUnlocked = true;
            achievement.currentProgress = achievement.maxProgress;
            achievement.unlockedAt = new Date().toISOString();
            newlyUnlocked.push(achievement);
          } else {
            // Update progress
            achievement.currentProgress = await this.calculateProgress(achievement, updatedStats);
          }
        }
      }

      // Save updated achievements
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updatedAchievements));
      this.achievements = updatedAchievements;

    } catch (error) {
      console.error('Error recording game completion:', error);
    }

    return newlyUnlocked;
  }

  private async checkAchievementCondition(
    achievement: Achievement, 
    stats: UserStats, 
    gameData: { stars: number; isPerfect: boolean; completionTime: number; errors: number }
  ): Promise<boolean> {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    switch (achievement.condition) {
      case 'complete_activity':
        return stats.activitiesCompleted >= 1;
      
      case 'complete_activities_5':
        return stats.activitiesCompleted >= 5;
      
      case 'complete_activities_25':
        return stats.activitiesCompleted >= 25;
      
      case 'complete_activities_100':
        return stats.activitiesCompleted >= 100;
      
      case 'perfect_game':
        return gameData.isPerfect;
      
      case 'perfect_games_5':
        return stats.perfectGames >= 5;
      
      case 'three_stars_10':
        return stats.threeStarGames >= 10;
      
      case 'fast_completion':
        return gameData.completionTime < 30000; // 30 seconds
      
      case 'perfect_streak_3':
        return stats.consecutivePerfectGames >= 3;
      
      case 'perfect_streak_7':
        return stats.consecutivePerfectGames >= 7;
      
      case 'early_morning':
        return hour < 8;
      
      case 'late_night':
        return hour >= 22;
      
      case 'weekend_activities':
        // This would need more sophisticated tracking
        return false; // Placeholder for now
      
      default:
        return false;
    }
  }

  private async calculateProgress(achievement: Achievement, stats: UserStats): Promise<number> {
    switch (achievement.condition) {
      case 'complete_activities_5':
        return Math.min(stats.activitiesCompleted, 5);
      
      case 'complete_activities_25':
        return Math.min(stats.activitiesCompleted, 25);
      
      case 'complete_activities_100':
        return Math.min(stats.activitiesCompleted, 100);
      
      case 'perfect_games_5':
        return Math.min(stats.perfectGames, 5);
      
      case 'three_stars_10':
        return Math.min(stats.threeStarGames, 10);
      
      case 'perfect_streak_3':
        return Math.min(stats.consecutivePerfectGames, 3);
      
      case 'perfect_streak_7':
        return Math.min(stats.consecutivePerfectGames, 7);
      
      default:
        return achievement.currentProgress;
    }
  }

  async getTotalPoints(): Promise<number> {
    try {
      const achievements = await this.getAllAchievements();
      return achievements
        .filter(a => a.isUnlocked)
        .reduce((total, a) => total + a.points, 0);
    } catch (error) {
      console.error('Error calculating total points:', error);
      return 0;
    }
  }
}

export const AchievementService = new AchievementServiceClass();