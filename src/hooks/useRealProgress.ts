// src/hooks/useRealProgress.ts
import { useState, useCallback } from 'react';
import ProgressService, { CompleteProgressData } from '../services/ProgressService';
import AuthService from '../services/AuthService';

interface UseRealProgressReturn {
  isLoading: boolean;
  error: string | null;
  completeStep: (stepData: Omit<CompleteProgressData, 'lessonId' | 'stepId'> & { lessonId: number; stepId: number }) => Promise<boolean>;
  clearError: () => void;
}

export const useRealProgress = (): UseRealProgressReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const completeStep = useCallback(async (stepData: Omit<CompleteProgressData, 'lessonId' | 'stepId'> & { lessonId: number; stepId: number }): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const user = AuthService.getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('🚀 [useRealProgress] Guardando progreso del paso:', {
        userId: user.id,
        lessonId: stepData.lessonId,
        stepId: stepData.stepId,
        stars: stepData.stars,
        attempts: stepData.attempts,
        errors: stepData.errors,
        timeSpent: stepData.timeSpent,
        perfectRun: stepData.perfectRun,
        usedHelp: stepData.usedHelp,
        helpActivations: stepData.helpActivations,
      });

      const result = await ProgressService.saveCompleteProgress(user.id, stepData);
      
      console.log('✅ [useRealProgress] Progreso guardado exitosamente:', result);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al guardar progreso';
      console.error('❌ [useRealProgress] Error guardando progreso:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    completeStep,
    clearError,
  };
};