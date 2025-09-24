// src/services/AchievementConditionsService.ts
import achievementsData from '../data/achievements.json';
import { Achievement } from './ApiService';

// Interfaces para eventos de juego
export interface GameEvent {
  type: string;
  timestamp: Date;
  data: any;
}

export interface LessonCompletionEvent extends GameEvent {
  type: 'lesson_completed';
  data: {
    lessonId: number;
    stepId: number;
    stars: number;
    completionTime: number; // en segundos
    errors: number;
    usedHelp: boolean;
    perfectRun: boolean;
    category: string;
  };
}

export interface HelpUsedEvent extends GameEvent {
  type: 'help_used';
  data: {
    lessonId: number;
    stepId: number;
  };
}

export interface DailyPlayEvent extends GameEvent {
  type: 'daily_play';
  data: {
    date: string; // YYYY-MM-DD
    hour: number; // 0-23
    isWeekend: boolean;
  };
}

export interface StarEarnedEvent extends GameEvent {
  type: 'star_earned';
  data: {
    amount: number;
  };
}

// Interface para estadísticas del usuario
export interface UserGameStats {
  totalLessonsCompleted: number;
  totalStarsEarned: number;
  totalHelpUsed: number;
  consecutiveDaysPlayed: number;
  categoriesCompleted: string[];
  playDates: string[]; // Array de fechas YYYY-MM-DD
  perfectLessons: number;
  fastCompletions: number; // Completadas en menos de 2 minutos
  attemptsHistory: { [lessonId: string]: number }; // Intentos por lección
}

// Condiciones disponibles para logros
export type AchievementCondition = 
  | 'complete_first_lesson'
  | 'complete_5_lessons'
  | 'earn_10_stars'
  | 'perfect_lesson'
  | 'fast_completion'
  | 'play_3_consecutive_days'
  | 'earn_50_stars'
  | 'complete_all_categories'
  | 'use_help_5_times'
  | 'complete_after_3_attempts'
  | 'play_early_morning'
  | 'play_evening'
  | 'play_weekend'
  | 'earn_100_stars'
  | 'play_full_week';

class AchievementConditionsService {
  private achievements: Achievement[] = [];

  constructor() {
    this.loadAchievements();
  }

  /**
   * Cargar logros desde el archivo JSON
   */
  private loadAchievements() {
    this.achievements = achievementsData.map(item => ({
      ID: item.id,
      CreatedAt: '',
      UpdatedAt: '',
      DeletedAt: null,
      name: item.title, // Mapear title del JSON a name del servidor
      title: item.title, // Mantener title también como fallback
      description: item.description,
      icon: item.icon,
      category: item.category,
      rarity: item.rarity as 'common' | 'rare' | 'epic' | 'legendary',
      points: item.points,
      condition_type: 'custom',
      condition_value: item.max_progress,
      is_active: true,
      sort_order: item.id,
    }));
    
    console.log(`🏆 [AchievementConditions] Cargados ${this.achievements.length} logros desde JSON`);
  }

  /**
   * Obtener todos los logros disponibles
   */
  getAvailableAchievements(): Achievement[] {
    return this.achievements;
  }

  /**
   * Evaluar si se desbloqueó un logro basado en las estadísticas del usuario
   */
  evaluateAchievementUnlock(
    achievementId: number, 
    userStats: UserGameStats,
    currentProgress: number
  ): { unlocked: boolean; newProgress: number } {
    
    const achievement = achievementsData.find(a => a.id === achievementId);
    if (!achievement) {
      return { unlocked: false, newProgress: currentProgress };
    }

    const condition = achievement.condition as AchievementCondition;
    const maxProgress = achievement.max_progress;
    let newProgress = currentProgress;

    // Evaluar condición específica
    switch (condition) {
      case 'complete_first_lesson':
        newProgress = userStats.totalLessonsCompleted >= 1 ? 1 : 0;
        break;

      case 'complete_5_lessons':
        newProgress = Math.min(userStats.totalLessonsCompleted, maxProgress);
        break;

      case 'earn_10_stars':
        newProgress = Math.min(userStats.totalStarsEarned, maxProgress);
        break;

      case 'perfect_lesson':
        newProgress = userStats.perfectLessons >= 1 ? 1 : 0;
        break;

      case 'fast_completion':
        newProgress = userStats.fastCompletions >= 1 ? 1 : 0;
        break;

      case 'play_3_consecutive_days':
        newProgress = Math.min(userStats.consecutiveDaysPlayed, maxProgress);
        break;

      case 'earn_50_stars':
        newProgress = Math.min(userStats.totalStarsEarned, maxProgress);
        break;

      case 'complete_all_categories':
        // Asumiendo que hay 4 categorías principales
        const requiredCategories = ['completion', 'perfection', 'speed', 'special'];
        const completedCategories = userStats.categoriesCompleted.filter(cat => 
          requiredCategories.includes(cat)
        ).length;
        newProgress = completedCategories >= requiredCategories.length ? 1 : 0;
        break;

      case 'use_help_5_times':
        newProgress = Math.min(userStats.totalHelpUsed, maxProgress);
        break;

      case 'complete_after_3_attempts':
        // Verificar si alguna lección fue completada después de exactamente 3 intentos
        // Esto significa que falló 2 veces antes de completarse exitosamente
        const hasThreeAttemptCompletion = Object.entries(userStats.attemptsHistory)
          .some(([lessonKey, attempts]) => {
            // Solo considerar lecciones que fueron completadas exitosamente
            // y que tuvieron exactamente 3 intentos (2 fallos + 1 éxito)
            console.log(`🔍 [AchievementConditions] Logro Persistente - Lección ${lessonKey}: ${attempts} intentos`);
            return attempts === 3;
          });
        
        console.log(`🔍 [AchievementConditions] Logro Persistente evaluado:`, {
          hasThreeAttemptCompletion,
          attemptsHistory: userStats.attemptsHistory,
          newProgress: hasThreeAttemptCompletion ? 1 : 0
        });
        
        newProgress = hasThreeAttemptCompletion ? 1 : 0;
        break;

      case 'play_early_morning':
        // Esto se evaluará cuando se procese un DailyPlayEvent
        break;

      case 'play_evening':
        // Esto se evaluará cuando se procese un DailyPlayEvent
        break;

      case 'play_weekend':
        // Esto se evaluará cuando se procese un DailyPlayEvent
        break;

      case 'earn_100_stars':
        newProgress = Math.min(userStats.totalStarsEarned, maxProgress);
        break;

      case 'play_full_week':
        // Verificar si jugó todos los días de una semana
        newProgress = this.checkFullWeekPlay(userStats.playDates) ? 7 : 0;
        break;

      default:
        console.warn(`🚨 [AchievementConditions] Condición no implementada: ${condition}`);
        break;
    }

    const unlocked = newProgress >= maxProgress;
    
    if (newProgress !== currentProgress) {
      console.log(`📈 [AchievementConditions] Progreso actualizado para "${achievement.title}": ${currentProgress} → ${newProgress}${unlocked ? ' (DESBLOQUEADO!)' : ''}`);
    }

    return { unlocked, newProgress };
  }

