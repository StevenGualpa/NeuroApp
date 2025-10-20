// src/hooks/useActivityProgress.ts
import { useState, useCallback } from 'react';
import { useAuthContext } from './useAuth';
import useGameSessions from './useGameSessions';
import useUserProgress from './useUserProgress';
import useUserStats from './useUserStats';
import { useRealAchievements } from './useRealAchievements';
import AchievementEvaluationService from '../services/AchievementEvaluationService';

export interface ActivityResult {
  lessonId: number;
  stepId: number;
  activityType: string;
  completed: boolean;
  stars: number;
  attempts: number;
  errors: number;
  timeSpent: number;
  perfectRun: boolean;
  usedHelp: boolean;
  helpActivations: number;
  showedImprovement?: boolean;
}

export interface ActivitySession {
  sessionId: number | null;
  lessonId: number;
  stepId: number;
  activityType: string;
  startTime: Date;
  attempts: number;
  errors: number;
  usedHelp: boolean;
  helpActivations: number;
}

export const useActivityProgress = () => {
  const { user } = useAuthContext();
  const gameSessions = useGameSessions();
  const userProgress = useUserProgress(user?.id);
  const userStats = useUserStats(user?.id);
  const achievements = useRealAchievements();

  const [currentSession, setCurrentSession] = useState<ActivitySession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Iniciar una nueva actividad
  const startActivity = useCallback(async (
    lessonId: number, 
    stepId: number, 
    activityType: string = 'lesson_step'
  ) => {
    if (!user) {
      setError('Usuario no autenticado');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`🎮 Iniciando actividad: Lección ${lessonId}, Paso ${stepId}, Tipo: ${activityType}`);

      // Iniciar sesión en el backend
      const session = await gameSessions.startSession({
        user_id: user.id,
        lesson_id: lessonId,
        step_id: stepId,
        activity_type: activityType,
      });

      const activitySession: ActivitySession = {
        sessionId: session.ID,
        lessonId,
        stepId,
        activityType,
        startTime: new Date(),
        attempts: 0,
        errors: 0,
        usedHelp: false,
        helpActivations: 0,
      };

      setCurrentSession(activitySession);
      console.log(`✅ Sesión iniciada con ID: ${session.ID}`);
      
      return activitySession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar actividad';
      setError(errorMessage);
      console.error('❌ Error iniciando actividad:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, gameSessions]);

  // Actualizar progreso durante la actividad
  const updateActivityProgress = useCallback(async (updates: {
    attempts?: number;
    errors?: number;
    usedHelp?: boolean;
    helpActivations?: number;
  }) => {
    if (!currentSession || !currentSession.sessionId) {
      setError('No hay sesión activa');
      return;
    }

    try {
      setError(null);

      // Actualizar estado local
      setCurrentSession(prev => prev ? {
        ...prev,
        attempts: updates.attempts ?? prev.attempts,
        errors: updates.errors ?? prev.errors,
        usedHelp: updates.usedHelp ?? prev.usedHelp,
        helpActivations: updates.helpActivations ?? prev.helpActivations,
      } : null);

      // Actualizar sesión en el backend
      await gameSessions.updateSession(currentSession.sessionId, {
        total_attempts: updates.attempts,
        errors: updates.errors,
        used_help: updates.usedHelp,
        help_activations: updates.helpActivations,
      });

      console.log('📊 Progreso actualizado:', updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error actualizando progreso';
      setError(errorMessage);
      console.error('❌ Error actualizando progreso:', err);
      throw err;
    }
  }, [currentSession, gameSessions]);

  // Completar actividad y guardar todo el progreso
  const completeActivity = useCallback(async (result: ActivityResult) => {
    if (!currentSession || !currentSession.sessionId || !user) {
      setError('No hay sesión activa o usuario no autenticado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🏁 Completando actividad:', result);

      // 1. Finalizar sesión de juego
      console.log('📝 Finalizando sesión...');
      await gameSessions.endSession(currentSession.sessionId, {
        total_attempts: result.attempts,
        errors: result.errors,
        stars: result.stars,
        completion_time: result.timeSpent,
        perfect_run: result.perfectRun,
        used_help: result.usedHelp,
        help_activations: result.helpActivations,
      });

      // 2. Guardar progreso del usuario
      console.log('💾 Guardando progreso del usuario...');
      const progressData = {
        lesson_id: result.lessonId,
        step_id: result.stepId,
        completed: result.completed,
        stars: result.stars,
        attempts: result.attempts,
        errors: result.errors,
        best_time: result.timeSpent,
      };

      await userProgress.saveProgress(progressData);

      // 3. Actualizar estadísticas del usuario
      console.log('📈 Actualizando estadísticas...');
      await userStats.updateStatsAfterActivity({
        stars: result.stars,
        timeSpent: result.timeSpent,
        usedHelp: result.usedHelp,
        activityType: result.activityType,
        improved: result.showedImprovement || false,
      });

      // 4. Procesar logros con el nuevo sistema backend si la actividad fue completada
      if (result.completed && user) {
        console.log('🏆 Evaluando logros en el backend...');
        try {
          const gameData = AchievementEvaluationService.processGameData(
            user.id,
            result.activityType,
            {
              stars: result.stars,
              isPerfect: result.perfectRun,
              completionTime: Math.round(result.timeSpent / 1000), // convertir a segundos
              errors: result.errors,
              usedHelp: result.usedHelp,
              showedImprovement: result.showedImprovement || false,
              sessionDuration: Math.round(result.timeSpent / 1000), // convertir a segundos
            }
          );

          const achievementResult = await AchievementEvaluationService.evaluateAchievements(user.id, gameData);
          
          if (achievementResult.newly_unlocked.length > 0) {
            console.log('🎉 ¡Nuevos logros desbloqueados!', achievementResult.newly_unlocked);
            // Aquí podrías mostrar notificaciones de logros desbloqueados
            // TODO: Implementar notificaciones de logros
          }
          
          console.log('✅ Logros evaluados exitosamente:', {
            newlyUnlocked: achievementResult.newly_unlocked.length,
            totalPoints: achievementResult.total_points
          });
        } catch (error) {
          console.error('❌ Error evaluando logros:', error);
          // No lanzar error para no interrumpir el flujo de la actividad
        }
      }

      // 5. Limpiar sesión actual
      setCurrentSession(null);

      console.log('✅ Actividad completada exitosamente');

      return {
        session: currentSession,
        progress: progressData,
        completed: true,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error completando actividad';
      setError(errorMessage);
      console.error('❌ Error completando actividad:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentSession, user, gameSessions, userProgress, userStats, achievements]);

  // Cancelar actividad actual
  const cancelActivity = useCallback(async () => {
    if (!currentSession) {
      setCurrentSession(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('❌ Cancelando actividad...');

      if (currentSession.sessionId) {
        // Finalizar sesión sin guardar progreso significativo
        await gameSessions.endSession(currentSession.sessionId, {
          total_attempts: currentSession.attempts,
          errors: currentSession.errors,
          stars: 0,
          completion_time: Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000),
          perfect_run: false,
          used_help: currentSession.usedHelp,
          help_activations: currentSession.helpActivations,
        });
      }

      setCurrentSession(null);
      console.log('✅ Actividad cancelada');
    } catch (err) {
      console.error('❌ Error cancelando actividad:', err);
      // Limpiar sesión local incluso si hay error
      setCurrentSession(null);
    } finally {
      setLoading(false);
    }
  }, [currentSession, gameSessions]);

  // Obtener tiempo transcurrido en la sesión actual
  const getCurrentSessionTime = useCallback(() => {
    if (!currentSession) return 0;
    return Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000);
  }, [currentSession]);

  // Calcular estrellas basado en rendimiento
  const calculateStars = useCallback((attempts: number, errors: number, timeSpent: number) => {
    // Lógica para calcular estrellas (1-3)
    if (errors === 0 && timeSpent < 60) {
      return 3; // Perfecto y rápido
    } else if (errors <= 1 && timeSpent < 120) {
      return 2; // Muy bien
    } else if (errors <= 3) {
      return 1; // Bien
    } else {
      return 0; // Necesita mejorar
    }
  }, []);

  // Verificar si es una mejora respecto al intento anterior
  const checkImprovement = useCallback((lessonId: number, stepId: number, currentErrors: number, currentTime: number) => {
    const previousProgress = userProgress.getProgressByStep(lessonId, stepId);
    if (!previousProgress) return false;

    const improvedErrors = currentErrors < previousProgress.errors;
    const improvedTime = currentTime < previousProgress.best_time;
    
    return improvedErrors || improvedTime;
  }, [userProgress]);

  // Limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado
    currentSession,
    loading: loading || gameSessions.loading || userProgress.loading || userStats.loading,
    error: error || gameSessions.error || userProgress.error || userStats.error,
    
    // Datos de progreso
    userProgress: userProgress.progress,
    progressSummary: userProgress.progressSummary,
    userStats: userStats.stats,
    achievements: achievements,
    
    // Acciones principales
    startActivity,
    updateActivityProgress,
    completeActivity,
    cancelActivity,
    
    // Utilidades
    getCurrentSessionTime,
    calculateStars,
    checkImprovement,
    clearError,
    
    // Consultas de progreso
    isStepCompleted: userProgress.isStepCompleted,
    getStepStars: userProgress.getStepStars,
    getLessonProgress: userProgress.getLessonProgress,
    getProgressByStep: userProgress.getProgressByStep,
  };
};

export default useActivityProgress;