import { useState, useCallback, useRef, useEffect } from 'react';
import { Animated, Vibration } from 'react-native';
import { Card, GameStats, Step } from '../types';
import { 
  calculateStars, 
  getPerformanceMessage, 
  calculateEfficiency, 
  createDefaultGameStats,
  shuffleArray,
} from '../utils/gameUtils';
import { GAME_CONFIG } from '../constants';

interface UseMemoryGameProps {
  step: Step;
  onGameComplete: (stats: GameStats) => void;
  onShowFeedback: (type: 'success' | 'error' | 'winner' | 'loser') => void;
}

export const useMemoryGame = ({ step, onGameComplete, onShowFeedback }: UseMemoryGameProps) => {
  // Game state
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showingCards, setShowingCards] = useState(true);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>(createDefaultGameStats());

  // Refs
  const startTime = useRef<number>(Date.now());
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Memoized values
  const totalPairs = step.options?.length || 0;

  // Initialize cards
  const initializeCards = useCallback(() => {
    const duplicated: Card[] =
      step.options?.map((option, index) => ({
        id: index,
        icon: option.icon,
        flipped: true,
        matched: false,
        animation: new Animated.Value(180),
      })) ?? [];

    // Create pairs and shuffle
    const shuffled = shuffleArray([
      ...duplicated.map((card) => ({
        ...card,
        id: card.id * 2,
        animation: new Animated.Value(180),
      })),
      ...duplicated.map((card) => ({
        ...card,
        id: card.id * 2 + 1,
        animation: new Animated.Value(180),
      })),
    ]);

    setCards(shuffled);

    // Show cards for configured time
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
      startTime.current = Date.now(); // Reset start time when game actually starts
    }, GAME_CONFIG.MEMORY_CARD_SHOW_TIME);

    return () => clearTimeout(timer);
  }, [step.options]);

  // Flip card logic
  const flipCard = useCallback((card: Card) => {
    if (card.flipped || card.matched || selected.length === 2 || !gameStarted) {
      return;
    }

    // Update flip count
    setGameStats(prev => ({
      ...prev,
      flipCount: prev.flipCount + 1,
    }));

    // Animate the card
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
          onShowFeedback('success');
          Vibration.vibrate(50);
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
          onShowFeedback('error');
          Vibration.vibrate([0, 100, 50, 100]);
        }, 1000);
      }

      setTimeout(() => setSelected([]), 1200);
    }
  }, [cards, selected, gameStarted, onShowFeedback]);

  // Reset game
  const resetGame = useCallback(() => {
    setMatchedCount(0);
    setSelected([]);
    setGameCompleted(false);
    setGameStarted(false);
    setShowingCards(true);
    setGameStats(createDefaultGameStats());
    progressAnimation.setValue(0);
    startTime.current = Date.now();
    initializeCards();
  }, [initializeCards, progressAnimation]);

  // Update progress animation
  useEffect(() => {
    const progress = totalPairs > 0 ? matchedCount / totalPairs : 0;
    
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();

    // Check if game is complete
    if (matchedCount === totalPairs && totalPairs > 0 && !gameCompleted) {
      const timer = setTimeout(() => {
        const completionTime = Date.now() - startTime.current;
        const efficiency = calculateEfficiency(totalPairs, gameStats.flipCount);
        const stars = calculateStars(gameStats.errors, gameStats.flipCount, completionTime, totalPairs);
        
        const finalStats: GameStats = {
          ...gameStats,
          completionTime,
          efficiency,
          stars,
        };

        setGameStats(finalStats);
        setGameCompleted(true);
        onShowFeedback('winner');
        onGameComplete(finalStats);
        Vibration.vibrate([0, 100, 50, 100, 50, 100]);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [matchedCount, totalPairs, gameCompleted, gameStats, onShowFeedback, onGameComplete, progressAnimation]);

  // Initialize game on mount
  useEffect(() => {
    const cleanup = initializeCards();
    return cleanup;
  }, [initializeCards]);

  // Performance message
  const performanceMessage = getPerformanceMessage(
    gameStats.stars,
    gameStats.perfectRun,
    gameStats.flipCount,
    totalPairs
  );

  return {
    // State
    cards,
    selected,
    matchedCount,
    gameStarted,
    showingCards,
    gameCompleted,
    gameStats,
    totalPairs,
    progressAnimation,
    performanceMessage,
    
    // Actions
    flipCard,
    resetGame,
  };
};