// src/hooks/useAchievementModalSequence.ts
import { useState, useCallback, useEffect } from 'react';
import { useAchievementContext } from '../contexts/AchievementContext';

interface UseAchievementModalSequenceReturn {
  shouldShowModal: boolean;
  setShouldShowModal: (show: boolean) => void;
  handleGameCompletion: (completionData: any) => Promise<void>;
}

/**
 * Hook para manejar la secuencia: Notificación de logro → Modal de éxito
 * Primero se muestra la notificación de logros, luego el modal de éxito
 */
export const useAchievementModalSequence = (): UseAchievementModalSequenceReturn => {
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState<any>(null);
  const [fallbackTimeout, setFallbackTimeout] = useState<NodeJS.Timeout | null>(null);
  const { recordGameCompletion, onAchievementNotificationHidden } = useAchievementContext();

  // Escuchar cuando se oculta la notificación de logros
  useEffect(() => {
    const unsubscribe = onAchievementNotificationHidden(() => {
      console.log('🔔 [AchievementModalSequence] Notificación de logro oculta, mostrando modal...');
      
      // Limpiar timeout de respaldo
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
        setFallbackTimeout(null);
      }
      
      // Si hay una finalización pendiente, mostrar el modal
      if (pendingCompletion) {
        setShouldShowModal(true);
        setPendingCompletion(null);
      }
    });

    return unsubscribe;
  }, [onAchievementNotificationHidden, pendingCompletion, fallbackTimeout]);

  const handleGameCompletion = useCallback(async (completionData: any) => {
    console.log('🎮 [AchievementModalSequence] Procesando finalización de juego...');
    
    try {
      // Registrar la finalización (esto puede mostrar notificaciones de logros)
      await recordGameCompletion(completionData);
      
      // Guardar los datos de finalización para mostrar el modal después
      setPendingCompletion(completionData);
      
      // Timeout de respaldo: si no se muestra notificación en 1 segundo, mostrar modal directamente
      const timeout = setTimeout(() => {
        console.log('⏰ [AchievementModalSequence] Timeout de respaldo - mostrando modal directamente');
        setShouldShowModal(true);
        setPendingCompletion(null);
        setFallbackTimeout(null);
      }, 1000);
      
      setFallbackTimeout(timeout);
      
      // No mostrar el modal inmediatamente - esperar a que se oculte la notificación
      console.log('⏳ [AchievementModalSequence] Esperando a que se oculte la notificación de logros...');
      
    } catch (error) {
      console.error('❌ [AchievementModalSequence] Error en finalización de juego:', error);
      // En caso de error, mostrar el modal de todas formas
      setShouldShowModal(true);
    }
  }, [recordGameCompletion]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
      }
    };
  }, [fallbackTimeout]);

  return {
    shouldShowModal,
    setShouldShowModal,
    handleGameCompletion,
  };
};
