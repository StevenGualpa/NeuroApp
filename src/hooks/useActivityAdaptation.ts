// src/hooks/useActivityAdaptation.ts
// Hook para usar adaptaciones de actividades en componentes

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import AnalysisService, { NeurodivergentProfile } from '../services/AnalysisService';
import ActivityAdaptationService, { ActivityAdaptation } from '../services/ActivityAdaptationService';

export const useActivityAdaptation = () => {
  const { user } = useAuth();
  const [neurodivergentProfile, setNeurodivergentProfile] = useState<NeurodivergentProfile | null>(null);
  const [adaptation, setAdaptation] = useState<ActivityAdaptation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadAdaptation();
    }
  }, [user]);

  const loadAdaptation = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔍 [useActivityAdaptation] Loading adaptation for user:', user.id);

      // Cargar perfil neurodivergente
      const profile = await AnalysisService.getNeurodivergentProfile(user.id);
      setNeurodivergentProfile(profile);

      // Obtener adaptaciones
      const activityAdaptation = ActivityAdaptationService.getActivityAdaptation(profile);
      setAdaptation(activityAdaptation);

      console.log('✅ [useActivityAdaptation] Adaptation loaded:', activityAdaptation);

    } catch (error) {
      console.error('❌ [useActivityAdaptation] Error loading adaptation:', error);
      // Usar adaptación por defecto en caso de error
      const defaultAdaptation = ActivityAdaptationService.getActivityAdaptation(null);
      setAdaptation(defaultAdaptation);
    } finally {
      setLoading(false);
    }
  };

  const refreshAdaptation = async () => {
    await loadAdaptation();
  };

  // Helpers para aplicar adaptaciones
  const getAdaptedTime = (originalTime: number): number => {
    if (!adaptation) return originalTime;
    return ActivityAdaptationService.applyTimeAdaptation(originalTime, adaptation);
  };

  const getAdaptedDifficulty = (originalDifficulty: number): number => {
    if (!adaptation) return originalDifficulty;
    return ActivityAdaptationService.applyDifficultyAdaptation(originalDifficulty, adaptation);
  };

  const getTextStyle = () => {
    if (!adaptation) return {};
    return ActivityAdaptationService.getTextStyle(adaptation);
  };

  const getButtonStyle = () => {
    if (!adaptation) return {};
    return ActivityAdaptationService.getButtonStyle(adaptation);
  };

  const getContainerStyle = () => {
    if (!adaptation) return {};
    return ActivityAdaptationService.getContainerStyle(adaptation);
  };

  const shouldShowHelp = (helpType: keyof ActivityAdaptation['cognitiveAids']): boolean => {
    if (!adaptation) return false;
    return ActivityAdaptationService.shouldShowHelp(helpType, adaptation);
  };

  const getHelpFrequency = (): number => {
    if (!adaptation) return 30;
    return ActivityAdaptationService.getHelpFrequency(adaptation);
  };

  const getMaxSessionDuration = (): number => {
    if (!adaptation) return 10;
    return ActivityAdaptationService.getMaxSessionDuration(adaptation);
  };

  const getBreakInterval = (): number => {
    if (!adaptation) return 5;
    return ActivityAdaptationService.getBreakInterval(adaptation);
  };

  const getMaxAttempts = (): number => {
    if (!adaptation) return 3;
    return ActivityAdaptationService.getMaxAttempts(adaptation);
  };

  const shouldGiveMoreStars = (): boolean => {
    if (!adaptation) return false;
    return ActivityAdaptationService.shouldGiveMoreStars(adaptation);
  };

  const getAchievementThresholds = (): number[] => {
    if (!adaptation) return [0.8, 0.9, 1.0];
    return ActivityAdaptationService.getAchievementThresholds(adaptation);
  };

  return {
    neurodivergentProfile,
    adaptation,
    loading,
    refreshAdaptation,
    // Helpers
    getAdaptedTime,
    getAdaptedDifficulty,
    getTextStyle,
    getButtonStyle,
    getContainerStyle,
    shouldShowHelp,
    getHelpFrequency,
    getMaxSessionDuration,
    getBreakInterval,
    getMaxAttempts,
    shouldGiveMoreStars,
    getAchievementThresholds,
  };
};
