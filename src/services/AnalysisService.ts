// src/services/AnalysisService.ts
// Servicio para análisis y reportes de progreso neurodivergente

import { API_CONFIG } from '../config/api';

// ==================== INTERFACES ====================

export interface NeurodivergentProfile {
  ID?: number;
  user_id?: number;
  primary_diagnosis: string; // "TDAH" | "TEA" | "Dislexia" | "Discalculia" | etc.
  secondary_diagnosis?: string; // JSON string
  severity: string; // "Leve" | "Moderado" | "Severo"
  diagnosis_date: string; // "2023-05-15"
  diagnosed_by?: string;
  characteristics?: string; // JSON string
  difficulty_areas?: string; // JSON string
  strength_areas?: string; // JSON string
  special_needs?: string; // JSON string
  therapeutic_goals?: string; // JSON string
  clinical_notes?: string;
}

export interface QuickAnalysis {
  user_id: number;
  period: string;
  data: {
    overall_progress: {
      period: {
        start: string;
        end: string;
      };
      total_sessions: number;
      average_errors: number;
      average_attempts: number;
      average_stars: number;
      average_duration: number;
      error_rate: number;
      help_usage_rate: number;
      perfect_run_rate: number;
      total_help_used: number;
      improvement_indicators: {
        error_rate_change: number;
        stars_change: number;
        is_improving: boolean;
      };
    };
    neurodivergent_analysis: {
      diagnosis: string;
      severity: string;
      total_sessions: number;
      // Métricas específicas según el tipo de diagnóstico
      attention_metrics?: {
        average_session_duration: number;
        abandonment_rate: number;
        attention_score: number;
      };
      impulsivity_metrics?: {
        average_errors_per_session: number;
        impulsivity_score: number;
      };
      self_regulation_metrics?: {
        help_usage_rate: number;
        auto_regulation_score: number;
      };
      tdah_progress_score?: number;
      tea_progress_score?: number;
      dislexia_progress_score?: number;
      interpretation: string;
      recommendations: string[];
    };
  };
}

export interface MonthlyAnalysis extends QuickAnalysis {
  data: QuickAnalysis['data'] & {
    trends: {
      period: {
        start: string;
        end: string;
      };
      first_half: any;
      second_half: any;
      trends: {
        error_rate: string;
        completion_time: string;
        help_usage: string;
        stars: string;
      };
      overall_trend: string;
    };
    activity_analysis: {
      period: {
        start: string;
        end: string;
      };
      activity_metrics: {
        [key: string]: {
          session_count: number;
          avg_errors: number;
          avg_attempts: number;
          avg_stars: number;
          avg_duration: number;
          error_rate: number;
          help_usage_rate: number;
        };
      };
      strength_areas: string[];
      weakness_areas: string[];
      recommendations: string[];
    };
  };
}

export interface ProgressReport {
  ID: number;
  user_id: number;
  report_type: string;
  start_date: string;
  end_date: string;
  generated_at: string;
  generated_by: string;
  report_data: string;
  summary: string;
  recommendations: string;
  status: string;
  visibility: string;
}

export interface Milestone {
  ID?: number;
  user_id?: number;
  milestone_type: string;
  title: string;
  description: string;
  achieved_at: string;
  activity_type?: string;
  session_id?: number;
  significance: string; // "minor" | "moderate" | "major"
  notes?: string;
}

// ==================== SERVICIO ====================

class AnalysisServiceClass {
  private baseUrl = API_CONFIG.BASE_URL;

