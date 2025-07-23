// src/hooks/useUserProgress.ts
import { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/ApiService';

export interface UserProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  step_id: number;
  completed: boolean;
  stars: number;
  attempts: number;
  errors: number;
  best_time: number;
  last_played: string;
}

export interface ProgressData {
  lesson_id: number;
  step_id: number;
  completed: boolean;
  stars: number;
  attempts: number;
  errors: number;
  best_time: number;
}

export interface ProgressSummary {
  total_lessons: number;
  completed_steps: number;
  total_steps: number;
  total_stars: number;
  total_attempts: number;
  total_errors: number;
  completion_rate: number;
}

export const useUserProgress = (userId?: number) => {
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todo el progreso del usuario
  const getUserProgress = useCallback(async (targetUserId?: number) => {
    const id = targetUserId || userId;
    if (!id) {
      setError('User ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.getUserProgress(id);
      setProgress(response.progress || []);
      
      return response.progress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching user progress';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Guardar progreso del usuario
  const saveProgress = useCallback(async (progressData: ProgressData, targetUserId?: number) => {
    const id = targetUserId || userId;
    if (!id) {
      setError('User ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.saveUserProgress(id, progressData);
      
      // Actualizar el progreso local
      setProgress(prev => {
        const existingIndex = prev.findIndex(
          p => p.lesson_id === progressData.lesson_id && p.step_id === progressData.step_id
        );
        
        if (existingIndex >= 0) {
          // Actualizar progreso existente
          const updated = [...prev];
          updated[existingIndex] = response.progress;
          return updated;
        } else {
          // Agregar nuevo progreso
          return [...prev, response.progress];
        }
      });
      
      return response.progress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error saving progress';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Obtener progreso por lección
  const getProgressByLesson = useCallback((lessonId: number) => {
    return progress.filter(p => p.lesson_id === lessonId);
  }, [progress]);

  // Obtener progreso por paso específico
  const getProgressByStep = useCallback((lessonId: number, stepId: number) => {
    return progress.find(p => p.lesson_id === lessonId && p.step_id === stepId);
  }, [progress]);

  // Verificar si un paso está completado
  const isStepCompleted = useCallback((lessonId: number, stepId: number) => {
    const stepProgress = getProgressByStep(lessonId, stepId);
    return stepProgress?.completed || false;
  }, [getProgressByStep]);

  // Obtener estrellas de un paso
  const getStepStars = useCallback((lessonId: number, stepId: number) => {
    const stepProgress = getProgressByStep(lessonId, stepId);
    return stepProgress?.stars || 0;
  }, [getProgressByStep]);

  // Calcular progreso de una lección (porcentaje de pasos completados)
  const getLessonProgress = useCallback((lessonId: number, totalSteps: number) => {
    const lessonProgress = getProgressByLesson(lessonId);
    const completedSteps = lessonProgress.filter(p => p.completed).length;
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  }, [getProgressByLesson]);

  // Calcular estadísticas generales
  const calculateProgressSummary = useCallback(() => {
    if (progress.length === 0) return null;

    const uniqueLessons = new Set(progress.map(p => p.lesson_id)).size;
    const completedSteps = progress.filter(p => p.completed).length;
    const totalSteps = progress.length;
    const totalStars = progress.reduce((sum, p) => sum + p.stars, 0);
    const totalAttempts = progress.reduce((sum, p) => sum + p.attempts, 0);
    const totalErrors = progress.reduce((sum, p) => sum + p.errors, 0);
    const completionRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    const summary: ProgressSummary = {
      total_lessons: uniqueLessons,
      completed_steps: completedSteps,
      total_steps: totalSteps,
      total_stars: totalStars,
      total_attempts: totalAttempts,
      total_errors: totalErrors,
      completion_rate: completionRate,
    };

    setProgressSummary(summary);
    return summary;
  }, [progress]);

  // Obtener mejor tiempo de un paso
  const getBestTime = useCallback((lessonId: number, stepId: number) => {
    const stepProgress = getProgressByStep(lessonId, stepId);
    return stepProgress?.best_time || 0;
  }, [getProgressByStep]);

  // Obtener intentos de un paso
  const getStepAttempts = useCallback((lessonId: number, stepId: number) => {
    const stepProgress = getProgressByStep(lessonId, stepId);
    return stepProgress?.attempts || 0;
  }, [getProgressByStep]);

  // Obtener errores de un paso
  const getStepErrors = useCallback((lessonId: number, stepId: number) => {
    const stepProgress = getProgressByStep(lessonId, stepId);
    return stepProgress?.errors || 0;
  }, [getProgressByStep]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cargar progreso automáticamente cuando se proporciona userId
  useEffect(() => {
    if (userId) {
      getUserProgress();
    }
  }, [userId, getUserProgress]);

  // Recalcular resumen cuando cambia el progreso
  useEffect(() => {
    calculateProgressSummary();
  }, [progress, calculateProgressSummary]);

  return {
    // Estado
    progress,
    progressSummary,
    loading,
    error,
    
    // Acciones principales
    getUserProgress,
    saveProgress,
    
    // Consultas específicas
    getProgressByLesson,
    getProgressByStep,
    isStepCompleted,
    getStepStars,
    getLessonProgress,
    getBestTime,
    getStepAttempts,
    getStepErrors,
    
    // Utilidades
    calculateProgressSummary,
    clearError,
  };
};

export default useUserProgress;