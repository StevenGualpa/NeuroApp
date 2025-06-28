import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Vibration,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FeedbackAnimation from '../components/FeedbackAnimation';
import AchievementNotification from '../components/AchievementNotification';
import { GameCompletionModal } from '../components/GameCompletionModal';
import { ProgressSection } from '../components/ProgressSection';
import { AchievementService, Achievement } from '../services/AchievementService';
import AdaptiveReinforcementService from '../services/AdaptiveReinforcementService';
import AudioService from '../services/AudioService';

const { width } = Dimensions.get('window');

type SelectOptionRouteProp = RouteProp<RootStackParamList, 'selectOption'>;

interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  firstTrySuccess: boolean;
  dragCount: number;
  efficiency: number;
}

const SelectOptionScreen = () => {
  const route = useRoute<SelectOptionRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle } = route.params;

  // Game state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
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
    firstTrySuccess: false,
    dragCount: 0,
    efficiency: 100,
  });
  const [startTime] = useState<number>(Date.now());
  const [showStars, setShowStars] = useState(false);

  // Animation refs
  const [optionScales] = useState(
    step.options?.map(() => new Animated.Value(1)) || []
  );

  // Adaptive reinforcement states
  const [isHelpActive, setIsHelpActive] = useState(false);
  const [blinkingOptionIndex, setBlinkingOptionIndex] = useState<number | null>(null);
  const [helpBlinkAnimation] = useState(new Animated.Value(1));
  const adaptiveService = useRef(AdaptiveReinforcementService.getInstance());
  const audioService = useRef(AudioService.getInstance());

  // Memoized values
  const totalOptions = useMemo(() => step.options?.length || 0, [step.options]);
  const totalItems = 1; // Solo una respuesta correcta en selección

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

  // Initialize adaptive reinforcement service
  useEffect(() => {
    const correctOptionIndex = step.options?.findIndex(option => option.correct) ?? -1;
    
    adaptiveService.current.initialize(
      (helpOptionIndex) => {
        // Handle help trigger
        if (helpOptionIndex === -1) {
          // Inactivity help - find correct option
          const correctIndex = step.options?.findIndex(option => option.correct) ?? -1;
          if (correctIndex !== -1) {
            triggerHelpForOption(correctIndex);
          }
        } else {
          // Error-based help
          triggerHelpForOption(helpOptionIndex);
        }
      },
      (message, activityType) => {
        // Handle audio help - use step's helpMessage if available, otherwise use service message
        let helpMessage: string;
        
        if (step.helpMessage) {
          helpMessage = step.helpMessage;
          console.log(`🔊 Using custom lesson help: ${helpMessage}`);
        } else {
          helpMessage = message;
          console.log(`🔊 Using default help for ${activityType}: ${helpMessage}`);
        }
        
        console.log(`🔊 About to play TTS: ${helpMessage}`);
        audioService.current.playTextToSpeech(helpMessage);
      },
      step.activityType // Pass the activity type to the service
    );

    return () => {
      console.log(`🔊 SelectOptionScreen: Cleaning up services`);
      adaptiveService.current.cleanup();
      audioService.current.cleanup();
    };
  }, [step]);

  // Calculate stars based on performance
  const calculateStars = useCallback((errors: number, completionTime: number, firstTry: boolean): number => {
    const maxTime = 30000; // 30 seconds as baseline
    const timeBonus = completionTime < maxTime * 0.5 ? 1 : 0;

    if (firstTry && errors === 0) {
      return 3; // Perfect performance - first try success
    } else if (errors === 0) {
      return 2 + timeBonus; // Good performance - no errors
    } else if (errors <= 1) {
      return 1 + timeBonus; // Acceptable performance - max 1 error
    } else {
      return 1; // Minimum star for completion
    }
  }, []);

  // Helper function to trigger help for a specific option
  const triggerHelpForOption = useCallback((optionIndex: number) => {
    setIsHelpActive(true);
    setBlinkingOptionIndex(optionIndex);
    
    // Start blinking animation
    const blinkAnimation = () => {
      Animated.sequence([
        Animated.timing(helpBlinkAnimation, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(helpBlinkAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isHelpActive) {
          blinkAnimation();
        }
      });
    };
    
    blinkAnimation();
    
    // Stop help after 5 seconds
    setTimeout(() => {
      setIsHelpActive(false);
      setBlinkingOptionIndex(null);
      helpBlinkAnimation.setValue(1);
    }, 5000);
  }, [helpBlinkAnimation, isHelpActive]);

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
        activityType: 'Selecciona la opción correcta',
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
    
    if (animationType === 'success' && !gameCompleted) {
      setGameCompleted(true);
      
      // Calculate final stats
      const completionTime = Date.now() - startTime;
      const finalStats = {
        ...gameStats,
        completionTime,
        stars: calculateStars(gameStats.errors, completionTime, gameStats.firstTrySuccess),
      };
      setGameStats(finalStats);
      
      // Record game completion for achievements
      recordGameCompletion(finalStats);
      
      // Small delay before showing winner animation
      setTimeout(() => {
        showFeedbackAnimation('winner');
      }, 300);
    } else if (animationType === 'winner') {
      // Show stars after winner animation
      setTimeout(() => {
        setShowStars(true);
      }, 500);
    }
  }, [animationType, gameCompleted, gameStats, startTime, calculateStars, recordGameCompletion, showFeedbackAnimation]);

  const handlePress = useCallback((correct: boolean, index: number) => {
    if (isAnswered || gameCompleted) return;

    // Record action in adaptive reinforcement service
    const correctOptionIndex = step.options?.findIndex(option => option.correct) ?? -1;
    adaptiveService.current.recordAction(correct, correctOptionIndex, step.activityType);

    // Clear any active help
    if (isHelpActive) {
      setIsHelpActive(false);
      setBlinkingOptionIndex(null);
      helpBlinkAnimation.setValue(1);
    }

    setSelectedOption(index);
    setIsAnswered(true);

    // Update stats
    const isFirstAttempt = gameStats.totalAttempts === 0;
    setGameStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
      errors: correct ? prev.errors : prev.errors + 1,
      perfectRun: correct ? prev.perfectRun : false,
      firstTrySuccess: correct && isFirstAttempt,
      dragCount: prev.dragCount + 1,
    }));

    // Animate the selected option
    Animated.sequence([
      Animated.timing(optionScales[index], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(optionScales[index], {
        toValue: 1.05,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      if (correct) {
        setScore(1);
        showFeedbackAnimation('success');
        // Play encouragement audio
        audioService.current.playEncouragementMessage();
      } else {
        showFeedbackAnimation('error');
        // Play error guidance audio
        audioService.current.playErrorGuidanceMessage();
        setTimeout(() => {
          setIsAnswered(false);
          setSelectedOption(null);
          // Reset animation
          Animated.timing(optionScales[index], {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }, 1500);
      }
    }, 600);
  }, [isAnswered, gameCompleted, gameStats, optionScales, showFeedbackAnimation, step.options, step.activityType, isHelpActive, helpBlinkAnimation]);

  const handleOptionPressIn = useCallback((index: number) => {
    if (isAnswered) return;
    
    // Record user interaction for inactivity tracking
    adaptiveService.current.recordInactivity();
    
    Animated.timing(optionScales[index], {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [isAnswered, optionScales]);

  const handleOptionPressOut = useCallback((index: number) => {
    if (isAnswered) return;
    Animated.spring(optionScales[index], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [isAnswered, optionScales]);

  const resetGame = useCallback(() => {
    setSelectedOption(null);
    setIsAnswered(false);
    setGameCompleted(false);
    setShowStars(false);
    setScore(0);
    setGameStats({
      totalAttempts: 0,
      errors: 0,
      stars: 0,
      completionTime: 0,
      perfectRun: true,
      firstTrySuccess: false,
      dragCount: 0,
      efficiency: 100,
    });

    // Reset all animations
    optionScales.forEach(scale => {
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [optionScales]);

  const getOptionStyle = useCallback((index: number, correct: boolean) => {
    if (!isAnswered) {
      // Add help highlighting if this option is blinking
      if (isHelpActive && blinkingOptionIndex === index) {
        return [styles.optionButton, styles.optionButtonHelp];
      }
      return styles.optionButton;
    }
    
    if (selectedOption === index) {
      return correct ? styles.optionButtonCorrect : styles.optionButtonIncorrect;
    }
    
    return styles.optionButtonDisabled;
  }, [isAnswered, selectedOption, isHelpActive, blinkingOptionIndex]);

  const getOptionTextStyle = useCallback((index: number, correct: boolean) => {
    if (!isAnswered) return styles.optionLabel;
    
    if (selectedOption === index) {
      return correct ? styles.optionLabelCorrect : styles.optionLabelIncorrect;
    }
    
    return styles.optionLabelDisabled;
  }, [isAnswered, selectedOption]);

  const getPerformanceMessage = useCallback((stars: number, perfectRun: boolean, firstTry: boolean) => {
    if (perfectRun && stars === 3 && firstTry) {
      return "¡Perfecto! Primera vez sin errores 🏆";
    } else if (perfectRun && stars === 3) {
      return "¡Excelente! Sin errores 🌟";
    } else if (stars === 3) {
      return "¡Muy bien hecho! 👏";
    } else if (stars === 2) {
      return "¡Buen trabajo! Sigue así 💪";
    } else {
      return "¡Completado! Puedes mejorar 📈";
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
        onTouchStart={() => {
          // Record user interaction for inactivity tracking
          adaptiveService.current.recordInactivity();
        }}
        onScrollBeginDrag={() => {
          // Record user interaction for inactivity tracking
          adaptiveService.current.recordInactivity();
        }}
      >

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

        {/* Opciones de respuesta */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Opciones disponibles:</Text>
          <View style={styles.optionsGrid}>
            {step.options?.map((option, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.optionWrapper,
                  { 
                    transform: [{ scale: optionScales[idx] || 1 }],
                    opacity: isHelpActive && blinkingOptionIndex === idx ? helpBlinkAnimation : 1
                  }
                ]}
              >
                <TouchableOpacity
                  style={getOptionStyle(idx, option.correct || false)}
                  onPress={() => handlePress(option.correct || false, idx)}
                  onPressIn={() => handleOptionPressIn(idx)}
                  onPressOut={() => handleOptionPressOut(idx)}
                  activeOpacity={0.8}
                  disabled={isAnswered}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.iconContainer,
                      isAnswered && selectedOption === idx && option.correct && styles.iconContainerCorrect,
                      isAnswered && selectedOption === idx && !option.correct && styles.iconContainerIncorrect,
                    ]}>
                      <Text style={styles.optionIcon}>{option.icon}</Text>
                    </View>
                    <Text style={getOptionTextStyle(idx, option.correct || false)}>
                      {option.label}
                    </Text>
                  </View>
                  
                  {isAnswered && selectedOption === idx && (
                    <View style={[
                      styles.resultIndicator,
                      option.correct ? styles.resultIndicatorCorrect : styles.resultIndicatorIncorrect
                    ]}>
                      <Text style={[
                        styles.resultIcon,
                        option.correct ? styles.resultIconCorrect : styles.resultIconIncorrect
                      ]}>
                        {option.correct ? '✓' : '✗'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Footer motivacional como en otras actividades */}
        <View style={styles.footer}>
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationIcon}>⭐</Text>
            <Text style={styles.footerText}>
              {score === 0 ? '¡Piensa bien antes de elegir!' :
               '¡Increíble! Lo lograste'}
            </Text>
            <Text style={styles.motivationIcon}>⭐</Text>
          </View>
          
          {/* Mensaje adicional de ánimo */}
          <View style={styles.encouragementFooter}>
            <Text style={styles.encouragementFooterText}>
              🧠 Cada decisión te hace más sabio ✨
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
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.firstTrySuccess)}
        gameType="selection"
        customStats={[
          { label: 'Intentos totales', value: gameStats.totalAttempts },
          { label: 'Respuesta correcta', value: score === 1 ? 'Sí' : 'No' },
        ]}
        bonusMessage={gameStats.firstTrySuccess ? "🎯 ¡Primera vez perfecto!" : undefined}
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionWrapper: {
    width: (width - 44) / 2,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e8f0fe',
    position: 'relative',
  },
  optionButtonCorrect: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOpacity: 0.25,
  },
  optionButtonIncorrect: {
    backgroundColor: '#ffeaea',
    borderColor: '#f44336',
    shadowColor: '#f44336',
    shadowOpacity: 0.25,
  },
  optionButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.6,
  },
  optionButtonHelp: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 3,
    shadowColor: '#ffc107',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainerCorrect: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  iconContainerIncorrect: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  optionIcon: {
    fontSize: 28,
  },
  optionLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    lineHeight: 16,
  },
  optionLabelCorrect: {
    fontSize: 12,
    textAlign: 'center',
    color: '#2e7d32',
    fontWeight: '700',
    lineHeight: 16,
  },
  optionLabelIncorrect: {
    fontSize: 12,
    textAlign: 'center',
    color: '#c62828',
    fontWeight: '700',
    lineHeight: 16,
  },
  optionLabelDisabled: {
    fontSize: 12,
    textAlign: 'center',
    color: '#9e9e9e',
    fontWeight: '600',
    lineHeight: 16,
  },
  resultIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  resultIndicatorCorrect: {
    backgroundColor: '#4caf50',
  },
  resultIndicatorIncorrect: {
    backgroundColor: '#f44336',
  },
  resultIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultIconCorrect: {
    color: '#ffffff',
  },
  resultIconIncorrect: {
    color: '#ffffff',
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

export default SelectOptionScreen;