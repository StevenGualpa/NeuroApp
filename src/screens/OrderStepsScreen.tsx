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
import { GameCompletionModal } from '../components/GameCompletionModal';
import { ProgressSection } from '../components/ProgressSection';
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
  dragCount: number;
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
  const [score, setScore] = useState(0);

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
    dragCount: 0,
  });
  const [startTime] = useState<number>(Date.now());
  const [showStars, setShowStars] = useState(false);

  // Memoized values
  const totalSteps = useMemo(() => shuffledOptions.length, [shuffledOptions]);
  const totalItems = totalSteps; // Para compatibilidad con ProgressSection

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
  }, []);

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
        activityType: 'Ordena los pasos',
        showedImprovement: finalStats.errors > 0 && finalStats.stars > 1,
        usedHelp: false,
        tookTime: finalStats.completionTime > 60000,
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
    setScore(newOrder.length);

    // Update total attempts
    setGameStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
      dragCount: prev.dragCount + 1,
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
    setScore(0);
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
    setScore(0);
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
      dragCount: 0,
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
      {/* Header simplificado */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido Scrollable */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Tarjeta principal con instrucciones */}
        <View style={styles.instructionCard}>
          {/* Instrucciones */}
          <View style={styles.instructionHeader}>
            <Text style={styles.instructionIcon}>🔢</Text>
            <Text style={styles.instructionTitle}>¿Cómo jugar?</Text>
          </View>
          
          <Text style={styles.instructionText}>
            1. 👀 Lee la pregunta con atención
          </Text>
          <Text style={styles.instructionText}>
            2. 🤔 Piensa en el orden correcto
          </Text>
          <Text style={styles.instructionText}>
            3. 👆 Toca las opciones en orden
          </Text>
          
          <View style={styles.instructionTip}>
            <Text style={styles.instructionTipText}>
              💡 ¡El orden es muy importante!
            </Text>
          </View>
        </View>

        {/* Progreso del juego */}
        <ProgressSection 
          score={score}
          totalItems={totalItems}
          gameStats={gameStats}
        />

        {/* Pregunta */}
        <View style={styles.questionContainer}>
          <Text style={styles.sectionTitle}>Pregunta:</Text>
          <Text style={styles.questionText}>{step.text}</Text>
        </View>

        {/* Opciones para ordenar */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Pasos para ordenar:</Text>
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

        {/* Footer motivacional como en otras actividades */}
        <View style={styles.footer}>
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationIcon}>⭐</Text>
            <Text style={styles.footerText}>
              {score === 0 ? '¡Piensa en el orden correcto!' :
               score === totalItems ? '¡Increíble! Lo lograste' :
               '¡Excelente! Sigue así, casi terminas'}
            </Text>
            <Text style={styles.motivationIcon}>⭐</Text>
          </View>
          
          {/* Mensaje adicional de ánimo */}
          <View style={styles.encouragementFooter}>
            <Text style={styles.encouragementFooterText}>
              🧠 Cada paso te hace más organizado ✨
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
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
        customStats={[
          { label: 'Pasos ordenados', value: `${score}/${totalItems}` },
          { label: 'Reinicios', value: gameStats.resets },
        ]}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  header: {
    backgroundColor: '#f8faff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8f0fe',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285f4',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  instructionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#4285f4',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  instructionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  instructionText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
    marginBottom: 6,
    paddingLeft: 6,
  },
  instructionTip: {
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  instructionTipText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
    textAlign: 'center',
  },
  questionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 16,
  },
  grid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionWrapper: {
    width: (width - 44) / 2,
    marginHorizontal: 2,
    marginVertical: 8,
  },
  optionCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
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
    shadowOpacity: 0.25,
  },
  optionCardWrong: {
    backgroundColor: '#ffeaea',
    borderColor: '#f44336',
    shadowColor: '#f44336',
    shadowOpacity: 0.25,
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionIconCorrect: {
    opacity: 0.9,
  },
  optionIconWrong: {
    opacity: 0.7,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 16,
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
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    backgroundColor: '#4caf50',
    borderRadius: 12,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  wrongIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    backgroundColor: '#f44336',
    borderRadius: 12,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  resetContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#6b7280',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  resetText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  motivationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  motivationIcon: {
    fontSize: 18,
    marginHorizontal: 6,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    flex: 1,
  },
  encouragementFooter: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  encouragementFooterText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default OrderStepsScreen;