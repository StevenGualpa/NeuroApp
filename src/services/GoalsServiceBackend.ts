// src/services/GoalsServiceBackend.ts
// Servicio para manejar metas y objetivos personalizados con backend

import { NeurodivergentProfile } from './AnalysisService';
import PersonalizationService, { PersonalizedRecommendations } from './PersonalizationService';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

export interface DailyGoal {
  id: number;
  user_id: number;
  date: string; // YYYY-MM-DD
  target_sessions: number;
  target_time: number; // en minutos
  target_stars: number;
  completed_sessions: number;
  completed_time: number; // en minutos
  earned_stars: number;
  is_completed: boolean;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  activity_goals: ActivityGoal[];
}

export interface ActivityGoal {
  id: number;
  daily_goal_id: number;
  activity_type: string;
  target_sessions: number;
  completed_sessions: number;
  is_completed: boolean;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  updated_at: string;
}

export interface WeeklyGoal {
  id: string;
  week_start: string; // YYYY-MM-DD
  week_end: string; // YYYY-MM-DD
  user_id: number;
  target_sessions: number;
  target_time: number; // en minutos
  target_stars: number;
  completed_sessions: number;
  completed_time: number; // en minutos
  earned_stars: number;
  is_completed: boolean;
  completion_percentage: number;
  daily_goals: DailyGoal[];
}

export interface GoalProgress {
  today: DailyGoal | null;
  this_week: WeeklyGoal | null;
  streak: number; // días consecutivos completando metas
  total_completed: number; // total de días completados
  average_completion: number; // porcentaje promedio de completado
  achievements: GoalAchievement[];
}

export interface GoalAchievement {
  id: number;
  user_id: number;
  type: 'daily' | 'weekly' | 'streak' | 'milestone';
  title: string;
  description: string;
  icon: string;
  earned_at: string;
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

class GoalsServiceBackend {
  private baseUrl = `${API_CONFIG.BASE_URL}/goals`;

  /**
   * Inicializa las metas para un usuario basado en su perfil
   */
  async initializeGoals(userId: number, profile: NeurodivergentProfile | null): Promise<DailyGoal> {
    const recommendations = PersonalizationService.getPersonalizedRecommendations(profile);
    const today = new Date().toISOString().split('T')[0];

    const requestData = {
      date: today,
      target_sessions: recommendations.dailyGoals.totalSessions,
      target_time: recommendations.dailyGoals.totalTime,
      target_stars: recommendations.dailyGoals.targetStars,
      activity_goals: recommendations.activityPriorities.map(activity => ({
        activity_type: activity.activityType,
        target_sessions: activity.dailyGoal,
        completed_sessions: 0,
        is_completed: false,
        priority: activity.priority,
      })),
    };

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.GOALS_DAILY(userId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [GoalsServiceBackend] Daily goal initialized:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ [GoalsServiceBackend] Error initializing goals:', error);
      throw error;
    }
  }

  /**
   * Obtiene la meta diaria actual
   */
  async getTodayGoal(userId: number): Promise<DailyGoal | null> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.GOALS_TODAY(userId)}`);
      
      if (response.status === 404) {
        return null; // No hay meta para hoy
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ [GoalsServiceBackend] Error getting today goal:', error);
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
      const requestData = {
        activity_type: activityType,
        duration: sessionData.duration,
        stars: sessionData.stars,
        completed: sessionData.completed,
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.GOALS_ACTIVITY_PROGRESS(userId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [GoalsServiceBackend] Activity progress updated:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ [GoalsServiceBackend] Error updating activity progress:', error);
      return null;
    }
  }

  /**
   * Obtiene el progreso completo de metas
   */
  async getGoalProgress(userId: number): Promise<GoalProgress> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.GOALS_PROGRESS(userId)}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ [GoalsServiceBackend] Error getting goal progress:', error);
      return {
        today: null,
        this_week: null,
        streak: 0,
        total_completed: 0,
        average_completion: 0,
        achievements: [],
      };
    }
  }

  /**
   * Obtiene los logros del usuario
   */
  async getAchievements(userId: number): Promise<GoalAchievement[]> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.GOALS_ACHIEVEMENTS(userId)}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ [GoalsServiceBackend] Error getting achievements:', error);
      return [];
    }
  }

  /**
   * Marca un logro como visto
   */
  async markAchievementAsSeen(userId: number, achievementId: number): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.GOALS_MARK_ACHIEVEMENT_SEEN(userId, achievementId)}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ [GoalsServiceBackend] Achievement marked as seen');
    } catch (error) {
      console.error('❌ [GoalsServiceBackend] Error marking achievement as seen:', error);
    }
  }
}

export default new GoalsServiceBackend();
