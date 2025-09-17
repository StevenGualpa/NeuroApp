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
import AchievementCelebration from '../components/AchievementCelebration';
import { GameCompletionModal } from '../components/GameCompletionModal';
import { ProgressSection } from '../components/ProgressSection';
import { AchievementService, Achievement } from '../services/AchievementService';
// import RealAchievementServiceEnhanced from '../services/RealAchievementService_enhanced';
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
  const { step, lessonTitle } = route.params;
  const { t, language } = useLanguage();

  // Real progress hook
  const { completeStep, isLoading: progressLoading, error: progressError } = useRealProgress();

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
  const [unlockedAchievements, setUnlockedAchievements] = useState<ServerAchievement[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

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
    console.log(`❌ [MemoryGameScreen] Error loading image for option ${optionIndex + 1}`);
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

  // Memoized values
  const totalPairs = useMemo(() => processedOptions.length || 0, [processedOptions]);
  const totalItems = totalPairs; // Para compatibilidad con ProgressSection

  // Process step content when language changes
  useEffect(() => {
    console.log(`🌍 [MemoryGameScreen] Procesando contenido para idioma: ${language}`);
    processStepForLanguage();
  }, [language]);

  // Process step content for current language
  const processStepForLanguage = useCallback(() => {
    console.log(`🌍 [MemoryGameScreen] NUEVO PROCESAMIENTO - Contenido para idioma: ${language}`);
    console.log(`🔧 [MemoryGameScreen] BilingualTextProcessor disponible: ${typeof BilingualTextProcessor}`);
    
    // Process step text
    const originalText = rawStep.text || '';
    const originalHelpMessage = rawStep.helpMessage || '';
    
    console.log(`🧪 [MemoryGameScreen] ANTES del procesamiento:`);
    console.log(`   Original text: "${originalText}"`);
    console.log(`   Original helpMessage: "${originalHelpMessage}"`);
    console.log(`   Tiene colon en text: ${originalText.includes(':')}`);
    console.log(`   Tiene colon en helpMessage: ${originalHelpMessage.includes(':')}`);
    
    const processedText = BilingualTextProcessor.extractText(originalText, language);
    const processedHelpMessage = BilingualTextProcessor.extractText(originalHelpMessage, language);
    
    // Process options (memory cards)
    const newProcessedOptions = rawStep.options?.map((option, index) => {
      const originalLabel = option.label || '';
      
      console.log(`🧪 [MemoryGameScreen] ANTES del procesamiento carta ${index + 1}:`);
      console.log(`   Original label: "${originalLabel}"`);
      console.log(`   Icon: "${option.icon}"`);
      console.log(`   Tiene colon: ${originalLabel.includes(':')}`);
      
      const processedLabel = BilingualTextProcessor.extractText(originalLabel, language);
      
      console.log(`��� [MemoryGameScreen] DESPUÉS del procesamiento carta ${index + 1}:`);
      console.log(`   Processed label: "${processedLabel}"`);
      console.log(`   Cambió: ${originalLabel !== processedLabel ? 'SÍ' : 'NO'}`);
      
      return {
        ...option,
        label: processedLabel,
      };
    }) || [];
    
    console.log(`🎯 [MemoryGameScreen] DESPUÉS del procesamiento principal:`);
    console.log(`   Processed text: "${processedText}"`);
    console.log(`   Processed helpMessage: "${processedHelpMessage}"`);
    console.log(`   Language usado: ${language}`);
    console.log(`   Text cambió: ${originalText !== processedText ? 'SÍ' : 'NO'}`);
    console.log(`   HelpMessage cambió: ${originalHelpMessage !== processedHelpMessage ? 'SÍ' : 'NO'}`);
    
    // Update processed step and options
    const newProcessedStep = {
      ...rawStep,
      text: processedText,
      helpMessage: processedHelpMessage,
      options: newProcessedOptions,
    };
    
    setProcessedStep(newProcessedStep);
    setProcessedOptions(newProcessedOptions);
    
    console.log(`✅ [MemoryGameScreen] RESULTADO FINAL - Contenido procesado para idioma: ${language}`);
    console.log('🃏 [MemoryGameScreen] Cartas procesadas:');
    newProcessedOptions.forEach((option, index) => {
      console.log(`  ${index + 1}. "${option.icon}" - "${option.label}"`);
    });
  }, [rawStep, language]);

  // Initialize achievements service
  useEffect(() => {
    const initAchievements = async () => {
      try {
        console.log('🏆 [MemoryGameScreen] Inicializando servicio de logros mejorado...');
        await AchievementService.initializeAchievements();
        console.log('✅ [MemoryGameScreen] Servicio de logros inicializado');
      } catch (error) {
        console.error('❌ [MemoryGameScreen] Error inicializando logros:', error);
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
        audioService.current.playTextToSpeech(helpMessage, true); // true indica que es mensaje de ayuda
      },
      step.activityType // Pass the activity type to the service
    );

    return () => {
      console.log(`🔊 MemoryGameScreen: Cleaning up services`);
      adaptiveService.current.cleanup();
      audioService.current.cleanup();
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
  const triggerHelpForMemoryGame = useCallback(() => {
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
      setBlinkingCardIds([]);
      helpBlinkAnimation.setValue(1);
    }, 5000);
  }, [cards, helpBlinkAnimation, isHelpActive]);

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

  // Save progress to backend
  const saveProgressToBackend = useCallback(async (finalStats: GameStats) => {
    try {
      console.log('💾 [MemoryGameScreen] Guardando progreso en backend...');
      
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

      console.log('📊 [MemoryGameScreen] ===== DATOS ENVIADOS AL SERVIDOR =====');
      console.log('🎯 Lección ID:', progressData.lessonId);
      console.log('📝 Paso ID:', progressData.stepId);
      console.log('⭐ Estrellas ganadas:', progressData.stars);
      console.log('🔄 Intentos totales:', progressData.attempts);
      console.log('❌ Errores cometidos:', progressData.errors);
      console.log('⏱️ Tiempo gastado (segundos):', progressData.timeSpent);
      console.log('🤝 Usó ayuda:', progressData.usedHelp);
      console.log('💡 Activaciones de ayuda:', progressData.helpActivations);
      console.log('🏆 Ejecución perfecta:', progressData.perfectRun);
      console.log('================================================');
      
      const success = await completeStep(progressData);

      if (success) {
        console.log('✅ [MemoryGameScreen] ¡PROGRESO GUARDADO EXITOSAMENTE EN EL SERVIDOR!');
        console.log('📊 [MemoryGameScreen] Todos los datos fueron enviados y procesados correctamente');
      } else {
        console.warn('⚠️ [MemoryGameScreen] No se pudo guardar el progreso en backend');
        if (progressError) {
          console.error('❌ [MemoryGameScreen] Error específico:', progressError);
          Alert.alert(
            'Error de Conexión',
            `No se pudo guardar tu progreso: ${progressError}. Tu progreso local se ha guardado.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('❌ [MemoryGameScreen] Error guardando progreso:', error);
      Alert.alert(
        'Error',
        'Hubo un problema guardando tu progreso. Tu progreso local se ha guardado.',
        [{ text: 'OK' }]
      );
    }
  }, [completeStep, step, progressError]);

  // Record game completion and check for achievements
  const recordGameCompletion = useCallback(async (finalStats: GameStats) => {
    try {
      console.log('🎮 [MemoryGameScreen] Registrando finalización del juego...');

      // 1. Save progress to backend first
      await saveProgressToBackend(finalStats);

      // 2. Use the enhanced achievement service that syncs with server
      const gameData = {
        stars: finalStats.stars,
        isPerfect: finalStats.perfectRun,
        completionTime: finalStats.completionTime,
        errors: finalStats.errors,
        activityType: t.games.activityTypes.memoryGame,
        showedImprovement: finalStats.errors > 0 && finalStats.stars > 1,
        usedHelp: finalStats.usedHelp || false,
        tookTime: finalStats.completionTime > 60000,
        lessonId: (step as any).lesson_id,
        stepId: (step as any).ID || step.id,
      };

      console.log('🏆 [MemoryGameScreen] Verificando logros con datos:', gameData);

      // const newlyUnlocked = await RealAchievementServiceEnhanced.recordGameCompletion(gameData);
      const newlyUnlocked: any[] = []; // Temporalmente deshabilitado
      
      if (newlyUnlocked.length > 0) {
        console.log(`🎉 [MemoryGameScreen] ¡${newlyUnlocked.length} LOGROS DESBLOQUEADOS!:`);
        newlyUnlocked.forEach((achievement, index) => {
          console.log(`   ${index + 1}. 🏆 ${achievement.title} - ${achievement.description}`);
        });
        
        // Convert to server achievement format for celebration
        const serverAchievements: ServerAchievement[] = newlyUnlocked.map(achievement => ({
          ID: achievement.ID || 0,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity || 'common',
          points: achievement.points || 0,
          category: achievement.category || 'general',
        }));
        
        setUnlockedAchievements(serverAchievements);
        
        // Show celebration after a short delay
        setTimeout(() => {
          setShowCelebration(true);
        }, 1500);
        
      } else {
        console.log('📊 [MemoryGameScreen] No se desbloquearon nuevos logros esta vez');
        console.log('💡 [MemoryGameScreen] Esto puede ser normal si ya tienes logros desbloqueados');
      }
    } catch (error) {
      console.error('❌ [MemoryGameScreen] Error registrando finalización:', error);
      Alert.alert(
        'Error',
        'No se pudieron verificar los logros. Tu progreso se ha guardado.',
        [{ text: 'OK' }]
      );
    }
  }, [saveProgressToBackend, step]);

  // FUNCIÓN CORREGIDA: handleAnimationFinish
  const handleAnimationFinish = useCallback(() => {
    console.log(`🎬 [MemoryGameScreen] Animación terminada: ${animationType}, matchedCount: ${matchedCount}, totalPairs: ${totalPairs}, gameCompleted: ${gameCompleted}`);
    setShowAnimation(false);
    
    // CONDICIÓN CORREGIDA: Solo completar el juego si se encontraron TODAS las parejas
    if (animationType === 'winner' && matchedCount === totalPairs && totalPairs > 0 && !gameCompleted) {
      console.log('🎯 [MemoryGameScreen] ¡TODAS LAS PAREJAS ENCONTRADAS! Iniciando secuencia de finalización...');
      console.log(`📊 [MemoryGameScreen] Verificación: matchedCount=${matchedCount}, totalPairs=${totalPairs}, todas encontradas=${matchedCount === totalPairs}`);
      
      // IMPORTANTE: Limpiar toda la ayuda activa inmediatamente
      if (isHelpActive) {
        console.log('🛑 [MemoryGameScreen] Limpiando ayuda activa...');
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

      console.log('📈 [MemoryGameScreen] Estadísticas finales calculadas:', {
        totalAttempts: finalStats.totalAttempts,
        errors: finalStats.errors,
        stars: finalStats.stars,
        completionTime: finalStats.completionTime,
        perfectRun: finalStats.perfectRun,
        matchesFound: finalStats.matchesFound,
        flipCount: finalStats.flipCount,
        efficiency: finalStats.efficiency,
        usedHelp: finalStats.usedHelp,
        helpActivations: finalStats.helpActivations,
      });
      
      // Record game completion (includes backend save and achievement check)
      recordGameCompletion(finalStats);
      
      // CAMBIO IMPORTANTE: Mostrar modal directamente después de un delay corto
      setTimeout(() => {
        console.log('🏆 [MemoryGameScreen] Mostrando modal de finalización directamente...');
        setShowStars(true);
        console.log('⭐ [MemoryGameScreen] Modal debería aparecer ahora');
        console.log(`🎯 [MemoryGameScreen] Estados para modal: matchedCount=${matchedCount}, gameCompleted=true, showAnimation=false, showStars=true, showCelebration=${showCelebration}`);
      }, 800);
    } else if (animationType === 'winner' && matchedCount !== totalPairs) {
      console.log(`⚠️ [MemoryGameScreen] Animación winner pero no todas las parejas encontradas: matchedCount=${matchedCount}, totalPairs=${totalPairs}`);
    }
  }, [animationType, matchedCount, totalPairs, gameCompleted, gameStats, startTime, calculateStars, recordGameCompletion, isHelpActive, helpBlinkAnimation, showCelebration]);

  useEffect(() => {
    // Update score for ProgressSection
    setScore(matchedCount);

    // Check if game is complete
    if (matchedCount === totalPairs && totalPairs > 0 && !gameCompleted) {
      console.log('🎉 [MemoryGameScreen] ¡TODAS LAS PAREJAS ENCONTRADAS! Preparando animación winner...');
      console.log(`📊 [MemoryGameScreen] Parejas encontradas: ${matchedCount}/${totalPairs}`);
      
      const timer = setTimeout(() => {
        showFeedbackAnimation('winner');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [matchedCount, totalPairs, gameCompleted, showFeedbackAnimation]);

  const flipCard = useCallback((card: Card) => {
    if (card.flipped || card.matched || selected.length === 2 || !gameStarted) return;

    console.log(`🃏 [MemoryGameScreen] Usuario volteó carta: ID=${card.id}, icon="${card.icon}"`);

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
      
      console.log(`🔍 [MemoryGameScreen] Comparando cartas: "${first.icon}" vs "${second.icon}"`);
      
      // Update total attempts
      setGameStats(prev => ({
        ...prev,
        totalAttempts: prev.totalAttempts + 1,
      }));

      const isMatch = first.icon === second.icon;

      console.log(`🎯 [MemoryGameScreen] ¿Es pareja?: ${isMatch ? 'SÍ' : 'NO'}`);

      // Record action in adaptive reinforcement service
      adaptiveService.current.recordAction(isMatch, -1, step.activityType);

      if (isMatch) {
        // Match found
        console.log('✅ [MemoryGameScreen] ¡PAREJA ENCONTRADA!');
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id || c.id === second.id ? { ...c, matched: true } : c
            )
          );
          setMatchedCount((prev) => {
            const newCount = prev + 1;
            console.log(`🎊 [MemoryGameScreen] Parejas encontradas: ${newCount}/${totalPairs}`);
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
        console.log('❌ [MemoryGameScreen] No es pareja, volteando cartas de vuelta');
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
          // Play error guidance audio
          audioService.current.playErrorGuidanceMessage();
        }, 1000);
      }

      setTimeout(() => setSelected([]), 1200);
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

    // Reinitialize cards
    initializeCards();
  }, [initializeCards]);

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

  const handleCelebrationClose = useCallback(() => {
    setShowCelebration(false);
    setUnlockedAchievements([]);
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
                  onLoad={() => console.log(`✅ [MemoryGameScreen] Image loaded for card: ${card.icon}`)}
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

  // Log component mount
  useEffect(() => {
    console.log('🎮 [MemoryGameScreen] Componente montado');
    console.log('📝 [MemoryGameScreen] Datos del paso:', {
      stepId: (step as any).ID || step.id,
      lessonId: (step as any).lesson_id,
      text: step.text,
      optionsCount: step.options?.length || 0,
    });
  }, [step]);

  // Log state changes for debugging
  useEffect(() => {
    console.log(`🎯 [MemoryGameScreen] Estado del modal: matchedCount=${matchedCount}, totalPairs=${totalPairs}, gameCompleted=${gameCompleted}, showAnimation=${showAnimation}, showStars=${showStars}, showCelebration=${showCelebration}`);
    
    // Log modal visibility condition
    const modalShouldBeVisible = gameCompleted && !showAnimation && showStars && !showCelebration;
    console.log(`🎯 [MemoryGameScreen] ¿Modal debería ser visible? ${modalShouldBeVisible ? 'SÍ' : 'NO'}`);
    
    if (gameCompleted && showStars && !showCelebration) {
      console.log(`🎯 [MemoryGameScreen] ✅ Condiciones principales cumplidas para mostrar modal`);
      if (showAnimation) {
        console.log(`🎯 [MemoryGameScreen] ⚠️ Pero showAnimation=${showAnimation} está bloqueando el modal`);
      } else {
        console.log(`🎯 [MemoryGameScreen] ✅ Modal debería estar visible ahora!`);
      }
    }
  }, [matchedCount, totalPairs, gameCompleted, showAnimation, showStars, showCelebration]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header simplificado */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>
            ← {language === 'es' ? 'Volver' : 'Back'}
          </Text>
        </TouchableOpacity>
        
        {/* Progress indicator */}
        {progressLoading && (
          <View style={styles.progressIndicator}>
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

        {/* Progreso del juego */}
        <ProgressSection 
          score={score}
          totalItems={totalItems}
          gameStats={gameStats}
        />

        {/* Estado del juego */}
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

        {/* Grid de cartas */}
        <View style={styles.gameContainer}>
          <View style={styles.grid}>
            {cards.map(renderCard)}
          </View>
        </View>

        {/* Footer motivacional como en otras actividades */}
        <View style={styles.footer}>
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationIcon}>⭐</Text>
            <Text style={styles.footerText}>
              {showingCards 
                ? (language === 'es' ? '¡Observa con atención!' : 'Watch carefully!')
                : score === 0 
                  ? (language === 'es' ? '¡Usa tu memoria!' : 'Use your memory!')
                  : score === totalItems 
                    ? (language === 'es' ? '¡Increíble! Lo lograste' : 'Amazing! You did it')
                    : (language === 'es' ? '¡Excelente! Sigue así, casi terminas' : 'Excellent! Keep going, almost done')
              }
            </Text>
            <Text style={styles.motivationIcon}>⭐</Text>
          </View>
          
          {/* Mensaje adicional de ánimo */}
          <View style={styles.encouragementFooter}>
            <Text style={styles.encouragementFooterText}>
              {language === 'es' 
                ? '🧠 Cada juego fortalece tu memoria ✨'
                : '🧠 Every game strengthens your memory ✨'
              }
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Game Complete Modal usando componente reutilizable */}
      <GameCompletionModal
        visible={gameCompleted && !showAnimation && showStars && !showCelebration}
        stats={gameStats}
        onReset={resetGame}
        onContinue={() => navigation.goBack()}
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.flipCount, totalPairs)}
        gameType="memory"
        showEfficiency={true}
        customStats={[
          { label: 'Volteos totales', value: gameStats.flipCount },
          { label: 'Parejas encontradas', value: `${gameStats.matchesFound}/${totalPairs}` },
          { label: 'Ayuda usada', value: gameStats.usedHelp ? 'Sí' : 'No' },
          { label: t.games.messages.progressSaved, value: progressLoading ? t.games.messages.saving : t.games.messages.saved },
        ]}
        bonusMessage={gameStats.perfectRun && gameStats.flipCount <= totalPairs * 2.4 ? t.games.messages.memoryExceptional : undefined}
      />

      {/* Feedback Animation */}
      {showAnimation && (
        <FeedbackAnimation
          type={animationType}
          onFinish={handleAnimationFinish}
        />
      )}

      {/* Achievement Celebration - NEW! */}
      <AchievementCelebration
        achievements={unlockedAchievements}
        visible={showCelebration}
        onClose={handleCelebrationClose}
      />

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
    backgroundColor: '#f8faff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  progressIndicator: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
  cardIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  cardIcon: {
    fontSize: 28,
  },
  cardImage: {
    width: CARD_SIZE * 0.6,
    height: CARD_SIZE * 0.6,
    borderRadius: 8,
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