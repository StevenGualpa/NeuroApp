// components/GameCompletionModal.tsx
import React, { useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  Animated, 
  Dimensions 
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { language, t } = useLanguage();
  // Animaciones para hacer la experiencia más suave y amigable
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const starAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animación de entrada suave
  useEffect(() => {
    if (visible) {
      // Animación de escala del modal
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Animación secuencial de estrellas
      const starAnimationSequence = starAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 200,
          useNativeDriver: true,
        })
      );

      Animated.sequence([
        Animated.delay(300),
        Animated.stagger(200, starAnimationSequence),
      ]).start();

      // Animación de celebración continua
      Animated.loop(
        Animated.sequence([
          Animated.timing(celebrationAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(celebrationAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulso suave para botones
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animaciones cuando se cierra
      scaleAnim.setValue(0);
      starAnimations.forEach(anim => anim.setValue(0));
      celebrationAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const renderStars = useCallback((count: number) => {
    return Array.from({ length: 3 }, (_, i) => {
      const rotation = celebrationAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      });

      return (
        <Animated.View
          key={i}
          style={{
            transform: [
              { scale: starAnimations[i] },
              { rotate: i < count ? rotation : '0deg' }
            ],
          }}
        >
          <Text
            style={[
              styles.star,
              i < count ? styles.starFilled : styles.starEmpty,
            ]}
          >
            {i < count ? '⭐' : '☆'}
          </Text>
        </Animated.View>
      );
    });
  }, [starAnimations, celebrationAnim]);

  const getDefaultStats = useCallback((): DetailedStat[] => {
    const defaultStats: DetailedStat[] = [
      {
        label: language === 'es' ? 'Tiempo' : 'Time',
        value: Math.round(stats.completionTime / 1000),
        suffix: 's'
      },
      {
        label: language === 'es' ? 'Precisión' : 'Accuracy',
        value: stats.totalAttempts > 0 
          ? Math.round(((stats.totalAttempts - stats.errors) / stats.totalAttempts) * 100)
          : 100,
        suffix: '%'
      }
    ];

    // Agregar estadísticas específicas según el tipo de juego
    if (stats.audioPlays !== undefined) {
      defaultStats.push({
        label: language === 'es' ? 'Reproducciones' : 'Plays',
        value: stats.audioPlays
      });
    }

    if (stats.flipCount !== undefined) {
      defaultStats.push({
        label: language === 'es' ? 'Volteos totales' : 'Total flips',
        value: stats.flipCount
      });
    }

    if (stats.resets !== undefined) {
      defaultStats.push({
        label: language === 'es' ? 'Reinicios' : 'Resets',
        value: stats.resets
      });
    }

    if (stats.matchesFound !== undefined) {
      defaultStats.push({
        label: language === 'es' ? 'Parejas encontradas' : 'Pairs found',
        value: stats.matchesFound
      });
    }

    if (showEfficiency && stats.efficiency !== undefined) {
      defaultStats.push({
        label: language === 'es' ? 'Eficiencia' : 'Efficiency',
        value: stats.efficiency,
        suffix: '%'
      });
    }

    return defaultStats;
  }, [stats, showEfficiency, language]);

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
    
    if (stats.firstTrySuccess) {
      return language === 'es' ? '🎯 ¡Primera vez perfecto!' : '🎯 Perfect first try!';
    }
    if (stats.perfectRun && stats.resets === 0) {
      return language === 'es' ? '🎯 ¡Secuencia perfecta!' : '🎯 Perfect sequence!';
    }
    if (stats.perfectRun && stats.audioPlays <= 1) {
      return language === 'es' ? '🏆 ¡Primera vez sin errores!' : '🏆 First try without errors!';
    }
    if (stats.flipCount && stats.matchesFound && stats.flipCount <= stats.matchesFound * 2.4) {
      return language === 'es' ? '🧠 ¡Memoria excepcional!' : '🧠 Exceptional memory!';
    }
    
    return language === 'es' ? '🏆 ¡Excelente trabajo!' : '🏆 Excellent work!';
  }, [stats, bonusMessage, language]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <View style={styles.completionContainer}>
        <Animated.View 
          style={[
            styles.completionContent,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Título con emoji grande y amigable */}
          <View style={styles.headerContainer}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.completionText}>
              {language === 'es' ? '¡Increíble!' : 'Incredible!'}
            </Text>
            <Text style={styles.completionSubtext}>
              {language === 'es' ? 'Lo lograste' : 'You did it!'}
            </Text>
          </View>
          
          {/* Stars Display con animación */}
          <View style={styles.starsContainer}>
            <Text style={styles.starsTitle}>
              {language === 'es' ? 'Tu resultado:' : 'Your result:'}
            </Text>
            <View style={styles.starsRow}>
              {renderStars(stats.stars)}
            </View>
            <View style={styles.messageContainer}>
              <Text style={styles.performanceMessage}>
                {performanceMessage}
              </Text>
            </View>
          </View>

          {/* Detailed Stats más compactas */}
          <View style={styles.detailedStats}>
            <View style={styles.statsGrid}>
              {allStats.slice(0, 4).map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {stat.value}{stat.suffix || ''}
                  </Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
            
            {shouldShowBonus() && (
              <View style={styles.bonusRow}>
                <Text style={styles.bonusText}>
                  🏆 {getAutoBonusMessage()}
                </Text>
              </View>
            )}
          </View>

          {/* Botones grandes y claros con animación */}
          <View style={styles.completionButtons}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={onReset}
                activeOpacity={0.7}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonEmoji}>🔄</Text>
                  <Text style={styles.resetButtonText}>
                    {language === 'es' ? 'Jugar otra vez' : 'Play again'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity 
                style={styles.continueButton} 
                onPress={onContinue}
                activeOpacity={0.7}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonEmoji}>➡️</Text>
                  <Text style={styles.continueButtonText}>
                    {language === 'es' ? 'Siguiente' : 'Next'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  completionContainer: {
    flex: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.15)', // Verde suave y calmante
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  completionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    maxWidth: 320,
    width: '90%',
    maxHeight: '85%', // Limitar altura máxima
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#E8F5E8', // Borde verde muy suave
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  celebrationEmoji: {
    fontSize: 40,
    marginBottom: 5,
  },
  completionText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2E7D32', // Verde oscuro amigable
    textAlign: 'center',
    marginBottom: 3,
    fontFamily: 'System', // Fuente del sistema para mejor legibilidad
  },
  completionSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#66BB6A', // Verde medio
    textAlign: 'center',
  },
  starsContainer: {
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#F1F8E9', // Fondo verde muy claro
    borderRadius: 15,
    padding: 15,
    width: '100%',
  },
  starsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#388E3C',
    marginBottom: 10,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'center',
  },
  star: {
    fontSize: 35, // Estrellas más pequeñas
    marginHorizontal: 5,
  },
  starFilled: {
    opacity: 1,
  },
  starEmpty: {
    opacity: 0.25,
  },
  messageContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
    padding: 8,
    marginTop: 5,
  },
  performanceMessage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'center',
  },
  detailedStats: {
    backgroundColor: '#F1F8E9', // Verde muy claro
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%', // Dos columnas
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#424242',
    fontWeight: '600',
    textAlign: 'center',
  },
  bonusRow: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E8',
  },
  bonusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F57C00', // Naranja cálido
    textAlign: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 6,
  },
  completionButtons: {
    flexDirection: 'row', // Volver a fila para ahorrar espacio
    gap: 10,
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#81C784', // Verde suave en lugar de gris
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    minHeight: 45, // Altura reducida pero accesible
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#42A5F5', // Azul más suave
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#90CAF9',
    minHeight: 45, // Altura reducida pero accesible
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});