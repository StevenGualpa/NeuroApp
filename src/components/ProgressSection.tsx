import React from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  const getEncouragementMessage = () => {
    if (gameStats.errors === 0 && score > 0) return '🌟 ¡Perfecto!';
    if (gameStats.errors <= 2) return '💪 ¡Muy bien!';
    return '🎯 ¡Sigue intentando!';
  };

  const getProgressMessage = () => {
    if (score === 0) return '¡Empecemos!';
    if (score === totalItems) return '¡Completado! 🎉';
    return `¡Genial! ${score} de ${totalItems} listos`;
  };

  return (
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>📊 Tu Progreso</Text>
      </View>
      
      <View style={styles.visualProgress}>
        <View style={styles.progressItems}>
          {Array.from({ length: totalItems }, (_, index) => (
            <View 
              key={index}
              style={[
                styles.progressDot,
                index < score ? styles.progressDotCompleted : styles.progressDotPending
              ]}
            >
              <Text style={styles.progressDotText}>
                {index < score ? '✓' : (index + 1)}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.progressLabel}>
          {getProgressMessage()}
        </Text>
      </View>
      
      {gameStats.totalAttempts > 0 && (
        <View style={styles.encouragementBadge}>
          <Text style={styles.encouragementText}>
            {getEncouragementMessage()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  progressSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    marginHorizontal: 4,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#4caf50',
  },
  progressHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285f4',
    marginBottom: 6,
  },
  visualProgress: {
    alignItems: 'center',
  },
  progressItems: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  progressDotCompleted: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  progressDotPending: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
  },
  progressDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4285f4',
    textAlign: 'center',
    marginTop: 3,
  },
  encouragementBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  encouragementText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#856404',
  },
});