  /**
   * Evaluar evento específico (para logros de tiempo/fecha)
   */
  evaluateEvent(event: GameEvent, achievementId: number, currentProgress: number): { unlocked: boolean; newProgress: number } {
    const achievement = achievementsData.find(a => a.id === achievementId);
    if (!achievement) {
      return { unlocked: false, newProgress: currentProgress };
    }

    const condition = achievement.condition as AchievementCondition;
    let newProgress = currentProgress;

    if (event.type === 'daily_play') {
      const dailyEvent = event as DailyPlayEvent;
      
      switch (condition) {
        case 'play_early_morning':
          if (dailyEvent.data.hour < 9) {
            newProgress = 1;
          }
          break;

        case 'play_evening':
          if (dailyEvent.data.hour >= 19) {
            newProgress = 1;
          }
          break;

        case 'play_weekend':
          if (dailyEvent.data.isWeekend) {
            newProgress = 1;
          }
          break;
      }
    }

    const unlocked = newProgress >= achievement.max_progress;
    return { unlocked, newProgress };
  }

  /**
   * Verificar si se jugó una semana completa
   */
  private checkFullWeekPlay(playDates: string[]): boolean {
    if (playDates.length < 7) return false;

    // Ordenar fechas
    const sortedDates = playDates.sort();
    
    // Buscar 7 días consecutivos
    for (let i = 0; i <= sortedDates.length - 7; i++) {
      const startDate = new Date(sortedDates[i]);
      let consecutive = true;
      
      for (let j = 1; j < 7; j++) {
        const expectedDate = new Date(startDate);
        expectedDate.setDate(startDate.getDate() + j);
        const expectedDateStr = expectedDate.toISOString().split('T')[0];
        
        if (!sortedDates.includes(expectedDateStr)) {
          consecutive = false;
          break;
        }
      }
      
      if (consecutive) return true;
    }
    
    return false;
  }

  /**
   * Obtener logro por ID
   */
  getAchievementById(id: number): Achievement | undefined {
    return this.achievements.find(a => a.ID === id);
  }

  /**
   * Obtener datos del logro desde JSON
   */
  getAchievementDataById(id: number) {
    return achievementsData.find(a => a.id === id);
  }

  /**
   * Obtener mensaje de felicitación con soporte bilingüe
   */
  getEncouragementMessage(achievementId: number, language: 'es' | 'en' = 'es'): string {
    const achievement = achievementsData.find(a => a.id === achievementId);
    if (!achievement) return '';

    const message = achievement.encouragement_message;
    
    // Si tiene formato bilingüe "español:english"
    if (message.includes(':')) {
      const [spanish, english] = message.split(':');
      return language === 'es' ? spanish : english;
    }
    
    return message;
  }

  /**
   * Obtener título con soporte bilingüe
   */
  getAchievementTitle(achievementId: number, language: 'es' | 'en' = 'es'): string {
    const achievement = achievementsData.find(a => a.id === achievementId);
    if (!achievement) return '';

    const title = achievement.title;
    
    // Si tiene formato bilingüe "español:english"
    if (title.includes(':')) {
      const [spanish, english] = title.split(':');
      return language === 'es' ? spanish : english;
    }
    
    return title;
  }

  /**
   * Obtener descripción con soporte bilingüe
   */
  getAchievementDescription(achievementId: number, language: 'es' | 'en' = 'es'): string {
    const achievement = achievementsData.find(a => a.id === achievementId);
    if (!achievement) return '';

    const description = achievement.description;
    
    // Si tiene formato bilingüe "español:english"
    if (description.includes(':')) {
      const [spanish, english] = description.split(':');
      return language === 'es' ? spanish : english;
    }
    
    return description;
  }
}

export default new AchievementConditionsService();
