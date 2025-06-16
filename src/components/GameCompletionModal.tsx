// components/GameCompletionModal.tsx
import React, { useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  Animated, 
  Dimensions 
} from 'react-native';

const { width } = Dimensions.get('window');

interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  // Campos opcionales para diferentes tipos de juegos
  audioPlays?: number;
  flipCount?: number;
  resets?: number;
  matchesFound?: number;
  efficiency?: number;
  firstTrySuccess?: boolean;
  [key: string]: any;
}

interface DetailedStat {
  label: string;
  value: string | number;
  suffix?: string;
}

interface GameCompletionModalProps {
  visible: boolean;
  stats: GameStats;
  onReset: () => void;
  onContinue: () => void;
  performanceMessage: string;
  gameType?: string;
  customStats?: DetailedStat[];
  showEfficiency?: boolean;
  bonusMessage?: string;
}

export const GameCompletionModal: React.FC<GameCompletionModalProps> = ({
  visible,
  stats,
  onReset,
  onContinue,
  performanceMessage,
  gameType = 'game',
  customStats = [],
  showEfficiency = false,
  bonusMessage,
}) => {

  const renderStars = useCallback((count: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <Animated.Text
        key={i}
        style={[
          styles.star,
          i < count ? styles.starFilled : styles.starEmpty,
        ]}
      >
        ⭐
      </Animated.Text>
    ));
  }, []);

  const getDefaultStats = useCallback((): DetailedStat[] => {
    const defaultStats: DetailedStat[] = [
      {
        label: 'Tiempo',
        value: Math.round(stats.completionTime / 1000),
        suffix: 's'
      },
      {
        label: 'Precisión',
        value: stats.totalAttempts > 0 
          ? Math.round(((stats.totalAttempts - stats.errors) / stats.totalAttempts) * 100)
          : 100,
        suffix: '%'
      }
    ];

    // Agregar estadísticas específicas según el tipo de juego
    if (stats.audioPlays !== undefined) {
      defaultStats.push({
        label: 'Reproducciones',
        value: stats.audioPlays
      });
    }

    if (stats.flipCount !== undefined) {
      defaultStats.push({
        label: 'Volteos totales',
        value: stats.flipCount
      });
    }

    if (stats.resets !== undefined) {
      defaultStats.push({
        label: 'Reinicios',
        value: stats.resets
      });
    }

    if (stats.matchesFound !== undefined) {
      defaultStats.push({
        label: 'Parejas encontradas',
        value: stats.matchesFound
      });
    }

    if (showEfficiency && stats.efficiency !== undefined) {
      defaultStats.push({
        label: 'Eficiencia',
        value: stats.efficiency,
        suffix: '%'
      });
    }

    return defaultStats;
  }, [stats, showEfficiency]);

  const allStats = [...getDefaultStats(), ...customStats];

  const shouldShowBonus = useCallback(() => {
    if (bonusMessage) return true;
    
    // Lógica automática para mostrar bonus
    if (stats.perfectRun && stats.firstTrySuccess) return true;
    if (stats.perfectRun && stats.resets === 0) return true;
    if (stats.perfectRun && stats.audioPlays <= 1) return true;
    if (stats.flipCount && stats.matchesFound && stats.flipCount <= stats.matchesFound * 2.4) return true;
    
    return false;
  }, [stats, bonusMessage]);

  const getAutoBonusMessage = useCallback(() => {
    if (bonusMessage) return bonusMessage;
    
    if (stats.firstTrySuccess) return '🎯 ¡Primera vez perfecto!';
    if (stats.perfectRun && stats.resets === 0) return '🎯 ¡Secuencia perfecta!';
    if (stats.perfectRun && stats.audioPlays <= 1) return '🏆 ¡Primera vez sin errores!';
    if (stats.flipCount && stats.matchesFound && stats.flipCount <= stats.matchesFound * 2.4) {
      return '🧠 ¡Memoria excepcional!';
    }
    
    return '🏆 ¡Excelente trabajo!';
  }, [stats, bonusMessage]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.completionContainer}>
        <View style={styles.completionContent}>
          <Text style={styles.completionText}>🎉 ¡Felicitaciones!</Text>
          
          {/* Stars Display */}
          <View style={styles.starsContainer}>
            <Text style={styles.starsTitle}>Tu puntuación:</Text>
            <View style={styles.starsRow}>
              {renderStars(stats.stars)}
            </View>
            <Text style={styles.performanceMessage}>
              {performanceMessage}
            </Text>
          </View>

          {/* Detailed Stats */}
          <View style={styles.detailedStats}>
            {allStats.map((stat, index) => (
              <View key={index} style={styles.statRow}>
                <Text style={styles.statDetailLabel}>{stat.label}:</Text>
                <Text style={styles.statDetailValue}>
                  {stat.value}{stat.suffix || ''}
                </Text>
              </View>
            ))}
            
            {shouldShowBonus() && (
              <View style={styles.bonusRow}>
                <Text style={styles.bonusText}>
                  {getAutoBonusMessage()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.completionButtons}>
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={onReset}
              activeOpacity={0.8}
            >
              <Text style={styles.resetButtonText}>🔄 Jugar de nuevo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={onContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>✨ Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  completionContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  completionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    maxWidth: 350,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  completionText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 25,
  },
  starsContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  starsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 15,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  star: {
    fontSize: 40,
    marginHorizontal: 5,
  },
  starFilled: {
    opacity: 1,
  },
  starEmpty: {
    opacity: 0.3,
  },
  performanceMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4285f4',
    textAlign: 'center',
    marginTop: 10,
  },
  detailedStats: {
    backgroundColor: '#f8faff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    marginBottom: 25,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statDetailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statDetailValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '700',
  },
  bonusRow: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e8f0fe',
  },
  bonusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
    textAlign: 'center',
  },
  completionButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#6b7280',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#4285f4',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});