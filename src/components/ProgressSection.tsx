import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

interface GameStats {
  totalAttempts: number;
  errors: number;
  dragCount: number;
  completionTime: number;
  perfectRun: boolean;
  efficiency: number;
}

interface ProgressSectionProps {
  score: number;
  totalItems: number;
  gameStats: GameStats;
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({
  score,
  totalItems,
  gameStats,
}) => {
  // Calcular el porcentaje de progreso
  const progressPercentage = totalItems > 0 ? (score / totalItems) * 100 : 0;
  
  // Determinar el color de la barra según el progreso
  const getProgressColor = () => {
    if (progressPercentage === 100) return '#4caf50'; // Verde para completado
    if (progressPercentage >= 50) return '#2196f3'; // Azul para medio progreso
    if (progressPercentage > 0) return '#ff9800'; // Naranja para poco progreso
    return '#e0e0e0'; // Gris para sin progreso
  };

  return (
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>📊 Tu Progreso</Text>
        <Text style={styles.progressPercentage}>
          {Math.round(progressPercentage)}%
        </Text>
      </View>
      
      <View style={styles.visualProgress}>
        {/* Barra de progreso */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill,
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: getProgressColor()
                }
              ]}
            />
          </View>
          
          {/* Indicadores de pasos */}
          <View style={styles.progressSteps}>
            {Array.from({ length: totalItems }, (_, index) => (
              <View 
                key={index}
                style={[
                  styles.progressStep,
                  index < score ? styles.progressStepCompleted : styles.progressStepPending
                ]}
              >
                <Text style={[
                  styles.progressStepText,
                  index < score ? styles.progressStepTextCompleted : styles.progressStepTextPending
                ]}>
                  {index < score ? '✓' : (index + 1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressSection: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 8,
    marginBottom: 4,
    marginHorizontal: 8,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderTopWidth: 2,
    borderTopColor: '#4caf50',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f5e8',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285f4',
    letterSpacing: 0.3,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4caf50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  visualProgress: {
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 6,
  },
  progressBarBackground: {
    height: 7,
    backgroundColor: '#e8f5e8',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#d1e7dd',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 3,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  progressStep: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  progressStepCompleted: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    borderWidth: 3,
  },
  progressStepPending: {
    backgroundColor: '#f8faff',
    borderColor: '#d1d5db',
  },
  progressStepText: {
    fontSize: 9,
    fontWeight: '800',
  },
  progressStepTextCompleted: {
    color: '#2e7d32',
  },
  progressStepTextPending: {
    color: '#6b7280',
  },
});