  // Helper para manejar errores
  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || error.message || 'Error en la petición');
    }
    return response.json();
  }

  // ==================== PERFILES NEURODIVERGENTES ====================

  /**
   * Crear perfil neurodivergente para un usuario
   */
  async createNeurodivergentProfile(
    userId: number,
    profile: NeurodivergentProfile
  ): Promise<{ message: string; profile: NeurodivergentProfile }> {
    try {
      console.log('📝 Creando perfil neurodivergente para usuario:', userId);
      const response = await fetch(
        `${this.baseUrl}/neurodivergent/user/${userId}/profile`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error creando perfil:', error);
      throw error;
    }
  }

  /**
   * Obtener perfil neurodivergente de un usuario
   */
  async getNeurodivergentProfile(
    userId: number
  ): Promise<NeurodivergentProfile | null> {
    try {
      console.log('🔍 Obteniendo perfil neurodivergente para usuario:', userId);
      const response = await fetch(
        `${this.baseUrl}/neurodivergent/user/${userId}/profile`
      );
      
      if (response.status === 404) {
        console.log('ℹ️ Usuario no tiene perfil neurodivergente');
        return null;
      }
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      throw error;
    }
  }

  /**
   * Actualizar perfil neurodivergente
   */
  async updateNeurodivergentProfile(
    userId: number,
    profile: Partial<NeurodivergentProfile>
  ): Promise<{ message: string; profile: NeurodivergentProfile }> {
    try {
      console.log('📝 Actualizando perfil neurodivergente para usuario:', userId);
      const response = await fetch(
        `${this.baseUrl}/neurodivergent/user/${userId}/profile`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      throw error;
    }
  }

  // ==================== ANÁLISIS ====================

  /**
   * Obtener análisis rápido (últimos 7 días)
   */
  async getQuickAnalysis(userId: number): Promise<QuickAnalysis> {
    try {
      console.log('📊 Obteniendo análisis rápido para usuario:', userId);
      const response = await fetch(
        `${this.baseUrl}/analysis/user/${userId}/quick`
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error obteniendo análisis rápido:', error);
      throw error;
    }
  }

  /**
   * Obtener análisis mensual completo
   */
  async getMonthlyAnalysis(userId: number): Promise<MonthlyAnalysis> {
    try {
      console.log('📊 Obteniendo análisis mensual para usuario:', userId);
      const response = await fetch(
        `${this.baseUrl}/analysis/user/${userId}/monthly`
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error obteniendo análisis mensual:', error);
      throw error;
    }
  }

  /**
   * Obtener análisis de progreso general con fechas personalizadas
   */
  async getProgressAnalysis(
    userId: number,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      console.log('📊 Obteniendo análisis de progreso para usuario:', userId);
      const params = new URLSearchParams();
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);
      
      const url = `${this.baseUrl}/analysis/user/${userId}/progress${
        params.toString() ? '?' + params.toString() : ''
      }`;
      
      const response = await fetch(url);
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error obteniendo análisis de progreso:', error);
      throw error;
    }
  }

  /**
   * Obtener análisis de tendencias
   */
  async getTrendsAnalysis(
    userId: number,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      console.log('📈 Obteniendo análisis de tendencias para usuario:', userId);
      const params = new URLSearchParams();
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);
      
      const url = `${this.baseUrl}/analysis/user/${userId}/trends${
        params.toString() ? '?' + params.toString() : ''
      }`;
      
      const response = await fetch(url);
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error obteniendo análisis de tendencias:', error);
      throw error;
    }
  }

  /**
   * Obtener análisis por tipo de actividad
   */
  async getActivityAnalysis(
    userId: number,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      console.log('🎮 Obteniendo análisis por actividad para usuario:', userId);
      const params = new URLSearchParams();
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);
      
      const url = `${this.baseUrl}/analysis/user/${userId}/by-activity${
        params.toString() ? '?' + params.toString() : ''
      }`;
      
      const response = await fetch(url);
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error obteniendo análisis por actividad:', error);
      throw error;
    }
  }

  /**
   * Obtener análisis específico por neurodivergencia
   */
  async getNeurodivergentAnalysis(
    userId: number,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      console.log('🧠 Obteniendo análisis neurodivergente para usuario:', userId);
      const params = new URLSearchParams();
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);
      
      const url = `${this.baseUrl}/analysis/user/${userId}/neurodivergent${
        params.toString() ? '?' + params.toString() : ''
      }`;
      
      const response = await fetch(url);
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error obteniendo análisis neurodivergente:', error);
      throw error;
    }
  }

  // ==================== REPORTES ====================

  /**
   * Generar reporte de progreso
   */
  async generateReport(
    userId: number,
    reportType: 'weekly' | 'monthly' | 'quarterly' | 'custom',
    startDate: string,
    endDate: string
  ): Promise<{ message: string; report: ProgressReport }> {
    try {
      console.log('📄 Generando reporte para usuario:', userId);
      const response = await fetch(
        `${this.baseUrl}/analysis/user/${userId}/report`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report_type: reportType,
            start_date: startDate,
            end_date: endDate,
          }),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error generando reporte:', error);
      throw error;
    }
  }

  // ==================== HITOS ====================

  /**
   * Registrar hito de desarrollo
   */
  async recordMilestone(
    userId: number,
    milestone: Milestone
  ): Promise<{ message: string; milestone: Milestone }> {
    try {
      console.log('🏆 Registrando hito para usuario:', userId);
      const response = await fetch(
        `${this.baseUrl}/neurodivergent/user/${userId}/milestone`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(milestone),
        }
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error registrando hito:', error);
      throw error;
    }
  }

  /**
   * Obtener hitos de un usuario
   */
  async getMilestones(
    userId: number
  ): Promise<{ milestones: Milestone[]; count: number }> {
    try {
      console.log('🏆 Obteniendo hitos para usuario:', userId);
      const response = await fetch(
        `${this.baseUrl}/neurodivergent/user/${userId}/milestones`
      );
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error obteniendo hitos:', error);
      throw error;
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Verificar si el usuario tiene perfil neurodivergente
   */
  async hasNeurodivergentProfile(userId: number): Promise<boolean> {
    try {
      const profile = await this.getNeurodivergentProfile(userId);
      return profile !== null && profile.ID !== undefined;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener diagnóstico del usuario (si existe)
   */
  async getUserDiagnosis(userId: number): Promise<string | null> {
    try {
      const profile = await this.getNeurodivergentProfile(userId);
      return profile?.primary_diagnosis || null;
    } catch (error) {
      return null;
    }
  }
}

// Exportar instancia única (singleton)
export const AnalysisService = new AnalysisServiceClass();
export default AnalysisService;

