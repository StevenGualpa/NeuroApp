import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Alert,
  FlatList,
  Dimensions,
  ScrollView,
  Vibration,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FeedbackAnimation from '../components/FeedbackAnimation';
import AchievementNotification from '../components/AchievementNotification';
import { GameStatsDisplay } from '../components/GameStatsDisplay';
import { GameCompletionModal } from '../components/GameCompletionModal';
import { AchievementService, Achievement } from '../services/AchievementService';

const { width } = Dimensions.get('window');

interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  resets: number;
  efficiency: number;
}

const OrderStepsScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'orderSteps'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle } = route.params;

  // Crear una copia de las opciones y mezclarlas
  const shuffledOptions = useMemo(() => 
    [...(step.options || [])].sort(() => Math.random() - 0.5), 
    [step.options]
  );

  // Game state
  const [selectedOrder, setSelectedOrder] = useState<any[]>([]);
  const [status, setStatus] = useState<{ [key: string]: 'correct' | 'wrong' | 'idle' }>({});
  const [disabled, setDisabled] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Animation states
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'success' | 'error' | 'winner' | 'loser'>('success');

  // Achievement states
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);

  // Gamification states
  const [gameStats, setGameStats] = useState<GameStats>({
    totalAttempts: 0,
    errors: 0,
    stars: 0,
    completionTime: 0,
    perfectRun: true,
    resets: 0,
    efficiency: 100,
  });
  const [startTime] = useState<number>(Date.now());
  const [showStars, setShowStars] = useState(false);

  // Animation refs
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const instructionAnimation = useRef(new Animated.Value(0)).current;

  // Memoized values
  const totalSteps = useMemo(() => shuffledOptions.length, [shuffledOptions]);

  // Initialize achievements service
  useEffect(() => {
    const initAchievements = async () => {
      try {
        await AchievementService.initializeAchievements();
      } catch (error) {
        console.error('Error initializing achievements:', error);
      }
    };
    initAchievements();
  }, []);

  useEffect(() => {
    const initStatus: any = {};
    shuffledOptions.forEach(opt => initStatus[opt.label] = 'idle');
    setStatus(initStatus);

    // Entrance animations
    Animated.sequence([
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(instructionAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Update progress bar
    const progress = selectedOrder.length / shuffledOptions.length;
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [selectedOrder]);

  // Calculate stars based on performance
  const calculateStars = useCallback((errors: number, resets: number, completionTime: number, totalSteps: number): number => {
    const maxTime = totalSteps * 10000; // 10 seconds per step as baseline
    const timeBonus = completionTime < maxTime * 0.5 ? 1 : 0;
    const resetPenalty = resets > 0 ? 1 : 0;

    if (errors === 0 && resets === 0) {
      return 3; // Perfect performance - no errors, no resets
    } else if (errors <= 1 && resets <= 1) {
      return 2 + timeBonus; // Good performance
    } else if (errors <= 2 || resets <= 2) {
      return Math.max(1, 2 - resetPenalty); // Acceptable performance
    } else {
      return 1; // Minimum star for completion
    }
  }, []);

  const showFeedbackAnimation = useCallback((type: 'success' | 'error' | 'winner' | 'loser') => {
    setAnimationType(type);
    setShowAnimation(true);
    
    // Add haptic feedback
    if (type === 'success') {
      Vibration.vibrate(50);
    } else if (type === 'error') {
      Vibration.vibrate([0, 100, 50, 100]);
    } else if (type === 'winner') {
      Vibration.vibrate([0, 100, 50, 100, 50, 100]);
    }
  }, []);

  // Handle achievement notifications queue
  const processAchievementQueue = useCallback(() => {
    if (achievementQueue.length > 0 && !showAchievementNotification) {
      const nextAchievement = achievementQueue[0];
      setNewAchievement(nextAchievement);
      setShowAchievementNotification(true);
      setAchievementQueue(prev => prev.slice(1));
    }
  }, [achievementQueue, showAchievementNotification]);

  const handleAchievementNotificationHide = useCallback(() => {
    setShowAchievementNotification(false);
    setNewAchievement(null);
    
    setTimeout(() => {
      processAchievementQueue();
    }, 1000);
  }, [processAchievementQueue]);

  // Record game completion and check for achievements
  const recordGameCompletion = useCallback(async (finalStats: GameStats) => {
    try {
      const gameData = {
        stars: finalStats.stars,
        isPerfect: finalStats.perfectRun,
        completionTime: finalStats.completionTime,
        errors: finalStats.errors,
      };

      const newlyUnlocked = await AchievementService.recordGameCompletion(gameData);
      
      if (newlyUnlocked.length > 0) {
        setAchievementQueue(prev => [...prev, ...newlyUnlocked]);
        
        if (!showAchievementNotification) {
          setTimeout(() => {
            processAchievementQueue();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error recording game completion:', error);
      Alert.alert(
        'Error',
        'No se pudieron guardar los logros. Tu progreso se ha guardado localmente.',
        [{ text: 'OK' }]
      );
    }
  }, [showAchievementNotification, processAchievementQueue]);

  const handleAnimationFinish = useCallback(() => {
    setShowAnimation(false);
    
    if (animationType === 'winner' && !gameCompleted) {
      setGameCompleted(true);
      
      // Calculate final stats
      const completionTime = Date.now() - startTime;
      const efficiency = Math.round((totalSteps / (gameStats.totalAttempts || 1)) * 100);
      const finalStats = {
        ...gameStats,
        completionTime,
        efficiency,
        stars: calculateStars(gameStats.errors, gameStats.resets, completionTime, totalSteps),
      };
      setGameStats(finalStats);
      
      // Record game completion for achievements
      recordGameCompletion(finalStats);
      
      // Show stars after a delay
      setTimeout(() => {
        setShowStars(true);
      }, 500);
    }
  }, [animationType, gameCompleted, gameStats, startTime, totalSteps, calculateStars, recordGameCompletion]);

  const handleSelect = useCallback((option: any) => {
    if (disabled || selectedOrder.some(item => item.label === option.label)) return;

    const newOrder = [...selectedOrder, option];
    setSelectedOrder(newOrder);

    // Update total attempts
    setGameStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
    }));

    // Find what step should be next based on order
    const expectedStep = newOrder.length;
    const isCorrect = option.order === expectedStep;

    setStatus(prev => ({ ...prev, [option.label]: isCorrect ? 'correct' : 'wrong' }));

    if (!isCorrect) {
      // Update error stats
      setGameStats(prev => ({
        ...prev,
        errors: prev.errors + 1,
        perfectRun: false,
      }));

      setDisabled(true);
      setTimeout(() => {
        showFeedbackAnimation('error');
        setTimeout(() => {
          Alert.alert(
            '🤔 ¡Inténtalo otra vez!', 
            'Ese no era el paso correcto. ¡Tú puedes hacerlo!',
            [
              {
                text: '¡Intentar de nuevo!',
                onPress: reset,
              }
            ]
          );
        }, 1000);
      }, 800);
    } else if (newOrder.length === shuffledOptions.length) {
      // Game completed successfully
      setTimeout(() => {
        showFeedbackAnimation('winner');
      }, 500);
    } else {
      // Correct step, continue
      showFeedbackAnimation('success');
    }
  }, [disabled, selectedOrder, shuffledOptions.length, showFeedbackAnimation]);

  const reset = useCallback(() => {
    const resetStatus: any = {};
    shuffledOptions.forEach(opt => resetStatus[opt.label] = 'idle');
    setStatus(resetStatus);
    setSelectedOrder([]);
    setDisabled(false);

    // Update reset count
    setGameStats(prev => ({
      ...prev,
      resets: prev.resets + 1,
      perfectRun: false,
    }));
  }, [shuffledOptions]);

  const resetGame = useCallback(() => {
    const resetStatus: any = {};
    shuffledOptions.forEach(opt => resetStatus[opt.label] = 'idle');
    setStatus(resetStatus);
    setSelectedOrder([]);
    setDisabled(false);
    setGameCompleted(false);
    setShowStars(false);
    setGameStats({
      totalAttempts: 0,
      errors: 0,
      stars: 0,
      completionTime: 0,
      perfectRun: true,
      resets: 0,
      efficiency: 100,
    });
  }, [shuffledOptions]);

  const getPerformanceMessage = useCallback((stars: number, perfectRun: boolean, resets: number) => {
    if (perfectRun && stars === 3 && resets === 0) {
      return "¡Perfecto! Secuencia correcta sin errores 🏆";
    } else if (perfectRun && stars === 3) {
      return "¡Excelente! Muy bien ordenado 🌟";
    } else if (stars === 3) {
      return "¡Muy bien hecho! 👏";
    } else if (stars === 2) {
      return "¡Buen trabajo! Sigue practicando 💪";
    } else {
      return "¡Completado! Puedes mejorar el orden 📈";
    }
  }, []);

  const handleBackPress = useCallback(() => {
    if (gameStats.totalAttempts > 0 && !gameCompleted) {
      Alert.alert(
        'Salir del juego',
        '¿Estás seguro de que quieres salir? Perderás tu progreso actual.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [gameStats.totalAttempts, gameCompleted, navigation]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const itemStatus = status[item.label];
    const isSelected = selectedOrder.some(selected => selected.label === item.label);
    const stepNumber = selectedOrder.findIndex(selected => selected.label === item.label) + 1;

    return (
      <View style={styles.optionWrapper}>
        <TouchableOpacity
          disabled={disabled || itemStatus !== 'idle'}
          style={[
            styles.optionCard,
            itemStatus === 'correct' && styles.optionCardCorrect,
            itemStatus === 'wrong' && styles.optionCardWrong,
            itemStatus === 'idle' && styles.optionCardIdle,
          ]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.8}
        >
          <View style={styles.optionContent}>
            <Text style={[
              styles.optionIcon,
              itemStatus === 'correct' && styles.optionIconCorrect,
              itemStatus === 'wrong' && styles.optionIconWrong,
            ]}>
              {item.icon}
            </Text>
            <Text style={[
              styles.optionLabel,
              itemStatus === 'correct' && styles.optionLabelCorrect,
              itemStatus === 'wrong' && styles.optionLabelWrong,
            ]}>
              {item.label}
            </Text>
          </View>
          
          {isSelected && itemStatus === 'correct' && (
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{stepNumber}</Text>
            </View>
          )}
          
          {itemStatus === 'wrong' && (
            <View style={styles.wrongIndicator}>
              <Text style={styles.wrongIndicatorText}>✗</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [status, selectedOrder, disabled, handleSelect]);

  // Process achievement queue when it changes
  useEffect(() => {
    processAchievementQueue();
  }, [processAchievementQueue]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: headerAnimation,
              transform: [{
                translateY: headerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                })
              }]
            }
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{lessonTitle}</Text>
            <View style={styles.titleUnderline} />
          </View>
          <View style={styles.activityBadge}>
            <Text style={styles.activityText}>🔢 Ordenar Pasos</Text>
          </View>

          {/* Stats Display usando componente reutilizable */}
          {gameStats.totalAttempts > 0 && (
            <GameStatsDisplay 
              stats={gameStats}
              showPerfectBadge={true}
              customStats={[
                { label: 'Secuencia', value: `${selectedOrder.length}/${totalSteps}` }
              ]}
            />
          )}

          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  })
                }
              ]} 
            />
          </View>
        </Animated.View>

        {/* Instructions */}
        <Animated.View 
          style={[
            styles.instructionCard,
            {
              opacity: instructionAnimation,
              transform: [{
                scale: instructionAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                })
              }]
            }
          ]}
        >
          <View style={styles.instructionHeader}>
            <Text style={styles.instructionIcon}>🎯</Text>
            <Text style={styles.instructionTitle}>Ordena los pasos</Text>
          </View>
          <Text style={styles.instruction}>{step.text}</Text>
          <Text style={styles.instructionSubtext}>
            Toca las opciones en el orden correcto
          </Text>
        </Animated.View>

        {/* Grid de opciones */}
        <View style={styles.gameContainer}>
          <FlatList
            data={shuffledOptions}
            keyExtractor={(item, idx) => item.label + idx}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={styles.grid}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Reset button */}
        {selectedOrder.length > 0 && !gameCompleted && (
          <View style={styles.resetContainer}>
            <TouchableOpacity onPress={reset} style={styles.resetButton}>
              <Text style={styles.resetText}>🔄 Reiniciar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer motivacional */}
        <View style={styles.footer}>
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationIcon}>⭐</Text>
            <Text style={styles.footerText}>¡Piensa en el orden correcto!</Text>
            <Text style={styles.motivationIcon}>⭐</Text>
          </View>
        </View>
      </ScrollView>

      {/* Game Complete Modal usando componente reutilizable */}
      <GameCompletionModal
        visible={gameCompleted && !showAnimation && showStars}
        stats={gameStats}
        onReset={resetGame}
        onContinue={() => navigation.goBack()}
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.resets)}
        gameType="sequence"
        showEfficiency={true}
        bonusMessage={gameStats.perfectRun && gameStats.resets === 0 ? "🎯 ¡Secuencia perfecta!" : undefined}
      />

      {/* Feedback Animation */}
      {showAnimation && (
        <FeedbackAnimation
          type={animationType}
          onFinish={handleAnimationFinish}
        />
      )}

      {/* Achievement Notification */}
      {newAchievement && (
        <AchievementNotification
          achievement={newAchievement}
          visible={showAchievementNotification}
          onHide={handleAchievementNotificationHide}
        />
      )}

      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#4285f4',
    borderRadius: 2,
  },
  activityBadge: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#4285f4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 15,
    alignSelf: 'center',
  },
  activityText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e8f0fe',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4285f4',
    borderRadius: 3,
  },
  instructionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#4285f4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#4285f4',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  instructionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#4285f4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instruction: {
    fontSize: 18,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 8,
  },
  instructionSubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '500',
  },
  gameContainer: {
    flex: 1,
    marginBottom: 20,
  },
  grid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionWrapper: {
    width: (width - 60) / 2,
    marginHorizontal: 5,
    marginVertical: 8,
  },
  optionCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    position: 'relative',
  },
  optionCardIdle: {
    backgroundColor: '#ffffff',
    borderColor: '#e8f0fe',
    shadowColor: '#4285f4',
  },
  optionCardCorrect: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOpacity: 0.3,
  },
  optionCardWrong: {
    backgroundColor: '#ffeaea',
    borderColor: '#f44336',
    shadowColor: '#f44336',
    shadowOpacity: 0.3,
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  optionIconCorrect: {
    opacity: 0.9,
  },
  optionIconWrong: {
    opacity: 0.7,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 18,
  },
  optionLabelCorrect: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  optionLabelWrong: {
    color: '#c62828',
    fontWeight: '700',
  },
  stepNumber: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    backgroundColor: '#4caf50',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  wrongIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    backgroundColor: '#f44336',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  wrongIndicatorText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
    shadowColor: '#6b7280',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  resetText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  motivationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  motivationIcon: {
    fontSize: 20,
    marginHorizontal: 8,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  // Back Button Styles
  backButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#4285f4',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285f4',
  },
});

export default OrderStepsScreen;