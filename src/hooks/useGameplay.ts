// src/hooks/useGameplay.ts
import { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from './useAuth';
import useGameSessions, { SessionData, SessionEndData, SessionUpdateData } from './useGameSessions';
import useUserProgress, { ProgressData } from './useUserProgress';
import { useRealAchievements } from './useRealAchievements';
import useUserStats from './useUserStats';
import AchievementEvaluationService from '../services/AchievementEvaluationService';

export interface GameplaySession {
  sessionId: number | null;
  lessonId: number;
  stepId: number;
  startTime: Date;
  attempts: number;
  errors: number;
  usedHelp: boolean;
  helpActivations: number;
}

export interface GameplayResult {
  completed: boolean;
  stars: number;
  attempts: number;
  errors: number;
  timeSpent: number;
  perfectRun: boolean;
  usedHelp: boolean;
  helpActivations: number;
}

export const useGameplay = () => {
  const { user } = useAuthContext();
  const gameSessions = useGameSessions();
  const userProgress = useUserProgress(user?.id);
  const achievements = useRealAchievements();
  const userStats = useUserStats(user?.id);

  const [currentGameplay, setCurrentGameplay] = useState<GameplaySession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Iniciar una nueva sesión de juego
  const startGameplay = useCallback(async (lessonId: number, stepId: number) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const sessionData: SessionData = {
        user_id: user.id,
        lesson_id: lessonId,
        step_id: stepId,
        activity_type: 'lesson_step',
      };

      const session = await gameSessions.startSession(sessionData);

      const gameplay: GameplaySession = {
        sessionId: session.ID,
        lessonId,
        stepId,
        startTime: new Date(),
        attempts: 0,
        errors: 0,
        usedHelp: false,
        helpActivations: 0,
      };

      setCurrentGameplay(gameplay);
      return gameplay;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error starting gameplay';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, gameSessions]);

  // Actualizar progreso durante el juego
  const updateGameplayProgress = useCallback(async (updates: {
    attempts?: number;
    errors?: number;
    usedHelp?: boolean;
    helpActivations?: number;
  }) => {
    if (!currentGameplay || !currentGameplay.sessionId) {
      setError('No active gameplay session');
      return;
    }

    try {
      setError(null);

      // Actualizar estado local
      setCurrentGameplay(prev => prev ? {
        ...prev,
        attempts: updates.attempts ?? prev.attempts,
        errors: updates.errors ?? prev.errors,
        usedHelp: updates.usedHelp ?? prev.usedHelp,
        helpActivations: updates.helpActivations ?? prev.helpActivations,
      } : null);

      // Actualizar sesión en el backend
      const sessionUpdate: SessionUpdateData = {
        total_attempts: updates.attempts,
        errors: updates.errors,
        used_help: updates.usedHelp,
        help_activations: updates.helpActivations,
      };

      await gameSessions.updateSession(currentGameplay.sessionId, sessionUpdate);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating gameplay progress';
      setError(errorMessage);
      throw err;
    }
  }, [currentGameplay, gameSessions]);

  // Finalizar sesión de juego
  const endGameplay = useCallback(async (result: GameplayResult) => {
    if (!currentGameplay || !currentGameplay.sessionId || !user) {
      setError('No active gameplay session or user not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Finalizar sesión
      const endData: SessionEndData = {
        total_attempts: result.attempts,
        errors: result.errors,
        stars: result.stars,
        completion_time: result.timeSpent,
        perfect_run: result.perfectRun,
        used_help: result.usedHelp,
        help_activations: result.helpActivations,
      };

      await gameSessions.endSession(currentGameplay.sessionId, endData);

      // 2. Guardar progreso del usuario
      const progressData: ProgressData = {
        lesson_id: currentGameplay.lessonId,
        step_id: currentGameplay.stepId,
        completed: result.completed,
        stars: result.stars,
        attempts: result.attempts,
        errors: result.errors,
        best_time: result.timeSpent,
      };

      await userProgress.saveProgress(progressData);

      // 3. Actualizar estadísticas del usuario
      await userStats.updateStatsAfterActivity({
        stars: result.stars,
        timeSpent: result.timeSpent,
        usedHelp: result.usedHelp,
        activityType: 'lesson_step',
        improved: result.errors < currentGameplay.attempts / 2, // Mejoró si tiene menos errores que la mitad de intentos
      });

      // 4. Procesar logros con el nuevo sistema backend si la actividad fue completada
      if (result.completed && user) {
        console.log('🏆 Evaluando logros en el backend...');
        try {
          const gameData = AchievementEvaluationService.processGameData(
            user.id,
            'lesson_step', // Tipo de actividad para gameplay
            {
              stars: result.stars,
              isPerfect: result.perfectRun,
              completionTime: Math.round(result.timeSpent / 1000), // convertir a segundos
              errors: result.errors,
              usedHelp: result.usedHelp,
              showedImprovement: result.errors < currentGameplay.attempts / 2,
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
      setCurrentGameplay(null);

      return {
        session: endData,
        progress: progressData,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error ending gameplay';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentGameplay, user, gameSessions, userProgress, userStats, achievements]);

  // Cancelar sesión de juego
  const cancelGameplay = useCallback(async () => {
    if (!currentGameplay || !currentGameplay.sessionId) {
      setCurrentGameplay(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Finalizar sesión sin guardar progreso significativo
      const endData: SessionEndData = {
        total_attempts: currentGameplay.attempts,
        errors: currentGameplay.errors,
        stars: 0,
        completion_time: Math.floor((Date.now() - currentGameplay.startTime.getTime()) / 1000),
        perfect_run: false,
        used_help: currentGameplay.usedHelp,
        help_activations: currentGameplay.helpActivations,
      };

      await gameSessions.endSession(currentGameplay.sessionId, endData);
      setCurrentGameplay(null);
    } catch (err) {
      console.error('Error canceling gameplay:', err);
      // Limpiar sesión local incluso si hay error
      setCurrentGameplay(null);
    } finally {
      setLoading(false);
    }
  }, [currentGameplay, gameSessions]);

  // Obtener tiempo transcurrido en la sesión actual
  const getCurrentSessionTime = useCallback(() => {
    if (!currentGameplay) return 0;
    return Math.floor((Date.now() - currentGameplay.startTime.getTime()) / 1000);
  }, [currentGameplay]);

  // Verificar si un paso está completado
  const isStepCompleted = useCallback((lessonId: number, stepId: number) => {
    return userProgress.isStepCompleted(lessonId, stepId);
  }, [userProgress]);

  // Obtener estrellas de un paso
  const getStepStars = useCallback((lessonId: number, stepId: number) => {
    return userProgress.getStepStars(lessonId, stepId);
  }, [userProgress]);

  // Obtener progreso de una lección
  const getLessonProgress = useCallback((lessonId: number, totalSteps: number) => {
    return userProgress.getLessonProgress(lessonId, totalSteps);
  }, [userProgress]);

  // Limpiar errores
  const clearError = useCallback(() => {
    setError(null);
    gameSessions.clearError();
    userProgress.clearError();
    userStats.clearError();
  }, [gameSessions, userProgress, userStats]);

  // Limpiar sesión actual si el usuario cambia
  useEffect(() => {
    if (!user && currentGameplay) {
      setCurrentGameplay(null);
    }
  }, [user, currentGameplay]);

  return {
    // Estado
    currentGameplay,
    loading: loading || gameSessions.loading || userProgress.loading || userStats.loading,
    error: error || gameSessions.error || userProgress.error || userStats.error,
    
    // Datos
    userProgress: userProgress.progress,
    progressSummary: userProgress.progressSummary,
    userStats: userStats.stats,
    achievements: achievements.achievements,
    
    // Acciones principales
    startGameplay,
    updateGameplayProgress,
    endGameplay,
    cancelGameplay,
    
    // Consultas
    isStepCompleted,
    getStepStars,
    getLessonProgress,
    getCurrentSessionTime,
    
    // Utilidades
    clearError,
  };
};

export default useGameplay;