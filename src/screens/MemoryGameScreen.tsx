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
import { MessageCarousel } from '../components/MessageCarousel';
import { AchievementService, Achievement } from '../services/AchievementService';
import { useAchievementContext } from '../contexts/AchievementContext';
import { useAchievementModalSequence } from '../hooks/useAchievementModalSequence';
import AdaptiveReinforcementService from '../services/AdaptiveReinforcementService';
import AudioService from '../services/AudioService';
import { useRealProgress } from '../hooks/useRealProgress';
import { useLanguage } from '../contexts/LanguageContext';
import BilingualTextProcessor from '../utils/BilingualTextProcessor';
import { Image } from 'react-native';

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
  usedHelp?: boolean;
  helpActivations?: number;
  firstTrySuccess: boolean;
}

interface ServerAchievement {
  ID: number;
  title: string;
  description: string;
  icon: string;
  rarity: string;
  points: number;
  category: string;
}

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 60) / 4; // Reduced for better fit

const MemoryGameScreen = () => {
  const route = useRoute<MemoryGameRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle: _lessonTitle } = route.params;
  const { t, language } = useLanguage();

  // Real progress hook
  const { completeStep, isLoading: progressLoading, error: progressError } = useRealProgress();

  // Achievement system hooks
  const { recordHelpUsed } = useAchievementContext();
  const { shouldShowModal, setShouldShowModal, handleGameCompletion } = useAchievementModalSequence();

  // Bilingual states
  const [processedStep, setProcessedStep] = useState(step);
  const [rawStep] = useState(step); // Keep original data
  const [processedOptions, setProcessedOptions] = useState(step.options || []);

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
  
  // New celebration states

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
    usedHelp: false,
    helpActivations: 0,
    firstTrySuccess: false,
  });
  const [startTime] = useState<number>(Date.now());
  const [showStars, setShowStars] = useState(false);

  // Image error states for each option
  const [imageErrors, setImageErrors] = useState<boolean[]>([]);

  // Helper function to check if icon is a URL or emoji
  const isImageUrl = useCallback((icon: string) => {
    return icon && (icon.startsWith('http://') || icon.startsWith('https://'));
  }, []);

  // Initialize image error states when step changes
  useEffect(() => {
    if (step.options) {
      setImageErrors(new Array(step.options.length).fill(false));
    }
  }, [step.options]);

  // Handle image error for specific option
  const handleImageError = useCallback((optionIndex: number) => {
    setImageErrors(prev => {
      const newErrors = [...prev];
      newErrors[optionIndex] = true;
      return newErrors;
    });
  }, []);

  // Adaptive reinforcement states
  const [isHelpActive, setIsHelpActive] = useState(false);
  const [blinkingCardIds, setBlinkingCardIds] = useState<number[]>([]);
  const [helpBlinkAnimation] = useState(new Animated.Value(1));
  const adaptiveService = useRef(AdaptiveReinforcementService.getInstance());
  const audioService = useRef(AudioService.getInstance());
  
  // Mount control for safe state updates
  const isMountedRef = useRef(true);

  // Memoized values
  const totalPairs = useMemo(() => processedOptions.length || 0, [processedOptions]);
  const totalItems = totalPairs; // Para compatibilidad con ProgressSection

  // Process step content for current language
  const processStepForLanguage = useCallback(() => {
    const originalText = rawStep.text || '';
    const originalHelpMessage = rawStep.helpMessage || '';
    
    const processedText = BilingualTextProcessor.extractText(originalText, language);
    const processedHelpMessage = BilingualTextProcessor.extractText(originalHelpMessage, language);
    
    // Process options (memory cards)
    const newProcessedOptions = rawStep.options?.map((option: any, _index: number) => {
      const originalLabel = option.label || '';
      
      const processedLabel = BilingualTextProcessor.extractText(originalLabel, language);
      
      return {
        ...option,
        label: processedLabel,
      };
    }) || [];
    
    // Update processed step and options
    const newProcessedStep = {
      ...rawStep,
      text: processedText,
      helpMessage: processedHelpMessage,
      options: newProcessedOptions,
    };
    
    setProcessedStep(newProcessedStep);
    setProcessedOptions(newProcessedOptions);
  }, [rawStep, language]);

  // Process step content when language changes
  useEffect(() => {
    processStepForLanguage();
  }, [language]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize achievements service
  useEffect(() => {
    const initAchievements = async () => {
      try {
        await AchievementService.initializeAchievements();
      } catch (error) {
        // Error inicializando logros
      }
    };
    initAchievements();
  }, []);

  // Initialize adaptive reinforcement service
  useEffect(() => {
    // Sincronizar idioma de voz con el idioma actual
    audioService.current.syncWithAppLanguage(language);
    
    adaptiveService.current.initialize(
      (helpCardIndex) => {
        // Handle help trigger
        if (helpCardIndex === -1) {
          // Inactivity help - find a pair that can be matched
          triggerHelpForMemoryGame();
        } else {
          // Error-based help
          triggerHelpForMemoryGame();
        }
      },
      (message, _activityType) => {
        // Handle audio help - use step's helpMessage if available, otherwise use service message
        let helpMessage: string;
        
        if (processedStep.helpMessage) {
          // Use the already processed helpMessage from the step
          helpMessage = processedStep.helpMessage;
          console.log(`🔊 Using processed lesson help: ${helpMessage}`);
        } else {
          // Process the service message for current language
          helpMessage = BilingualTextProcessor.extractText(message, language);
          console.log(`🔊 Using processed default help for ${_activityType}: ${helpMessage}`);
        }
        
        audioService.current.playTextToSpeech(helpMessage, true); // true indica que es mensaje de ayuda
      },
      step.activityType // Pass the activity type to the service
    );

    return () => {
      const currentAdaptiveService = adaptiveService.current;
      const currentAudioService = audioService.current;
      currentAdaptiveService.cleanup();
      currentAudioService.cleanup();
    };
  }, [step, language]);

  const initializeCards = useCallback(() => {
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

    // Show cards for 4 seconds (reduced)
    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;
      
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

  // Helper function to trigger help for memory game
  const triggerHelpForMemoryGame = useCallback(async () => {
    // Find a pair that hasn't been matched yet
    const unmatchedCards = cards.filter(card => !card.matched);
    if (unmatchedCards.length === 0) return;

    // Group cards by icon to find pairs
    const cardGroups: { [icon: string]: Card[] } = {};
    unmatchedCards.forEach(card => {
      if (!cardGroups[card.icon]) {
        cardGroups[card.icon] = [];
      }
      cardGroups[card.icon].push(card);
    });

    // Find the first complete pair
    const availablePair = Object.values(cardGroups).find(group => group.length >= 2);
    if (!availablePair) return;

    // Take the first two cards of this pair
    const helpCards = availablePair.slice(0, 2);
    const helpCardIds = helpCards.map(card => card.id);

    setIsHelpActive(true);
    setBlinkingCardIds(helpCardIds);
    
    // Update help stats
    setGameStats(prev => ({
      ...prev,
      usedHelp: true,
      helpActivations: (prev.helpActivations || 0) + 1,
    }));

    // Record help usage for achievements
    try {
      await recordHelpUsed((step as any).lesson_id, (step as any).ID || step.id);
      console.log('📝 [MemoryGameScreen] Uso de ayuda registrado para achievements');
    } catch (error) {
      console.error('❌ [MemoryGameScreen] Error registrando uso de ayuda:', error);
    }
    
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
      if (!isMountedRef.current) return;
      
      setIsHelpActive(false);
      setBlinkingCardIds([]);
      helpBlinkAnimation.setValue(1);
    }, 5000);
  }, [cards, helpBlinkAnimation, isHelpActive, recordHelpUsed, step]);

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
      if (!isMountedRef.current) return;
      
      processAchievementQueue();
    }, 1000);
  }, [processAchievementQueue]);

  // Save progress to backend
  const saveProgressToBackend = useCallback(async (finalStats: GameStats) => {
    try {
      const progressData = {
        lessonId: (step as any).lesson_id || 1,
        stepId: (step as any).ID || step.id || 1,
        stars: finalStats.stars,
        attempts: finalStats.totalAttempts,
        errors: finalStats.errors,
        timeSpent: Math.round(finalStats.completionTime / 1000),
        usedHelp: finalStats.usedHelp || false,
        helpActivations: finalStats.helpActivations || 0,
        perfectRun: finalStats.perfectRun,
      };
      
      const success = await completeStep(progressData);

      if (success) {
        // Progreso guardado exitosamente
      } else {
        if (progressError) {
          Alert.alert(
            language === 'es' ? 'Error de Conexión' : 'Connection Error',
            language === 'es' 
              ? `No se pudo guardar tu progreso: ${progressError}. Tu progreso local se ha guardado.`
              : `Could not save your progress: ${progressError}. Your local progress has been saved.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' 
          ? 'Hubo un problema guardando tu progreso. Tu progreso local se ha guardado.'
          : 'There was a problem saving your progress. Your local progress has been saved.',
        [{ text: 'OK' }]
      );
    }
  }, [completeStep, step, progressError, language]);

  // Record game completion and check for achievements
  const recordGameCompletion = useCallback(async (finalStats: GameStats) => {
    try {
      console.log('🎮 [MemoryGameScreen] Registrando finalización de juego:', finalStats);
      
      // 1. Save progress to backend first
      await saveProgressToBackend(finalStats);
      
      // 2. Use the new achievement system
      const gameData = {
        lessonId: (step as any).lesson_id,
        stepId: (step as any).ID || step.id,
        stars: finalStats.stars,
        completionTime: Math.round(finalStats.completionTime / 1000),
        errors: finalStats.errors,
        usedHelp: finalStats.usedHelp || false,
        perfectRun: finalStats.perfectRun,
        activityType: 'memoryGame', // Category for achievement system
      };
      
      await handleGameCompletion(gameData);
      console.log('✅ [MemoryGameScreen] Finalización registrada exitosamente');
    } catch (error) {
      console.error('❌ [MemoryGameScreen] Error registrando finalización:', error);
    }
  }, [saveProgressToBackend, handleGameCompletion, step]);

  // FUNCIÓN CORREGIDA: handleAnimationFinish
  const handleAnimationFinish = useCallback(() => {
    setShowAnimation(false);
    
    // CONDICIÓN CORREGIDA: Solo completar el juego si se encontraron TODAS las parejas
    if (animationType === 'winner' && matchedCount === totalPairs && totalPairs > 0 && !gameCompleted) {
      // IMPORTANTE: Limpiar toda la ayuda activa inmediatamente
      if (isHelpActive) {
        setIsHelpActive(false);
        setBlinkingCardIds([]);
        helpBlinkAnimation.setValue(1);
      }
      
      // Detener servicios de ayuda
      adaptiveService.current.cleanup();
      audioService.current.cleanup();
      
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
      
      // Record game completion (includes backend save and achievement check)
      recordGameCompletion(finalStats);
      
      // CAMBIO IMPORTANTE: Mostrar modal directamente después de un delay corto
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        setShowStars(true);
      }, 800);
    }
  }, [animationType, matchedCount, totalPairs, gameCompleted, gameStats, startTime, calculateStars, recordGameCompletion, isHelpActive, helpBlinkAnimation]);

  useEffect(() => {
    // Update score for ProgressSection
    setScore(matchedCount);

    // Check if game is complete
    if (matchedCount === totalPairs && totalPairs > 0 && !gameCompleted) {
      const timer = setTimeout(() => {
        if (!isMountedRef.current) return;
        
        showFeedbackAnimation('winner');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [matchedCount, totalPairs, gameCompleted, showFeedbackAnimation]);

  const flipCard = useCallback((card: Card) => {
    if (card.flipped || card.matched || selected.length === 2 || !gameStarted) return;

    // Record user interaction for inactivity tracking
    adaptiveService.current.recordInactivity();

    // Clear any active help
    if (isHelpActive) {
      setIsHelpActive(false);
      setBlinkingCardIds([]);
      helpBlinkAnimation.setValue(1);
    }

    // Update flip count and drag count for ProgressSection compatibility
    const isFirstFlip = gameStats.flipCount === 0;
    setGameStats(prev => ({
      ...prev,
      flipCount: prev.flipCount + 1,
      dragCount: prev.dragCount + 1,
      firstTrySuccess: isFirstFlip,
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

      const isMatch = first.icon === second.icon;

      // Record action in adaptive reinforcement service
      adaptiveService.current.recordAction(isMatch, -1, step.activityType);

      if (isMatch) {
        // Match found
        setTimeout(() => {
          if (!isMountedRef.current) return;
          
          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id || c.id === second.id ? { ...c, matched: true } : c
            )
          );
          setMatchedCount((prev) => {
            const newCount = prev + 1;
            return newCount;
          });
          setGameStats(prev => ({
            ...prev,
            matchesFound: prev.matchesFound + 1,
          }));
          showFeedbackAnimation('success');
          // Play encouragement audio
          audioService.current.playEncouragementMessage();
        }, 500);
      } else {
        // No match
        setGameStats(prev => ({
          ...prev,
          errors: prev.errors + 1,
          perfectRun: false,
        }));

        setTimeout(() => {
          if (!isMountedRef.current) return;
          
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
          // Play error guidance audio
          audioService.current.playErrorGuidanceMessage();
        }, 1000);
      }

      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        setSelected([]);
      }, 1200);
    }
  }, [cards, selected, gameStarted, showFeedbackAnimation, step.activityType, isHelpActive, helpBlinkAnimation, gameStats.flipCount, totalPairs]);

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
      usedHelp: false,
      helpActivations: 0,
      firstTrySuccess: false,
    });

    // Reset modal state
    setShouldShowModal(false);

    // Reinitialize cards
    initializeCards();
  }, [initializeCards, setShouldShowModal]);

  const getPerformanceMessage = useCallback((stars: number, perfectRun: boolean, flipCount: number, totalPairs: number) => {
    const minFlips = totalPairs * 2;
    
    if (perfectRun && stars === 3 && flipCount <= minFlips * 1.2) {
      return t.games.messages.perfectMemory;
    } else if (perfectRun && stars === 3) {
      return t.games.messages.excellentMemory;
    } else if (stars === 3) {
      return "¡Muy bien hecho! 👏";
    } else if (stars === 2) {
      return "¡Buen trabajo! Sigue practicando 💪";
    } else {
      return "¡Completado! Tu memoria mejorará 📈";
    }
  }, [t.games.messages]);

  const handleBackPress = useCallback(() => {
    if (gameStats.totalAttempts > 0 && !gameCompleted) {
      Alert.alert(
        language === 'es' ? 'Salir del juego' : 'Exit game',
        language === 'es' 
          ? '¿Estás seguro de que quieres salir? Perderás tu progreso actual.'
          : 'Are you sure you want to exit? You will lose your current progress.',
        [
          { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
          { text: language === 'es' ? 'Salir' : 'Exit', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [gameStats.totalAttempts, gameCompleted, navigation, language]);

  const handleCelebrationClose = useCallback(() => {
  }, []);

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

    // Find the original option index for this card's icon to handle image errors
    const originalOptionIndex = step.options?.findIndex(option => option.icon === card.icon) ?? -1;

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
            <View style={styles.cardIconContainer}>
              {isImageUrl(card.icon) && originalOptionIndex >= 0 && !imageErrors[originalOptionIndex] ? (
                <Image
                  source={{ uri: card.icon }}
                  style={styles.cardImage}
                  resizeMode="contain"
                  onError={() => handleImageError(originalOptionIndex)}
                  onLoad={() => {}}
                />
              ) : (
                <Text style={styles.cardIcon}>
                  {isImageUrl(card.icon) && originalOptionIndex >= 0 && imageErrors[originalOptionIndex] 
                    ? '🖼️' // Fallback emoji when image fails to load
                    : card.icon // Original emoji or fallback
                  }
                </Text>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }, [flipCard, isHelpActive, blinkingCardIds, helpBlinkAnimation, step.options, imageErrors, isImageUrl, handleImageError]);

  // Process achievement queue when it changes
  useEffect(() => {
    processAchievementQueue();
  }, [processAchievementQueue]);

  const isGameComplete = matchedCount === totalPairs;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header moderno mejorado */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={[styles.backButtonText, { fontSize: 14 }]}>←</Text>
          <Text style={styles.backButtonText}>
            {language === 'es' ? 'Volver' : 'Back'}
          </Text>
        </TouchableOpacity>
        
        {/* Progress indicator mejorado */}
        {progressLoading && (
          <View style={styles.progressIndicator}>
            <Text style={[styles.progressText, { fontSize: 11, marginRight: 3 }]}>💾</Text>
            <Text style={styles.progressText}>
              {language === 'es' ? 'Guardando...' : 'Saving...'}
            </Text>
          </View>
        )}
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

        {/* 1. CONTEXTO - Estado del juego */}
        <View style={styles.gameStateContainer}>
          <Text style={styles.sectionTitle}>
            {showingCards 
              ? (language === 'es' ? '👀 ¡Memoriza las cartas!' : '👀 Memorize the cards!')
              : (language === 'es' ? '🧠 Encuentra las parejas:' : '🧠 Find the pairs:')
            }
          </Text>
          <Text style={styles.gameStateText}>
            {showingCards 
              ? (language === 'es' 
                  ? 'Observa bien las cartas y recuerda dónde están'
                  : 'Look carefully at the cards and remember where they are'
                )
              : (language === 'es' 
                  ? 'Toca las cartas para voltearlas y encuentra las parejas iguales'
                  : 'Tap the cards to flip them and find the matching pairs'
                )
            }
          </Text>
        </View>

        {/* 2. ACCIÓN - Grid de cartas */}
        <View style={styles.gameContainer}>
          <View style={styles.grid}>
            {cards.map(renderCard)}
          </View>
        </View>

        {/* 3. PROGRESO/MOTIVACIÓN - Progreso del juego */}
        <View style={{ marginTop: 4 }}>
          <ProgressSection 
            score={score}
            totalItems={totalItems}
            gameStats={gameStats}
          />
        </View>

        {/* Carrusel de mensajes motivacionales */}
        <View style={{ marginTop: 2 }}>
          <MessageCarousel 
            score={score}
            totalItems={totalItems}
            language={language}
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Game Complete Modal usando componente reutilizable */}
      <GameCompletionModal
        visible={shouldShowModal && gameCompleted && !showAnimation && showStars}
        stats={gameStats}
        onReset={resetGame}
        onContinue={() => navigation.goBack()}
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.flipCount, totalPairs)}
        gameType="memory"
        showEfficiency={true}
        customStats={[
          { 
            label: language === 'es' ? 'Volteos totales' : 'Total flips', 
            value: gameStats.flipCount 
          },
          { 
            label: language === 'es' ? 'Parejas encontradas' : 'Pairs found', 
            value: `${gameStats.matchesFound}/${totalPairs}` 
          },
          { 
            label: language === 'es' ? 'Ayuda usada' : 'Help used', 
            value: gameStats.usedHelp ? (language === 'es' ? 'Sí' : 'Yes') : (language === 'es' ? 'No' : 'No')
          },
          { 
            label: language === 'es' ? 'Progreso guardado' : 'Progress saved', 
            value: progressLoading 
              ? (language === 'es' ? 'Guardando...' : 'Saving...') 
              : (language === 'es' ? 'Guardado ✅' : 'Saved ✅')
          },
        ]}
        bonusMessage={gameStats.perfectRun && gameStats.flipCount <= totalPairs * 2.4 ? (language === 'es' ? '🧠 ¡Memoria excepcional!' : '🧠 Exceptional memory!') : undefined}
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
    backgroundColor: '#f0f4ff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: '#4285f4',
  },
  backButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 2,
    letterSpacing: 0.1,
  },
  progressIndicator: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#ff9800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  gameStateContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 4,
    shadowColor: '#ff9800',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderTopWidth: 3,
    borderTopColor: '#ff9800',
  },
  gameStateText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4285f4',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  gameContainer: {
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
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
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  front: {
    backgroundColor: '#4285f4',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  back: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e8f0fe',
    borderTopWidth: 4,
    borderTopColor: '#4285f4',
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
  cardIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  cardIcon: {
    fontSize: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardImage: {
    width: CARD_SIZE - 12,
    height: CARD_SIZE - 12,
    borderRadius: 10,
    borderWidth: 0,
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
  bottomSpacing: {
    height: 4,
  },
});

export default MemoryGameScreen;