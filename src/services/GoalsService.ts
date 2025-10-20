// src/services/GoalsService.ts
// Servicio para manejar metas y objetivos personalizados

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NeurodivergentProfile } from './AnalysisService';
import PersonalizationService, { PersonalizedRecommendations } from './PersonalizationService';

export interface DailyGoal {
  id: string;
  date: string; // YYYY-MM-DD
  userId: number;
  targetSessions: number;
  targetTime: number; // en minutos
  targetStars: number;
  completedSessions: number;
  completedTime: number; // en minutos
  earnedStars: number;
  isCompleted: boolean;
  completionPercentage: number;
  activities: ActivityGoal[];
}

export interface ActivityGoal {
  activityType: string;
  targetSessions: number;
  completedSessions: number;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface WeeklyGoal {
  id: string;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  userId: number;
  targetSessions: number;
  targetTime: number; // en minutos
  targetStars: number;
  completedSessions: number;
  completedTime: number; // en minutos
  earnedStars: number;
  isCompleted: boolean;
  completionPercentage: number;
  dailyGoals: DailyGoal[];
}

export interface GoalProgress {
  today: DailyGoal | null;
  thisWeek: WeeklyGoal | null;
  streak: number; // días consecutivos completando metas
  totalCompleted: number; // total de días completados
  averageCompletion: number; // porcentaje promedio de completado
  achievements: GoalAchievement[];
}

export interface GoalAchievement {
  id: string;
  type: 'daily' | 'weekly' | 'streak' | 'milestone';
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  isNew: boolean;
}

class GoalsService {
  private goalsKey = 'user_goals';
  private progressKey = 'goal_progress';

  /**
   * Inicializa las metas para un usuario basado en su perfil
   */
  async initializeGoals(userId: number, profile: NeurodivergentProfile | null): Promise<DailyGoal> {
    const recommendations = PersonalizationService.getPersonalizedRecommendations(profile);
    const today = new Date().toISOString().split('T')[0];

    const dailyGoal: DailyGoal = {
      id: `daily_${userId}_${today}`,
      date: today,
      userId,
      targetSessions: recommendations.dailyGoals.totalSessions,
      targetTime: recommendations.dailyGoals.totalTime,
      targetStars: recommendations.dailyGoals.targetStars,
      completedSessions: 0,
      completedTime: 0,
      earnedStars: 0,
      isCompleted: false,
      completionPercentage: 0,
      activities: recommendations.activityPriorities.map(activity => ({
        activityType: activity.activityType,
        targetSessions: activity.dailyGoal,
        completedSessions: 0,
        isCompleted: false,
        priority: activity.priority,
      })),
    };

    // Guardar en localStorage
    await this.saveDailyGoal(dailyGoal);
    
    console.log('✅ [GoalsService] Daily goal initialized:', dailyGoal);
    return dailyGoal;
  }

  /**
   * Obtiene la meta diaria actual
   */
  async getTodayGoal(userId: number): Promise<DailyGoal | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const goalId = `daily_${userId}_${today}`;
      
