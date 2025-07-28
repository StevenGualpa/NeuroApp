import AsyncStorage from '@react-native-async-storage/async-storage';
import BilingualTextProcessor from '../utils/BilingualTextProcessor';
import { Language } from '../i18n';

export type AchievementCategory = 'all' | 'primeros_pasos' | 'progreso' | 'esfuerzo' | 'especial';
export type AchievementRarity = 'celebracion' | 'genial' | 'increible' | 'super_especial';

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
  condition: string;
  encouragementMessage: string;
}

export interface UserStats {
  totalActivitiesCompleted: number;
  totalStarsEarned: number;
  daysPlaying: number;
  favoriteActivity: string;
  totalPlayTime: number;
  helpfulAttempts: number;
  improvementMoments: number;
  explorationPoints: number;
}

const ACHIEVEMENTS_KEY = '@achievements_neurodivergent';
const USER_STATS_KEY = '@user_stats_neurodivergent';

class AchievementServiceClass {
  // Datos con formato bilingüe (como vendrían del servidor)
  private achievements: Achievement[] = [
    // Primeros Pasos - Celebrar cada inicio
    {
      id: 'welcome',
      title: '¡Bienvenido!:Welcome!',
      description: 'Empezaste tu aventura de aprendizaje:You started your learning adventure',
      icon: '🌟',
      category: 'primeros_pasos',
      rarity: 'celebracion',
      points: 10,
      isUnlocked: true, // Para testing
      currentProgress: 1,
      maxProgress: 1,
      condition: 'first_activity',
      encouragementMessage: '¡Qué emocionante! Has comenzado tu viaje de aprendizaje.:How exciting! You have started your learning journey.'
    },
    {
      id: 'explorer',
      title: 'Explorador Curioso:Curious Explorer',
      description: 'Probaste 3 actividades diferentes:You tried 3 different activities',
      icon: '🔍',
      category: 'primeros_pasos',
      rarity: 'genial',
      points: 20,
      isUnlocked: false,
      currentProgress: 1,
      maxProgress: 3,
      condition: 'try_different_activities',
      encouragementMessage: '¡Me encanta tu curiosidad! Explorar cosas nuevas es súper genial.:I love your curiosity! Exploring new things is super cool.'
    },
    {
      id: 'brave_learner',
      title: 'Aprendiz Valiente:Brave Learner',
      description: 'Intentaste una actividad 5 veces:You tried an activity 5 times',
      icon: '💪',
      category: 'esfuerzo',
      rarity: 'genial',
      points: 25,
      isUnlocked: false,
      currentProgress: 2,
      maxProgress: 5,
      condition: 'persistent_tries',
      encouragementMessage: '¡Qué valiente eres! Seguir intentando muestra lo fuerte que eres.:How brave you are! Keeping trying shows how strong you are.'
    },
    {
      id: 'star_collector',
      title: 'Coleccionista de Estrellas:Star Collector',
      description: 'Ganaste tu primera estrella:You earned your first star',
      icon: '⭐',
      category: 'progreso',
      rarity: 'celebracion',
      points: 15,
      isUnlocked: true, // Para testing
      currentProgress: 1,
      maxProgress: 1,
      condition: 'first_star',
      encouragementMessage: '¡Tu primera estrella brilla muy fuerte! Estás aprendiendo genial.:Your first star shines so bright! You are learning great.'
    },
    {
      id: 'shining_bright',
      title: 'Brillando Fuerte:Shining Bright',
      description: 'Coleccionaste 10 estrellas:You collected 10 stars',
      icon: '✨',
      category: 'progreso',
      rarity: 'increible',
      points: 50,
      isUnlocked: false,
      currentProgress: 3,
      maxProgress: 10,
      condition: 'collect_stars_10',
      encouragementMessage: '¡Wow! Tus 10 estrellas iluminan todo. Eres una súper estrella.:Wow! Your 10 stars light up everything. You are a super star.'
    },
    {
      id: 'weekend_learner',
      title: 'Fin de Semana Activo:Active Weekend',
      description: 'Juega en fin de semana:Play on weekends',
      icon: '🎮',
      category: 'especial',
      rarity: 'genial',
      points: 25,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'weekend_learning',
      encouragementMessage: '¡Aprender en fin de semana es súper divertido!:Learning on weekends is super fun!'
    },
    {
      id: 'simple_achievement',
      title: 'Logro Simple',
      description: 'Este logro no tiene formato bilingüe',
      icon: '🎯',
      category: 'especial',
      rarity: 'celebracion',
      points: 10,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'simple_condition',
      encouragementMessage: '¡Bien hecho! Sigue así.'
    }
  ];

  private defaultUserStats: UserStats = {
    totalActivitiesCompleted: 0,
    totalStarsEarned: 0,
    daysPlaying: 0,
    favoriteActivity: '',
    totalPlayTime: 0,
    helpfulAttempts: 0,
    improvementMoments: 0,
    explorationPoints: 0,
  };

