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
import { GameCompletionModal } from '../components/GameCompletionModal';
import { ProgressSection } from '../components/ProgressSection';
import RealAchievementService from '../services/RealAchievementService';
import { Achievement } from '../services/ApiService';
import AdaptiveReinforcementService from '../services/AdaptiveReinforcementService';
import AudioService from '../services/AudioService';

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
  dragCount: number;
}

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 60) / 4;

const RealMemoryGameScreen = () => {
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
    matchesFound: 0,
    flipCount: 0,
    efficiency: 100,
    dragCount: 0,
  });
  const [startTime] = useState<number>(Date.now());
  const [showStars, setShowStars] = useState(false);

  // Adaptive reinforcement states
  const [isHelpActive, setIsHelpActive] = useState(false);
  const [blinkingCardIds, setBlinkingCardIds] = useState<number[]>([]);
  const [helpBlinkAnimation] = useState(new Animated.Value(1));
  const adaptiveService = useRef(AdaptiveReinforcementService.getInstance());
  const audioService = useRef(AudioService.getInstance());

  // Memoized values
  const totalPairs = useMemo(() => step.options?.length || 0, [step.options]);
  const totalItems = totalPairs;

  // Initialize achievements service
  useEffect(() => {
    const initAchievements = async () => {
      try {
        console.log('🏆 Initializing Real Achievement Service...');
        await RealAchievementService.initializeAchievements();
        console.log('✅ Real Achievement Service initialized');
      } catch (error) {
        console.error('❌ Error initializing real achievements:', error);
        // Continue without achievements if there's an error
      }
    };
    initAchievements();
  }, []);

  // Initialize adaptive reinforcement service
  useEffect(() => {
    adaptiveService.current.initialize(
      (helpCardIndex) => {
        if (helpCardIndex === -1) {
          triggerHelpForMemoryGame();
        } else {
          triggerHelpForMemoryGame();
        }
      },
      (message, activityType) => {
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
      step.activityType
    );

    return () => {
      console.log(`🔊 RealMemoryGameScreen: Cleaning up services`);
      adaptiveService.current.cleanup();
      audioService.current.cleanup();
    };
  }, [step]);

  const initializeCards = useCallback(() => {
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
          animation: new Animated.Value(180),
        },
        { 
          ...card, 
          id: card.id * 2 + 1,
          animation: new Animated.Value(180),
        },
      ])
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);

    const timer = setTimeout(() => {
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

    return () => clearTimeout(timer);
  }, [step.options]);

  useEffect(() => {
    const cleanup = initializeCards();
    return cleanup;
  }, [initializeCards]);

  const triggerHelpForMemoryGame = useCallback(() => {
    const unmatchedCards = cards.filter(card => !card.matched);
    if (unmatchedCards.length === 0) return;

    const cardGroups: { [icon: string]: Card[] } = {};
    unmatchedCards.forEach(card => {
      if (!cardGroups[card.icon]) {
        cardGroups[card.icon] = [];
      }
      cardGroups[card.icon].push(card);
    });

    const availablePair = Object.values(cardGroups).find(group => group.length >= 2);
    if (!availablePair) return;

    const helpCards = availablePair.slice(0, 2);
    const helpCardIds = helpCards.map(card => card.id);

    setIsHelpActive(true);
    setBlinkingCardIds(helpCardIds);
    
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
    
    setTimeout(() => {
      setIsHelpActive(false);
      setBlinkingCardIds([]);
      helpBlinkAnimation.setValue(1);
    }, 5000);
  }, [cards, helpBlinkAnimation, isHelpActive]);

  const calculateStars = useCallback((errors: number, flipCount: number, completionTime: number, totalPairs: number): number => {
    const maxTime = totalPairs * 12000;
    const minFlips = totalPairs * 2;
    
    const timeBonus = completionTime < maxTime * 0.6 ? 1 : 0;
    const memoryBonus = flipCount <= minFlips * 1.4 ? 1 : 0;

    if (errors === 0 && flipCount <= minFlips * 1.2) {
      return 3;
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

  // Record game completion and check for achievements with REAL backend
  const recordGameCompletion = useCallback(async (finalStats: GameStats) => {
    try {
      console.log('🎮 Recording game completion with Real Achievement Service...');
      
      const gameData = {
        stars: finalStats.stars,
        isPerfect: finalStats.perfectRun,
        completionTime: finalStats.completionTime,
        errors: finalStats.errors,
        activityType: 'Memoria visual',
        showedImprovement: finalStats.errors > 0 && finalStats.stars > 1,
        usedHelp: false,
        tookTime: finalStats.completionTime > 60000,
        lessonId: step.lesson_id,
        stepId: step.ID,
      };

      console.log('📊 Game data to record:', gameData);

      const newlyUnlocked = await RealAchievementService.recordGameCompletion(gameData);
      
      if (newlyUnlocked.length > 0) {
        console.log(`🏆 Unlocked ${newlyUnlocked.length} new achievements:`, newlyUnlocked.map(a => a.name));
        setAchievementQueue(prev => [...prev, ...newlyUnlocked]);
        
        if (!showAchievementNotification) {
          setTimeout(() => {
            processAchievementQueue();
          }, 2000);
        }
      } else {
        console.log('📈 No new achievements unlocked, but progress may have been updated');
      }
    } catch (error) {
      console.error('❌ Error recording game completion:', error);
      Alert.alert(
        'Conexión',
        'No se pudieron sincronizar los logros con el servidor. Tu progreso se ha guardado localmente.',
        [{ text: 'OK' }]
      );
    }
  }, [step, showAchievementNotification, processAchievementQueue]);

  const handleAnimationFinish = useCallback(() => {
    setShowAnimation(false);
    
    if (animationType === 'winner' && !gameCompleted) {
      setGameCompleted(true);
      
      const completionTime = Date.now() - startTime;
      const efficiency = Math.round((totalPairs * 2 / gameStats.flipCount) * 100);
      const finalStats = {
        ...gameStats,
        completionTime,
        efficiency,
        stars: calculateStars(gameStats.errors, gameStats.flipCount, completionTime, totalPairs),
      };
      setGameStats(finalStats);
      
      // Record game completion for achievements with REAL backend
      recordGameCompletion(finalStats);
      
      setTimeout(() => {
        setShowStars(true);
      }, 500);
    }
  }, [animationType, gameCompleted, gameStats, startTime, calculateStars, totalPairs, recordGameCompletion]);

  useEffect(() => {
    setScore(matchedCount);

    if (matchedCount === totalPairs && totalPairs > 0 && !gameCompleted) {
      const timer = setTimeout(() => {
        showFeedbackAnimation('winner');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [matchedCount, totalPairs, gameCompleted, showFeedbackAnimation]);

  const flipCard = useCallback((card: Card) => {
    if (card.flipped || card.matched || selected.length === 2 || !gameStarted) return;

    adaptiveService.current.recordInactivity();

    if (isHelpActive) {
      setIsHelpActive(false);
      setBlinkingCardIds([]);
      helpBlinkAnimation.setValue(1);
    }

    setGameStats(prev => ({
      ...prev,
      flipCount: prev.flipCount + 1,
      dragCount: prev.dragCount + 1,
    }));

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
      
      setGameStats(prev => ({
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
      }));

      const isMatch = first.icon === second.icon;

      adaptiveService.current.recordAction(isMatch, -1, step.activityType);

      if (isMatch) {
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
          audioService.current.playEncouragementMessage();
        }, 500);
      } else {
        setGameStats(prev => ({
          ...prev,
          errors: prev.errors + 1,
          perfectRun: false,
        }));

        setTimeout(() => {
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
          audioService.current.playErrorGuidanceMessage();
        }, 1000);
      }

      setTimeout(() => setSelected([]), 1200);
    }
  }, [cards, selected, gameStarted, showFeedbackAnimation, step.activityType, isHelpActive, helpBlinkAnimation]);

  const resetGame = useCallback(() => {
    setMatchedCount(0);
    setScore(0);
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
      dragCount: 0,
    });

    initializeCards();
  }, [initializeCards]);

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

    const isBlinking = isHelpActive && blinkingCardIds.includes(card.id);

    return (
      <TouchableWithoutFeedback key={card.id} onPress={() => flipCard(card)}>
        <Animated.View 
          style={[
            styles.cardWrapper,
            { opacity: isBlinking ? helpBlinkAnimation : 1 }
          ]}
        >
          <Animated.View
            style={[
              styles.card,
              styles.front,
              styles.cardFace,
              isBlinking && styles.cardHelp,
              {
                transform: [{ rotateY }],
              },
            ]}
          >
            <Text style={styles.cardQuestionText}>❓</Text>
          </Animated.View>
          <Animated.View
            style={[
              styles.card,
              styles.back,
              styles.cardFaceBack,
              card.matched && styles.matchedCard,
              isBlinking && styles.cardHelp,
              {
                transform: [{ rotateY: rotateYBack }],
              },
            ]}
          >
            <Text style={styles.cardIcon}>{card.icon}</Text>
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }, [flipCard, isHelpActive, blinkingCardIds, helpBlinkAnimation]);

  useEffect(() => {
    processAchievementQueue();
  }, [processAchievementQueue]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>🧠 Memoria Visual</Text>
          <Text style={styles.headerSubtitle}>Conectado a API Real</Text>
        </View>
      </View>

      {/* Contenido Scrollable */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        onTouchStart={() => {
          adaptiveService.current.recordInactivity();
        }}
        onScrollBeginDrag={() => {
          adaptiveService.current.recordInactivity();
        }}
      >

        {/* Progreso del juego */}
        <ProgressSection 
          score={score}
          totalItems={totalItems}
          gameStats={gameStats}
        />

        {/* Estado del juego */}
        <View style={styles.gameStateContainer}>
          <Text style={styles.sectionTitle}>
            {showingCards ? '👀 ¡Memoriza las cartas!' : '🧠 Encuentra las parejas:'}
          </Text>
          <Text style={styles.gameStateText}>
            {showingCards 
              ? 'Observa bien las cartas y recuerda dónde están'
              : 'Toca las cartas para voltearlas y encuentra las parejas iguales'
            }
          </Text>
        </View>

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
              {showingCards ? '¡Observa con atención!' :
               score === 0 ? '¡Usa tu memoria!' :
               score === totalItems ? '¡Increíble! Lo lograste' :
               '¡Excelente! Sigue así, casi terminas'}
            </Text>
            <Text style={styles.motivationIcon}>⭐</Text>
          </View>
          
          <View style={styles.encouragementFooter}>
            <Text style={styles.encouragementFooterText}>
              🏆 Los logros se sincronizan automáticamente ✨
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Game Complete Modal */}
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

export default RealMemoryGameScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  header: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginLeft: -60, // Compensate for back button
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gameStateContainer: {
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
  gameStateText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  gameContainer: {
    alignItems: 'center',
    marginBottom: 16,
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
  cardHelp: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 3,
    shadowColor: '#ffc107',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
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
  cardFace: {
    backfaceVisibility: 'hidden',
  },
  cardFaceBack: {
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
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
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  encouragementFooterText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});