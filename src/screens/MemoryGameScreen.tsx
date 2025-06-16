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
import { GameStatsDisplay } from '../components/GameStatsDisplay';
import { GameCompletionModal } from '../components/GameCompletionModal';
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
  efficiency: number;
}

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 60) / 4; // Reduced for better fit

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
    efficiency: 100,
  });
  const [startTime] = useState<number>(Date.now());
  const [showStars, setShowStars] = useState(false);

  // Animation refs
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

    // Show cards for 4 seconds (reduced)
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
    }, 4000);
  }, []);

  // Calculate stars based on performance
  const calculateStars = useCallback((errors: number, flipCount: number, completionTime: number, totalPairs: number): number => {
    const maxTime = totalPairs * 12000; // 12 seconds per pair
    const minFlips = totalPairs * 2;
    
    const timeBonus = completionTime < maxTime * 0.6 ? 1 : 0;
    const memoryBonus = flipCount <= minFlips * 1.4 ? 1 : 0;

    if (errors === 0 && flipCount <= minFlips * 1.2) {
      return 3; // Perfect performance
    } else if (errors <= 2 && flipCount <= minFlips * 1.5) {
      return 2 + timeBonus;
    } else if (errors <= 4) {
      return 1 + memoryBonus;
    } else {
      return 1;
    }
  }, []);

  const showFeedbackAnimation = useCallback((type: 'success' | 'error' | 'winner' | 'loser') => {
    setAnimationType(type);
    setShowAnimation(true);
    
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
      const efficiency = Math.round((totalPairs * 2 / gameStats.flipCount) * 100);
      const finalStats = {
        ...gameStats,
        completionTime,
        efficiency,
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
      efficiency: 100,
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
    }, 4000);
  }, [step.options]);

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
          <Text style={styles.activityText}>🧠 Juego de Memoria</Text>
        </View>

        {/* Progress Bar */}
        {gameStarted && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{matchedCount}/{totalPairs}</Text>
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
          </View>
        )}

        {/* Compact Stats Display usando componente reutilizable */}
        {gameStarted && gameStats.totalAttempts > 0 && (
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
            <Text style={styles.instructionIcon}>👀</Text>
            <Text style={styles.instructionTitle}>
              {showingCards ? '¡Memoriza!' : '¡Encuentra parejas!'}
            </Text>
          </View>
          <Text style={styles.instructionText}>
            {showingCards 
              ? 'Observa bien las cartas y recuerda dónde están'
              : 'Toca las cartas para voltearlas y encuentra las parejas iguales'
            }
          </Text>
        </View>

        {/* Compact Grid de cartas */}
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

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Game Complete Modal usando componente reutilizable */}
      <GameCompletionModal
        visible={gameCompleted && !showAnimation && showStars}
        stats={gameStats}
        onReset={resetGame}
        onContinue={() => navigation.goBack()}
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.flipCount, totalPairs)}
        gameType="memory"
        showEfficiency={true}
        customStats={[
          { label: 'Volteos totales', value: gameStats.flipCount },
          { label: 'Parejas encontradas', value: `${gameStats.matchesFound}/${totalPairs}` }
        ]}
        bonusMessage={gameStats.perfectRun && gameStats.flipCount <= totalPairs * 2.4 ? "🧠 ¡Memoria excepcional!" : undefined}
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

export default MemoryGameScreen;

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
    borderColor: '#4285f4',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285f4',
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
    backgroundColor: '#4285f4',
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285f4',
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e8f0fe',
    borderRadius: 3,
    overflow: 'hidden',
    maxWidth: 120,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4285f4',
    borderRadius: 3,
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
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
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
  gameContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: width - 32,
  },
  cardWrapper: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: 2,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  front: {
    backgroundColor: '#4285f4',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  back: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e8f0fe',
  },
  matchedCard: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
  },
  cardQuestionText: {
    fontSize: 24,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardIcon: {
    fontSize: 28,
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
    shadowColor: '#4285f4',
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