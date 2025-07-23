// src/services/SessionService.ts
import ApiService, { GameSession, SessionStats } from './ApiService';
import AuthService from './AuthService';

export interface SessionData {
  lessonId?: number;
  stepId?: number;
  activityType: string;
  sessionData?: any;
}

export interface SessionEndData {
  completed: boolean;
  starsEarned: number;
  errorsCount: number;
  hintsUsed: number;
  score: number;
  sessionData?: any;
}

class SessionService {
  private currentSession: GameSession | null = null;
  private sessionStartTime: Date | null = null;

  // Start a new game session
  async startSession(sessionData: SessionData): Promise<GameSession | null> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        console.warn('No user logged in, cannot start session');
        return null;
      }

      this.sessionStartTime = new Date();

      const sessionPayload = {
        user_id: user.id,
        lesson_id: sessionData.lessonId,
        step_id: sessionData.stepId,
        activity_type: sessionData.activityType,
        start_time: this.sessionStartTime.toISOString(),
        completed: false,
        stars_earned: 0,
        errors_count: 0,
        hints_used: 0,
        score: 0,
        session_data: sessionData.sessionData,
      };

      const response = await ApiService.startSession(sessionPayload);
      this.currentSession = response.session;

      console.log('Session started:', this.currentSession.ID);
      return this.currentSession;
    } catch (error) {
      console.error('Error starting session:', error);
      return null;
    }
  }

  // End the current session
  async endSession(endData: SessionEndData): Promise<GameSession | null> {
    try {
      if (!this.currentSession) {
        console.warn('No active session to end');
        return null;
      }

      const endTime = new Date();
      const duration = this.sessionStartTime 
        ? Math.floor((endTime.getTime() - this.sessionStartTime.getTime()) / 1000)
        : 0;

      const endPayload = {
        end_time: endTime.toISOString(),
        duration,
        completed: endData.completed,
        stars_earned: endData.starsEarned,
        errors_count: endData.errorsCount,
        hints_used: endData.hintsUsed,
        score: endData.score,
        session_data: endData.sessionData,
      };

      const response = await ApiService.endSession(this.currentSession.ID, endPayload);
      
      console.log('Session ended:', this.currentSession.ID, 'Duration:', duration, 'seconds');
      
      // Clear current session
      const completedSession = this.currentSession;
      this.currentSession = null;
      this.sessionStartTime = null;

      return response.session;
    } catch (error) {
      console.error('Error ending session:', error);
      return null;
    }
  }

  // Update current session (for progress tracking)
  async updateSession(updateData: Partial<SessionEndData>): Promise<GameSession | null> {
    try {
      if (!this.currentSession) {
        console.warn('No active session to update');
        return null;
      }

      const response = await ApiService.updateSession(this.currentSession.ID, updateData);
      this.currentSession = response.session;

      return this.currentSession;
    } catch (error) {
      console.error('Error updating session:', error);
      return null;
    }
  }

  // Get current active session
  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  // Check if there's an active session
  hasActiveSession(): boolean {
    return this.currentSession !== null;
  }

  // Get session duration in seconds
  getSessionDuration(): number {
    if (!this.sessionStartTime) return 0;
    return Math.floor((new Date().getTime() - this.sessionStartTime.getTime()) / 1000);
  }

  // Get user's session history
  async getUserSessions(): Promise<GameSession[]> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        console.warn('No user logged in');
        return [];
      }

      return await ApiService.getUserSessions(user.id);
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  // Get user's session statistics
  async getUserSessionStats(): Promise<SessionStats | null> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        console.warn('No user logged in');
        return null;
      }

      return await ApiService.getUserSessionStats(user.id);
    } catch (error) {
      console.error('Error getting user session stats:', error);
      return null;
    }
  }

  // Get sessions for a specific lesson
  async getLessonSessions(lessonId: number): Promise<GameSession[]> {
    try {
      return await ApiService.getLessonSessions(lessonId);
    } catch (error) {
      console.error('Error getting lesson sessions:', error);
      return [];
    }
  }

  // Get sessions for a specific step
  async getStepSessions(stepId: number): Promise<GameSession[]> {
    try {
      return await ApiService.getStepSessions(stepId);
    } catch (error) {
      console.error('Error getting step sessions:', error);
      return [];
    }
  }

  // Force end session (for cleanup)
  forceEndSession(): void {
    if (this.currentSession) {
      console.log('Force ending session:', this.currentSession.ID);
      this.currentSession = null;
      this.sessionStartTime = null;
    }
  }

  // Auto-save session progress (call periodically during gameplay)
  async autoSaveProgress(progressData: Partial<SessionEndData>): Promise<void> {
    try {
      if (!this.currentSession) return;

      // Update session with current progress without ending it
      await this.updateSession(progressData);
    } catch (error) {
      console.error('Error auto-saving session progress:', error);
    }
  }

  // Get session analytics for dashboard
  async getSessionAnalytics(): Promise<{
    todaySessions: number;
    weekSessions: number;
    totalPlayTime: number;
    averageSessionTime: number;
    completionRate: number;
  } | null> {
    try {
      const sessions = await this.getUserSessions();
      if (sessions.length === 0) {
        return {
          todaySessions: 0,
          weekSessions: 0,
          totalPlayTime: 0,
          averageSessionTime: 0,
          completionRate: 0,
        };
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const todaySessions = sessions.filter(session => 
        new Date(session.start_time) >= today
      ).length;

      const weekSessions = sessions.filter(session => 
        new Date(session.start_time) >= weekAgo
      ).length;

      const totalPlayTime = sessions.reduce((total, session) => total + session.duration, 0);
      const averageSessionTime = totalPlayTime / sessions.length;
      const completedSessions = sessions.filter(session => session.completed).length;
      const completionRate = (completedSessions / sessions.length) * 100;

      return {
        todaySessions,
        weekSessions,
        totalPlayTime,
        averageSessionTime,
        completionRate,
      };
    } catch (error) {
      console.error('Error getting session analytics:', error);
      return null;
    }
  }
}

export default new SessionService();