// src/services/ProgressService.ts
import ApiService from './ApiService';

export interface CompleteProgressData {
  lessonId: number;
  stepId: number;
  stars: number;
  attempts: number;
  errors: number;
  timeSpent: number;
  usedHelp: boolean;
  helpActivations: number;
  perfectRun: boolean;
}

export interface ProgressAnalytics {
  totalSessions: number;
  totalPlayTime: number;
  averageStars: number;
  completionRate: number;
  improvementTrend: number;
  strongestAreas: string[];
  areasForImprovement: string[];
}

class ProgressService {
  // Guardar progreso completo (sesión + progreso + logros + estadísticas)
  async saveCompleteProgress(userId: number, progressData: CompleteProgressData) {
    try {
      console.log('📊 [ProgressService] Iniciando guardado de progreso completo:', {
        userId,
        lessonId: progressData.lessonId,
        stepId: progressData.stepId,
        stars: progressData.stars,
        attempts: progressData.attempts,
        errors: progressData.errors,
        timeSpent: progressData.timeSpent,
        usedHelp: progressData.usedHelp,
        helpActivations: progressData.helpActivations,
        perfectRun: progressData.perfectRun,
      });

      // 1. Iniciar sesión
      const sessionResponse = await ApiService.startSession({
        user_id: userId,
        lesson_id: progressData.lessonId,
        step_id: progressData.stepId,
        activity_type: 'lesson_step',
        start_time: new Date().toISOString(),
      });

      const sessionId = sessionResponse.session.ID;
      console.log('✅ [ProgressService] Sesión iniciada con ID:', sessionId);

      // 2. Finalizar sesión con campos correctos que espera el backend
      const sessionEndData = {
        end_time: new Date().toISOString(),
        duration: progressData.timeSpent * 1000, // Backend espera milisegundos
        total_attempts: progressData.attempts,
        errors: progressData.errors,
        stars: progressData.stars,
        completion_time: progressData.timeSpent * 1000, // Backend espera milisegundos
        perfect_run: progressData.perfectRun,
        used_help: progressData.usedHelp,
        help_activations: progressData.helpActivations,
      };

      console.log('📤 [ProgressService] DATOS MAPEADOS PARA EL BACKEND:');
      console.log('⏱️ Duration (ms):', sessionEndData.duration);
      console.log('🔄 Total attempts:', sessionEndData.total_attempts);
      console.log('❌ Errors:', sessionEndData.errors);
      console.log('⭐ Stars:', sessionEndData.stars);
      console.log('⏱️ Completion time (ms):', sessionEndData.completion_time);
      console.log('🏆 Perfect run:', sessionEndData.perfect_run);
      console.log('🤝 Used help:', sessionEndData.used_help);
      console.log('💡 Help activations:', sessionEndData.help_activations);
      
      await ApiService.endSession(sessionId, sessionEndData);

      console.log('✅ [ProgressService] Sesión finalizada exitosamente con datos corregidos');

      // 3. Guardar progreso del usuario
      const progressResponse = await ApiService.saveUserProgress(userId, {
        lesson_id: progressData.lessonId,
        step_id: progressData.stepId,
        completed: true,
        stars: progressData.stars,
        attempts: progressData.attempts,
        errors: progressData.errors,
        best_time: progressData.timeSpent,
      });

      console.log('✅ [ProgressService] Progreso del usuario guardado');

      // 4. Actualizar estadísticas del usuario
      try {
        const currentStats = await ApiService.getUserStats(userId);
        const updatedStats = {
          total_activities_completed: currentStats.stats.total_activities_completed + 1,
          total_stars_earned: currentStats.stats.total_stars_earned + progressData.stars,
          total_play_time: currentStats.stats.total_play_time + (progressData.timeSpent * 1000), // Convertir a ms
          helpful_attempts: currentStats.stats.helpful_attempts + (progressData.usedHelp ? 1 : 0),
          improvement_moments: currentStats.stats.improvement_moments + (progressData.perfectRun ? 1 : 0),
          exploration_points: currentStats.stats.exploration_points + (progressData.stars * 10),
          last_activity_date: new Date().toISOString(),
        };

        console.log('📊 [ProgressService] Actualizando estadísticas del usuario:', updatedStats);
        
        await ApiService.updateUserStats(userId, updatedStats);

        console.log('✅ [ProgressService] Estadísticas del usuario actualizadas');
      } catch (statsError) {
        console.warn('⚠️ [ProgressService] Error actualizando estadísticas (continuando):', statsError);
      }

      // 5. Actualizar progreso de logros
      try {
        await this.updateAchievementProgress(userId, progressData);
        console.log('✅ [ProgressService] Progreso de logros actualizado');
      } catch (achievementError) {
        console.warn('⚠️ [ProgressService] Error actualizando logros (continuando):', achievementError);
      }

      return {
        session: sessionResponse.session,
        progress: progressResponse.progress,
        message: 'Progress saved successfully',
      };
    } catch (error) {
      console.error('❌ [ProgressService] Error guardando progreso completo:', error);
      throw error;
    }
  }

