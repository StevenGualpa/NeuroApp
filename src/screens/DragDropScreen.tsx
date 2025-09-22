import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
  Vibration,
  ScrollView,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FeedbackAnimation from '../components/FeedbackAnimation';
import AchievementNotification from '../components/AchievementNotification';
import AchievementCelebration from '../components/AchievementCelebration';
import { GameStatsDisplay } from '../components/GameStatsDisplay';
import { GameCompletionModal } from '../components/GameCompletionModal';
import { ProgressSection } from '../components/ProgressSection';
import { MessageCarousel } from '../components/MessageCarousel';
import { AchievementService, Achievement } from '../services/AchievementService';
import AdaptiveReinforcementService from '../services/AdaptiveReinforcementService';
import AudioService from '../services/AudioService';
import { useRealProgress } from '../hooks/useRealProgress';
import { useLanguage } from '../contexts/LanguageContext';
import BilingualTextProcessor from '../utils/BilingualTextProcessor';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

type DragDropRouteProp = RouteProp<RootStackParamList, 'dragDrop'>;

interface Option {
  icon: string;
  label: string;
  correctZone: string;
}

interface PlacedItem {
  option: Option;
  index: number;
}

interface ZoneBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  dragCount: number;
  efficiency: number;
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

const DragDropScreen = () => {
  const route = useRoute<DragDropRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle: _lessonTitle } = route.params;
  const { t, language } = useLanguage();

  // Real progress hook
  const { completeStep, isLoading: progressLoading, error: progressError } = useRealProgress();

  // Bilingual states
  const [processedStep, setProcessedStep] = useState(step);
  const [rawStep] = useState(step); // Keep original data
  const [processedOptions, setProcessedOptions] = useState(step.options || []);
  const [processedZones, setProcessedZones] = useState<string[]>([]);

  // Game state
  const [correctlyPlaced, setCorrectlyPlaced] = useState<Set<number>>(new Set());
  const [zoneItems, setZoneItems] = useState<{ [key: string]: PlacedItem[] }>({});
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
    dragCount: 0,
    efficiency: 100,
    usedHelp: false,
    helpActivations: 0,
    firstTrySuccess: false,
  });
  const [startTime] = useState<number>(Date.now());
  const [showStars, setShowStars] = useState(false);

  // Memoized values
  const zones = useMemo(() => Array.from(new Set(processedOptions.map(o => o.correctZone) || [])), [processedOptions]);
  const totalItems = useMemo(() => processedOptions.length || 0, [processedOptions]);

  // Process step content for current language
  const processStepForLanguage = useCallback(() => {
    const originalText = rawStep.text || '';
    const originalHelpMessage = rawStep.helpMessage || '';
    
    const processedText = BilingualTextProcessor.extractText(originalText, language);
    const processedHelpMessage = BilingualTextProcessor.extractText(originalHelpMessage, language);
    
    // Process options (draggable items)
    const newProcessedOptions = rawStep.options?.map((option: any, _index: number) => {
      const originalLabel = option.label || '';
      const originalCorrectZone = option.correctZone || '';
      
      const processedLabel = BilingualTextProcessor.extractText(originalLabel, language);
      const processedCorrectZone = BilingualTextProcessor.extractText(originalCorrectZone, language);
      
      return {
        ...option,
        label: processedLabel,
        correctZone: processedCorrectZone,
      };
    }) || [];
    
    // Process zones
    const newProcessedZones = Array.from(new Set(newProcessedOptions.map(o => o.correctZone).filter(Boolean)));
    
    // Update processed step and options
    const newProcessedStep = {
      ...rawStep,
      text: processedText,
      helpMessage: processedHelpMessage,
      options: newProcessedOptions,
    };
    
    setProcessedStep(newProcessedStep);
    setProcessedOptions(newProcessedOptions);
    setProcessedZones(newProcessedZones);
  }, [rawStep, language]);

  // Process step content when language changes
  useEffect(() => {
    processStepForLanguage();
  }, [language]);


  // Adaptive reinforcement states
  const [isHelpActive, setIsHelpActive] = useState(false);
  const [blinkingItemIndex, setBlinkingItemIndex] = useState<number | null>(null);
  const [blinkingZone, setBlinkingZone] = useState<string | null>(null);
  const [helpBlinkAnimation] = useState(new Animated.Value(1));
  const adaptiveService = useRef(AdaptiveReinforcementService.getInstance());
  const audioService = useRef(AudioService.getInstance());

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

  // Refs for zone positions
  const zoneRefs = useRef<{ [key: string]: View | null }>({});
  const zoneBounds = useRef<{ [key: string]: ZoneBounds }>({});
  const scrollViewRef = useRef<ScrollView>(null);

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
      (helpItemIndex) => {
        // Handle help trigger
        if (helpItemIndex === -1) {
          // Inactivity help - find an item that hasn't been placed yet
          triggerHelpForDragDrop();
        } else {
          // Error-based help
          triggerHelpForDragDrop();
        }
      },
      (message, _activityType) => {
        // Handle audio help - use step's helpMessage if available, otherwise use service message
        let helpMessage: string;
        
        if (step.helpMessage) {
          helpMessage = step.helpMessage;
        } else {
          helpMessage = message;
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

  // Update zone bounds when layout changes
  const updateZoneBounds = useCallback((zone: string) => {
    const zoneRef = zoneRefs.current[zone];
    if (zoneRef) {
      zoneRef.measure((x, y, width, height, pageX, pageY) => {
        zoneBounds.current[zone] = { 
          x: pageX, 
          y: pageY, 
          width, 
          height 
        };
      });
    }
  }, []);

  const handleZoneLayout = useCallback((zone: string) => {
    setTimeout(() => {
      updateZoneBounds(zone);
    }, 300);
  }, [updateZoneBounds]);

  // Helper function to trigger help for drag and drop
  const triggerHelpForDragDrop = useCallback(() => {
    // Find an item that hasn't been placed yet
    const unplacedItems = step.options?.filter((_, index) => !correctlyPlaced.has(index)) || [];
    if (unplacedItems.length === 0) return;

    // Select the first unplaced item
    const firstUnplacedIndex = step.options?.findIndex((_, index) => !correctlyPlaced.has(index)) ?? -1;
    if (firstUnplacedIndex === -1) return;

    const targetItem = step.options?.[firstUnplacedIndex];
    if (!targetItem) return;

    setIsHelpActive(true);
    setBlinkingItemIndex(firstUnplacedIndex);
    setBlinkingZone(targetItem.correctZone || null);
    
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
      setBlinkingItemIndex(null);
      setBlinkingZone(null);
      helpBlinkAnimation.setValue(1);
    }, 5000);
  }, [step.options, correctlyPlaced, helpBlinkAnimation, isHelpActive]);

  // Calculate stars based on performance
  const calculateStars = useCallback((errors: number, totalItems: number, completionTime: number, dragCount: number): number => {
    const maxTime = totalItems * 8000; // 8 seconds per item
    const timeBonus = completionTime < maxTime * 0.6 ? 1 : 0;
    const efficiencyBonus = dragCount <= totalItems * 1.3 ? 1 : 0;

    if (errors === 0 && dragCount <= totalItems) {
      return 3;
    } else if (errors === 0) {
      return 2 + timeBonus;
    } else if (errors <= Math.ceil(totalItems * 0.25)) {
      return 1 + timeBonus + efficiencyBonus;
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
      // 1. Save progress to backend first
      await saveProgressToBackend(finalStats);

      // 2. Use the enhanced achievement service that syncs with server
      const _gameData = {
        stars: finalStats.stars,
        isPerfect: finalStats.perfectRun,
        completionTime: finalStats.completionTime,
        errors: finalStats.errors,
        activityType: t.games.activityTypes.dragDrop,
        showedImprovement: finalStats.errors > 0 && finalStats.stars > 1,
        usedHelp: finalStats.usedHelp || false,
        tookTime: finalStats.completionTime > 60000,
        lessonId: (step as any).lesson_id,
        stepId: (step as any).ID || step.id,
      };

      // Use the local achievement service (temporarily disabled server sync)
      const newlyUnlocked: any[] = []; // Temporalmente deshabilitado
      
      if (newlyUnlocked.length > 0) {
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
      }
    } catch (error) {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' 
          ? 'No se pudieron verificar los logros. Tu progreso se ha guardado.'
          : 'Could not verify achievements. Your progress has been saved.',
        [{ text: 'OK' }]
      );
    }
  }, [saveProgressToBackend, step, language, t.games.activityTypes.dragDrop]);

  // FUNCIÓN CORREGIDA: handleAnimationFinish - Alineada con otras actividades
  const handleAnimationFinish = useCallback(() => {
    setShowAnimation(false);
    
    // CONDICIÓN CORREGIDA: Verificar que se completaron TODOS los elementos
    if (animationType === 'success' && score === totalItems && !gameCompleted) {
      // IMPORTANTE: Limpiar toda la ayuda activa inmediatamente
      if (isHelpActive) {
        setIsHelpActive(false);
        setBlinkingItemIndex(null);
        setBlinkingZone(null);
        helpBlinkAnimation.setValue(1);
      }
      
      // Detener servicios de ayuda
      adaptiveService.current.cleanup();
      audioService.current.cleanup();
      
      setGameCompleted(true);
      
      // Calculate final stats
      const completionTime = Date.now() - startTime;
      const efficiency = Math.round((totalItems / (gameStats.dragCount || 1)) * 100);
      const finalStats = {
        ...gameStats,
        completionTime,
        efficiency,
        stars: calculateStars(gameStats.errors, totalItems, completionTime, gameStats.dragCount),
      };
      setGameStats(finalStats);
      
      // Record game completion (includes backend save and achievement check)
      recordGameCompletion(finalStats);
      
      // CAMBIO IMPORTANTE: Mostrar modal directamente después de un delay corto
      setTimeout(() => {
        setShowStars(true);
      }, 800);
    }
  }, [animationType, score, totalItems, gameCompleted, startTime, gameStats, calculateStars, recordGameCompletion, isHelpActive, helpBlinkAnimation]);

  const handleCorrectDrop = useCallback((zone: string, option: Option, index: number) => {
    // Record action in adaptive reinforcement service
    adaptiveService.current.recordAction(true, -1, step.activityType);

    // Clear any active help
    if (isHelpActive) {
      setIsHelpActive(false);
      setBlinkingItemIndex(null);
      setBlinkingZone(null);
      helpBlinkAnimation.setValue(1);
    }

    setCorrectlyPlaced(prev => new Set([...prev, index]));
    setZoneItems(prev => ({
      ...prev,
      [zone]: [...(prev[zone] || []), { option, index }],
    }));
    const newScore = score + 1;
    setScore(newScore);

    // Update first try success
    const isFirstAttempt = gameStats.totalAttempts === 0;
    setGameStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
      firstTrySuccess: isFirstAttempt && newScore === 1,
    }));

    showFeedbackAnimation('success');
    // Play encouragement audio
    audioService.current.playEncouragementMessage();
  }, [score, showFeedbackAnimation, step.activityType, isHelpActive, helpBlinkAnimation, gameStats.totalAttempts]);

  const handleIncorrectDrop = useCallback(() => {
    // Record action in adaptive reinforcement service
    adaptiveService.current.recordAction(false, -1, step.activityType);

    setGameStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
      errors: prev.errors + 1,
      perfectRun: false,
    }));

    showFeedbackAnimation('error');
    // Play error guidance audio
    audioService.current.playErrorGuidanceMessage();
  }, [showFeedbackAnimation, step.activityType]);

  const checkCollision = useCallback((gestureX: number, gestureY: number): string | null => {
    for (const [zone, bounds] of Object.entries(zoneBounds.current)) {
      // Add some tolerance for easier dropping
      const tolerance = 20;
      if (
        gestureX >= bounds.x - tolerance &&
        gestureX <= bounds.x + bounds.width + tolerance &&
        gestureY >= bounds.y - tolerance &&
        gestureY <= bounds.y + bounds.height + tolerance
      ) {
        return zone;
      }
    }
    return null;
  }, []);

  const createPanHandlers = useCallback((option: Option, index: number) => {
    const pan = useRef(new Animated.ValueXY()).current;

    return {
      pan,
      panResponder: PanResponder.create({
        onStartShouldSetPanResponder: () => !correctlyPlaced.has(index),
        onMoveShouldSetPanResponder: () => !correctlyPlaced.has(index),
        onPanResponderGrant: () => {
          setIsDragging(true);
          setGameStats(prev => ({
            ...prev,
            dragCount: prev.dragCount + 1,
          }));

          pan.setOffset({
            x: (pan.x as any)._value,
            y: (pan.y as any)._value,
          });
          pan.setValue({ x: 0, y: 0 });
        },

        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false, // Necesario para transformaciones de posición
        }),

        onPanResponderRelease: (_, gesture) => {
          setIsDragging(false);
          pan.flattenOffset();
          const targetZone = checkCollision(gesture.moveX, gesture.moveY);
          
          if (targetZone) {
            if (option.correctZone === targetZone) {
              handleCorrectDrop(targetZone, option, index);
              
              Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: false,
                tension: 100,
                friction: 8,
              }).start();
            } else {
              handleIncorrectDrop();
              Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: false,
                tension: 150,
                friction: 8,
              }).start();
            }
          } else {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
              tension: 150,
              friction: 8,
            }).start();
          }
        },
      }),
    };
  }, [correctlyPlaced, checkCollision, handleCorrectDrop, handleIncorrectDrop]);

  const resetGame = useCallback(() => {
    setCorrectlyPlaced(new Set());
    setZoneItems({});
    setScore(0);
    setShowStars(false);
    setGameCompleted(false);
    setGameStats({
      totalAttempts: 0,
      errors: 0,
      stars: 0,
      completionTime: 0,
      perfectRun: true,
      dragCount: 0,
      efficiency: 100,
      usedHelp: false,
      helpActivations: 0,
      firstTrySuccess: false,
    });
  }, []);

  const getPerformanceMessage = useCallback((stars: number, perfectRun: boolean, efficiency: number) => {
    if (language === 'es') {
      if (perfectRun && stars === 3 && efficiency >= 100) {
        return '¡Perfecto! Arrastre eficiente sin errores 🏆';
      } else if (perfectRun && stars === 3) {
        return '¡Excelente! Sin errores 🌟';
      } else if (stars === 3) {
        return '¡Muy bien hecho! 👏';
      } else if (stars === 2) {
        return '¡Buen trabajo! Sigue practicando 💪';
      } else {
        return '¡Completado! Puedes mejorar la precisión 📈';
      }
    } else {
      if (perfectRun && stars === 3 && efficiency >= 100) {
        return 'Perfect! Efficient dragging without errors 🏆';
      } else if (perfectRun && stars === 3) {
        return 'Excellent! No errors 🌟';
      } else if (stars === 3) {
        return 'Very well done! 👏';
      } else if (stars === 2) {
        return 'Good job! Keep practicing 💪';
      } else {
        return 'Completed! You can improve precision 📈';
      }
    }
  }, [language]);

  const handleBackPress = useCallback(() => {
    if (gameStats.totalAttempts > 0 && !gameCompleted) {
      Alert.alert(
        language === 'es' ? 'Salir del juego' : 'Exit game',
        language === 'es' 
          ? '¿Estás seguro de que quieres salir? Perderás tu progreso actual.'
          : 'Are you sure you want to exit? You will lose your current progress.',
        [
          { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
          { text: language === 'es' ? 'Salir' : 'Exit', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [gameStats.totalAttempts, gameCompleted, navigation, language]);

  const handleCelebrationClose = useCallback(() => {
    setShowCelebration(false);
    setUnlockedAchievements([]);
  }, []);

  // Update zone bounds when component mounts and when layout changes
  useEffect(() => {
    const timer = setTimeout(() => {
      zones.forEach(zone => {
        if (zone) {
          updateZoneBounds(zone);
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [zones, updateZoneBounds]);

  // Also update bounds when scroll view layout changes
  useEffect(() => {
    const intervalTimer = setInterval(() => {
      zones.forEach(zone => {
        if (zone) {
          updateZoneBounds(zone);
        }
      });
    }, 2000);

    return () => clearInterval(intervalTimer);
  }, [zones, updateZoneBounds]);

  // Process achievement queue when it changes
  useEffect(() => {
    processAchievementQueue();
  }, [processAchievementQueue]);


  const isGameComplete = score === totalItems;

  // Función para calcular el ancho de las zonas basado en la cantidad
  const getZoneWidth = useCallback(() => {
    const totalZones = zones.length;
    if (totalZones <= 2) {
      return (width - 40) / 2; // 2 zonas por fila
    } else if (totalZones <= 3) {
      return (width - 60) / 3; // 3 zonas por fila
    } else if (totalZones <= 4) {
      return (width - 60) / 2; // 2x2 grid
    } else {
      return (width - 80) / 3; // 3 zonas por fila para más de 4
    }
  }, [zones.length]);

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
        ref={scrollViewRef}
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

        {/* 1. CONTEXTO - Pregunta */}
        <View style={styles.questionContainer}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? 'Pregunta:' : 'Question:'}
          </Text>
          <Text style={styles.questionText}>{processedStep.text}</Text>
        </View>

        {/* 2. ACCIÓN - Zonas y elementos para arrastrar */}
        <View style={styles.zonesContainer}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? 'Zonas de destino:' : 'Target zones:'}
          </Text>
          <View style={styles.zonesGrid}>
            {zones.map((zone, zoneIndex) => {
              if (!zone) return null;
              const isBlinkingZone = isHelpActive && blinkingZone === zone;
              return (
                <Animated.View 
                  key={`${zone}-${zoneIndex}`} 
                  ref={(ref: any) => {
                    if (zone) {
                      zoneRefs.current[zone] = ref;
                    }
                  }}
                  style={[
                    styles.zone,
                    isDragging && styles.zoneHighlighted,
                    isBlinkingZone && styles.zoneHelp,
                    { 
                      opacity: isBlinkingZone ? helpBlinkAnimation : 1,
                      width: getZoneWidth()
                    }
                  ]}
                  onLayout={() => zone && handleZoneLayout(zone)}
                >
                <Text style={styles.zoneTitle}>{zone}</Text>
                <View style={styles.zoneContent}>
                  {(zoneItems[zone] || []).length === 0 ? (
                    <Text style={styles.emptyZoneText}>
                      {language === 'es' ? 'Suelta aquí' : 'Drop here'}
                    </Text>
                  ) : (
                    <View style={styles.placedItemsContainer}>
                      {(zoneItems[zone] || []).map((placedItem: PlacedItem, i: number) => (
                        <View key={i} style={styles.placedItem}>
                          {isImageUrl(placedItem.option.icon) && !imageErrors[placedItem.index] ? (
                            <Image
                              source={{ uri: placedItem.option.icon }}
                              style={styles.placedItemImage}
                              resizeMode="contain"
                              onError={() => handleImageError(placedItem.index)}
                              onLoad={() => {}}
                            />
                          ) : (
                            <Text style={styles.placedIcon}>
                              {isImageUrl(placedItem.option.icon) && imageErrors[placedItem.index] 
                                ? '🖼️' // Fallback emoji when image fails to load
                                : placedItem.option.icon // Original emoji or fallback
                              }
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* Elementos Arrastrables */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? 'Elementos para arrastrar:' : 'Elements to drag:'}
          </Text>
          <View style={styles.optionsGrid}>
            {processedOptions.map((option, idx) => {
              if (!option.correctZone) return null;
              const { pan, panResponder } = createPanHandlers(option as Option, idx);
              const isPlaced = correctlyPlaced.has(idx);
              const isBlinkingItem = isHelpActive && blinkingItemIndex === idx;

              return (
                <Animated.View
                  key={idx}
                  {...panResponder.panHandlers}
                  style={[
                    styles.draggable,
                    isPlaced && styles.draggablePlaced,
                    isBlinkingItem && styles.draggableHelp,
                    {
                      transform: pan.getTranslateTransform(),
                    },
                  ]}
                >
                  <Animated.View
                    style={{
                      opacity: isBlinkingItem ? helpBlinkAnimation : 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <View style={styles.iconContainer}>
                      {isImageUrl(option.icon) && !imageErrors[idx] ? (
                        <Image
                          source={{ uri: option.icon }}
                          style={styles.draggableImage}
                          resizeMode="contain"
                          onError={() => handleImageError(idx)}
                          onLoad={() => {}}
                        />
                      ) : (
                        <Text style={[styles.optionIcon, isPlaced && styles.placedIconStyle]}>
                          {isImageUrl(option.icon) && imageErrors[idx] 
                            ? '🖼️' // Fallback emoji when image fails to load
                            : option.icon // Original emoji or fallback
                          }
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.optionLabel, isPlaced && styles.placedLabelStyle]}>
                      {option.label}
                    </Text>
                    {isPlaced && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </Animated.View>
                </Animated.View>
              );
            })}
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

      {/* Game Complete Modal */}
      <GameCompletionModal
        visible={isGameComplete && !showAnimation && showStars && !showCelebration}
        stats={gameStats}
        onReset={resetGame}
        onContinue={() => navigation.goBack()}
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.efficiency)}
        gameType="dragdrop"
        showEfficiency={true}
        customStats={[
          { 
            label: language === 'es' ? 'Arrastres totales' : 'Total drags', 
            value: gameStats.dragCount 
          },
          { 
            label: language === 'es' ? 'Elementos colocados' : 'Elements placed', 
            value: `${score}/${totalItems}` 
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
        bonusMessage={gameStats.perfectRun && gameStats.efficiency >= 100 ? (language === 'es' ? '🎯 ¡Arrastre perfecto!' : '🎯 Perfect dragging!') : undefined}
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4285f4',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  questionContainer: {
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
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  zonesContainer: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  zonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  zone: {
    backgroundColor: '#ffffff',
    height: 100,
    borderRadius: 14,
    padding: 8,
    borderWidth: 2,
    borderColor: '#e8f0fe',
    borderStyle: 'dashed',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderTopWidth: 3,
    borderTopColor: '#4285f4',
    marginBottom: 4,
  },
  zoneHighlighted: {
    borderColor: '#4285f4',
    backgroundColor: '#f0f9ff',
    shadowOpacity: 0.15,
    elevation: 5,
  },
  zoneHelp: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 3,
    shadowColor: '#ffc107',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  zoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    color: '#4285f4',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  zoneContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyZoneText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '500',
  },
  placedItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  placedItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
    minWidth: 32,
    minHeight: 32,
  },
  placedIcon: {
    fontSize: 16,
  },
  placedItemImage: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    minWidth: 45,
    minHeight: 45,
  },
  draggableImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  optionsContainer: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  draggable: {
    width: 75,
    height: 75,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#e8f0fe',
    position: 'relative',
    borderTopWidth: 3,
    borderTopColor: '#4285f4',
    marginBottom: 4,
  },
  draggablePlaced: {
    opacity: 0.6,
    backgroundColor: '#f8fafc',
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
  },
  draggableHelp: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 3,
    shadowColor: '#ffc107',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: 2,
  },
  optionLabel: {
    fontSize: 8,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  placedIconStyle: {
    opacity: 0.7,
  },
  placedLabelStyle: {
    color: '#6b7280',
  },
  checkmark: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    backgroundColor: '#4caf50',
    borderRadius: 10,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 4,
  },
});

export default DragDropScreen;