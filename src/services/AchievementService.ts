import AsyncStorage from '@react-native-async-storage/async-storage';

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
  encouragementMessage: string; // Mensaje especial para niños
}

export interface UserStats {
  totalActivitiesCompleted: number;
  totalStarsEarned: number;
  daysPlaying: number;
  favoriteActivity: string;
  totalPlayTime: number;
  helpfulAttempts: number; // Intentos que muestran esfuerzo
  improvementMoments: number; // Cuando mejoran de un intento a otro
  explorationPoints: number; // Por probar diferentes actividades
}

const ACHIEVEMENTS_KEY = '@achievements_neurodivergent';
const USER_STATS_KEY = '@user_stats_neurodivergent';

class AchievementServiceClass {
  private achievements: Achievement[] = [
    // Primeros Pasos - Celebrar cada inicio
    {
      id: 'welcome',
      title: '¡Bienvenido!',
      description: 'Empezaste tu aventura de aprendizaje',
      icon: '🌟',
      category: 'primeros_pasos',
      rarity: 'celebracion',
      points: 10,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'first_activity',
      encouragementMessage: '¡Qué emocionante! Has comenzado tu viaje de aprendizaje. ¡Eres increíble!'
    },
    {
      id: 'explorer',
      title: 'Explorador Curioso',
      description: 'Probaste 3 actividades diferentes',
      icon: '🔍',
      category: 'primeros_pasos',
      rarity: 'genial',
      points: 20,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 3,
      condition: 'try_different_activities',
      encouragementMessage: '¡Me encanta tu curiosidad! Explorar cosas nuevas es súper genial.'
    },
    {
      id: 'brave_learner',
      title: 'Aprendiz Valiente',
      description: 'Intentaste una actividad 5 veces',
      icon: '💪',
      category: 'esfuerzo',
      rarity: 'genial',
      points: 25,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 5,
      condition: 'persistent_tries',
      encouragementMessage: '¡Qué valiente eres! Seguir intentando muestra lo fuerte que eres.'
    },

    // Progreso Personal - Celebrar el crecimiento
    {
      id: 'star_collector',
      title: 'Coleccionista de Estrellas',
      description: 'Ganaste tu primera estrella',
      icon: '⭐',
      category: 'progreso',
      rarity: 'celebracion',
      points: 15,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'first_star',
      encouragementMessage: '¡Tu primera estrella brilla muy fuerte! Estás aprendiendo genial.'
    },
    {
      id: 'shining_bright',
      title: 'Brillando Fuerte',
      description: 'Coleccionaste 10 estrellas',
      icon: '✨',
      category: 'progreso',
      rarity: 'increible',
      points: 50,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 10,
      condition: 'collect_stars_10',
      encouragementMessage: '¡Wow! Tus 10 estrellas iluminan todo. Eres una súper estrella.'
    },
    {
      id: 'learning_champion',
      title: 'Campeón del Aprendizaje',
      description: 'Completaste 5 actividades',
      icon: '🏆',
      category: 'progreso',
      rarity: 'increible',
      points: 40,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 5,
      condition: 'complete_activities_5',
      encouragementMessage: '¡Eres un verdadero campeón! Cada actividad te hace más inteligente.'
    },

    // Esfuerzo - Reconocer el proceso, no solo el resultado
    {
      id: 'thoughtful_thinker',
      title: 'Pensador Cuidadoso',
      description: 'Te tomaste tu tiempo para pensar',
      icon: '🤔',
      category: 'esfuerzo',
      rarity: 'genial',
      points: 20,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'thoughtful_completion',
      encouragementMessage: '¡Pensar bien es súper importante! Tomarse tiempo está perfecto.'
    },
    {
      id: 'helper_friend',
      title: 'Amigo Ayudador',
      description: 'Usaste las pistas para aprender',
      icon: '🤝',
      category: 'esfuerzo',
      rarity: 'genial',
      points: 15,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'used_help',
      encouragementMessage: '¡Pedir ayuda es de personas inteligentes! Bien hecho.'
    },
    {
      id: 'improvement_star',
      title: 'Estrella de Mejora',
      description: 'Mejoraste en una actividad',
      icon: '📈',
      category: 'esfuerzo',
      rarity: 'increible',
      points: 30,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'showed_improvement',
      encouragementMessage: '¡Mejorar es lo más genial del mundo! Cada día aprendes más.'
    },

    // Especiales - Momentos únicos y divertidos
    {
      id: 'morning_sunshine',
      title: 'Sol de la Mañana',
      description: 'Aprendiste algo nuevo por la mañana',
      icon: '🌅',
      category: 'especial',
      rarity: 'genial',
      points: 20,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'morning_activity',
      encouragementMessage: '¡Empezar el día aprendiendo es súper especial! Eres genial.'
    },
    {
      id: 'weekend_learner',
      title: 'Aprendiz de Fin de Semana',
      description: 'Aprendiste algo divertido en fin de semana',
      icon: '🎈',
      category: 'especial',
      rarity: 'genial',
      points: 25,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'weekend_learning',
      encouragementMessage: '¡Aprender en fin de semana es súper divertido! Eres increíble.'
    },
    {
      id: 'happy_learner',
      title: 'Aprendiz Feliz',
      description: 'Completaste una actividad con una sonrisa',
      icon: '😊',
      category: 'especial',
      rarity: 'super_especial',
      points: 35,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'happy_completion',
      encouragementMessage: '¡Tu sonrisa hace que todo sea más bonito! Sigue siendo feliz.'
    },
    {
      id: 'patient_learner',
      title: 'Aprendiz Paciente',
      description: 'Te tomaste el tiempo que necesitabas',
      icon: '🐌',
      category: 'esfuerzo',
      rarity: 'increible',
      points: 30,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'patient_learning',
      encouragementMessage: '¡Ir a tu propio ritmo es perfecto! Cada persona aprende diferente.'
    },
    {
      id: 'creative_thinker',
      title: 'Pensador Creativo',
      description: 'Encontraste tu propia manera de resolver',
      icon: '🎨',
      category: 'especial',
      rarity: 'super_especial',
      points: 40,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'creative_solution',
      encouragementMessage: '¡Tu manera de pensar es única y especial! Eres súper creativo.'
    },
    {
      id: 'daily_friend',
      title: 'Amigo de Cada Día',
      description: 'Aprendiste algo 3 días seguidos',
      icon: '📅',
      category: 'progreso',
      rarity: 'increible',
      points: 45,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 3,
      condition: 'daily_learning_3',
      encouragementMessage: '¡Aprender cada día te hace súper fuerte! Eres constante y genial.'
    },
    {
      id: 'storyteller',
      title: 'Narrador Principiante',
      description: 'Completaste tu primera historia ordenada',
      icon: '📖',
      category: 'primeros_pasos',
      rarity: 'celebracion',
      points: 25,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'first_story',
      encouragementMessage: '¡Eres un narrador increíble! Has ordenado tu primera historia perfectamente.'
    },
    {
      id: 'perfect_storyteller',
      title: 'Narrador Perfecto',
      description: 'Ordenaste una historia sin errores ni pistas',
      icon: '⭐',
      category: 'esfuerzo',
      rarity: 'increible',
      points: 40,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'perfect_story',
      encouragementMessage: '¡Increíble! Ordenaste la historia perfectamente sin ayuda. Eres súper inteligente.'
    },
    {
      id: 'persistent_storyteller',
      title: 'Narrador Persistente',
      description: 'Completaste una historia después de varios intentos',
      icon: '💪',
      category: 'esfuerzo',
      rarity: 'genial',
      points: 30,
      isUnlocked: false,
      currentProgress: 0,
      maxProgress: 1,
      condition: 'persistent_story',
      encouragementMessage: '¡Qué persistente eres! Seguir intentando hasta lograrlo es súper valioso.'
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
    activityType: string;
    showedImprovement?: boolean;
    usedHelp?: boolean;
    tookTime?: boolean;
  }): Promise<Achievement[]> {
    const newlyUnlocked: Achievement[] = [];
    
    try {
      const currentStats = await this.getUserStats();
      const now = new Date();
      
      // Update user stats with positive focus
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

      // Check for newly unlocked achievements
      const achievements = await this.getAllAchievements();
      const updatedAchievements = [...achievements];

      for (let i = 0; i < updatedAchievements.length; i++) {
        const achievement = updatedAchievements[i];
        if (!achievement.isUnlocked) {
          const shouldUnlock = await this.checkAchievementCondition(achievement, updatedStats, gameData, now);
          if (shouldUnlock) {
            achievement.isUnlocked = true;
            achievement.currentProgress = achievement.maxProgress;
            achievement.unlockedAt = now.toISOString();
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
        // This would need more sophisticated tracking of activity types
        return stats.explorationPoints >= 3;
      
      case 'persistent_tries':
        return stats.helpfulAttempts >= 5;
      
      case 'first_star':
        return stats.totalStarsEarned >= 1;
      
      case 'collect_stars_10':
        return stats.totalStarsEarned >= 10;
      
      case 'complete_activities_5':
        return stats.totalActivitiesCompleted >= 5;
      
      case 'thoughtful_completion':
        return gameData.tookTime === true;
      
      case 'used_help':
        return gameData.usedHelp === true;
      
      case 'showed_improvement':
        return gameData.showedImprovement === true;
      
      case 'morning_activity':
        return hour >= 6 && hour < 12;
      
      case 'weekend_learning':
        return isWeekend;
      
      case 'happy_completion':
        return gameData.stars > 0; // Any completion with stars shows happiness
      
      case 'patient_learning':
        return gameData.completionTime > 60000; // Took more than 1 minute (patient)
      
      case 'creative_solution':
        return gameData.errors > 0 && gameData.stars > 0; // Found solution despite initial mistakes
      
      case 'daily_learning_3':
        // This would need day tracking - simplified for now
        return stats.totalActivitiesCompleted >= 3;
      
      case 'first_story':
        return gameData.activityType === 'story_creation';
      
      case 'perfect_story':
        return gameData.activityType === 'story_creation' && gameData.isPerfect && !gameData.usedHelp;
      
      case 'persistent_story':
        return gameData.activityType === 'story_creation' && gameData.errors >= 2 && gameData.stars >= 1;
      
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
      
      case 'complete_activities_5':
        return Math.min(stats.totalActivitiesCompleted, 5);
      
      case 'daily_learning_3':
        return Math.min(stats.totalActivitiesCompleted, 3);
      
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

  // Método especial para obtener mensaje de aliento
  async getEncouragementMessage(achievementId: string): Promise<string> {
    try {
      const achievements = await this.getAllAchievements();
      const achievement = achievements.find(a => a.id === achievementId);
      return achievement?.encouragementMessage || '¡Eres increíble! Sigue aprendiendo.';
    } catch (error) {
      console.error('Error getting encouragement message:', error);
      return '¡Eres increíble! Sigue aprendiendo.';
    }
  }
}

export const AchievementService = new AchievementServiceClass();