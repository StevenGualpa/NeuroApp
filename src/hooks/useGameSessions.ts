// src/hooks/useGameSessions.ts
import { useState, useEffect, useCallback } from 'react';
import ApiService, { GameSession } from '../services/ApiService';

export interface SessionData {
  user_id: number;
  lesson_id?: number;
  step_id?: number;
  activity_type?: string;
}

export interface SessionEndData {
  total_attempts: number;
  errors: number;
  stars: number;
  completion_time: number;
  perfect_run: boolean;
  used_help: boolean;
  help_activations: number;
}

export interface SessionUpdateData {
  total_attempts?: number;
  errors?: number;
  used_help?: boolean;
  help_activations?: number;
}

export interface SessionStats {
  total_sessions: number;
  total_duration: number;
  average_duration: number;
  total_stars: number;
  average_stars: number;
  completion_rate: number;
  favorite_activity: string;
  best_streak: number;
  current_streak: number;
}

export const useGameSessions = () => {
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [userSessions, setUserSessions] = useState<GameSession[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Iniciar nueva sesión
  const startSession = useCallback(async (sessionData: SessionData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.startSession(sessionData);
      setCurrentSession(response.session);
      
      return response.session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error starting session';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar sesión en progreso
  const updateSession = useCallback(async (sessionId: number, updateData: SessionUpdateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.updateSession(sessionId, updateData);
      setCurrentSession(response.session);
      
      return response.session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating session';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Finalizar sesión
  const endSession = useCallback(async (sessionId: number, endData: SessionEndData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.endSession(sessionId, endData);
      setCurrentSession(null); // Limpiar sesión actual
      
      return response.session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error ending session';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener sesión por ID
  const getSessionById = useCallback(async (sessionId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const session = await ApiService.getSessionById(sessionId);
      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching session';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener sesiones del usuario
  const getUserSessions = useCallback(async (userId: number, limit?: number, offset?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint = `/sessions/user/${userId}`;
      if (limit || offset) {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        if (offset) params.append('offset', offset.toString());
        endpoint += `?${params.toString()}`;
      }
      
      const sessions = await ApiService.getUserSessions(userId);
      setUserSessions(sessions);
      
      return sessions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching user sessions';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener estadísticas de sesiones del usuario
  const getUserSessionStats = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const stats = await ApiService.getUserSessionStats(userId);
      setSessionStats(stats);
      
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching session stats';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener sesiones por lección
  const getLessonSessions = useCallback(async (lessonId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const sessions = await ApiService.getLessonSessions(lessonId);
      return sessions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching lesson sessions';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener sesiones por paso
  const getStepSessions = useCallback(async (stepId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const sessions = await ApiService.getStepSessions(stepId);
      return sessions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching step sessions';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Limpiar sesión actual
  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  return {
    // Estado
    currentSession,
    userSessions,
    sessionStats,
    loading,
    error,
    
    // Acciones
    startSession,
    updateSession,
    endSession,
    getSessionById,
    getUserSessions,
    getUserSessionStats,
    getLessonSessions,
    getStepSessions,
    clearError,
    clearCurrentSession,
  };
};

export default useGameSessions;