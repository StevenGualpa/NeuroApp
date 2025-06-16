import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  Vibration,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FeedbackAnimation from '../components/FeedbackAnimation';
import AchievementNotification from '../components/AchievementNotification';
import { AchievementService, Achievement } from '../services/AchievementService';

const { width } = Dimensions.get('window');

interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  firstTrySuccess: boolean;
}

const MatchScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'match'>>();
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
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const questionAnimation = useRef(new Animated.Value(0)).current;
  const optionAnimations = useRef(
    step.options?.map(() => new Animated.Value(0)) || []
  ).current;

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
      Animated.stagger(150, 
        optionAnimations.map(anim => 
          Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          })
        )
      ),
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

  const handleOptionPress = useCallback((correct: boolean, index: number) => {
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

    // Animate selected option
    Animated.spring(optionAnimations[index], {
      toValue: 0.95,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(optionAnimations[index], {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });

    setTimeout(() => {
      if (correct) {
        showFeedbackAnimation('success');
      } else {
        showFeedbackAnimation('error');
        setTimeout(() => {
          setIsAnswered(false);
          setSelectedOption(null);
        }, 1500);
      }
    }, 500);
  }, [isAnswered, gameCompleted, gameStats, optionAnimations, showFeedbackAnimation]);

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
  }, []);

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

  const getOptionStyle = useCallback((index: number, correct: boolean) => {
    if (!isAnswered) return styles.optionButton;
    
    if (selectedOption === index) {
      return correct ? styles.optionButtonCorrect : styles.optionButtonIncorrect;
    }
    
    return styles.optionButtonDisabled;
  }, [isAnswered, selectedOption]);

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

          {/* Stats Display */}
          {gameStats.totalAttempts > 0 && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Intentos</Text>
                <Text style={styles.statValue}>{gameStats.totalAttempts}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Errores</Text>
                <Text style={[styles.statValue, gameStats.errors > 0 && styles.errorText]}>
                  {gameStats.errors}
                </Text>
              </View>
              {gameStats.perfectRun && gameStats.totalAttempts > 0 && (
                <View style={styles.perfectBadge}>
                  <Text style={styles.perfectText}>🔥 Perfecto</Text>
                </View>
              )}
            </View>
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
          <Text style={styles.questionText}>{step.text}</Text>
          <Text style={styles.instructionText}>Selecciona la opción correcta</Text>
        </Animated.View>

        {/* Options Container */}
        <View style={styles.optionsContainer}>
          {step.options?.map((option, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.optionWrapper,
                {
                  opacity: optionAnimations[idx],
                  transform: [{
                    translateY: optionAnimations[idx].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    })
                  }, {
                    scale: optionAnimations[idx]
                  }]
                }
              ]}
            >
              <TouchableOpacity
                style={getOptionStyle(idx, option.correct)}
                onPress={() => handleOptionPress(option.correct, idx)}
                activeOpacity={0.8}
                disabled={isAnswered}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.iconContainer,
                    isAnswered && selectedOption === idx && option.correct && styles.iconContainerCorrect,
                    isAnswered && selectedOption === idx && !option.correct && styles.iconContainerIncorrect,
                  ]}>
                    <Text style={styles.icon}>{option.icon}</Text>
                  </View>
                  <Text style={[
                    styles.label,
                    isAnswered && selectedOption === idx && option.correct && styles.labelCorrect,
                    isAnswered && selectedOption === idx && !option.correct && styles.labelIncorrect,
                  ]}>{option.label}</Text>
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

        {/* Footer motivacional */}
        <View style={styles.footer}>
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationIcon}>⭐</Text>
            <Text style={styles.footerText}>¡Piensa bien antes de elegir!</Text>
            <Text style={styles.motivationIcon}>⭐</Text>
          </View>
        </View>
      </ScrollView>

      {/* Game Complete Modal with Stars */}
      {gameCompleted && !showAnimation && showStars && (
        <View style={styles.completionContainer}>
          <View style={styles.completionContent}>
            <Text style={styles.completionText}>🎉 ¡Felicitaciones!</Text>
            
            {/* Stars Display */}
            <View style={styles.starsContainer}>
              <Text style={styles.starsTitle}>Tu puntuación:</Text>
              <View style={styles.starsRow}>
                {renderStars(gameStats.stars)}
              </View>
              <Text style={styles.performanceMessage}>
                {getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.firstTrySuccess)}
              </Text>
            </View>

            {/* Detailed Stats */}
            <View style={styles.detailedStats}>
              <View style={styles.statRow}>
                <Text style={styles.statDetailLabel}>Tiempo:</Text>
                <Text style={styles.statDetailValue}>
                  {Math.round(gameStats.completionTime / 1000)}s
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statDetailLabel}>Precisión:</Text>
                <Text style={styles.statDetailValue}>
                  {gameStats.totalAttempts > 0 
                    ? Math.round(((gameStats.totalAttempts - gameStats.errors) / gameStats.totalAttempts) * 100)
                    : 100}%
                </Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statDetailLabel}>Intentos:</Text>
                <Text style={styles.statDetailValue}>{gameStats.totalAttempts}</Text>
              </View>
              {gameStats.firstTrySuccess && (
                <View style={styles.bonusRow}>
                  <Text style={styles.bonusText}>🎯 ¡Primera vez perfecto!</Text>
                </View>
              )}
            </View>

            <View style={styles.completionButtons}>
              <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                <Text style={styles.resetButtonText}>🔄 Jugar de nuevo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.continueButton} 
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.continueButtonText}>✨ Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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

export default MatchScreen;
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
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  errorText: {
    color: '#ef4444',
  },
  perfectBadge: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  perfectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
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
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 28,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '500',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  optionWrapper: {
    width: (width - 56) / 2,
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
  icon: {
    fontSize: 40,
  },
  label: {
    fontSize: 16,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    lineHeight: 22,
  },
  labelCorrect: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  labelIncorrect: {
    color: '#c62828',
    fontWeight: '700',
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
  // Game Complete Modal Styles
  completionContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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