// src/services/AchievementEvaluationService.ts
// Servicio simplificado para evaluar logros en el backend

import { API_CONFIG, API_ENDPOINTS } from '../config/api';

export interface GameCompletionData {
  user_id: number;
  activity_type: string;
  stars: number;
  is_perfect: boolean;
  completion_time: number; // en segundos
  errors: number;
  used_help: boolean;
  showed_improvement: boolean;
  session_duration: number; // en segundos
}

export interface AchievementEvaluationResult {
  newly_unlocked: Achievement[];
  updated_progress: UserAchievement[];
  total_points: number;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  points: number;
  max_progress: number;
  condition: string;
  encouragement_message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  is_unlocked: boolean;
  current_progress: number;
  unlocked_at?: string;
  created_at: string;
  updated_at: string;
  achievement?: Achievement;
}

export interface AchievementStats {
  total_achievements: number;
  unlocked_achievements: number;
  total_points: number;
  completion_percentage: number;
}

class AchievementEvaluationService {
  private baseUrl = `${API_CONFIG.BASE_URL}/achievement-evaluation`;

  /**
   * Evalúa logros después de completar una actividad
   */
  async evaluateAchievements(userId: number, gameData: GameCompletionData): Promise<AchievementEvaluationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [AchievementEvaluationService] Achievements evaluated:', data.data);
      return data.data;
    } catch (error) {
      console.error('❌ [AchievementEvaluationService] Error evaluating achievements:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los logros del usuario con su progreso
   */
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}/achievements`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ [AchievementEvaluationService] Error getting user achievements:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de logros del usuario
   */
  async getAchievementStats(userId: number): Promise<AchievementStats> {
    try {
      const response = await fetch(`${this.baseUrl}/user/${userId}/stats`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('❌ [AchievementEvaluationService] Error getting achievement stats:', error);
      throw error;
    }
  }

  /**
   * Procesa los datos de una actividad completada para enviar al backend
   */
  processGameData(
    userId: number,
    activityType: string,
    sessionData: {
      stars: number;
      isPerfect: boolean;
      completionTime: number; // en segundos
      errors: number;
      usedHelp?: boolean;
      showedImprovement?: boolean;
      sessionDuration?: number; // en segundos
    }
  ): GameCompletionData {
    return {
      user_id: userId,
      activity_type: activityType,
      stars: sessionData.stars,
      is_perfect: sessionData.isPerfect,
      completion_time: sessionData.completionTime,
      errors: sessionData.errors,
      used_help: sessionData.usedHelp || false,
      showed_improvement: sessionData.showedImprovement || false,
      session_duration: sessionData.sessionDuration || sessionData.completionTime,
    };
  }
}

export default new AchievementEvaluationService();