  async initializeAchievements(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      if (!stored) {
        await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(this.achievements));
      } else {
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
        merged[index] = { ...merged[index], ...storedAchievement };
      }
    });

    return merged;
  }

  /**
   * Obtiene todos los logros procesados para el idioma especificado
   */
  async getAllAchievements(language: Language = 'es'): Promise<Achievement[]> {
    try {
      const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      let achievements: Achievement[];
      
      if (stored) {
        achievements = JSON.parse(stored);
      } else {
        achievements = this.achievements;
      }

      // Procesar textos bilingües según el idioma
      return achievements.map(achievement => ({
        ...achievement,
        title: BilingualTextProcessor.extractText(achievement.title, language),
        description: BilingualTextProcessor.extractText(achievement.description, language),
        encouragementMessage: BilingualTextProcessor.extractText(achievement.encouragementMessage, language),
      }));
    } catch (error) {
      console.error('Error getting achievements:', error);
      return this.achievements.map(achievement => ({
        ...achievement,
        title: BilingualTextProcessor.extractText(achievement.title, language),
        description: BilingualTextProcessor.extractText(achievement.description, language),
        encouragementMessage: BilingualTextProcessor.extractText(achievement.encouragementMessage, language),
      }));
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
    activityType: string;
    showedImprovement?: boolean;
    usedHelp?: boolean;
    tookTime?: boolean;
  }, language: Language = 'es'): Promise<Achievement[]> {
    const newlyUnlocked: Achievement[] = [];
    
    try {
      const currentStats = await this.getUserStats();
      const now = new Date();
      
      // Update user stats
      const updatedStats: UserStats = {
        ...currentStats,
        totalActivitiesCompleted: currentStats.totalActivitiesCompleted + 1,
        totalStarsEarned: currentStats.totalStarsEarned + gameData.stars,
        totalPlayTime: currentStats.totalPlayTime + gameData.completionTime,
        helpfulAttempts: gameData.usedHelp ? currentStats.helpfulAttempts + 1 : currentStats.helpfulAttempts,
        improvementMoments: gameData.showedImprovement ? currentStats.improvementMoments + 1 : currentStats.improvementMoments,
        explorationPoints: currentStats.explorationPoints + 1,
      };

      await this.updateUserStats(updatedStats);

      // Check for newly unlocked achievements (usando datos originales)
      const storedAchievements = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      const achievements: Achievement[] = storedAchievements ? JSON.parse(storedAchievements) : this.achievements;
      const updatedAchievements = [...achievements];

      for (let i = 0; i < updatedAchievements.length; i++) {
        const achievement = updatedAchievements[i];
        if (!achievement.isUnlocked) {
          const shouldUnlock = await this.checkAchievementCondition(achievement, updatedStats, gameData, now);
          if (shouldUnlock) {
            achievement.isUnlocked = true;
            achievement.currentProgress = achievement.maxProgress;
            achievement.unlockedAt = now.toISOString();
            
            // Procesar el logro para el idioma antes de agregarlo a newlyUnlocked
            const processedAchievement = {
              ...achievement,
              title: BilingualTextProcessor.extractText(achievement.title, language),
              description: BilingualTextProcessor.extractText(achievement.description, language),
              encouragementMessage: BilingualTextProcessor.extractText(achievement.encouragementMessage, language),
            };
            newlyUnlocked.push(processedAchievement);
          } else {
            // Update progress
            achievement.currentProgress = await this.calculateProgress(achievement, updatedStats);
          }
        }
      }

      // Save updated achievements (datos originales con formato bilingüe)
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
    gameData: { 
      stars: number; 
      isPerfect: boolean; 
      completionTime: number; 
      errors: number;
      activityType: string;
      showedImprovement?: boolean;
      usedHelp?: boolean;
      tookTime?: boolean;
    },
    now: Date
  ): Promise<boolean> {
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    switch (achievement.condition) {
      case 'first_activity':
        return stats.totalActivitiesCompleted >= 1;
      case 'try_different_activities':
        return stats.explorationPoints >= 3;
      case 'persistent_tries':
        return stats.helpfulAttempts >= 5;
      case 'first_star':
        return stats.totalStarsEarned >= 1;
      case 'collect_stars_10':
        return stats.totalStarsEarned >= 10;
      case 'weekend_learning':
        return isWeekend;
      default:
        return false;
    }
  }

  private async calculateProgress(achievement: Achievement, stats: UserStats): Promise<number> {
    switch (achievement.condition) {
      case 'try_different_activities':
        return Math.min(stats.explorationPoints, 3);
      case 'persistent_tries':
        return Math.min(stats.helpfulAttempts, 5);
      case 'collect_stars_10':
        return Math.min(stats.totalStarsEarned, 10);
      default:
        return achievement.currentProgress;
    }
  }

  async getTotalPoints(language: Language = 'es'): Promise<number> {
    try {
      // Para puntos, no necesitamos procesar el idioma, solo contar
      const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      const achievements: Achievement[] = stored ? JSON.parse(stored) : this.achievements;
      
      return achievements
        .filter(a => a.isUnlocked)
        .reduce((total, a) => total + a.points, 0);
    } catch (error) {
      console.error('Error calculating total points:', error);
      return 0;
    }
  }

  async getEncouragementMessage(achievementId: string, language: Language = 'es'): Promise<string> {
    try {
      const achievements = await this.getAllAchievements(language);
      const achievement = achievements.find(a => a.id === achievementId);
      
      const defaultMessage = language === 'es' 
        ? '¡Eres increíble! Sigue aprendiendo.'
        : 'You are amazing! Keep learning.';
        
      return achievement?.encouragementMessage || defaultMessage;
    } catch (error) {
      console.error('Error getting encouragement message:', error);
      const defaultMessage = language === 'es' 
        ? '¡Eres increíble! Sigue aprendiendo.'
        : 'You are amazing! Keep learning.';
      return defaultMessage;
    }
  }
}

export const AchievementService = new AchievementServiceClass();