// src/examples/ActivityProgressExample.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useActivityProgress } from '../hooks';

interface ActivityProgressExampleProps {
  lessonId: number;
  stepId: number;
  activityType?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

const ActivityProgressExample: React.FC<ActivityProgressExampleProps> = ({
  lessonId,
  stepId,
  activityType = 'lesson_step',
  onComplete,
  onCancel,
}) => {
  const {
    currentSession,
    loading,
    error,
    startActivity,
    updateActivityProgress,
    completeActivity,
    cancelActivity,
    getCurrentSessionTime,
    calculateStars,
    checkImprovement,
    isStepCompleted,
    getStepStars,
  } = useActivityProgress();

  // Estados del juego
  const [attempts, setAttempts] = useState(0);
  const [errors, setErrors] = useState(0);
  const [usedHelp, setUsedHelp] = useState(false);
  const [helpActivations, setHelpActivations] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // Iniciar actividad al montar el componente
  useEffect(() => {
    if (!gameStarted) {
      handleStartActivity();
    }
  }, []);

  // Manejar inicio de actividad
  const handleStartActivity = async () => {
    try {
      await startActivity(lessonId, stepId, activityType);
      setGameStarted(true);
      console.log(`🎮 Actividad iniciada: Lección ${lessonId}, Paso ${stepId}`);
    } catch (error) {
      console.error('Error iniciando actividad:', error);
      Alert.alert('Error', 'No se pudo iniciar la actividad');
    }
  };

  // Manejar intento del usuario
  const handleAttempt = async (isCorrect: boolean) => {
    const newAttempts = attempts + 1;
    const newErrors = isCorrect ? errors : errors + 1;

    setAttempts(newAttempts);
    setErrors(newErrors);

    try {
      // Actualizar progreso en tiempo real
      await updateActivityProgress({
        attempts: newAttempts,
        errors: newErrors,
        usedHelp,
        helpActivations,
      });

      console.log(`📊 Intento ${newAttempts}: ${isCorrect ? 'Correcto' : 'Incorrecto'}`);

      // Si es correcto, completar la actividad
      if (isCorrect) {
        await handleCompleteActivity(newAttempts, newErrors);
      }
    } catch (error) {
      console.error('Error actualizando progreso:', error);
    }
  };

  // Manejar uso de ayuda
  const handleUseHelp = async () => {
    const newHelpActivations = helpActivations + 1;
    setUsedHelp(true);
    setHelpActivations(newHelpActivations);

    try {
      await updateActivityProgress({
        attempts,
        errors,
        usedHelp: true,
        helpActivations: newHelpActivations,
      });

      console.log(`💡 Ayuda usada ${newHelpActivations} veces`);
      Alert.alert('Ayuda', 'Aquí tienes una pista para resolver el ejercicio');
    } catch (error) {
      console.error('Error actualizando uso de ayuda:', error);
    }
  };

  // Completar actividad
  const handleCompleteActivity = async (finalAttempts: number, finalErrors: number) => {
    if (!currentSession) return;

    try {
      const timeSpent = getCurrentSessionTime();
      const stars = calculateStars(finalAttempts, finalErrors, timeSpent);
      const perfectRun = finalErrors === 0;
      const showedImprovement = checkImprovement(lessonId, stepId, finalErrors, timeSpent);

      const result = {
        lessonId,
        stepId,
        activityType,
        completed: true,
        stars,
        attempts: finalAttempts,
        errors: finalErrors,
        timeSpent,
        perfectRun,
        usedHelp,
        helpActivations,
        showedImprovement,
      };

      console.log('🏁 Completando actividad con resultado:', result);

      await completeActivity(result);

      // Mostrar resultado
      Alert.alert(
        '¡Felicitaciones!',
        `Has completado la actividad con ${stars} estrella${stars !== 1 ? 's' : ''}!\n\n` +
        `Intentos: ${finalAttempts}\n` +
        `Errores: ${finalErrors}\n` +
        `Tiempo: ${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')}\n` +
        `${perfectRun ? '¡Ejecución perfecta! 🌟' : ''}\n` +
        `${showedImprovement ? '¡Has mejorado! 📈' : ''}`,
        [
          {
            text: 'Continuar',
            onPress: () => {
              onComplete?.();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error completando actividad:', error);
      Alert.alert('Error', 'No se pudo guardar el progreso');
    }
  };

  // Cancelar actividad
  const handleCancelActivity = async () => {
    Alert.alert(
      'Cancelar Actividad',
      '¿Estás seguro de que quieres salir? Se perderá el progreso actual.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelActivity();
              onCancel?.();
            } catch (error) {
              console.error('Error cancelando actividad:', error);
              onCancel?.(); // Salir de todas formas
            }
          },
        },
      ]
    );
  };

  // Mostrar loading
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>Cargando actividad...</Text>
      </View>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleStartActivity}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Información del progreso previo
  const isCompleted = isStepCompleted(lessonId, stepId);
  const previousStars = getStepStars(lessonId, stepId);

  return (
    <View style={styles.container}>
      {/* Header con información */}
      <View style={styles.header}>
        <Text style={styles.title}>Lección {lessonId} - Paso {stepId}</Text>
        <Text style={styles.subtitle}>Tipo: {activityType}</Text>
        {isCompleted && (
          <Text style={styles.previousScore}>
            Mejor puntuación: {previousStars} estrella{previousStars !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Estadísticas actuales */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Intentos</Text>
          <Text style={styles.statValue}>{attempts}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Errores</Text>
          <Text style={styles.statValue}>{errors}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tiempo</Text>
          <Text style={styles.statValue}>
            {Math.floor(getCurrentSessionTime() / 60)}:
            {(getCurrentSessionTime() % 60).toString().padStart(2, '0')}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Ayuda</Text>
          <Text style={styles.statValue}>{helpActivations}</Text>
        </View>
      </View>

      {/* Área de juego simulada */}
      <View style={styles.gameArea}>
        <Text style={styles.gameTitle}>Área de Juego</Text>
        <Text style={styles.gameInstructions}>
          Simula tu actividad aquí. Presiona los botones para probar el sistema de progreso.
        </Text>
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.correctButton]}
          onPress={() => handleAttempt(true)}
        >
          <Text style={styles.buttonText}>✅ Respuesta Correcta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.incorrectButton]}
          onPress={() => handleAttempt(false)}
        >
          <Text style={styles.buttonText}>❌ Respuesta Incorrecta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.helpButton]}
          onPress={handleUseHelp}
        >
          <Text style={styles.buttonText}>💡 Usar Ayuda</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancelActivity}
        >
          <Text style={styles.buttonText}>🚪 Salir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  previousScore: {
    fontSize: 14,
    color: '#4285f4',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  gameArea: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  gameInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  controls: {
    gap: 10,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  correctButton: {
    backgroundColor: '#27ae60',
  },
  incorrectButton: {
    backgroundColor: '#e74c3c',
  },
  helpButton: {
    backgroundColor: '#f39c12',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ActivityProgressExample;