  // Actualizar progreso de logros basado en la actividad completada
  private async updateAchievementProgress(userId: number, progressData: CompleteProgressData) {
    try {
      console.log('🏆 [ProgressService] Actualizando progreso de logros...');

      // Logro: Completar primera lección
      await ApiService.updateAchievementProgress(userId, 1, 1);
      
      // Logro: Completar 5 lecciones
      await ApiService.updateAchievementProgress(userId, 2, 1);
      
      // Logro: Ganar 10 estrellas
      await ApiService.updateAchievementProgress(userId, 3, progressData.stars);
      
      // Logro: Lección perfecta
      if (progressData.perfectRun) {
        await ApiService.updateAchievementProgress(userId, 4, 1);
      }
      
      // Logro: Completar rápido (menos de 1 minuto)
      if (progressData.timeSpent < 60) {
        await ApiService.updateAchievementProgress(userId, 5, 1);
      }
      
      // Logro: Usar ayuda 5 veces
      if (progressData.usedHelp) {
        await ApiService.updateAchievementProgress(userId, 9, progressData.helpActivations);
      }
      
      // Logro: Ganar 50 estrellas
      await ApiService.updateAchievementProgress(userId, 7, progressData.stars);
      
      // Logro: Ganar 100 estrellas
      await ApiService.updateAchievementProgress(userId, 13, progressData.stars);
    } catch (error) {
      console.error('❌ [ProgressService] Error actualizando progreso de logros:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  // Obtener análisis completo del progreso del usuario
  async getProgressAnalytics(userId: number): Promise<ProgressAnalytics> {
    try {
      const [userProgress, userStats, userSessions, userAchievements] = await Promise.all([
        ApiService.getUserProgress(userId),
        ApiService.getUserStats(userId),
        ApiService.getUserSessions(userId),
        ApiService.getUserAchievements(userId),
      ]);

      const progress = userProgress.progress || [];
      const sessions = userSessions || [];
      const stats = userStats.stats;

      // Calcular métricas
      const totalSessions = sessions.length;
      const totalPlayTime = stats.total_play_time;
      const averageStars = stats.total_activities_completed > 0 
        ? stats.total_stars_earned / stats.total_activities_completed 
        : 0;
      
      const completedSteps = progress.filter(p => p.completed).length;
      const completionRate = progress.length > 0 ? (completedSteps / progress.length) * 100 : 0;

      // Calcular tendencia de mejora (últimas 10 sesiones vs primeras 10)
      const recentSessions = sessions.slice(-10);
      const oldSessions = sessions.slice(0, 10);
      const recentAvgStars = recentSessions.length > 0 
        ? recentSessions.reduce((sum, s) => sum + s.stars_earned, 0) / recentSessions.length 
        : 0;
      const oldAvgStars = oldSessions.length > 0 
        ? oldSessions.reduce((sum, s) => sum + s.stars_earned, 0) / oldSessions.length 
        : 0;
      const improvementTrend = recentAvgStars - oldAvgStars;

      // Identificar áreas fuertes y de mejora
      const lessonStats = this.analyzeLessonPerformance(progress);
      const strongestAreas = lessonStats
        .filter(l => l.averageStars >= 2.5)
        .map(l => `Lección ${l.lessonId}`)
        .slice(0, 3);
      
      const areasForImprovement = lessonStats
        .filter(l => l.averageStars < 2)
        .map(l => `Lección ${l.lessonId}`)
        .slice(0, 3);

      return {
        totalSessions,
        totalPlayTime,
        averageStars,
        completionRate,
        improvementTrend,
        strongestAreas,
        areasForImprovement,
      };
    } catch (error) {
      console.error('Error getting progress analytics:', error);
      throw error;
    }
  }

  // Analizar rendimiento por lección
  private analyzeLessonPerformance(progress: any[]) {
    const lessonMap = new Map();
    
    progress.forEach(p => {
      if (!lessonMap.has(p.lesson_id)) {
        lessonMap.set(p.lesson_id, {
          lessonId: p.lesson_id,
          totalStars: 0,
          totalSteps: 0,
          completedSteps: 0,
        });
      }
      
      const lesson = lessonMap.get(p.lesson_id);
      lesson.totalStars += p.stars;
      lesson.totalSteps += 1;
      if (p.completed) lesson.completedSteps += 1;
    });
    
    return Array.from(lessonMap.values()).map(lesson => ({
      ...lesson,
      averageStars: lesson.totalSteps > 0 ? lesson.totalStars / lesson.totalSteps : 0,
      completionRate: lesson.totalSteps > 0 ? (lesson.completedSteps / lesson.totalSteps) * 100 : 0,
    }));
  }

  // Obtener resumen de progreso para dashboard
  async getProgressSummary(userId: number) {
    try {
      const [userProgress, userStats, userAchievements] = await Promise.all([
        ApiService.getUserProgress(userId),
        ApiService.getUserStats(userId),
        ApiService.getUserAchievements(userId),
      ]);

      const progress = userProgress.progress || [];
      const stats = userStats.stats;
      const achievements = userAchievements || [];

      const completedSteps = progress.filter(p => p.completed).length;
      const totalSteps = progress.length;
      const unlockedAchievements = achievements.filter(a => a.is_unlocked).length;
      const totalAchievements = achievements.length;

      return {
        progress: {
          completedSteps,
          totalSteps,
          completionRate: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
        },
        stats: {
          totalStars: stats.total_stars_earned,
          totalPlayTime: stats.total_play_time,
          activitiesCompleted: stats.total_activities_completed,
          daysPlaying: stats.days_playing,
        },
        achievements: {
          unlocked: unlockedAchievements,
          total: totalAchievements,
          unlockedRate: totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0,
        },
      };
    } catch (error) {
      console.error('Error getting progress summary:', error);
      throw error;
    }
  }

  // Sincronizar progreso offline (para cuando la app vuelve online)
  async syncOfflineProgress(offlineProgressData: CompleteProgressData[]) {
    const results = [];
    
    for (const progressData of offlineProgressData) {
      try {
        // Corregir la llamada - necesita userId como primer parámetro
        const result = await this.saveCompleteProgress(progressData.lessonId, progressData);
        results.push({ success: true, data: result });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        results.push({ success: false, error: errorMessage, data: progressData });
      }
    }
    
    return results;
  }

  // Obtener estadísticas de rendimiento por período
  async getPerformanceStats(userId: number, days: number = 7) {
    try {
      const sessions = await ApiService.getUserSessions(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentSessions = sessions.filter(session => 
        new Date(session.CreatedAt) >= cutoffDate
      );

      if (recentSessions.length === 0) {
        return {
          totalSessions: 0,
          averageStars: 0,
          totalPlayTime: 0,
          improvementRate: 0,
        };
      }

      const totalSessions = recentSessions.length;
      const totalStars = recentSessions.reduce((sum, s) => sum + s.stars_earned, 0);
      const totalPlayTime = recentSessions.reduce((sum, s) => sum + s.duration, 0);
      const averageStars = totalStars / totalSessions;

      // Calcular tasa de mejora comparando primera mitad vs segunda mitad
      const midPoint = Math.floor(totalSessions / 2);
      const firstHalf = recentSessions.slice(0, midPoint);
      const secondHalf = recentSessions.slice(midPoint);

      const firstHalfAvg = firstHalf.length > 0 
        ? firstHalf.reduce((sum, s) => sum + s.stars_earned, 0) / firstHalf.length 
        : 0;
      const secondHalfAvg = secondHalf.length > 0 
        ? secondHalf.reduce((sum, s) => sum + s.stars_earned, 0) / secondHalf.length 
        : 0;

      const improvementRate = firstHalfAvg > 0 
        ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 
        : 0;

      return {
        totalSessions,
        averageStars,
        totalPlayTime,
        improvementRate,
      };
    } catch (error) {
      console.error('Error getting performance stats:', error);
      throw error;
    }
  }
}

export default new ProgressService();