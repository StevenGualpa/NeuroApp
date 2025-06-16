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
import { GameStatsDisplay } from '../components/GameStatsDisplay';
import { GameCompletionModal } from '../components/GameCompletionModal';
import { AchievementService, Achievement } from '../services/AchievementService';

const { width } = Dimensions.get('window');

type SelectOptionRouteProp = RouteProp<RootStackParamList, 'selectOption'>;

interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  firstTrySuccess: boolean;
}

const SelectOptionScreen = () => {
  const route = useRoute<SelectOptionRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle } = route.params;

  // Game state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
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
    firstTrySuccess: false,
  });
  const [startTime] = useState<number>(Date.now());
  const [showStars, setShowStars] = useState(false);

  // Animation refs
  const [optionScales] = useState(
    step.options?.map(() => new Animated.Value(1)) || []
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const questionAnimation = useRef(new Animated.Value(0)).current;

  // Memoized values
  const totalOptions = useMemo(() => step.options?.length || 0, [step.options]);

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
    // Entrance animations
    Animated.sequence([
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(questionAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
        showFeedbackAnimation('success');
      } else {
        showFeedbackAnimation('error');
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
  }, [isAnswered, gameCompleted, gameStats, optionScales, showFeedbackAnimation]);

  const handleOptionPressIn = useCallback((index: number) => {
    if (isAnswered) return;
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
    setGameStats({
      totalAttempts: 0,
      errors: 0,
      stars: 0,
      completionTime: 0,
      perfectRun: true,
      firstTrySuccess: false,
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
    if (!isAnswered) return styles.optionButton;
    
    if (selectedOption === index) {
      return correct ? styles.optionButtonCorrect : styles.optionButtonIncorrect;
    }
    
    return styles.optionButtonDisabled;
  }, [isAnswered, selectedOption]);

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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header mejorado */}
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
            <Text style={styles.activityText}>🎯 Selección Múltiple</Text>
          </View>

          {/* Stats Display usando componente reutilizable */}
          {gameStats.totalAttempts > 0 && (
            <GameStatsDisplay 
              stats={gameStats}
              showPerfectBadge={true}
            />
          )}

          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </Animated.View>

        {/* Question Container */}
        <Animated.View 
          style={[
            styles.questionContainer,
            {
              opacity: questionAnimation,
              transform: [{
                scale: questionAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                })
              }]
            }
          ]}
        >
          <View style={styles.questionHeader}>
            <Text style={styles.questionIcon}>❓</Text>
            <Text style={styles.questionTitle}>Pregunta</Text>
          </View>
          <Text style={styles.instruction}>{step.text}</Text>
          <Text style={styles.instructionSubtext}>Selecciona la opción correcta</Text>
        </Animated.View>

        {/* Options Grid */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.optionsGrid}>
            {step.options?.map((option, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.optionWrapper,
                  { transform: [{ scale: optionScales[idx] || 1 }] }
                ]}
              >
                <TouchableOpacity
                  style={getOptionStyle(idx, option.correct)}
                  onPress={() => handlePress(option.correct, idx)}
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
                    <Text style={getOptionTextStyle(idx, option.correct)}>
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
        </Animated.View>

        {/* Footer motivacional */}
        <View style={styles.footer}>
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationIcon}>⭐</Text>
            <Text style={styles.footerText}>¡Piensa bien antes de elegir!</Text>
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
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.firstTrySuccess)}
        gameType="selection"
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

      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
          accessible={true}
          accessibilityLabel="Volver a la pantalla anterior"
          accessibilityRole="button"
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
    paddingBottom: 80,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    height: 8,
    backgroundColor: '#e8f0fe',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: '#4285f4',
    borderRadius: 4,
  },
  questionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 25,
    shadowColor: '#4285f4',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#4285f4',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  questionIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  instruction: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 28,
    marginBottom: 12,
  },
  instructionSubtext: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 20,
  },
  optionWrapper: {
    width: (width - 56) / 2,
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285f4',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#e8f0fe',
    position: 'relative',
  },
  optionButtonCorrect: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOpacity: 0.3,
  },
  optionButtonIncorrect: {
    backgroundColor: '#ffeaea',
    borderColor: '#f44336',
    shadowColor: '#f44336',
    shadowOpacity: 0.3,
  },
  optionButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.6,
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 40,
  },
  optionLabel: {
    fontSize: 16,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    lineHeight: 22,
  },
  optionLabelCorrect: {
    fontSize: 16,
    textAlign: 'center',
    color: '#2e7d32',
    fontWeight: '700',
    lineHeight: 22,
  },
  optionLabelIncorrect: {
    fontSize: 16,
    textAlign: 'center',
    color: '#c62828',
    fontWeight: '700',
    lineHeight: 22,
  },
  optionLabelDisabled: {
    fontSize: 16,
    textAlign: 'center',
    color: '#9e9e9e',
    fontWeight: '600',
    lineHeight: 22,
  },
  resultIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 16,
    width: 32,
    height: 32,
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
    fontSize: 18,
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

export default SelectOptionScreen;