import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  Vibration,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FeedbackAnimation from '../components/FeedbackAnimation';
import AchievementCelebration from '../components/AchievementCelebration';
import { GameCompletionModal } from '../components/GameCompletionModal';
import { ProgressSection } from '../components/ProgressSection';
import { MessageCarousel } from '../components/MessageCarousel';
import AdaptiveReinforcementService from '../services/AdaptiveReinforcementService';
import AudioService from '../services/AudioService';
import { useRealProgress } from '../hooks/useRealProgress';
import { useLanguage } from '../contexts/LanguageContext';
import { useAchievementContext } from '../contexts/AchievementContext';
import { useAchievementModalSequence } from '../hooks/useAchievementModalSequence';
import { useActivityAdaptation } from '../hooks/useActivityAdaptation';
import { useGoals } from '../hooks/useGoals';
import BilingualTextProcessor from '../utils/BilingualTextProcessor';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');

type SelectOptionRouteProp = RouteProp<RootStackParamList, 'selectOption'>;

interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  firstTrySuccess: boolean;
  dragCount: number;
  efficiency: number;
  usedHelp?: boolean;
  helpActivations?: number;
}

interface ServerAchievement {
  ID: number;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  points: number;
  category: string;
}

const SelectOptionScreen = () => {
  const route = useRoute<SelectOptionRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle: _lessonTitle } = route.params;
  const { t, language } = useLanguage();

  // Real progress hook
  const { completeStep, isLoading: progressLoading, error: progressError } = useRealProgress();
  
  // Achievement system hook
  const { recordHelpUsed } = useAchievementContext();
  
  // Achievement modal sequence hook
  const { shouldShowModal, setShouldShowModal, handleGameCompletion } = useAchievementModalSequence();

  // Activity adaptation hook
  const { 
    adaptation, 
    getAdaptedTime, 
    getTextStyle, 
    getButtonStyle, 
    getContainerStyle,
    shouldShowHelp,
    getHelpFrequency,
    getMaxAttempts,
    shouldGiveMoreStars,
    getAchievementThresholds
  } = useActivityAdaptation();

  // Goals hook
  const { updateActivityProgress } = useGoals();

  // Bilingual states
  const [processedStep, setProcessedStep] = useState(step);
  const [rawStep] = useState(step); // Keep original data

  // Game state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Animation states
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'success' | 'error' | 'winner' | 'loser'>('success');

  // Legacy achievement states (removed - now using AchievementContext)
  
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
    firstTrySuccess: false,
    dragCount: 0,
    efficiency: 100,
    usedHelp: false,
    helpActivations: 0,
  });
  const [startTime] = useState<number>(Date.now());
  const [showStars, setShowStars] = useState(false);

  // Animation refs
  const [optionScales] = useState(
    step.options?.map(() => new Animated.Value(1)) || []
  );

  // Adaptive reinforcement states
  const [isHelpActive, setIsHelpActive] = useState(false);
  const [blinkingOptionIndex, setBlinkingOptionIndex] = useState<number | null>(null);
  const [helpBlinkAnimation] = useState(new Animated.Value(1));
  const adaptiveService = useRef(AdaptiveReinforcementService.getInstance());
  const audioService = useRef(AudioService.getInstance());
  
  // Mount control for safe state updates
  const isMountedRef = useRef(true);

  // Image error states for each option
  const [imageErrors, setImageErrors] = useState<boolean[]>([]);

  // Memoized values
  const totalOptions = useMemo(() => step.options?.length || 0, [step.options]);
  const totalItems = 1; // Solo una respuesta correcta en selección

  // Calculate dynamic option width based on total options
  const getOptionWidth = useCallback(() => {
    const totalOptions = step.options?.length || 0;
    if (totalOptions <= 2) {
      return (width - 40) / 2; // 2 opciones por fila
    } else if (totalOptions <= 3) {
      return (width - 60) / 3; // 3 opciones por fila
    } else if (totalOptions <= 4) {
      return (width - 60) / 2; // 2x2 grid
    } else {
      return (width - 80) / 3; // 3 opciones por fila para más de 4
    }
  }, [step.options?.length]);

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

  // Process step content for current language
  const processStepForLanguage = useCallback(() => {
    const originalText = rawStep.text || '';
    const originalHelpMessage = rawStep.helpMessage || '';
    
    const processedText = BilingualTextProcessor.extractText(originalText, language);
    const processedHelpMessage = BilingualTextProcessor.extractText(originalHelpMessage, language);
    
    // Process options
    const processedOptions = rawStep.options?.map((option: any, _index: number) => {
      const originalLabel = option.label || '';
      
      const processedLabel = BilingualTextProcessor.extractText(originalLabel, language);
      
      return {
        ...option,
        label: processedLabel,
      };
    }) || [];
    
    // Update processed step
    const newProcessedStep = {
      ...rawStep,
      text: processedText,
      helpMessage: processedHelpMessage,
      options: processedOptions,
    };
    
    setProcessedStep(newProcessedStep);
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
  // Achievement initialization is now handled by AchievementContext

  // Calculate stars based on performance
  const calculateStars = useCallback((errors: number, completionTime: number, firstTry: boolean): number => {
    const maxTime = 30000; // 30 seconds as baseline
    const timeBonus = completionTime < maxTime * 0.5 ? 1 : 0;

    if (firstTry && errors === 0) {
      return 3; // Perfect performance - first try success
    } else if (errors === 0) {
      return 2 + timeBonus; // Good performance - no errors
    } else if (errors <= 1) {
      return 1 + timeBonus; // Acceptable performance - max 1 error
    } else {
      return 1; // Minimum star for completion
    }
  }, []);

  // Helper function to trigger help for a specific option
  const triggerHelpForOption = useCallback((optionIndex: number) => {
    // NO ACTIVAR AYUDA SI EL JUEGO YA TERMINÓ
    if (gameCompleted || score === 1) {
      return;
    }
    
    setIsHelpActive(true);
    setBlinkingOptionIndex(optionIndex);
    
    // Update help stats
    setGameStats(prev => ({
      ...prev,
      usedHelp: true,
      helpActivations: (prev.helpActivations || 0) + 1,
    }));
    
    // Record help usage for achievements
    try {
      const lessonId = (step as any).lesson_id;
      const stepId = (step as any).ID || step.id;
      recordHelpUsed(lessonId, stepId);
      console.log('📝 [SelectOptionScreen] Uso de ayuda registrado para achievements');
    } catch (error) {
      console.error('❌ [SelectOptionScreen] Error registrando uso de ayuda:', error);
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
        if (isHelpActive && !gameCompleted && score !== 1) {
          blinkAnimation();
        }
      });
    };
    
    blinkAnimation();
    
    // Stop help after 5 seconds
    setTimeout(() => {
      if (!isMountedRef.current) return;
      
      setIsHelpActive(false);
      setBlinkingOptionIndex(null);
      helpBlinkAnimation.setValue(1);
    }, 5000);
  }, [helpBlinkAnimation, isHelpActive, gameCompleted, score, recordHelpUsed, step]);

  // Initialize adaptive reinforcement service
  useEffect(() => {
    const correctOptionIndex = step.options?.findIndex(option => option.correct) ?? -1;
    
    // Sincronizar idioma de voz con el idioma actual
    audioService.current.syncWithAppLanguage(language);
    
    // Configurar ayuda adaptativa basada en el perfil
    const helpFrequency = getHelpFrequency();
    const maxAttempts = getMaxAttempts();
    
    adaptiveService.current.initialize(
      (helpOptionIndex) => {
        // Handle help trigger
        if (helpOptionIndex === -1) {
          // Inactivity help - highlight the correct option
          if (correctOptionIndex >= 0) {
            triggerHelpForOption(correctOptionIndex);
          }
        } else {
          // Error-based help
          if (correctOptionIndex >= 0) {
            triggerHelpForOption(correctOptionIndex);
          }
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
        
        // Aplicar adaptaciones de audio
        if (adaptation?.audioAids.readAloud) {
          audioService.current.playTextToSpeech(helpMessage, true);
        }
      },
      step.activityType, // Pass the activity type to the service
      helpFrequency, // Usar frecuencia personalizada
      maxAttempts // Usar intentos máximos personalizados
    );

    return () => {
      const currentAdaptiveService = adaptiveService.current;
      const currentAudioService = audioService.current;
      currentAdaptiveService.cleanup();
      currentAudioService.cleanup();
    };
  }, [step, language, triggerHelpForOption]);

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
  // Legacy achievement functions removed - now handled by AchievementContext

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
      console.log('🎮 [SelectOptionScreen] Registrando finalización de juego:', finalStats);
      
      // 1. Save progress to backend first
      await saveProgressToBackend(finalStats);

      // 2. Use the new achievement system
      const gameData = {
        lessonId: (step as any).lesson_id,
        stepId: (step as any).ID || step.id,
        stars: finalStats.stars,
        completionTime: Math.round(finalStats.completionTime / 1000), // Convertir a segundos
        errors: finalStats.errors,
        usedHelp: finalStats.usedHelp || false,
        perfectRun: finalStats.perfectRun,
        activityType: 'completion', // Categoría para el sistema de logros
      };

      // Use the new sequence handler (handles achievements and modal timing)
      await handleGameCompletion(gameData);

      // Actualizar metas de progreso
      await updateActivityProgress(
        step.ActivityType?.name || 'Unknown',
        {
          duration: finalStats.completionTime,
          stars: finalStats.stars,
          completed: finalStats.perfectRun || finalStats.stars > 0,
        }
      );
      
      console.log('✅ [SelectOptionScreen] Finalización registrada exitosamente');
    } catch (error) {
      console.error('❌ [SelectOptionScreen] Error registrando finalización:', error);
      // No mostrar alert para achievements - el usuario no necesita saber si fallan
      // El progreso ya se guardó exitosamente
    }
  }, [saveProgressToBackend, handleGameCompletion, step]);

  // FUNCIÓN CORREGIDA: handleAnimationFinish
  const handleAnimationFinish = useCallback(() => {
    setShowAnimation(false);
    
    // CONDICIÓN CORREGIDA: Solo completar el juego si se respondió correctamente
    if (animationType === 'winner' && score === 1 && !gameCompleted) {
      // IMPORTANTE: Limpiar toda la ayuda activa inmediatamente
      if (isHelpActive) {
        setIsHelpActive(false);
        setBlinkingOptionIndex(null);
        helpBlinkAnimation.setValue(1);
      }
      
      // Detener servicios de ayuda
      adaptiveService.current.cleanup();
      audioService.current.cleanup();
      
      setGameCompleted(true);
      
      // Calculate final stats
      const completionTime = Date.now() - startTime;
      const finalStats = {
        ...gameStats,
        completionTime,
        stars: calculateStars(gameStats.errors, completionTime, gameStats.firstTrySuccess),
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
  }, [animationType, score, gameCompleted, gameStats, startTime, calculateStars, recordGameCompletion, isHelpActive, helpBlinkAnimation]);

  const handleOptionPress = useCallback((optionIndex: number) => {
    if (isAnswered || gameCompleted) return;

    // Record user interaction for inactivity tracking
    adaptiveService.current.recordInactivity();

    // Clear any active help
    if (isHelpActive) {
      setIsHelpActive(false);
      setBlinkingOptionIndex(null);
      helpBlinkAnimation.setValue(1);
    }

    setSelectedOption(optionIndex);
    setIsAnswered(true);
    setScore(1);

    // Update game stats
    const isFirstAttempt = gameStats.totalAttempts === 0;
    const isCorrect = step.options?.[optionIndex]?.correct || false;
    
    setGameStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
      firstTrySuccess: isFirstAttempt && isCorrect,
      perfectRun: isCorrect,
      errors: isCorrect ? prev.errors : prev.errors + 1,
    }));

    // Record action in adaptive reinforcement service
    adaptiveService.current.recordAction(isCorrect, optionIndex, step.activityType);

    if (isCorrect) {
      showFeedbackAnimation('winner');
      // Play encouragement audio
      audioService.current.playEncouragementMessage();
    } else {
      showFeedbackAnimation('error');
      // Play error guidance audio
      audioService.current.playErrorGuidanceMessage();
    }
  }, [isAnswered, gameCompleted, isHelpActive, helpBlinkAnimation, gameStats.totalAttempts, step.options, step.activityType, showFeedbackAnimation]);

  const resetGame = useCallback(() => {
    setSelectedOption(null);
    setIsAnswered(false);
    setGameCompleted(false);
    setShowStars(false);
    setScore(0);
    setShouldShowModal(false); // Reset modal state
    setGameStats({
      totalAttempts: 0,
      errors: 0,
      stars: 0,
      completionTime: 0,
      perfectRun: true,
      firstTrySuccess: false,
      dragCount: 0,
      efficiency: 100,
      usedHelp: false,
      helpActivations: 0,
    });
  }, [setShouldShowModal]);

  const getPerformanceMessage = useCallback((stars: number, perfectRun: boolean, firstTry: boolean) => {
    if (language === 'es') {
      if (perfectRun && stars === 3 && firstTry) {
        return '¡Perfecto! Primera vez correcta 🏆';
      } else if (perfectRun && stars === 3) {
        return '¡Excelente! Respuesta correcta 🌟';
      } else if (stars === 3) {
        return '¡Muy bien hecho! 👏';
      } else if (stars === 2) {
        return '¡Buen trabajo! Sigue practicando 💪';
      } else {
        return '¡Completado! Puedes mejorar 📈';
      }
    } else {
      if (perfectRun && stars === 3 && firstTry) {
        return 'Perfect! First try success 🏆';
      } else if (perfectRun && stars === 3) {
        return 'Excellent! Correct answer 🌟';
      } else if (stars === 3) {
        return 'Very well done! 👏';
      } else if (stars === 2) {
        return 'Good job! Keep practicing 💪';
      } else {
        return 'Completed! You can improve 📈';
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
          { text: language === 'es' ? 'Salir' : 'Exit', style: 'destructive', onPress: () => navigation.goBack() }
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

  // Achievement queue processing is now handled by AchievementContext

  const isGameComplete = score === 1;

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
          <Text style={[styles.questionText, getTextStyle()]}>{processedStep.text}</Text>
        </View>

        {/* 2. ACCIÓN - Opciones de respuesta */}
        <View style={[styles.optionsContainer, getContainerStyle()]}>
          <Text style={[styles.sectionTitle, getTextStyle()]}>
            {language === 'es' ? 'Selecciona la opción correcta:' : 'Select the correct option:'}
          </Text>
          <View style={styles.optionsGrid}>
            {processedStep.options?.map((option: any, index: number) => {
              const isSelected = selectedOption === index;
              const isCorrect = option.correct;
              const isBlinking = isHelpActive && blinkingOptionIndex === index;
              
              let optionStatus = 'idle';
              if (isAnswered) {
                if (isSelected) {
                  optionStatus = isCorrect ? 'correct' : 'wrong';
                } else if (isCorrect) {
                  optionStatus = 'correct';
                }
              }

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.optionWrapper,
                    { 
                      width: getOptionWidth(),
                      opacity: isBlinking ? helpBlinkAnimation : 1 
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.optionCard,
                      getButtonStyle(),
                      styles[`optionCard${optionStatus.charAt(0).toUpperCase() + optionStatus.slice(1)}`],
                      isBlinking && styles.optionCardHelp,
                    ]}
                    onPress={() => handleOptionPress(index)}
                    disabled={isAnswered}
                    activeOpacity={0.8}
                  >
                    <View style={styles.iconContainer}>
                      {isImageUrl(option.icon) && !imageErrors[index] ? (
                        <Image
                          source={{ uri: option.icon }}
                          style={styles.optionImage}
                          resizeMode="contain"
                          onError={() => handleImageError(index)}
                          onLoad={() => {}}
                        />
                      ) : (
                        <Text style={styles.optionIcon}>
                          {isImageUrl(option.icon) && imageErrors[index] 
                            ? '🖼️' // Fallback emoji when image fails to load
                            : option.icon // Original emoji or fallback
                          }
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.optionLabel, getTextStyle(), isSelected && styles.selectedLabel]}>
                      {option.label}
                    </Text>
                    {isAnswered && isSelected && (
                      <View style={styles.statusIndicator}>
                        <Text style={styles.statusText}>
                          {isCorrect ? '✓' : '✗'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
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
        visible={shouldShowModal && isGameComplete && !showAnimation && showStars && !showCelebration}
        stats={gameStats}
        onReset={resetGame}
        onContinue={() => navigation.goBack()}
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.firstTrySuccess)}
        gameType="select"
        showEfficiency={false}
        customStats={[
          { 
            label: language === 'es' ? 'Intentos totales' : 'Total attempts', 
            value: gameStats.totalAttempts 
          },
          { 
            label: language === 'es' ? 'Respuesta correcta' : 'Correct answer', 
            value: score === 1 ? (language === 'es' ? 'Sí' : 'Yes') : (language === 'es' ? 'No' : 'No')
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
        bonusMessage={gameStats.perfectRun && gameStats.firstTrySuccess ? (language === 'es' ? '🎯 ¡Primera vez perfecta!' : '🎯 Perfect first try!') : undefined}
      />

      {/* Feedback Animation */}
      {showAnimation && (
        <FeedbackAnimation
          type={animationType}
          onFinish={handleAnimationFinish}
        />
      )}

      {/* Achievement Celebration */}
      <AchievementCelebration
        achievements={unlockedAchievements}
        visible={showCelebration}
        onClose={handleCelebrationClose}
      />

      {/* Achievement notifications are now handled globally by AchievementContext */}
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4285f4',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 20,
    letterSpacing: 0.2,
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
  },
  optionWrapper: {
    marginBottom: 8,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e8f0fe',
    borderTopWidth: 4,
    borderTopColor: '#4285f4',
    transform: [{ scale: 1 }],
  },
  optionCardIdle: {
    // Estado normal
  },
  optionCardCorrect: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    borderWidth: 3,
    shadowColor: '#4caf50',
    shadowOpacity: 0.3,
  },
  optionCardWrong: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 3,
    shadowColor: '#f44336',
    shadowOpacity: 0.3,
  },
  optionCardHelp: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 3,
    shadowColor: '#ffc107',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    minWidth: 60,
    minHeight: 60,
    backgroundColor: 'rgba(66, 133, 244, 0.06)',
    borderRadius: 12,
    padding: 8,
  },
  optionIcon: {
    fontSize: 36,
    marginBottom: 0,
  },
  optionImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 0,
  },
  optionLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  selectedLabel: {
    fontWeight: '700',
  },
  statusIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 4,
  },
});

export default SelectOptionScreen;