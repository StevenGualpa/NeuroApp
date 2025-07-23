// src/hooks/useUserStats.ts
import { useState, useEffect, useCallback } from 'react';
import ApiService, { UserStats } from '../services/ApiService';

export interface StatsUpdate {
  total_activities_completed?: number;
  total_stars_earned?: number;
  days_playing?: number;
  favorite_activity?: string;
  total_play_time?: number;
  helpful_attempts?: number;
  improvement_moments?: number;
  exploration_points?: number;
}

export const useUserStats = (userId?: number) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener estadísticas del usuario
  const getUserStats = useCallback(async (targetUserId?: number) => {
    const id = targetUserId || userId;
    if (!id) {
      setError('User ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.getUserStats(id);
      setStats(response.stats);
      
      return response.stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching user stats';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Actualizar estadísticas del usuario
  const updateUserStats = useCallback(async (statsUpdate: StatsUpdate, targetUserId?: number) => {
    const id = targetUserId || userId;
    if (!id) {
      setError('User ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.updateUserStats(id, statsUpdate);
      setStats(response.stats);
      
      return response.stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating user stats';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Incrementar actividades completadas
  const incrementActivitiesCompleted = useCallback(async (increment: number = 1) => {
    if (!stats) return;
    
    const newCount = stats.total_activities_completed + increment;
    return updateUserStats({ total_activities_completed: newCount });
  }, [stats, updateUserStats]);

  // Incrementar estrellas ganadas
  const incrementStarsEarned = useCallback(async (stars: number) => {
    if (!stats || stars <= 0) return;
    
    const newCount = stats.total_stars_earned + stars;
    return updateUserStats({ total_stars_earned: newCount });
  }, [stats, updateUserStats]);

  // Incrementar tiempo de juego
  const incrementPlayTime = useCallback(async (timeInSeconds: number) => {
    if (!stats || timeInSeconds <= 0) return;
    
    const newTime = stats.total_play_time + timeInSeconds;
    return updateUserStats({ total_play_time: newTime });
  }, [stats, updateUserStats]);

  // Incrementar intentos con ayuda
  const incrementHelpfulAttempts = useCallback(async (increment: number = 1) => {
    if (!stats) return;
    
    const newCount = stats.helpful_attempts + increment;
    return updateUserStats({ helpful_attempts: newCount });
  }, [stats, updateUserStats]);

  // Incrementar momentos de mejora
  const incrementImprovementMoments = useCallback(async (increment: number = 1) => {
    if (!stats) return;
    
    const newCount = stats.improvement_moments + increment;
    return updateUserStats({ improvement_moments: newCount });
  }, [stats, updateUserStats]);

  // Incrementar puntos de exploración
  const incrementExplorationPoints = useCallback(async (points: number) => {
    if (!stats || points <= 0) return;
    
    const newPoints = stats.exploration_points + points;
    return updateUserStats({ exploration_points: newPoints });
  }, [stats, updateUserStats]);

  // Actualizar actividad favorita
  const updateFavoriteActivity = useCallback(async (activity: string) => {
    return updateUserStats({ favorite_activity: activity });
  }, [updateUserStats]);

  // Incrementar días jugando
  const incrementDaysPlaying = useCallback(async (increment: number = 1) => {
    if (!stats) return;
    
    const newDays = stats.days_playing + increment;
    return updateUserStats({ days_playing: newDays });
  }, [stats, updateUserStats]);

  // Actualizar estadísticas después de completar una actividad
  const updateStatsAfterActivity = useCallback(async (activityData: {
    stars: number;
    timeSpent: number;
    usedHelp: boolean;
    activityType: string;
    improved: boolean;
  }) => {
    if (!stats) return;

    const updates: StatsUpdate = {
      total_activities_completed: stats.total_activities_completed + 1,
      total_stars_earned: stats.total_stars_earned + activityData.stars,
      total_play_time: stats.total_play_time + activityData.timeSpent,
    };

    if (activityData.usedHelp) {
      updates.helpful_attempts = stats.helpful_attempts + 1;
    }

    if (activityData.improved) {
      updates.improvement_moments = stats.improvement_moments + 1;
    }

    // Actualizar actividad favorita si es necesario
    if (activityData.activityType) {
      updates.favorite_activity = activityData.activityType;
    }

    // Agregar puntos de exploración basados en las estrellas
    updates.exploration_points = stats.exploration_points + (activityData.stars * 10);

    return updateUserStats(updates);
  }, [stats, updateUserStats]);

  // Obtener estadísticas formateadas para mostrar
  const getFormattedStats = useCallback(() => {
    if (!stats) return null;

    return {
      activitiesCompleted: stats.total_activities_completed,
      starsEarned: stats.total_stars_earned,
      daysPlaying: stats.days_playing,
      favoriteActivity: stats.favorite_activity || 'Ninguna',
      playTimeFormatted: formatPlayTime(stats.total_play_time),
      helpfulAttempts: stats.helpful_attempts,
      improvementMoments: stats.improvement_moments,
      explorationPoints: stats.exploration_points,
      lastActivityDate: stats.last_activity_date,
    };
  }, [stats]);

  // Formatear tiempo de juego
  const formatPlayTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Calcular promedio de estrellas por actividad
  const getAverageStars = useCallback(() => {
    if (!stats || stats.total_activities_completed === 0) return 0;
    return stats.total_stars_earned / stats.total_activities_completed;
  }, [stats]);

  // Calcular tiempo promedio por actividad
  const getAveragePlayTime = useCallback(() => {
    if (!stats || stats.total_activities_completed === 0) return 0;
    return stats.total_play_time / stats.total_activities_completed;
  }, [stats]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cargar estadísticas automáticamente cuando se proporciona userId
  useEffect(() => {
    if (userId) {
      getUserStats();
    }
  }, [userId, getUserStats]);

  return {
    // Estado
    stats,
    loading,
    error,
    
    // Acciones principales
    getUserStats,
    updateUserStats,
    
    // Incrementadores específicos
    incrementActivitiesCompleted,
    incrementStarsEarned,
    incrementPlayTime,
    incrementHelpfulAttempts,
    incrementImprovementMoments,
    incrementExplorationPoints,
    incrementDaysPlaying,
    updateFavoriteActivity,
    
    // Acciones compuestas
    updateStatsAfterActivity,
    
    // Utilidades
    getFormattedStats,
    getAverageStars,
    getAveragePlayTime,
    clearError,
  };
};

export default useUserStats;