// src/hooks/useGoals.ts
// Hook para manejar metas y objetivos personalizados

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import AnalysisService, { NeurodivergentProfile } from '../services/AnalysisService';
import GoalsServiceBackend, { DailyGoal, WeeklyGoal, GoalProgress, GoalAchievement } from '../services/GoalsServiceBackend';

export const useGoals = () => {
  const { user } = useAuth();
  const [neurodivergentProfile, setNeurodivergentProfile] = useState<NeurodivergentProfile | null>(null);
  const [todayGoal, setTodayGoal] = useState<DailyGoal | null>(null);
  const [thisWeekGoal, setThisWeekGoal] = useState<WeeklyGoal | null>(null);
  const [goalProgress, setGoalProgress] = useState<GoalProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      initializeGoals();
    }
  }, [user]);

  const initializeGoals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 [useGoals] Initializing goals for user:', user.id);

      // Cargar perfil neurodivergente
      const profile = await AnalysisService.getNeurodivergentProfile(user.id);
      setNeurodivergentProfile(profile);

      // Verificar si ya existe una meta para hoy
      let todayGoalData = await GoalsServiceBackend.getTodayGoal(user.id);
      
      if (!todayGoalData) {
        // Inicializar nueva meta para hoy
        todayGoalData = await GoalsServiceBackend.initializeGoals(user.id, profile);
      }

      setTodayGoal(todayGoalData);

      // Cargar progreso completo
      const progress = await GoalsServiceBackend.getGoalProgress(user.id);
      setGoalProgress(progress);

      console.log('✅ [useGoals] Goals initialized successfully:', {
        todayGoal: todayGoalData,
        progress
      });

    } catch (error) {
      console.error('❌ [useGoals] Error initializing goals:', error);
      setError('Error al cargar las metas');
    } finally {
      setLoading(false);
    }
  };

  const updateActivityProgress = useCallback(async (
    activityType: string,
    sessionData: {
      duration: number; // en segundos
      stars: number;
      completed: boolean;
    }
  ) => {
    if (!user) return;

    try {
      console.log('🔍 [useGoals] Updating activity progress:', { activityType, sessionData });

      const updatedGoal = await GoalsServiceBackend.updateActivityProgress(
        user.id,
        activityType,
        sessionData
      );

      if (updatedGoal) {
        setTodayGoal(updatedGoal);
        
        // Actualizar progreso completo
        const progress = await GoalsServiceBackend.getGoalProgress(user.id);
        setGoalProgress(progress);
        
        console.log('✅ [useGoals] Activity progress updated:', updatedGoal);
      }
    } catch (error) {
      console.error('❌ [useGoals] Error updating activity progress:', error);
    }
  }, [user]);

  const refreshGoals = useCallback(async () => {
    await initializeGoals();
  }, [user]);

  const getTodayProgress = useCallback(() => {
    if (!todayGoal) return null;

    return {
      sessions: {
        completed: todayGoal.completed_sessions,
        target: todayGoal.target_sessions,
        percentage: todayGoal.target_sessions > 0 
          ? Math.round((todayGoal.completed_sessions / todayGoal.target_sessions) * 100)
          : 0,
      },
      time: {
        completed: todayGoal.completed_time,
        target: todayGoal.target_time,
        percentage: todayGoal.target_time > 0 
          ? Math.round((todayGoal.completed_time / todayGoal.target_time) * 100)
          : 0,
      },
      stars: {
        completed: todayGoal.earned_stars,
        target: todayGoal.target_stars,
        percentage: todayGoal.target_stars > 0 
          ? Math.round((todayGoal.earned_stars / todayGoal.target_stars) * 100)
          : 0,
      },
      overall: {
        percentage: todayGoal.completion_percentage,
        isCompleted: todayGoal.is_completed,
      },
    };
  }, [todayGoal]);

  const getWeekProgress = useCallback(() => {
    if (!thisWeekGoal) return null;

    return {
      sessions: {
        completed: thisWeekGoal.completedSessions,
        target: thisWeekGoal.targetSessions,
        percentage: thisWeekGoal.targetSessions > 0 
          ? Math.round((thisWeekGoal.completedSessions / thisWeekGoal.targetSessions) * 100)
          : 0,
      },
      time: {
        completed: thisWeekGoal.completedTime,
        target: thisWeekGoal.targetTime,
        percentage: thisWeekGoal.targetTime > 0 
          ? Math.round((thisWeekGoal.completedTime / thisWeekGoal.targetTime) * 100)
          : 0,
      },
      stars: {
        completed: thisWeekGoal.earnedStars,
        target: thisWeekGoal.targetStars,
        percentage: thisWeekGoal.targetStars > 0 
          ? Math.round((thisWeekGoal.earnedStars / thisWeekGoal.targetStars) * 100)
          : 0,
      },
      overall: {
        percentage: thisWeekGoal.completionPercentage,
        isCompleted: thisWeekGoal.isCompleted,
      },
    };
  }, [thisWeekGoal]);

  const getActivityProgress = useCallback((activityType: string) => {
    if (!todayGoal) return null;

    const activityGoal = todayGoal.activity_goals.find(a => 
      a.activity_type.toLowerCase().includes(activityType.toLowerCase()) ||
      activityType.toLowerCase().includes(a.activity_type.toLowerCase())
    );

    if (!activityGoal) return null;

    return {
      completed: activityGoal.completed_sessions,
      target: activityGoal.target_sessions,
      percentage: activityGoal.target_sessions > 0 
        ? Math.round((activityGoal.completed_sessions / activityGoal.target_sessions) * 100)
        : 0,
      isCompleted: activityGoal.is_completed,
      priority: activityGoal.priority,
    };
  }, [todayGoal]);

  const getNewAchievements = useCallback(() => {
    if (!goalProgress) return [];
    return goalProgress.achievements.filter(achievement => achievement.is_new);
  }, [goalProgress]);

  const markAchievementAsSeen = useCallback(async (achievementId: number) => {
    if (!user) return;

    try {
      await GoalsServiceBackend.markAchievementAsSeen(user.id, achievementId);
      
      // Actualizar el estado local
      if (goalProgress) {
        const updatedAchievements = goalProgress.achievements.map(achievement => 
          achievement.id === achievementId 
            ? { ...achievement, is_new: false }
            : achievement
        );

        setGoalProgress({
          ...goalProgress,
          achievements: updatedAchievements,
        });
      }
    } catch (error) {
      console.error('❌ [useGoals] Error marking achievement as seen:', error);
    }
  }, [user, goalProgress]);

  const getMotivationalMessage = useCallback(() => {
    if (!todayGoal) return '¡Comienza tu día de aprendizaje!';

    const progress = getTodayProgress();
    if (!progress) return '¡Comienza tu día de aprendizaje!';

    const { overall } = progress;

    if (overall.percentage >= 100) {
      return '🎉 ¡Increíble! Has completado todas tus metas de hoy';
    } else if (overall.percentage >= 75) {
      return '🔥 ¡Estás muy cerca! Solo un poco más para completar tus metas';
    } else if (overall.percentage >= 50) {
      return '💪 ¡Vas por buen camino! Continúa así';
    } else if (overall.percentage >= 25) {
      return '🌟 ¡Buen comienzo! Sigue adelante';
    } else {
      return '🚀 ¡Es hora de comenzar! Tú puedes lograrlo';
    }
  }, [todayGoal, getTodayProgress]);

  const getStreakMessage = useCallback(() => {
    if (!goalProgress) return '';

    const { streak } = goalProgress;

    if (streak >= 7) {
      return '🔥 ¡Racha de una semana completa!';
    } else if (streak >= 3) {
      return `🔥 ¡Racha de ${streak} días!`;
    } else if (streak >= 1) {
      return `🌟 ¡${streak} día consecutivo!`;
    } else {
      return '💪 ¡Comienza tu racha hoy!';
    }
  }, [goalProgress]);

  return {
    // Estados
    neurodivergentProfile,
    todayGoal,
    thisWeekGoal,
    goalProgress,
    loading,
    error,

    // Acciones
    updateActivityProgress,
    refreshGoals,
    markAchievementAsSeen,

    // Helpers
    getTodayProgress,
    getWeekProgress,
    getActivityProgress,
    getNewAchievements,
    getMotivationalMessage,
    getStreakMessage,
  };
};
