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
import { GameStatsDisplay } from '../components/GameStatsDisplay';
import { GameCompletionModal } from '../components/GameCompletionModal';
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
  firstTrySuccess: boolean;
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
    firstTrySuccess: false,
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
    
    // Entrance animation
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Auto-play after loading
    setTimeout(() => {
      playAudio();
    }, 1000);

    // Continuous pulse animation for audio button
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
  const calculateStars = useCallback((errors: number, audioPlays: number, completionTime: number, firstTry: boolean): number => {
    const maxTime = 30000; // 30 seconds as baseline
    const timeBonus = completionTime < maxTime * 0.5 ? 1 : 0;
    const audioBonus = audioPlays <= 2 ? 1 : 0;

    if (firstTry && errors === 0 && audioPlays <= 1) {
      return 3; // Perfect performance - first try, minimal audio
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
        stars: calculateStars(gameStats.errors, gameStats.audioPlays, completionTime, gameStats.firstTrySuccess),
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
    
    // Audio button animation
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
    const isFirstAttempt = gameStats.totalAttempts === 0;
    setGameStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
      errors: correct ? prev.errors : prev.errors + 1,
      perfectRun: correct ? prev.perfectRun : false,
      firstTrySuccess: correct && isFirstAttempt,
    }));
    
    // Option animation
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
  }, [gameCompleted, gameStats, optionScales, showFeedbackAnimation]);

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
      firstTrySuccess: false,
    });
  }, []);

  const getPerformanceMessage = useCallback((stars: number, perfectRun: boolean, audioPlays: number, firstTry: boolean) => {
    if (perfectRun && stars === 3 && firstTry && audioPlays <= 1) {
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
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{lessonTitle}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.activityBadge}>
          <Text style={styles.activityText}>🎵 Repetir Sonido</Text>
        </View>

        {/* Compact Stats Display usando componente reutilizable */}
        {gameStats.totalAttempts > 0 && (
          <GameStatsDisplay 
            stats={gameStats}
            showPerfectBadge={true}
            layout="horizontal"
          />
        )}
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <View style={styles.instructionHeader}>
            <Text style={styles.instructionIcon}>👂</Text>
            <Text style={styles.instructionTitle}>¡Escucha con atención!</Text>
          </View>
          <Text style={styles.instructionText}>
            Presiona el botón de audio y elige el pictograma correcto
          </Text>
        </View>

        {/* Compact Audio Section */}
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
                {isPlaying ? '¡Reproduciendo!' : 'Presiona para escuchar'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Compact Options Grid */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Elige la opción correcta:</Text>
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

        {/* Footer motivacional */}
        <View style={styles.footer}>
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationIcon}>⭐</Text>
            <Text style={styles.footerText}>¡Tú puedes hacerlo!</Text>
            <Text style={styles.motivationIcon}>⭐</Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Game Complete Modal usando componente reutilizable */}
      <GameCompletionModal
        visible={gameCompleted && !showAnimation && showStars}
        stats={gameStats}
        onReset={resetGame}
        onContinue={() => navigation.goBack()}
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.audioPlays, gameStats.firstTrySuccess)}
        gameType="audio"
        bonusMessage={gameStats.firstTrySuccess && gameStats.audioPlays <= 1 ? "🎯 ¡Primera vez perfecto!" : undefined}
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 60,
  },
  activityBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 8,
  },
  activityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  instructionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '500',
    lineHeight: 22,
  },
  audioSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  audioContainer: {
    alignItems: 'center',
  },
  speakerButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#26D0CE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 180,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  speakerButtonActive: {
    backgroundColor: '#45B7D1',
    shadowColor: '#3742FA',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  speakerIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  speakerIcon: {
    fontSize: 24,
  },
  speakerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  optionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  optionContainer: {
    width: (width - 44) / 2,
    maxWidth: 140,
  },
  optionButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 120,
    justifyContent: 'center',
    position: 'relative',
  },
  optionButtonSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#F0FFFF',
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.25,
  },
  optionButtonCorrect: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e8',
    shadowColor: '#4caf50',
    shadowOpacity: 0.25,
  },
  iconContainer: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 28,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    lineHeight: 16,
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
  checkmarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  motivationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  motivationIcon: {
    fontSize: 18,
    marginHorizontal: 6,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default RepeatSoundScreen;