      const stored = await this.getStoredGoals();
      return stored[goalId] || null;
    } catch (error) {
      console.error('❌ [GoalsService] Error getting today goal:', error);
      return null;
    }
  }

  /**
   * Actualiza el progreso de una actividad
   */
  async updateActivityProgress(
    userId: number, 
    activityType: string, 
    sessionData: {
      duration: number; // en segundos
      stars: number;
      completed: boolean;
    }
  ): Promise<DailyGoal | null> {
    try {
      const todayGoal = await this.getTodayGoal(userId);
      if (!todayGoal) {
        console.log('⚠️ [GoalsService] No today goal found, initializing...');
        return null;
      }

      // Actualizar progreso general
      if (sessionData.completed) {
        todayGoal.completedSessions += 1;
        todayGoal.completedTime += Math.round(sessionData.duration / 60); // convertir a minutos
        todayGoal.earnedStars += sessionData.stars;
      }

      // Actualizar progreso de actividad específica
      const activityGoal = todayGoal.activities.find(a => 
        a.activityType.toLowerCase().includes(activityType.toLowerCase()) ||
        activityType.toLowerCase().includes(a.activityType.toLowerCase())
      );

      if (activityGoal && sessionData.completed) {
        activityGoal.completedSessions += 1;
        activityGoal.isCompleted = activityGoal.completedSessions >= activityGoal.targetSessions;
      }

      // Recalcular porcentajes
      todayGoal.completionPercentage = this.calculateCompletionPercentage(todayGoal);
      todayGoal.isCompleted = todayGoal.completionPercentage >= 100;

      // Guardar cambios
      await this.saveDailyGoal(todayGoal);

      // Verificar logros
      await this.checkAchievements(userId, todayGoal);

      console.log('✅ [GoalsService] Activity progress updated:', {
        activityType,
        sessionData,
        newProgress: todayGoal.completionPercentage
      });

      return todayGoal;
    } catch (error) {
      console.error('❌ [GoalsService] Error updating activity progress:', error);
      return null;
    }
  }

  /**
   * Obtiene el progreso completo de metas
   */
  async getGoalProgress(userId: number): Promise<GoalProgress> {
    try {
      const todayGoal = await this.getTodayGoal(userId);
      const thisWeekGoal = await this.getThisWeekGoal(userId);
      const streak = await this.getStreak(userId);
      const achievements = await this.getAchievements(userId);

      return {
        today: todayGoal,
        thisWeek: thisWeekGoal,
        streak,
        totalCompleted: await this.getTotalCompleted(userId),
        averageCompletion: await this.getAverageCompletion(userId),
        achievements,
      };
    } catch (error) {
      console.error('❌ [GoalsService] Error getting goal progress:', error);
      return {
        today: null,
        thisWeek: null,
        streak: 0,
        totalCompleted: 0,
        averageCompletion: 0,
        achievements: [],
      };
    }
  }

  /**
   * Obtiene la meta semanal actual
   */
  private async getThisWeekGoal(userId: number): Promise<WeeklyGoal | null> {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Domingo
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sábado

      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];

      // Obtener todas las metas diarias de la semana
      const dailyGoals: DailyGoal[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dailyGoal = await this.getDailyGoal(userId, dateStr);
        if (dailyGoal) {
          dailyGoals.push(dailyGoal);
        }
      }

      // Calcular totales
      const totalTargetSessions = dailyGoals.reduce((sum, goal) => sum + goal.targetSessions, 0);
      const totalTargetTime = dailyGoals.reduce((sum, goal) => sum + goal.targetTime, 0);
      const totalTargetStars = dailyGoals.reduce((sum, goal) => sum + goal.targetStars, 0);
      const totalCompletedSessions = dailyGoals.reduce((sum, goal) => sum + goal.completedSessions, 0);
      const totalCompletedTime = dailyGoals.reduce((sum, goal) => sum + goal.completedTime, 0);
      const totalEarnedStars = dailyGoals.reduce((sum, goal) => sum + goal.earnedStars, 0);

      const weeklyGoal: WeeklyGoal = {
        id: `weekly_${userId}_${weekStartStr}`,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        userId,
        targetSessions: totalTargetSessions,
        targetTime: totalTargetTime,
        targetStars: totalTargetStars,
        completedSessions: totalCompletedSessions,
        completedTime: totalCompletedTime,
        earnedStars: totalEarnedStars,
        isCompleted: totalCompletedSessions >= totalTargetSessions,
        completionPercentage: totalTargetSessions > 0 ? (totalCompletedSessions / totalTargetSessions) * 100 : 0,
        dailyGoals,
      };

      return weeklyGoal;
    } catch (error) {
      console.error('❌ [GoalsService] Error getting weekly goal:', error);
      return null;
    }
  }

  /**
   * Obtiene una meta diaria específica
   */
  private async getDailyGoal(userId: number, date: string): Promise<DailyGoal | null> {
    try {
      const goalId = `daily_${userId}_${date}`;
      const stored = await this.getStoredGoals();
      return stored[goalId] || null;
    } catch (error) {
      console.error('❌ [GoalsService] Error getting daily goal:', error);
      return null;
    }
  }

  /**
   * Calcula el porcentaje de completado
   */
  private calculateCompletionPercentage(goal: DailyGoal): number {
    const sessionProgress = goal.targetSessions > 0 ? (goal.completedSessions / goal.targetSessions) * 100 : 0;
    const timeProgress = goal.targetTime > 0 ? (goal.completedTime / goal.targetTime) * 100 : 0;
    const starProgress = goal.targetStars > 0 ? (goal.earnedStars / goal.targetStars) * 100 : 0;

    // Promedio ponderado (sesiones 50%, tiempo 30%, estrellas 20%)
    return Math.round((sessionProgress * 0.5) + (timeProgress * 0.3) + (starProgress * 0.2));
  }

  /**
   * Obtiene la racha de días consecutivos
   */
  private async getStreak(userId: number): Promise<number> {
    try {
      const stored = await this.getStoredGoals();
      const userGoals = Object.values(stored).filter(goal => 
        goal.userId === userId && goal.isCompleted
      ) as DailyGoal[];

      if (userGoals.length === 0) return 0;

      // Ordenar por fecha descendente
      userGoals.sort((a, b) => b.date.localeCompare(a.date));

      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < userGoals.length; i++) {
        const goalDate = new Date(userGoals[i].date);
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);

        if (goalDate.toDateString() === expectedDate.toDateString()) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('❌ [GoalsService] Error getting streak:', error);
      return 0;
    }
  }

  /**
   * Obtiene el total de días completados
   */
  private async getTotalCompleted(userId: number): Promise<number> {
    try {
      const stored = await this.getStoredGoals();
      return Object.values(stored).filter(goal => 
        goal.userId === userId && goal.isCompleted
      ).length;
    } catch (error) {
      console.error('❌ [GoalsService] Error getting total completed:', error);
      return 0;
    }
  }

  /**
   * Obtiene el porcentaje promedio de completado
   */
  private async getAverageCompletion(userId: number): Promise<number> {
    try {
      const stored = await this.getStoredGoals();
      const userGoals = Object.values(stored).filter(goal => goal.userId === userId) as DailyGoal[];
      
      if (userGoals.length === 0) return 0;

      const totalCompletion = userGoals.reduce((sum, goal) => sum + goal.completionPercentage, 0);
      return Math.round(totalCompletion / userGoals.length);
    } catch (error) {
      console.error('❌ [GoalsService] Error getting average completion:', error);
      return 0;
    }
  }

  /**
   * Verifica y otorga logros
   */
  private async checkAchievements(userId: number, goal: DailyGoal): Promise<void> {
    try {
      const achievements: GoalAchievement[] = [];

      // Logro: Primera meta completada
      if (goal.isCompleted && goal.completionPercentage >= 100) {
        const existingAchievements = await this.getAchievements(userId);
        const hasFirstGoal = existingAchievements.some(a => a.type === 'daily' && a.title.includes('Primera'));
        
        if (!hasFirstGoal) {
          achievements.push({
            id: `first_daily_${userId}_${Date.now()}`,
            type: 'daily',
            title: '🎯 Primera Meta Completada',
            description: '¡Completaste tu primera meta diaria!',
            icon: '🎯',
            earnedAt: new Date().toISOString(),
            isNew: true,
          });
        }
      }

      // Logro: Racha de 3 días
      const streak = await this.getStreak(userId);
      if (streak >= 3) {
        const existingAchievements = await this.getAchievements(userId);
        const hasStreak3 = existingAchievements.some(a => a.type === 'streak' && a.title.includes('3 días'));
        
        if (!hasStreak3) {
          achievements.push({
            id: `streak_3_${userId}_${Date.now()}`,
            type: 'streak',
            title: '🔥 Racha de 3 Días',
            description: '¡Has completado metas por 3 días seguidos!',
            icon: '🔥',
            earnedAt: new Date().toISOString(),
            isNew: true,
          });
        }
      }

      // Logro: Racha de 7 días
      if (streak >= 7) {
        const existingAchievements = await this.getAchievements(userId);
        const hasStreak7 = existingAchievements.some(a => a.type === 'streak' && a.title.includes('7 días'));
        
        if (!hasStreak7) {
          achievements.push({
            id: `streak_7_${userId}_${Date.now()}`,
            type: 'streak',
            title: '⭐ Racha de 7 Días',
            description: '¡Has completado metas por una semana completa!',
            icon: '⭐',
            earnedAt: new Date().toISOString(),
            isNew: true,
          });
        }
      }

      // Guardar nuevos logros
      if (achievements.length > 0) {
        await this.saveAchievements(userId, achievements);
        console.log('🏆 [GoalsService] New achievements earned:', achievements);
      }
    } catch (error) {
      console.error('❌ [GoalsService] Error checking achievements:', error);
    }
  }

  /**
   * Obtiene los logros del usuario
   */
  private async getAchievements(userId: number): Promise<GoalAchievement[]> {
    try {
      const stored = await this.getStoredProgress();
      return stored[userId]?.achievements || [];
    } catch (error) {
      console.error('❌ [GoalsService] Error getting achievements:', error);
      return [];
    }
  }

  /**
   * Guarda los logros del usuario
   */
  private async saveAchievements(userId: number, newAchievements: GoalAchievement[]): Promise<void> {
    try {
      const stored = await this.getStoredProgress();
      if (!stored[userId]) {
        stored[userId] = { achievements: [] };
      }
      
      stored[userId].achievements = [...(stored[userId].achievements || []), ...newAchievements];
      await this.setStoredProgress(stored);
    } catch (error) {
      console.error('❌ [GoalsService] Error saving achievements:', error);
    }
  }

  /**
   * Guarda una meta diaria
   */
  private async saveDailyGoal(goal: DailyGoal): Promise<void> {
    try {
      const stored = await this.getStoredGoals();
      stored[goal.id] = goal;
      await this.setStoredGoals(stored);
    } catch (error) {
      console.error('❌ [GoalsService] Error saving daily goal:', error);
    }
  }

  /**
   * Obtiene las metas almacenadas
   */
  private async getStoredGoals(): Promise<Record<string, DailyGoal>> {
    try {
      const stored = await AsyncStorage.getItem(this.goalsKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('❌ [GoalsService] Error getting stored goals:', error);
      return {};
    }
  }

  /**
   * Guarda las metas
   */
  private async setStoredGoals(goals: Record<string, DailyGoal>): Promise<void> {
    try {
      await AsyncStorage.setItem(this.goalsKey, JSON.stringify(goals));
    } catch (error) {
      console.error('❌ [GoalsService] Error setting stored goals:', error);
    }
  }

  /**
   * Obtiene el progreso almacenado
   */
  private async getStoredProgress(): Promise<Record<number, { achievements: GoalAchievement[] }>> {
    try {
      const stored = await AsyncStorage.getItem(this.progressKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('❌ [GoalsService] Error getting stored progress:', error);
      return {};
    }
  }

  /**
   * Guarda el progreso
   */
  private async setStoredProgress(progress: Record<number, { achievements: GoalAchievement[] }>): Promise<void> {
    try {
      await AsyncStorage.setItem(this.progressKey, JSON.stringify(progress));
    } catch (error) {
      console.error('❌ [GoalsService] Error setting stored progress:', error);
    }
  }
}

export default new GoalsService();
