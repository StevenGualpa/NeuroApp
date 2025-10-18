// src/services/LessonProgressService.ts
// Servicio para manejar el progreso de lecciones y pasos

import { API_CONFIG, API_ENDPOINTS } from '../config/api';

export interface LessonProgress {
  lesson_id: number;
  lesson_title: string;
  total_steps: number;
  completed_steps: number;
  best_time: number;
  best_time_formatted: string;
  best_stars: number;
  total_stars: number;
  perfect_runs: number;
  total_sessions: number;
  average_time: number;
  average_time_formatted: string;
  last_played: string;
  is_completed: boolean;
  progress_percentage: number;
}

export interface StepProgress {
  step_id: number;
  step_title: string;
  activity_type: string;
  best_time: number;
  best_time_formatted: string;
  best_stars: number;
  total_sessions: number;
  perfect_runs: number;
  last_played: string;
  is_completed: boolean;
  has_progress: boolean;
}

class LessonProgressService {
  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error en la respuesta del servidor');
      }

      return data.data;
    } catch (error) {
      console.error('Error en LessonProgressService:', error);
      throw error;
    }
  }

  /**
   * Obtiene el progreso de un usuario en una lección específica
   */
  async getLessonProgress(userId: number, lessonId: number): Promise<LessonProgress> {
    const endpoint = API_ENDPOINTS.LESSON_PROGRESS(userId, lessonId);
    return this.makeRequest<LessonProgress>(endpoint);
  }

  /**
   * Obtiene el progreso de un usuario en un paso específico
   */
  async getStepProgress(userId: number, stepId: number): Promise<StepProgress> {
    const endpoint = API_ENDPOINTS.STEP_PROGRESS(userId, stepId);
    console.log('🔍 [LessonProgressService] getStepProgress called:', { userId, stepId, endpoint });
    const result = await this.makeRequest<StepProgress>(endpoint);
    console.log('📊 [LessonProgressService] getStepProgress result:', result);
    return result;
  }

  /**
   * Obtiene el progreso de múltiples pasos de una lección
   */
  async getStepsProgress(userId: number, stepIds: number[]): Promise<StepProgress[]> {
    console.log('🔍 [LessonProgressService] getStepsProgress called with:', { userId, stepIds });
    const promises = stepIds.map(stepId => this.getStepProgress(userId, stepId));
    const results = await Promise.all(promises);
    console.log('📊 [LessonProgressService] getStepsProgress results:', results);
    return results;
  }

  /**
   * Formatea el tiempo en segundos a formato legible
   */
  formatTime(seconds: number): string {
    if (seconds === 0) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Obtiene el estado de progreso de un paso
   */
  getStepStatus(stepProgress: StepProgress): 'not_played' | 'in_progress' | 'completed' {
    if (!stepProgress.has_progress) {
      return 'not_played';
    }
    
    if (stepProgress.is_completed) {
      return 'completed';
    }
    
    return 'in_progress';
  }

  /**
   * Obtiene el color del estado de progreso
   */
  getStatusColor(status: 'not_played' | 'in_progress' | 'completed'): string {
    switch (status) {
      case 'not_played':
        return '#9E9E9E'; // Gris
      case 'in_progress':
        return '#FF9800'; // Naranja
      case 'completed':
        return '#4CAF50'; // Verde
      default:
        return '#9E9E9E';
    }
  }

  /**
   * Obtiene el ícono del estado de progreso
   */
  getStatusIcon(status: 'not_played' | 'in_progress' | 'completed'): string {
    switch (status) {
      case 'not_played':
        return '⭕';
      case 'in_progress':
        return '🟡';
      case 'completed':
        return '✅';
      default:
        return '⭕';
    }
  }

  /**
   * Obtiene el texto del estado de progreso
   */
  getStatusText(status: 'not_played' | 'in_progress' | 'completed'): string {
    switch (status) {
      case 'not_played':
        return 'Aún no jugado';
      case 'in_progress':
        return 'En progreso';
      case 'completed':
        return 'Completado';
      default:
        return 'Aún no jugado';
    }
  }
}

export default new LessonProgressService();
