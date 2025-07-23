// src/hooks/useActivityProgressDebug.ts
// Versión con logs detallados para debuggear

import { useState, useCallback } from 'react';
import { useAuthContext } from './useAuth';
import useGameSessions from './useGameSessions';
import useUserProgress from './useUserProgress';
import useUserStats from './useUserStats';
import { useRealAchievements } from './useRealAchievements';

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

export const useActivityProgressDebug = () => {
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
    console.log(`\n🚀 [DEBUG] ===== INICIANDO ACTIVIDAD =====`);
    console.log(`📋 Parámetros recibidos:`);
    console.log(`   - lessonId: ${lessonId}`);
    console.log(`   - stepId: ${stepId}`);
    console.log(`   - activityType: ${activityType}`);

    if (!user) {
      console.error('❌ [DEBUG] Usuario no autenticado');
      setError('Usuario no autenticado');
      return null;
    }

    console.log(`👤 [DEBUG] Usuario autenticado:`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Username: ${user.username}`);
    console.log(`   - Email: ${user.email}`);

    try {
      setLoading(true);
      setError(null);

      console.log(`📤 [DEBUG] Preparando datos para el backend...`);

      const sessionData = {
        user_id: user.id,
        lesson_id: lessonId,
        step_id: stepId,
        activity_type: activityType,
      };

      console.log(`📤 [DEBUG] Datos a enviar:`, JSON.stringify(sessionData, null, 2));

      console.log(`🌐 [DEBUG] Llamando a gameSessions.startSession...`);
      const session = await gameSessions.startSession(sessionData);

      console.log(`📥 [DEBUG] Respuesta del servidor:`, JSON.stringify(session, null, 2));

      if (!session || !session.ID) {
        throw new Error('El servidor no devolvió un ID de sesión válido');
      }

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
      console.log(`✅ [DEBUG] Sesión local creada:`, JSON.stringify(activitySession, null, 2));
      console.log(`✅ [DEBUG] Actividad iniciada exitosamente con ID: ${session.ID}`);
      
      return activitySession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar actividad';
      setError(errorMessage);
      console.error('❌ [DEBUG] Error iniciando actividad:', err);
      console.error('❌ [DEBUG] Stack trace:', err instanceof Error ? err.stack : 'No stack trace');
      throw err;
    } finally {
      setLoading(false);
      console.log(`🏁 [DEBUG] ===== FIN INICIAR ACTIVIDAD =====\n`);
    }
  }, [user, gameSessions]);

  // Actualizar progreso durante la actividad
  const updateActivityProgress = useCallback(async (updates: {
    attempts?: number;
    errors?: number;
    usedHelp?: boolean;
    helpActivations?: number;
  }) => {
    console.log(`\n📊 [DEBUG] ===== ACTUALIZANDO PROGRESO =====`);
    console.log(`📋 Updates recibidos:`, JSON.stringify(updates, null, 2));

    if (!currentSession || !currentSession.sessionId) {
      console.error('❌ [DEBUG] No hay sesión activa');
      console.log(`🔍 [DEBUG] Estado de currentSession:`, currentSession);
      setError('No hay sesión activa');
      return;
    }

    console.log(`📋 [DEBUG] Sesión actual:`, JSON.stringify(currentSession, null, 2));

    try {
      setError(null);

      // Actualizar estado local
      const updatedSession = {
        ...currentSession,
        attempts: updates.attempts ?? currentSession.attempts,
        errors: updates.errors ?? currentSession.errors,
        usedHelp: updates.usedHelp ?? currentSession.usedHelp,
        helpActivations: updates.helpActivations ?? currentSession.helpActivations,
      };

      setCurrentSession(updatedSession);
      console.log(`📝 [DEBUG] Estado local actualizado:`, JSON.stringify(updatedSession, null, 2));

      // Actualizar sesión en el backend
      const sessionUpdate = {
        total_attempts: updates.attempts,
        errors: updates.errors,
        used_help: updates.usedHelp,
        help_activations: updates.helpActivations,
      };

      console.log(`📤 [DEBUG] Enviando actualización al backend:`, JSON.stringify(sessionUpdate, null, 2));
      console.log(`🌐 [DEBUG] Llamando a gameSessions.updateSession(${currentSession.sessionId})...`);

      await gameSessions.updateSession(currentSession.sessionId, sessionUpdate);

      console.log(`✅ [DEBUG] Progreso actualizado exitosamente`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error actualizando progreso';
      setError(errorMessage);
      console.error('❌ [DEBUG] Error actualizando progreso:', err);
      console.error('❌ [DEBUG] Stack trace:', err instanceof Error ? err.stack : 'No stack trace');
      throw err;
    } finally {
      console.log(`🏁 [DEBUG] ===== FIN ACTUALIZAR PROGRESO =====\n`);
    }
  }, [currentSession, gameSessions]);

  // Completar actividad y guardar todo el progreso
  const completeActivity = useCallback(async (result: ActivityResult) => {
    console.log(`\n🏁 [DEBUG] ===== COMPLETANDO ACTIVIDAD =====`);
    console.log(`📋 Resultado recibido:`, JSON.stringify(result, null, 2));

    if (!currentSession || !currentSession.sessionId || !user) {
      console.error('❌ [DEBUG] Faltan datos para completar actividad');
      console.log(`🔍 [DEBUG] currentSession:`, currentSession);
      console.log(`🔍 [DEBUG] user:`, user);
      setError('No hay sesión activa o usuario no autenticado');
      return;
    }

    console.log(`📋 [DEBUG] Sesión actual:`, JSON.stringify(currentSession, null, 2));
    console.log(`👤 [DEBUG] Usuario:`, { id: user.id, username: user.username });

    try {
      setLoading(true);
      setError(null);

      // 1. Finalizar sesión de juego
      console.log(`\n📝 [DEBUG] PASO 1: Finalizando sesión...`);
      const endData = {
        total_attempts: result.attempts,
        errors: result.errors,
        stars: result.stars,
        completion_time: result.timeSpent,
        perfect_run: result.perfectRun,
        used_help: result.usedHelp,
        help_activations: result.helpActivations,
      };

      console.log(`📤 [DEBUG] Datos para finalizar sesión:`, JSON.stringify(endData, null, 2));
      console.log(`🌐 [DEBUG] Llamando a gameSessions.endSession(${currentSession.sessionId})...`);

      await gameSessions.endSession(currentSession.sessionId, endData);
      console.log(`✅ [DEBUG] Sesión finalizada exitosamente`);

      // 2. Guardar progreso del usuario
      console.log(`\n💾 [DEBUG] PASO 2: Guardando progreso del usuario...`);
      const progressData = {
        lesson_id: result.lessonId,
        step_id: result.stepId,
        completed: result.completed,
        stars: result.stars,
        attempts: result.attempts,
        errors: result.errors,
        best_time: result.timeSpent,
      };

      console.log(`📤 [DEBUG] Datos de progreso:`, JSON.stringify(progressData, null, 2));
      console.log(`🌐 [DEBUG] Llamando a userProgress.saveProgress...`);

      await userProgress.saveProgress(progressData);
      console.log(`✅ [DEBUG] Progreso guardado exitosamente`);

      // 3. Actualizar estadísticas del usuario
      console.log(`\n📈 [DEBUG] PASO 3: Actualizando estadísticas...`);
      const statsUpdate = {
        stars: result.stars,
        timeSpent: result.timeSpent,
        usedHelp: result.usedHelp,
        activityType: result.activityType,
        improved: result.showedImprovement || false,
      };

      console.log(`📤 [DEBUG] Datos de estadísticas:`, JSON.stringify(statsUpdate, null, 2));
      console.log(`🌐 [DEBUG] Llamando a userStats.updateStatsAfterActivity...`);

      await userStats.updateStatsAfterActivity(statsUpdate);
      console.log(`✅ [DEBUG] Estadísticas actualizadas exitosamente`);

      // 4. Procesar logros si la actividad fue completada
      if (result.completed) {
        console.log(`\n🏆 [DEBUG] PASO 4: Procesando logros...`);
        const achievementData = {
          stars: result.stars,
          isPerfect: result.perfectRun,
          completionTime: result.timeSpent,
          errors: result.errors,
          activityType: result.activityType,
          showedImprovement: result.showedImprovement,
          usedHelp: result.usedHelp,
          tookTime: result.timeSpent > 120,
          lessonId: result.lessonId,
          stepId: result.stepId,
        };

        console.log(`📤 [DEBUG] Datos de logros:`, JSON.stringify(achievementData, null, 2));
        console.log(`🌐 [DEBUG] Llamando a achievements.recordGameCompletion...`);

        await achievements.recordGameCompletion(achievementData);
        console.log(`✅ [DEBUG] Logros procesados exitosamente`);
      } else {
        console.log(`⏭️ [DEBUG] Actividad no completada, saltando procesamiento de logros`);
      }

      // 5. Limpiar sesión actual
      console.log(`\n🧹 [DEBUG] PASO 5: Limpiando sesión local...`);
      setCurrentSession(null);
      console.log(`✅ [DEBUG] Sesión local limpiada`);

      console.log(`🎉 [DEBUG] ¡Actividad completada exitosamente!`);

      return {
        session: currentSession,
        progress: progressData,
        completed: true,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error completando actividad';
      setError(errorMessage);
      console.error('❌ [DEBUG] Error completando actividad:', err);
      console.error('❌ [DEBUG] Stack trace:', err instanceof Error ? err.stack : 'No stack trace');
      throw err;
    } finally {
      setLoading(false);
      console.log(`🏁 [DEBUG] ===== FIN COMPLETAR ACTIVIDAD =====\n`);
    }
  }, [currentSession, user, gameSessions, userProgress, userStats, achievements]);

  // Cancelar actividad actual
  const cancelActivity = useCallback(async () => {
    console.log(`\n❌ [DEBUG] ===== CANCELANDO ACTIVIDAD =====`);

    if (!currentSession) {
      console.log(`⏭️ [DEBUG] No hay sesión que cancelar`);
      setCurrentSession(null);
      return;
    }

    console.log(`📋 [DEBUG] Cancelando sesión:`, JSON.stringify(currentSession, null, 2));

    try {
      setLoading(true);
      setError(null);

      if (currentSession.sessionId) {
        const endData = {
          total_attempts: currentSession.attempts,
          errors: currentSession.errors,
          stars: 0,
          completion_time: Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000),
          perfect_run: false,
          used_help: currentSession.usedHelp,
          help_activations: currentSession.helpActivations,
        };

        console.log(`📤 [DEBUG] Finalizando sesión cancelada:`, JSON.stringify(endData, null, 2));
        await gameSessions.endSession(currentSession.sessionId, endData);
        console.log(`✅ [DEBUG] Sesión cancelada en el backend`);
      }

      setCurrentSession(null);
      console.log(`✅ [DEBUG] Actividad cancelada exitosamente`);
    } catch (err) {
      console.error('❌ [DEBUG] Error cancelando actividad:', err);
      setCurrentSession(null);
    } finally {
      setLoading(false);
      console.log(`🏁 [DEBUG] ===== FIN CANCELAR ACTIVIDAD =====\n`);
    }
  }, [currentSession, gameSessions]);

  // Obtener tiempo transcurrido en la sesión actual
  const getCurrentSessionTime = useCallback(() => {
    if (!currentSession) return 0;
    const timeSpent = Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000);
    console.log(`⏱️ [DEBUG] Tiempo de sesión actual: ${timeSpent} segundos`);
    return timeSpent;
  }, [currentSession]);

  // Calcular estrellas basado en rendimiento
  const calculateStars = useCallback((attempts: number, errors: number, timeSpent: number) => {
    console.log(`⭐ [DEBUG] Calculando estrellas: attempts=${attempts}, errors=${errors}, time=${timeSpent}`);
    let stars = 0;
    
    if (errors === 0 && timeSpent < 60) {
      stars = 3; // Perfecto y rápido
    } else if (errors <= 1 && timeSpent < 120) {
      stars = 2; // Muy bien
    } else if (errors <= 3) {
      stars = 1; // Bien
    } else {
      stars = 0; // Necesita mejorar
    }

    console.log(`⭐ [DEBUG] Estrellas calculadas: ${stars}`);
    return stars;
  }, []);

  // Verificar si es una mejora respecto al intento anterior
  const checkImprovement = useCallback((lessonId: number, stepId: number, currentErrors: number, currentTime: number) => {
    console.log(`📈 [DEBUG] Verificando mejora: lesson=${lessonId}, step=${stepId}, errors=${currentErrors}, time=${currentTime}`);
    
    const previousProgress = userProgress.getProgressByStep(lessonId, stepId);
    console.log(`📈 [DEBUG] Progreso anterior:`, previousProgress);
    
    if (!previousProgress) {
      console.log(`📈 [DEBUG] No hay progreso anterior, no es mejora`);
      return false;
    }

    const improvedErrors = currentErrors < previousProgress.errors;
    const improvedTime = currentTime < previousProgress.best_time;
    const isImprovement = improvedErrors || improvedTime;
    
    console.log(`📈 [DEBUG] Mejora detectada: ${isImprovement} (errors: ${improvedErrors}, time: ${improvedTime})`);
    return isImprovement;
  }, [userProgress]);

  // Limpiar errores
  const clearError = useCallback(() => {
    console.log(`🧹 [DEBUG] Limpiando errores`);
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

export default useActivityProgressDebug;