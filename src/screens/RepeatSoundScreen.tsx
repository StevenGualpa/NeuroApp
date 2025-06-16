import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
import Tts from 'react-native-tts';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FeedbackAnimation from '../components/FeedbackAnimation';
import AchievementNotification from '../components/AchievementNotification';
import { AchievementService, Achievement } from '../services/AchievementService';

const { width } = Dimensions.get('window');

type RepeatSoundRouteProp = RouteProp<RootStackParamList, 'repeatSound'>;

interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  audioPlays: number;
}

const RepeatSoundScreen = () => {
  const route = useRoute<RepeatSoundRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle } = route.params;

  // Audio and game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
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
    audioPlays: 0,
  });
  const [startTime] = useState<number>(Date.now());
  const [showStars, setShowStars] = useState(false);

  // Animation refs
  const speakerScale = useRef(new Animated.Value(1)).current;
  const optionScales = useRef(
    step.options?.map(() => new Animated.Value(1)) || []
  ).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const headerAnimation = useRef(new Animated.Value(0)).current;

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
    Tts.setDefaultLanguage('es-ES');
    Tts.setDefaultRate(0.5);
    
    // Animación de entrada del header
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Reproducir automáticamente al cargar
    setTimeout(() => {
      playAudio();
    }, 1000);

    // Animación de pulso continua para el botón de audio
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startPulse();

    return () => {
      Tts.stop();
    };
  }, []);

  // Calculate stars based on performance
  const calculateStars = useCallback((errors: number, audioPlays: number, completionTime: number): number => {
    const maxTime = 30000; // 30 seconds as baseline
    const timeBonus = completionTime < maxTime * 0.5 ? 1 : 0;
    const audioBonus = audioPlays <= 2 ? 1 : 0; // Bonus for not replaying too much

    if (errors === 0 && audioPlays <= 1) {
      return 3; // Perfect performance - first try, no replays
    } else if (errors === 0) {
      return 2 + timeBonus; // Good performance - no errors
    } else if (errors <= 1) {
      return 1 + audioBonus; // Acceptable performance - max 1 error
    } else {
      return 1; // Minimum star for completion
    }
  }, []);

  const showFeedbackAnimation = useCallback((type: 'success' | 'error' | 'winner' | 'loser') => {
    setAnimationType(type);
    setShowAnimation(true);
    
    // Add haptic feedback
    if (type === 'success') {
      Vibration.vibrate(50); // Short vibration for success
    } else if (type === 'error') {
      Vibration.vibrate([0, 100, 50, 100]); // Pattern for error
    } else if (type === 'winner') {
      Vibration.vibrate([0, 100, 50, 100, 50, 100]); // Celebration
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
    
    // Process next achievement in queue after a delay
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
        stars: calculateStars(gameStats.errors, gameStats.audioPlays, completionTime),
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

  const playAudio = useCallback(() => {
    setIsPlaying(true);
    Tts.speak(step.audio);
    
    // Update audio play count
    setGameStats(prev => ({
      ...prev,
      audioPlays: prev.audioPlays + 1,
    }));
    
    // Animación del botón de audio
    Animated.sequence([
      Animated.timing(speakerScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(speakerScale, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(speakerScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => setIsPlaying(false), 1000);
    });
  }, [step.audio, speakerScale]);

  const handleOptionPress = useCallback((optionIndex: number, correct: boolean) => {
    if (gameCompleted) return;
    
    setSelectedOption(optionIndex);
    
    // Update stats
    setGameStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
      errors: correct ? prev.errors : prev.errors + 1,
      perfectRun: correct ? prev.perfectRun : false,
    }));
    
    // Animación de la opción seleccionada
    Animated.spring(optionScales[optionIndex], {
      toValue: 0.95,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(optionScales[optionIndex], {
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
          setSelectedOption(null);
        }, 1500);
      }
    }, 300);
  }, [gameCompleted, optionScales, showFeedbackAnimation]);

  const handleOptionPressIn = useCallback((index: number) => {
    if (gameCompleted) return;
    Animated.spring(optionScales[index], {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, [gameCompleted, optionScales]);

  const handleOptionPressOut = useCallback((index: number) => {
    if (selectedOption !== index && !gameCompleted) {
      Animated.spring(optionScales[index], {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedOption, gameCompleted, optionScales]);

  const resetGame = useCallback(() => {
    setSelectedOption(null);
    setGameCompleted(false);
    setShowStars(false);
    setGameStats({
      totalAttempts: 0,
      errors: 0,
      stars: 0,
      completionTime: 0,
      perfectRun: true,
      audioPlays: 0,
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

  const getPerformanceMessage = useCallback((stars: number, perfectRun: boolean, audioPlays: number) => {
    if (perfectRun && stars === 3 && audioPlays <= 1) {
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
          
          {/* Stats Display */}
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
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Audio</Text>
              <Text style={styles.statValue}>{gameStats.audioPlays}</Text>
            </View>
            {gameStats.perfectRun && gameStats.totalAttempts > 0 && (
              <View style={styles.perfectBadge}>
                <Text style={styles.perfectText}>🔥 Perfecto</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Botón de Audio mejorado */}
        <View style={styles.audioSection}>
          <Animated.View 
            style={[
              styles.audioContainer,
              { 
                transform: [
                  { scale: speakerScale },
                  { scale: pulseAnimation }
                ] 
              }
            ]}
          >
            <TouchableOpacity 
              style={[
                styles.speakerButton,
                isPlaying && styles.speakerButtonActive
              ]} 
              onPress={playAudio}
              activeOpacity={0.8}
              disabled={gameCompleted}
            >
              <View style={styles.speakerIconContainer}>
                <Text style={styles.speakerIcon}>
                  {isPlaying ? '🔊' : '🎵'}
                </Text>
              </View>
              <Text style={styles.speakerText}>
                {isPlaying ? '¡Reproduciendo!' : '¡Presiona para escuchar!'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Opciones con instrucciones integradas */}
        <View style={styles.optionsSection}>
          <View style={styles.instructionCard}>
            <View style={styles.instructionHeader}>
              <Text style={styles.instructionIcon}>👂</Text>
              <Text style={styles.instructionTitle}>¡Escucha con atención!</Text>
            </View>
            <Text style={styles.instruction}>
              Presiona el botón de audio y elige el pictograma correcto
            </Text>
          </View>
          
          <View style={styles.optionsGrid}>
            {step.options?.map((option, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.optionContainer,
                  { transform: [{ scale: optionScales[idx] }] }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedOption === idx && styles.optionButtonSelected,
                    gameCompleted && option.correct && styles.optionButtonCorrect
                  ]}
                  onPress={() => handleOptionPress(idx, option.correct)}
                  onPressIn={() => handleOptionPressIn(idx)}
                  onPressOut={() => handleOptionPressOut(idx)}
                  activeOpacity={0.8}
                  disabled={gameCompleted}
                >
                  <View style={[
                    styles.iconContainer,
                    selectedOption === idx && styles.iconContainerSelected,
                    gameCompleted && option.correct && styles.iconContainerCorrect
                  ]}>
                    <Text style={styles.icon}>{option.icon}</Text>
                  </View>
                  <Text style={[
                    styles.label,
                    selectedOption === idx && styles.labelSelected,
                    gameCompleted && option.correct && styles.labelCorrect
                  ]}>
                    {option.label}
                  </Text>
                  {gameCompleted && option.correct && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Footer motivacional mejorado */}
        <View style={styles.footer}>
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationIcon}>⭐</Text>
            <Text style={styles.footerText}>¡Tú puedes hacerlo!</Text>
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
                {getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.audioPlays)}
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
                <Text style={styles.statDetailLabel}>Reproducciones:</Text>
                <Text style={styles.statDetailValue}>{gameStats.audioPlays}</Text>
              </View>
              {gameStats.perfectRun && gameStats.audioPlays <= 1 && (
                <View style={styles.bonusRow}>
                  <Text style={styles.bonusText}>🏆 ¡Primera vez perfecto!</Text>
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

export default RepeatSoundScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  header: {
    alignItems: 'center',
    paddingTop: 25,
    paddingBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    color: '#2D3436',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
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
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    color: '#2D3436',
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
  instructionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#4ECDC4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#4ECDC4',
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
    color: '#2D3436',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    color: '#636E72',
    fontWeight: '500',
    lineHeight: 22,
  },
  audioSection: {
    alignItems: 'center',
    marginBottom: 35,
  },
  audioContainer: {
    alignItems: 'center',
  },
  speakerButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 35,
    paddingVertical: 25,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#26D0CE',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    minWidth: 220,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  speakerButtonActive: {
    backgroundColor: '#45B7D1',
    shadowColor: '#3742FA',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  speakerIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  speakerIcon: {
    fontSize: 28,
  },
  speakerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  optionsSection: {
    flex: 1,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
  },
  optionContainer: {
    width: (width - 60) / 2,
    maxWidth: 160,
  },
  optionButton: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'transparent',
    minHeight: 140,
    justifyContent: 'center',
    position: 'relative',
  },
  optionButtonSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#F0FFFF',
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.3,
  },
  optionButtonCorrect: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e8',
    shadowColor: '#4caf50',
    shadowOpacity: 0.3,
  },
  iconContainer: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 50,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  iconContainerCorrect: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  icon: {
    fontSize: 36,
  },
  label: {
    fontSize: 14,
    textAlign: 'center',
    color: '#2D3436',
    fontWeight: '600',
    lineHeight: 18,
  },
  labelSelected: {
    color: '#4ECDC4',
    fontWeight: '700',
  },
  labelCorrect: {
    color: '#4caf50',
    fontWeight: '700',
  },
  checkmark: {
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
  checkmarkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  motivationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  motivationIcon: {
    fontSize: 20,
    marginHorizontal: 8,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
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
    color: '#2D3436',
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
    color: '#636E72',
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
    color: '#4ECDC4',
    textAlign: 'center',
    marginTop: 10,
  },
  detailedStats: {
    backgroundColor: '#F8FAFF',
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
    color: '#636E72',
    fontWeight: '500',
  },
  statDetailValue: {
    fontSize: 16,
    color: '#2D3436',
    fontWeight: '700',
  },
  bonusRow: {
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8F0FE',
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
    backgroundColor: '#636E72',
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
    backgroundColor: '#4ECDC4',
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
    borderColor: '#4ECDC4',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
  },
});