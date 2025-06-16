import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  Alert,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Vibration,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FeedbackAnimation from '../components/FeedbackAnimation';
import AchievementNotification from '../components/AchievementNotification';
import { AchievementService, Achievement } from '../services/AchievementService';

type MemoryGameRouteProp = RouteProp<RootStackParamList, 'memoryGame'>;

interface Card {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
  animation: Animated.Value;
}

interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  matchesFound: number;
  flipCount: number;
}

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 80) / 4;

const MemoryGameScreen = () => {
  const route = useRoute<MemoryGameRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle } = route.params;

  // Game state
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showingCards, setShowingCards] = useState(true);
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
    matchesFound: 0,
    flipCount: 0,
  });
  const [startTime] = useState<number>(Date.now());
  const [showStars, setShowStars] = useState(false);

  // Animation refs
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const instructionAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Memoized values
  const totalPairs = useMemo(() => step.options?.length || 0, [step.options]);

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
    // Animaciones de entrada
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

    const duplicated: Card[] =
      step.options?.map((option, index) => ({
        id: index,
        icon: option.icon,
        flipped: true,
        matched: false,
        animation: new Animated.Value(180),
      })) ?? [];

    // Create unique Animated.Value instances for each card
    const shuffled = [...duplicated]
      .flatMap((card) => [
        { 
          ...card, 
          id: card.id * 2,
          animation: new Animated.Value(180)
        },
        { 
          ...card, 
          id: card.id * 2 + 1,
          animation: new Animated.Value(180)
        },
      ])
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);

    // Show cards for 5 seconds
    setTimeout(() => {
      setShowingCards(false);
      const reset = shuffled.map((c) => ({
        ...c,
        flipped: false,
      }));

      reset.forEach((card) => {
        Animated.timing(card.animation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });

      setCards(reset);
      setGameStarted(true);
    }, 5000);
  }, []);

  // Calculate stars based on performance
  const calculateStars = useCallback((errors: number, flipCount: number, completionTime: number, totalPairs: number): number => {
    const maxTime = totalPairs * 15000; // 15 seconds per pair as baseline
    const minFlips = totalPairs * 2; // Minimum flips needed (perfect memory)
    
    const timeBonus = completionTime < maxTime * 0.5 ? 1 : 0;
    const memoryBonus = flipCount <= minFlips * 1.5 ? 1 : 0; // Bonus for good memory

    if (errors === 0 && flipCount <= minFlips * 1.2) {
      return 3; // Perfect performance - excellent memory
    } else if (errors <= 2 && flipCount <= minFlips * 1.5) {
      return 2 + timeBonus; // Good performance
    } else if (errors <= 4) {
      return 1 + memoryBonus; // Acceptable performance
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
      const finalStats = {
        ...gameStats,
        completionTime,
        stars: calculateStars(gameStats.errors, gameStats.flipCount, completionTime, totalPairs),
      };
      setGameStats(finalStats);
      
      // Record game completion for achievements
      recordGameCompletion(finalStats);
      
      // Show stars after a delay
      setTimeout(() => {
        setShowStars(true);
      }, 500);
    }
  }, [animationType, gameCompleted, gameStats, startTime, calculateStars, totalPairs, recordGameCompletion]);

  useEffect(() => {
    // Update progress bar
    const progress = totalPairs > 0 ? matchedCount / totalPairs : 0;
    
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();

    // Check if game is complete
    if (matchedCount === totalPairs && totalPairs > 0 && !gameCompleted) {
      setTimeout(() => {
        showFeedbackAnimation('winner');
      }, 1000);
    }
  }, [matchedCount, totalPairs, gameCompleted, showFeedbackAnimation]);

  const flipCard = useCallback((card: Card) => {
    if (card.flipped || card.matched || selected.length === 2 || !gameStarted) return;

    // Update flip count
    setGameStats(prev => ({
      ...prev,
      flipCount: prev.flipCount + 1,
    }));

    // Animate the specific card
    Animated.timing(card.animation, {
      toValue: 180,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const updatedCard = { ...card, flipped: true };
    const newCards = cards.map((c) => (c.id === card.id ? updatedCard : c));
    setCards(newCards);

    const newSelected = [...selected, updatedCard];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      
      // Update total attempts
      setGameStats(prev => ({
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
      }));

      if (first.icon === second.icon) {
        // Match found
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id || c.id === second.id ? { ...c, matched: true } : c
            )
          );
          setMatchedCount((prev) => prev + 1);
          setGameStats(prev => ({
            ...prev,
            matchesFound: prev.matchesFound + 1,
          }));
          showFeedbackAnimation('success');
        }, 500);
      } else {
        // No match
        setGameStats(prev => ({
          ...prev,
          errors: prev.errors + 1,
          perfectRun: false,
        }));

        setTimeout(() => {
          // Animate cards back
          [first, second].forEach((selectedCard) => {
            const currentCard = cards.find(c => c.id === selectedCard.id);
            if (currentCard) {
              Animated.timing(currentCard.animation, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }).start();
            }
          });

          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id || c.id === second.id
                ? { ...c, flipped: false }
                : c
            )
          );
          showFeedbackAnimation('error');
        }, 1000);
      }

      setTimeout(() => setSelected([]), 1200);
    }
  }, [cards, selected, gameStarted, showFeedbackAnimation]);

  const resetGame = useCallback(() => {
    setMatchedCount(0);
    setSelected([]);
    setGameCompleted(false);
    setShowStars(false);
    setGameStarted(false);
    setShowingCards(true);
    setGameStats({
      totalAttempts: 0,
      errors: 0,
      stars: 0,
      completionTime: 0,
      perfectRun: true,
      matchesFound: 0,
      flipCount: 0,
    });

    // Reset cards
    const duplicated: Card[] =
      step.options?.map((option, index) => ({
        id: index,
        icon: option.icon,
        flipped: true,
        matched: false,
        animation: new Animated.Value(180),
      })) ?? [];

    const shuffled = [...duplicated]
      .flatMap((card) => [
        { 
          ...card, 
          id: card.id * 2,
          animation: new Animated.Value(180)
        },
        { 
          ...card, 
          id: card.id * 2 + 1,
          animation: new Animated.Value(180)
        },
      ])
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);

    // Show cards again
    setTimeout(() => {
      setShowingCards(false);
      const reset = shuffled.map((c) => ({
        ...c,
        flipped: false,
      }));

      reset.forEach((card) => {
        Animated.timing(card.animation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });

      setCards(reset);
      setGameStarted(true);
    }, 5000);
  }, [step.options]);

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

  const getPerformanceMessage = useCallback((stars: number, perfectRun: boolean, flipCount: number, totalPairs: number) => {
    const minFlips = totalPairs * 2;
    
    if (perfectRun && stars === 3 && flipCount <= minFlips * 1.2) {
      return "¡Memoria perfecta! Increíble 🧠🏆";
    } else if (perfectRun && stars === 3) {
      return "¡Excelente memoria! Sin errores 🌟";
    } else if (stars === 3) {
      return "¡Muy bien hecho! 👏";
    } else if (stars === 2) {
      return "¡Buen trabajo! Sigue practicando 💪";
    } else {
      return "¡Completado! Tu memoria mejorará 📈";
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

  const renderCard = useCallback((card: Card) => {
    const rotateY = card.animation.interpolate({
      inputRange: [0, 180],
      outputRange: ['0deg', '180deg'],
    });

    const rotateYBack = card.animation.interpolate({
      inputRange: [0, 180],
      outputRange: ['180deg', '360deg'],
    });

    return (
      <TouchableWithoutFeedback key={card.id} onPress={() => flipCard(card)}>
        <View style={styles.cardWrapper}>
          <Animated.View
            style={[
              styles.card,
              styles.front,
              {
                transform: [{ rotateY }],
                backfaceVisibility: 'hidden',
              },
            ]}
          >
            <Text style={styles.cardQuestionText}>❓</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.card,
              styles.back,
              card.matched && styles.matchedCard,
              {
                transform: [{ rotateY: rotateYBack }],
                backfaceVisibility: 'hidden',
                position: 'absolute',
                top: 0,
                left: 0,
              },
            ]}
          >
            <Text style={styles.cardIcon}>{card.icon}</Text>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    );
  }, [flipCard]);

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
            <Text style={styles.activityText}>🧠 Juego de Memoria</Text>
          </View>

          {/* Stats Display */}
          {gameStarted && (
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
                <Text style={styles.statLabel}>Volteos</Text>
                <Text style={styles.statValue}>{gameStats.flipCount}</Text>
              </View>
              {gameStats.perfectRun && gameStats.totalAttempts > 0 && (
                <View style={styles.perfectBadge}>
                  <Text style={styles.perfectText}>🔥 Perfecto</Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>

        {/* Instrucciones */}
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
            <Text style={styles.instructionIcon}>👀</Text>
            <Text style={styles.instructionTitle}>
              {showingCards ? '¡Memoriza las cartas!' : '¡Encuentra las parejas!'}
            </Text>
          </View>
          <Text style={styles.instruction}>
            {showingCards 
              ? 'Observa bien las cartas y recuerda dónde están'
              : 'Toca las cartas para voltearlas y encuentra las parejas iguales'
            }
          </Text>
        </Animated.View>

        {/* Barra de progreso */}
        {gameStarted && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>🎯 Progreso</Text>
              <Text style={styles.progressText}>{matchedCount} / {totalPairs}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Grid de cartas */}
        <View style={styles.gameContainer}>
          <View style={styles.grid}>
            {cards.map(renderCard)}
          </View>
        </View>

        {/* Footer motivacional */}
        <View style={styles.footer}>
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationIcon}>⭐</Text>
            <Text style={styles.footerText}>
              {showingCards ? '¡Observa con atención!' : '¡Tú puedes hacerlo!'}
            </Text>
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
                {getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.flipCount, totalPairs)}
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
                <Text style={styles.statDetailLabel}>Volteos totales:</Text>
                <Text style={styles.statDetailValue}>{gameStats.flipCount}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statDetailLabel}>Eficiencia:</Text>
                <Text style={styles.statDetailValue}>
                  {totalPairs > 0 
                    ? Math.round((totalPairs * 2 / gameStats.flipCount) * 100)
                    : 100}%
                </Text>
              </View>
              {gameStats.perfectRun && gameStats.flipCount <= totalPairs * 2.4 && (
                <View style={styles.bonusRow}>
                  <Text style={styles.bonusText}>🧠 ¡Memoria excepcional!</Text>
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

export default MemoryGameScreen;

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
    alignItems: 'center',
    paddingTop: 25,
    paddingBottom: 20,
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
    marginTop: 15,
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
  instructionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginVertical: 20,
    shadowColor: '#4285f4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
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
    color: '#1a1a1a',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '500',
    lineHeight: 22,
  },
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4285f4',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e8f0fe',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4285f4',
    borderRadius: 4,
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: width - 40,
  },
  cardWrapper: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: 4,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  front: {
    backgroundColor: '#4285f4',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  back: {
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#e8f0fe',
  },
  matchedCard: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
  },
  cardQuestionText: {
    fontSize: 32,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardIcon: {
    fontSize: 36,
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
    shadowColor: '#4285f4',
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