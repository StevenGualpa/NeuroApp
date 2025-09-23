import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Alert,
  FlatList,
  Dimensions,
  ScrollView,
  Vibration,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FeedbackAnimation from '../components/FeedbackAnimation';
import AchievementNotification from '../components/AchievementNotification';
import AchievementCelebration from '../components/AchievementCelebration';
import { GameCompletionModal } from '../components/GameCompletionModal';
import { ProgressSection } from '../components/ProgressSection';
import { MessageCarousel } from '../components/MessageCarousel';
import { AchievementService, Achievement } from '../services/AchievementService';
// import RealAchievementServiceEnhanced from '../services/RealAchievementService_enhanced';
import AdaptiveReinforcementService from '../services/AdaptiveReinforcementService';
import AudioService from '../services/AudioService';
import { useRealProgress } from '../hooks/useRealProgress';
import { useLanguage } from '../contexts/LanguageContext';
import BilingualTextProcessor from '../utils/BilingualTextProcessor';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  resets: number;
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

const OrderStepsScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'orderSteps'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle: _lessonTitle } = route.params;
  const { t, language } = useLanguage();

  // Real progress hook
  const { completeStep, isLoading: progressLoading, error: progressError } = useRealProgress();

  // Bilingual states
  const [processedStep, setProcessedStep] = useState(step);
  const [rawStep] = useState(step); // Keep original data
  const [processedOptions, setProcessedOptions] = useState(step.options || []);

  // Crear una copia de las opciones procesadas y mezclarlas
  const shuffledOptions = useMemo(() => 
    [...processedOptions].sort(() => Math.random() - 0.5), 
    [processedOptions]
  );

  // Game state
  const [selectedOrder, setSelectedOrder] = useState<any[]>([]);
  const [status, setStatus] = useState<{ [key: string]: 'correct' | 'wrong' | 'idle' }>({});
  const [disabled, setDisabled] = useState(false);
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
    resets: 0,
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
  const [blinkingStepIndex, setBlinkingStepIndex] = useState<number | null>(null);
  const [helpBlinkAnimation] = useState(new Animated.Value(1));
  const adaptiveService = useRef(AdaptiveReinforcementService.getInstance());
  const audioService = useRef(AudioService.getInstance());
  
  // Mount control for safe state updates
  const isMountedRef = useRef(true);

  // Memoized values
  const totalSteps = useMemo(() => shuffledOptions.length, [shuffledOptions]);
  const totalItems = totalSteps; // Para compatibilidad con ProgressSection

  // Process step content for current language
  const processStepForLanguage = useCallback(() => {
    // Process step text
    const originalText = rawStep.text || '';
    const originalHelpMessage = rawStep.helpMessage || '';
    
    
    const processedText = BilingualTextProcessor.extractText(originalText, language);
    const processedHelpMessage = BilingualTextProcessor.extractText(originalHelpMessage, language);
    
    // Process options
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
      (helpStepIndex) => {
        // Handle help trigger
        if (helpStepIndex === -1) {
          // Inactivity help - find next correct step
          const nextStepOrder = selectedOrder.length + 1;
          const nextCorrectStep = shuffledOptions.findIndex(option => (option.order_value || option.order) === nextStepOrder);
          if (nextCorrectStep !== -1) {
            triggerHelpForStep(nextCorrectStep);
          }
        } else {
          // Error-based help
          triggerHelpForStep(helpStepIndex);
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
  }, [step, selectedOrder, shuffledOptions, language]);

  useEffect(() => {
    const initStatus: any = {};
    shuffledOptions.forEach((opt, _index) => {
      initStatus[opt.label] = 'idle';
    });
    setStatus(initStatus);
  }, [shuffledOptions]);

  // Helper function to trigger help for a specific step
  const triggerHelpForStep = useCallback((stepIndex: number) => {
    setIsHelpActive(true);
    setBlinkingStepIndex(stepIndex);
    
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
      if (!isMountedRef.current) return;
      
      setIsHelpActive(false);
      setBlinkingStepIndex(null);
      helpBlinkAnimation.setValue(1);
    }, 5000);
  }, [helpBlinkAnimation, isHelpActive]);

  // Calculate stars based on performance
  const calculateStars = useCallback((errors: number, resets: number, completionTime: number, stepCount: number): number => {
    const maxTime = stepCount * 10000; // 10 seconds per step as baseline
    const timeBonus = completionTime < maxTime * 0.5 ? 1 : 0;
    const resetPenalty = resets > 0 ? 1 : 0;

    if (errors === 0 && resets === 0) {
      return 3; // Perfect performance - no errors, no resets
    } else if (errors <= 1 && resets <= 1) {
      return 2 + timeBonus; // Good performance
    } else if (errors <= 2 || resets <= 2) {
      return Math.max(1, 2 - resetPenalty); // Acceptable performance
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
      } else {
        if (progressError) {
          Alert.alert(
            'Error de Conexión',
            `No se pudo guardar tu progreso: ${progressError}. Tu progreso local se ha guardado.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
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

      // 1. Save progress to backend first
      await saveProgressToBackend(finalStats);

      // 2. Use the enhanced achievement service that syncs with server
      const _gameData = {
        stars: finalStats.stars,
        isPerfect: finalStats.perfectRun,
        completionTime: finalStats.completionTime,
        errors: finalStats.errors,
        activityType: t.games.activityTypes.orderSteps,
        showedImprovement: finalStats.errors > 0 && finalStats.stars > 1,
        usedHelp: finalStats.usedHelp || false,
        tookTime: finalStats.completionTime > 60000,
        lessonId: (step as any).lesson_id,
        stepId: (step as any).ID || step.id,
      };


      // const newlyUnlocked = await RealAchievementServiceEnhanced.recordGameCompletion(gameData);
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
          if (!isMountedRef.current) return;
          
          setShowCelebration(true);
        }, 1500);
        
      } else {
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudieron verificar los logros. Tu progreso se ha guardado.',
        [{ text: 'OK' }]
      );
    }
  }, [saveProgressToBackend, step]);

  // FUNCIÓN CORREGIDA: handleAnimationFinish
  const handleAnimationFinish = useCallback(() => {
    setShowAnimation(false);
    
    // CONDICIÓN CORREGIDA: Solo completar el juego si se ordenaron TODOS los pasos
    if (animationType === 'winner' && score === totalSteps && !gameCompleted) {
      
      // IMPORTANTE: Limpiar toda la ayuda activa inmediatamente
      if (isHelpActive) {
        setIsHelpActive(false);
        setBlinkingStepIndex(null);
        helpBlinkAnimation.setValue(1);
      }
      
      // Detener servicios de ayuda
      adaptiveService.current.cleanup();
      audioService.current.cleanup();
      
      setGameCompleted(true);
      
      // Calculate final stats
      const completionTime = Date.now() - startTime;
      const efficiency = Math.round((totalSteps / (gameStats.totalAttempts || 1)) * 100);
      const finalStats = {
        ...gameStats,
        completionTime,
        efficiency,
        stars: calculateStars(gameStats.errors, gameStats.resets, completionTime, totalSteps),
      };
      setGameStats(finalStats);

      
      // Record game completion (includes backend save and achievement check)
      recordGameCompletion(finalStats);
      
      // CAMBIO IMPORTANTE: Mostrar modal directamente después de un delay corto
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        setShowStars(true);
      }, 800);
    } else if (animationType === 'winner' && score !== totalSteps) {
    }
  }, [animationType, score, totalSteps, gameCompleted, gameStats, startTime, calculateStars, recordGameCompletion, isHelpActive, helpBlinkAnimation]);

  const handleSelect = useCallback((option: any) => {
    if (disabled || selectedOrder.some(item => item.label === option.label)) {
      return;
    }


    const newOrder = [...selectedOrder, option];
    setSelectedOrder(newOrder);
    setScore(newOrder.length);

    // Find what step should be next based on order
    const expectedStep = newOrder.length;
    const optionOrder = option.order_value || option.order; // Usar order_value del backend o order como fallback
    const isCorrect = optionOrder === expectedStep;


    // Record action in adaptive reinforcement service
    const nextStepOrder = newOrder.length + 1;
    const nextCorrectStepIndex = shuffledOptions.findIndex(opt => (opt.order_value || opt.order) === nextStepOrder);
    adaptiveService.current.recordAction(isCorrect, nextCorrectStepIndex, step.activityType);

    // Clear any active help
    if (isHelpActive) {
      setIsHelpActive(false);
      setBlinkingStepIndex(null);
      helpBlinkAnimation.setValue(1);
    }

    // Update total attempts and first try success
    const isFirstAttempt = gameStats.totalAttempts === 0;
    setGameStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
      dragCount: prev.dragCount + 1,
      firstTrySuccess: isCorrect && isFirstAttempt && newOrder.length === 1,
    }));

    setStatus(prev => ({ ...prev, [option.label]: isCorrect ? 'correct' : 'wrong' }));

    if (!isCorrect) {
      // PASO INCORRECTO - Error y reiniciar
      
      // Update error stats
      setGameStats(prev => ({
        ...prev,
        errors: prev.errors + 1,
        perfectRun: false,
      }));

      setDisabled(true);
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        showFeedbackAnimation('error');
        // Play error guidance audio
        audioService.current.playErrorGuidanceMessage();
        setTimeout(() => {
          if (!isMountedRef.current) return;
          
          Alert.alert(
            '🤔 ¡Inténtalo otra vez!', 
            'Ese no era el paso correcto. ¡Tú puedes hacerlo!',
            [
              {
                text: '¡Intentar de nuevo!',
                onPress: reset,
              }
            ]
          );
        }, 1000);
      }, 800);
    } else if (newOrder.length === shuffledOptions.length) {
      // TODOS LOS PASOS COMPLETADOS CORRECTAMENTE
      
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        showFeedbackAnimation('winner');
      }, 500);
    } else {
      // PASO CORRECTO PERO AÚN FALTAN MÁS
      
      showFeedbackAnimation('success');
      // Play encouragement audio
      audioService.current.playEncouragementMessage();
    }
  }, [disabled, selectedOrder, shuffledOptions, showFeedbackAnimation, step.activityType, isHelpActive, helpBlinkAnimation, gameStats.totalAttempts]);

  const reset = useCallback(() => {
    const resetStatus: any = {};
    shuffledOptions.forEach(opt => resetStatus[opt.label] = 'idle');
    setStatus(resetStatus);
    setSelectedOrder([]);
    setScore(0);
    setDisabled(false);

    // Update reset count
    setGameStats(prev => ({
      ...prev,
      resets: prev.resets + 1,
      perfectRun: false,
    }));
  }, [shuffledOptions]);

  const resetGame = useCallback(() => {
    const resetStatus: any = {};
    shuffledOptions.forEach(opt => resetStatus[opt.label] = 'idle');
    setStatus(resetStatus);
    setSelectedOrder([]);
    setScore(0);
    setDisabled(false);
    setGameCompleted(false);
    setShowStars(false);
    setGameStats({
      totalAttempts: 0,
      errors: 0,
      stars: 0,
      completionTime: 0,
      perfectRun: true,
      resets: 0,
      efficiency: 100,
      dragCount: 0,
      usedHelp: false,
      helpActivations: 0,
      firstTrySuccess: false,
    });
  }, [shuffledOptions]);

  const getPerformanceMessage = useCallback((stars: number, perfectRun: boolean, resets: number) => {
    if (perfectRun && stars === 3 && resets === 0) {
      return "¡Perfecto! Secuencia correcta sin errores 🏆";
    } else if (perfectRun && stars === 3) {
      return "¡Excelente! Muy bien ordenado 🌟";
    } else if (stars === 3) {
      return "¡Muy bien hecho! 👏";
    } else if (stars === 2) {
      return "¡Buen trabajo! Sigue practicando 💪";
    } else {
      return "¡Completado! Puedes mejorar el orden 📈";
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

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const itemStatus = status[item.label];
    const isSelected = selectedOrder.some(selected => selected.label === item.label);
    const stepNumber = selectedOrder.findIndex(selected => selected.label === item.label) + 1;
    const isBlinking = isHelpActive && blinkingStepIndex === index;
    
    // Debug logs

    return (
      <Animated.View 
        style={[
          styles.optionWrapper,
          { opacity: isBlinking ? helpBlinkAnimation : 1 }
        ]}
      >
        <TouchableOpacity
          disabled={disabled || (itemStatus && itemStatus !== 'idle')}
          style={[
            styles.optionCard,
            itemStatus === 'correct' && styles.optionCardCorrect,
            itemStatus === 'wrong' && styles.optionCardWrong,
            (!itemStatus || itemStatus === 'idle') && styles.optionCardIdle,
            isBlinking && styles.optionCardHelp,
          ]}
          onPress={() => {
            // Record user interaction for inactivity tracking
            adaptiveService.current.recordInactivity();
            handleSelect(item);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.optionContent}>
            <View style={styles.iconContainer}>
              {isImageUrl(item.icon) && !imageErrors[index] ? (
                <Image
                  source={{ uri: item.icon }}
                  style={[
                    styles.optionImage,
                    itemStatus === 'correct' && styles.optionIconCorrect,
                    itemStatus === 'wrong' && styles.optionIconWrong,
                  ]}
                  resizeMode="contain"
                  onError={() => handleImageError(index)}
                  onLoad={() => {}}
                />
              ) : (
                <Text style={[
                  styles.optionIcon,
                  itemStatus === 'correct' && styles.optionIconCorrect,
                  itemStatus === 'wrong' && styles.optionIconWrong,
                ]}>
                  {isImageUrl(item.icon) && imageErrors[index] 
                    ? '🖼️' // Fallback emoji when image fails to load
                    : item.icon // Original emoji or fallback
                  }
                </Text>
              )}
            </View>
            <Text style={[
              styles.optionLabel,
              itemStatus === 'correct' && styles.optionLabelCorrect,
              itemStatus === 'wrong' && styles.optionLabelWrong,
            ]}>
              {item.label}
            </Text>
          </View>
          
          {isSelected && itemStatus === 'correct' && (
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{stepNumber}</Text>
            </View>
          )}
          
          {itemStatus === 'wrong' && (
            <View style={styles.wrongIndicator}>
              <Text style={styles.wrongIndicatorText}>✗</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }, [status, selectedOrder, disabled, handleSelect, isHelpActive, blinkingStepIndex, helpBlinkAnimation, handleImageError, imageErrors, isImageUrl]);

  // Process achievement queue when it changes
  useEffect(() => {
    processAchievementQueue();
  }, [processAchievementQueue]);

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

        {/* 1. CONTEXTO - Pregunta */}
        <View style={styles.questionContainer}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? 'Pregunta:' : 'Question:'}
          </Text>
          <Text style={styles.questionText}>{processedStep.text}</Text>
        </View>

        {/* 2. ACCIÓN - Opciones para ordenar */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? 'Pasos para ordenar:' : 'Steps to order:'}
          </Text>
          <FlatList
            data={shuffledOptions}
            keyExtractor={(item, idx) => item.label + idx}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={styles.grid}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Reset button */}
        {selectedOrder.length > 0 && !gameCompleted && (
          <View style={styles.resetContainer}>
            <TouchableOpacity onPress={reset} style={styles.resetButton}>
              <Text style={styles.resetText}>
                🔄 {language === 'es' ? 'Reiniciar' : 'Reset'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
        visible={gameCompleted && !showAnimation && showStars && !showCelebration}
        stats={gameStats}
        onReset={resetGame}
        onContinue={() => navigation.goBack()}
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.resets)}
        gameType="sequence"
        showEfficiency={true}
        customStats={[
          { label: 'Pasos ordenados', value: `${score}/${totalItems}` },
          { label: 'Reinicios', value: gameStats.resets },
          { label: 'Ayuda usada', value: gameStats.usedHelp ? 'Sí' : 'No' },
          { label: 'Progreso guardado', value: progressLoading ? 'Guardando...' : 'Guardado ✅' },
        ]}
        bonusMessage={gameStats.perfectRun && gameStats.resets === 0 ? "🎯 ¡Secuencia perfecta!" : undefined}
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
    paddingTop: 8,
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4ff',
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285f4',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  optionsContainer: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  grid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionWrapper: {
    width: (width - 40) / 2,
    marginHorizontal: 2,
    marginVertical: 6,
  },
  optionCard: {
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
    shadowColor: '#4285f4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0,
    position: 'relative',
  },
  optionCardIdle: {
    backgroundColor: '#ffffff',
    shadowColor: '#4285f4',
    shadowOpacity: 0.15,
  },
  optionCardCorrect: {
    backgroundColor: '#e8f8f5',
    shadowColor: '#4caf50',
    shadowOpacity: 0.4,
    borderTopWidth: 4,
    borderTopColor: '#4caf50',
    borderLeftWidth: 2,
    borderLeftColor: '#4caf50',
    borderRightWidth: 2,
    borderRightColor: '#4caf50',
  },
  optionCardWrong: {
    backgroundColor: '#fef2f2',
    shadowColor: '#f44336',
    shadowOpacity: 0.4,
    borderTopWidth: 4,
    borderTopColor: '#f44336',
    borderLeftWidth: 2,
    borderLeftColor: '#f44336',
    borderRightWidth: 2,
    borderRightColor: '#f44336',
  },
  optionCardHelp: {
    backgroundColor: '#fffbeb',
    shadowColor: '#ffc107',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    borderTopWidth: 4,
    borderTopColor: '#ffc107',
    borderBottomWidth: 4,
    borderBottomColor: '#ffc107',
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
    borderRightWidth: 3,
    borderRightColor: '#ffc107',
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    borderRadius: 16,
    padding: 8,
    minWidth: 80,
    minHeight: 80,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    fontSize: 50,
    marginBottom: 0,
  },
  optionImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginBottom: 0,
    borderWidth: 0,
  },
  optionIconCorrect: {
    opacity: 1,
  },
  optionIconWrong: {
    opacity: 0.8,
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  optionLabelCorrect: {
    color: '#2e7d32',
    fontWeight: '800',
  },
  optionLabelWrong: {
    color: '#c62828',
    fontWeight: '800',
  },
  stepNumber: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 40,
    height: 40,
    backgroundColor: '#4caf50',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  wrongIndicator: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 40,
    height: 40,
    backgroundColor: '#f44336',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  wrongIndicatorText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  resetContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#ff6b6b',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  resetText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomSpacing: {
    height: 4,
  },
});

export default OrderStepsScreen;