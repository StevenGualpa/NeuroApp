import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
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

type PatternRecognitionRouteProp = RouteProp<RootStackParamList, 'patternRecognition'>;

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
  patternComplexity?: string;
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

const PatternRecognitionScreen = () => {
  const route = useRoute<PatternRecognitionRouteProp>();
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
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
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
    firstTrySuccess: false,
    dragCount: 0,
    efficiency: 100,
    usedHelp: false,
    helpActivations: 0,
    patternComplexity: step.difficulty || 'medium',
  });
  const [startTime] = useState<number>(Date.now());
  const [showStars, setShowStars] = useState(false);

  // Animation refs
  const [animatedValues] = useState(
    step.sequence?.map(() => new Animated.Value(0)) || []
  );
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [optionScales] = useState(
    step.options?.map(() => new Animated.Value(1)) || []
  );

  // Image error states for sequence and options
  const [sequenceImageErrors, setSequenceImageErrors] = useState<boolean[]>([]);
  const [optionImageErrors, setOptionImageErrors] = useState<boolean[]>([]);

  // Helper function to check if icon is a URL or emoji
  const isImageUrl = useCallback((icon: string) => {
    return icon && (icon.startsWith('http://') || icon.startsWith('https://'));
  }, []);

  // Initialize image error states when step changes
  useEffect(() => {
    if (step.sequence) {
      setSequenceImageErrors(new Array(step.sequence.length).fill(false));
    }
    if (step.options) {
      setOptionImageErrors(new Array(step.options.length).fill(false));
    }
  }, [step.sequence, step.options]);

  // Handle image error for sequence items
  const handleSequenceImageError = useCallback((sequenceIndex: number) => {
    console.log(`❌ [PatternRecognitionScreen] Error loading sequence image ${sequenceIndex + 1}`);
    setSequenceImageErrors(prev => {
      const newErrors = [...prev];
      newErrors[sequenceIndex] = true;
      return newErrors;
    });
  }, []);

  // Handle image error for option items
  const handleOptionImageError = useCallback((optionIndex: number) => {
    console.log(`❌ [PatternRecognitionScreen] Error loading option image ${optionIndex + 1}`);
    setOptionImageErrors(prev => {
      const newErrors = [...prev];
      newErrors[optionIndex] = true;
      return newErrors;
    });
  }, []);

  // Adaptive reinforcement states
  const [isHelpActive, setIsHelpActive] = useState(false);
  const [blinkingOptionIndex, setBlinkingOptionIndex] = useState<number | null>(null);
  const [helpBlinkAnimation] = useState(new Animated.Value(1));
  const adaptiveService = useRef(AdaptiveReinforcementService.getInstance());
  const audioService = useRef(AudioService.getInstance());
  
  // Mount control for safe state updates
  const isMountedRef = useRef(true);

  // Memoized values
  const totalItems = 1; // Solo una respuesta correcta en reconocimiento de patrones

  // Process step content when language changes
  useEffect(() => {
    console.log(`🌍 [PatternRecognitionScreen] Procesando contenido para idioma: ${language}`);
    processStepForLanguage();
  }, [language]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Process step content for current language
  const processStepForLanguage = useCallback(() => {
    console.log(`🌍 [PatternRecognitionScreen] NUEVO PROCESAMIENTO - Contenido para idioma: ${language}`);
    console.log(`🔧 [PatternRecognitionScreen] BilingualTextProcessor disponible: ${typeof BilingualTextProcessor}`);
    
    // Process step text and description
    const originalText = rawStep.text || '';
    const originalDescription = rawStep.description || '';
    
    console.log(`🧪 [PatternRecognitionScreen] ANTES del procesamiento:`);
    console.log(`   Original text: "${originalText}"`);
    console.log(`   Original description: "${originalDescription}"`);
    console.log(`   Tiene colon en text: ${originalText.includes(':')}`);
    console.log(`   Tiene colon en description: ${originalDescription.includes(':')}`);
    
    const processedText = BilingualTextProcessor.extractText(originalText, language);
    const processedDescription = BilingualTextProcessor.extractText(originalDescription, language);
    
    // Process options
    const newProcessedOptions = rawStep.options?.map((option, index) => {
      const originalLabel = option.label || '';
      
      console.log(`🧪 [PatternRecognitionScreen] ANTES del procesamiento opción ${index + 1}:`);
      console.log(`   Original label: "${originalLabel}"`);
      console.log(`   Icon: "${option.icon}"`);
      console.log(`   Correct: ${option.correct}`);
      console.log(`   Tiene colon en label: ${originalLabel.includes(':')}`);
      
      const processedLabel = BilingualTextProcessor.extractText(originalLabel, language);
      
      console.log(`🎯 [PatternRecognitionScreen] DESPUÉS del procesamiento opción ${index + 1}:`);
      console.log(`   Processed label: "${processedLabel}"`);
      console.log(`   Label cambió: ${originalLabel !== processedLabel ? 'SÍ' : 'NO'}`);
      
      return {
        ...option,
        label: processedLabel,
      };
    }) || [];
    
    console.log(`🎯 [PatternRecognitionScreen] DESPUÉS del procesamiento principal:`);
    console.log(`   Processed text: "${processedText}"`);
    console.log(`   Processed description: "${processedDescription}"`);
    console.log(`   Language usado: ${language}`);
    console.log(`   Text cambió: ${originalText !== processedText ? 'SÍ' : 'NO'}`);
    console.log(`   Description cambió: ${originalDescription !== processedDescription ? 'SÍ' : 'NO'}`);
    
    // Update processed step and options
    const newProcessedStep = {
      ...rawStep,
      text: processedText,
      description: processedDescription,
      options: newProcessedOptions,
    };
    
    setProcessedStep(newProcessedStep);
    setProcessedOptions(newProcessedOptions);
    
    console.log(`✅ [PatternRecognitionScreen] RESULTADO FINAL - Contenido procesado para idioma: ${language}`);
    console.log('🎯 [PatternRecognitionScreen] Opciones procesadas:');
    newProcessedOptions.forEach((option, index) => {
      console.log(`  ${index + 1}. "${option.icon}" - "${option.label}" (correct: ${option.correct})`);
    });
  }, [rawStep, language]);

  // Initialize achievements service
  useEffect(() => {
    const initAchievements = async () => {
      try {
        console.log('🏆 [PatternRecognitionScreen] Inicializando servicio de logros mejorado...');
        await AchievementService.initializeAchievements();
        console.log('✅ [PatternRecognitionScreen] Servicio de logros inicializado');
      } catch (error) {
        console.error('❌ [PatternRecognitionScreen] Error inicializando logros:', error);
      }
    };
    initAchievements();
  }, []);

  // Initialize adaptive reinforcement service
  useEffect(() => {
    // Sincronizar idioma de voz con el idioma actual
    audioService.current.syncWithAppLanguage(language);
    
    adaptiveService.current.initialize(
      (helpOptionIndex: number) => {
        // Handle help trigger - NO ACTIVAR SI EL JUEGO YA TERMINÓ
        if (gameCompleted || score === 1) {
          console.log('🛑 [PatternRecognitionScreen] Juego completado, ignorando ayuda');
          return;
        }
        
        if (helpOptionIndex === -1) {
          // Inactivity help - find correct option
          const correctIndex = processedOptions.findIndex(option => option.correct) ?? -1;
          if (correctIndex !== -1) {
            triggerHelpForOption(correctIndex);
          }
        } else {
          // Error-based help
          triggerHelpForOption(helpOptionIndex);
        }
      },
      (message: string, activityType: string) => {
        // Handle audio help - NO REPRODUCIR SI EL JUEGO YA TERMINÓ
        if (gameCompleted || score === 1) {
          console.log('🛑 [PatternRecognitionScreen] Juego completado, ignorando audio de ayuda');
          return;
        }
        
        let helpMessage: string;
        
        if (processedStep.helpMessage) {
          // Use the already processed helpMessage from the step
          helpMessage = processedStep.helpMessage;
          console.log(`🔊 Using processed lesson help: ${helpMessage}`);
        } else {
          // Process the service message for current language
          helpMessage = BilingualTextProcessor.extractText(message, language);
          console.log(`🔊 Using processed default help for ${activityType}: ${helpMessage}`);
        }
        
        console.log(`🔊 About to play TTS: ${helpMessage}`);
        audioService.current.playTextToSpeech(helpMessage, true); // true indica que es mensaje de ayuda
      },
      step.activityType // Pass the activity type to the service
    );

    return () => {
      console.log(`🔊 PatternRecognitionScreen: Cleaning up services`);
      adaptiveService.current.cleanup();
      audioService.current.cleanup();
    };
  }, [processedStep, processedOptions, step.activityType, gameCompleted, score, language]);

  useEffect(() => {
    // Animación de entrada para la secuencia
    const animations = animatedValues.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 300,
        delay: index * 200,
        useNativeDriver: true,
      })
    );

    Animated.stagger(200, animations).start();

    // Animación de pulso para el elemento faltante
    const pulseAnimationLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimationLoop.start();

    return () => {
      pulseAnimationLoop.stop();
    };
  }, []);

  // Helper function to trigger help for a specific option
  const triggerHelpForOption = useCallback((optionIndex: number) => {
    // NO ACTIVAR AYUDA SI EL JUEGO YA TERMINÓ
    if (gameCompleted || score === 1) {
      console.log('🛑 [PatternRecognitionScreen] Juego completado, no activando ayuda');
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
  }, [helpBlinkAnimation, isHelpActive, gameCompleted, score]);

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
      console.log('💾 [PatternRecognitionScreen] Guardando progreso en backend...');
      
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

      console.log('📊 [PatternRecognitionScreen] ===== DATOS ENVIADOS AL SERVIDOR =====');
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
        console.log('✅ [PatternRecognitionScreen] ¡PROGRESO GUARDADO EXITOSAMENTE EN EL SERVIDOR!');
        console.log('📊 [PatternRecognitionScreen] Todos los datos fueron enviados y procesados correctamente');
      } else {
        console.warn('⚠️ [PatternRecognitionScreen] No se pudo guardar el progreso en backend');
        if (progressError) {
          console.error('❌ [PatternRecognitionScreen] Error específico:', progressError);
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
      console.error('❌ [PatternRecognitionScreen] Error guardando progreso:', error);
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
      console.log('🎮 [PatternRecognitionScreen] Registrando finalización del juego...');

      // 1. Save progress to backend first
      await saveProgressToBackend(finalStats);

      // 2. Use the enhanced achievement service that syncs with server
      const gameData = {
        stars: finalStats.stars,
        isPerfect: finalStats.perfectRun,
        completionTime: finalStats.completionTime,
        errors: finalStats.errors,
        activityType: 'Reconocimiento de patrones',
        showedImprovement: finalStats.errors > 0 && finalStats.stars > 1,
        usedHelp: finalStats.usedHelp || false,
        tookTime: finalStats.completionTime > 60000,
        lessonId: (step as any).lesson_id,
        stepId: (step as any).ID || step.id,
      };

      console.log('🏆 [PatternRecognitionScreen] Verificando logros con datos:', gameData);

      // const newlyUnlocked = await RealAchievementServiceEnhanced.recordGameCompletion(gameData);
      const newlyUnlocked: any[] = []; // Temporalmente deshabilitado
      
      if (newlyUnlocked.length > 0) {
        console.log(`🎉 [PatternRecognitionScreen] ¡${newlyUnlocked.length} LOGROS DESBLOQUEADOS!:`);
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
          if (!isMountedRef.current) return;
          
          setShowCelebration(true);
        }, 1500);
        
      } else {
        console.log('📊 [PatternRecognitionScreen] No se desbloquearon nuevos logros esta vez');
        console.log('💡 [PatternRecognitionScreen] Esto puede ser normal si ya tienes logros desbloqueados');
      }
    } catch (error) {
      console.error('❌ [PatternRecognitionScreen] Error registrando finalización:', error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' 
          ? 'No se pudieron verificar los logros. Tu progreso se ha guardado.'
          : 'Could not verify achievements. Your progress has been saved.',
        [{ text: 'OK' }]
      );
    }
  }, [saveProgressToBackend, step, language]);

  // FUNCIÓN CORREGIDA: handleAnimationFinish
  const handleAnimationFinish = useCallback(() => {
    console.log(`🎬 [PatternRecognitionScreen] Animación terminada: ${animationType}, score: ${score}, gameCompleted: ${gameCompleted}`);
    setShowAnimation(false);
    
    // CONDICIÓN CORREGIDA: Verificar que el score sea 1 (ganó)
    if (animationType === 'success' && score === 1 && !gameCompleted) {
      console.log('🎯 [PatternRecognitionScreen] ¡PATRÓN IDENTIFICADO! Iniciando secuencia de finalización...');
      console.log(`📊 [PatternRecognitionScreen] Verificación: score=${score}, patrón identificado=${score === 1}`);
      
      // IMPORTANTE: Limpiar toda la ayuda activa inmediatamente
      if (isHelpActive) {
        console.log('🛑 [PatternRecognitionScreen] Limpiando ayuda activa...');
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

      console.log('📈 [PatternRecognitionScreen] Estadísticas finales calculadas:', {
        totalAttempts: finalStats.totalAttempts,
        errors: finalStats.errors,
        stars: finalStats.stars,
        completionTime: finalStats.completionTime,
        perfectRun: finalStats.perfectRun,
        firstTrySuccess: finalStats.firstTrySuccess,
        usedHelp: finalStats.usedHelp,
        helpActivations: finalStats.helpActivations,
        patternComplexity: finalStats.patternComplexity,
      });
      
      // Record game completion (includes backend save and achievement check)
      recordGameCompletion(finalStats);
      
      // Small delay before showing winner animation
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        console.log('🏆 [PatternRecognitionScreen] Mostrando animación de ganador...');
        showFeedbackAnimation('winner');
      }, 300);
    } else if (animationType === 'winner') {
      console.log('🎊 [PatternRecognitionScreen] Animación winner terminada, mostrando modal...');
      // Show stars after winner animation
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        console.log('⭐ [PatternRecognitionScreen] Modal debería aparecer ahora');
        setShowStars(true);
        console.log(`🎯 [PatternRecognitionScreen] Estados para modal: score=${score}, gameCompleted=${gameCompleted}, showAnimation=false, showStars=true, showCelebration=${showCelebration}`);
      }, 500);
    }
  }, [animationType, score, gameCompleted, gameStats, startTime, calculateStars, recordGameCompletion, showFeedbackAnimation, isHelpActive, helpBlinkAnimation, showCelebration]);

  const handleAnswerSelect = useCallback((selectedIcon: string, index: number) => {
    if (isAnswered || gameCompleted) return;

    console.log(`🎯 [PatternRecognitionScreen] Respuesta seleccionada: ${selectedIcon} (índice: ${index})`);

    // Record action in adaptive reinforcement service
    const correctOptionIndex = processedOptions.findIndex(option => option.correct) ?? -1;
    const correctOption = processedOptions.find(option => option.correct);
    const correct = selectedIcon === correctOption?.icon;
    
    console.log(`✅ [PatternRecognitionScreen] Respuesta ${correct ? 'CORRECTA' : 'INCORRECTA'}`);
    
    adaptiveService.current.recordAction(correct, correctOptionIndex, step.activityType);

    // Clear any active help INMEDIATAMENTE
    if (isHelpActive) {
      console.log('🛑 [PatternRecognitionScreen] Limpiando ayuda activa por respuesta...');
      setIsHelpActive(false);
      setBlinkingOptionIndex(null);
      helpBlinkAnimation.setValue(1);
    }

    setSelectedAnswer(selectedIcon);
    setIsAnswered(true);

    // Update stats
    const isFirstAttempt = gameStats.totalAttempts === 0;
    setGameStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
      errors: correct ? prev.errors : prev.errors + 1,
      perfectRun: correct ? prev.perfectRun : false,
      firstTrySuccess: correct && isFirstAttempt,
      dragCount: prev.dragCount + 1,
    }));

    // Animate the selected option
    Animated.sequence([
      Animated.timing(optionScales[index], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(optionScales[index], {
        toValue: 1.05,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      if (!isMountedRef.current) return;
      
      if (correct) {
        console.log('🎉 [PatternRecognitionScreen] ¡Respuesta correcta! Estableciendo score = 1');
        setScore(1);
        showFeedbackAnimation('success');
        // Play encouragement audio
        audioService.current.playEncouragementMessage();
      } else {
        console.log('❌ [PatternRecognitionScreen] Respuesta incorrecta, mostrando error');
        showFeedbackAnimation('error');
        // Play error guidance audio
        audioService.current.playErrorGuidanceMessage();
        setTimeout(() => {
          if (!isMountedRef.current) return;
          
          setIsAnswered(false);
          setSelectedAnswer(null);
          // Reset animation
          Animated.timing(optionScales[index], {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }, 1500);
      }
    }, 600);
  }, [isAnswered, gameCompleted, gameStats, optionScales, showFeedbackAnimation, processedOptions, step.activityType, isHelpActive, helpBlinkAnimation]);

  const handleOptionPressIn = useCallback((index: number) => {
    if (isAnswered) return;
    Animated.timing(optionScales[index], {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [isAnswered, optionScales]);

  const handleOptionPressOut = useCallback((index: number) => {
    if (isAnswered) return;
    Animated.spring(optionScales[index], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [isAnswered, optionScales]);

  const resetGame = useCallback(() => {
    console.log('🔄 [PatternRecognitionScreen] Reiniciando juego...');
    setSelectedAnswer(null);
    setIsAnswered(false);
    setGameCompleted(false);
    setShowStars(false);
    setScore(0);
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
      patternComplexity: step.difficulty || 'medium',
    });

    // Reset all animations
    optionScales.forEach(scale => {
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [optionScales, step.difficulty]);

  const getDifficultyColor = () => {
    switch (step.difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  const getPatternTypeLabel = () => {
    switch (step.patternType) {
      case 'visual':
        return language === 'es' ? 'Patrón Visual' : 'Visual Pattern';
      case 'auditory':
        return language === 'es' ? 'Patrón Auditivo' : 'Auditory Pattern';
      case 'conceptual':
        return language === 'es' ? 'Patrón Conceptual' : 'Conceptual Pattern';
      case 'behavioral':
        return language === 'es' ? 'Patrón de Comportamiento' : 'Behavioral Pattern';
      default:
        return language === 'es' ? 'Patrón' : 'Pattern';
    }
  };

  const getOptionStyle = useCallback((index: number, correct: boolean) => {
    if (!isAnswered) return styles.optionButton;
    
    if (selectedAnswer === processedOptions[index]?.icon) {
      return correct ? styles.optionButtonCorrect : styles.optionButtonIncorrect;
    }
    
    return styles.optionButtonDisabled;
  }, [isAnswered, selectedAnswer, processedOptions]);

  const getOptionTextStyle = useCallback((index: number, correct: boolean) => {
    if (!isAnswered) return styles.optionLabel;
    
    if (selectedAnswer === processedOptions[index]?.icon) {
      return correct ? styles.optionLabelCorrect : styles.optionLabelIncorrect;
    }
    
    return styles.optionLabelDisabled;
  }, [isAnswered, selectedAnswer, processedOptions]);

  const getPerformanceMessage = useCallback((stars: number, perfectRun: boolean, firstTry: boolean) => {
    if (language === 'es') {
      if (perfectRun && stars === 3 && firstTry) {
        return "¡Perfecto! Patrón identificado a la primera 🧠🏆";
      } else if (perfectRun && stars === 3) {
        return "¡Excelente! Patrón identificado sin errores 🌟";
      } else if (stars === 3) {
        return "¡Muy bien hecho! 👏";
      } else if (stars === 2) {
        return "¡Buen trabajo! Sigue practicando 💪";
      } else {
        return "¡Completado! Tu reconocimiento mejorará 📈";
      }
    } else {
      if (perfectRun && stars === 3 && firstTry) {
        return "Perfect! Pattern identified on first try 🧠🏆";
      } else if (perfectRun && stars === 3) {
        return "Excellent! Pattern identified without errors 🌟";
      } else if (stars === 3) {
        return "Very well done! 👏";
      } else if (stars === 2) {
        return "Good job! Keep practicing 💪";
      } else {
        return "Completed! Your recognition will improve 📈";
      }
    }
  }, [language]);

  const handleCelebrationClose = useCallback(() => {
    setShowCelebration(false);
    setUnlockedAchievements([]);
  }, []);

  const renderSequenceItem = (item: string, index: number) => {
    const isMissing = index === step.missingPosition;
    
    if (isMissing) {
      return (
        <Animated.View
          key={index}
          style={[
            styles.sequenceItem,
            styles.missingItem,
            {
              transform: [{ scale: pulseAnimation }],
            },
          ]}
        >
          <Text style={styles.missingText}>?</Text>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        key={index}
        style={[
          styles.sequenceItem,
          {
            opacity: animatedValues[index],
            transform: [
              {
                translateY: animatedValues[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        {isImageUrl(item) && !sequenceImageErrors[index] ? (
          <Image
            source={{ uri: item }}
            style={styles.sequenceImage}
            resizeMode="contain"
            onError={() => handleSequenceImageError(index)}
            onLoad={() => console.log(`✅ [PatternRecognitionScreen] Sequence image loaded ${index + 1}: ${item}`)}
          />
        ) : (
          <Text style={styles.sequenceIcon}>
            {isImageUrl(item) && sequenceImageErrors[index] 
              ? '🖼️' // Fallback emoji when image fails to load
              : item // Original emoji or fallback
            }
          </Text>
        )}
      </Animated.View>
    );
  };

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

  // Process achievement queue when it changes
  useEffect(() => {
    processAchievementQueue();
  }, [processAchievementQueue]);

  // Log component mount
  useEffect(() => {
    console.log('🎮 [PatternRecognitionScreen] Componente montado');
    console.log('📝 [PatternRecognitionScreen] Datos del paso:', {
      stepId: (step as any).ID || step.id,
      lessonId: (step as any).lesson_id,
      text: step.text,
      optionsCount: step.options?.length || 0,
      difficulty: step.difficulty,
      patternType: step.patternType,
    });
  }, [step]);

  // Log state changes for debugging
  useEffect(() => {
    console.log(`🎯 [PatternRecognitionScreen] Estado del modal: score=${score}, gameCompleted=${gameCompleted}, showAnimation=${showAnimation}, showStars=${showStars}, showCelebration=${showCelebration}`);
    
    // Log modal visibility condition
    const modalShouldBeVisible = score === 1 && gameCompleted && !showAnimation && showStars && !showCelebration;
    console.log(`🎯 [PatternRecognitionScreen] ¿Modal debería ser visible? ${modalShouldBeVisible ? 'SÍ' : 'NO'}`);
    
    if (score === 1 && gameCompleted && showStars && !showCelebration) {
      console.log(`🎯 [PatternRecognitionScreen] ✅ Condiciones principales cumplidas para mostrar modal`);
      if (showAnimation) {
        console.log(`🎯 [PatternRecognitionScreen] ⚠️ Pero showAnimation=${showAnimation} está bloqueando el modal`);
      } else {
        console.log(`🎯 [PatternRecognitionScreen] ✅ Modal debería estar visible ahora!`);
      }
    }
  }, [score, gameCompleted, showAnimation, showStars, showCelebration]);

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
          // Record user interaction for inactivity tracking - SOLO SI NO HA GANADO
          if (!gameCompleted && score !== 1) {
            adaptiveService.current.recordInactivity();
          }
        }}
        onScrollBeginDrag={() => {
          // Record user interaction for inactivity tracking - SOLO SI NO HA GANADO
          if (!gameCompleted && score !== 1) {
            adaptiveService.current.recordInactivity();
          }
        }}
      >

        {/* 1. CONTEXTO - Pregunta y descripción */}
        <View style={styles.questionContainer}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? 'Pregunta:' : 'Question:'}
          </Text>
          <Text style={styles.questionText}>{processedStep.text}</Text>
          {processedStep.description && (
            <Text style={styles.descriptionText}>{processedStep.description}</Text>
          )}
        </View>

        {/* Secuencia del patrón */}
        <View style={styles.sequenceContainer}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? 'Secuencia del patrón:' : 'Pattern sequence:'}
          </Text>
          <View style={styles.sequenceRow}>
            {step.sequence?.map((item, index) => renderSequenceItem(item, index))}
          </View>
        </View>

        {/* 2. ACCIÓN - Opciones de respuesta */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? 'Encuentra el patrón faltante:' : 'Find the missing pattern:'}
          </Text>
          <View style={styles.optionsGrid}>
            {processedOptions.map((option, index) => {
              const isBlinking = isHelpActive && blinkingOptionIndex === index && !gameCompleted && score !== 1;
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.optionWrapper,
                    { 
                      transform: [{ scale: optionScales[index] || 1 }],
                      opacity: isBlinking ? helpBlinkAnimation : 1
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      getOptionStyle(index, option.correct || false),
                      isBlinking && styles.optionButtonHelp
                    ]}
                    onPress={() => {
                      // Record user interaction for inactivity tracking - SOLO SI NO HA GANADO
                      if (!gameCompleted && score !== 1) {
                        adaptiveService.current.recordInactivity();
                      }
                      handleAnswerSelect(option.icon, index);
                    }}
                    onPressIn={() => handleOptionPressIn(index)}
                    onPressOut={() => handleOptionPressOut(index)}
                    activeOpacity={0.8}
                    disabled={isAnswered}
                  >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.iconContainer,
                      isAnswered && selectedAnswer === option.icon && option.correct && styles.iconContainerCorrect,
                      isAnswered && selectedAnswer === option.icon && !option.correct && styles.iconContainerIncorrect,
                    ]}>
                      {isImageUrl(option.icon) && !optionImageErrors[index] ? (
                        <Image
                          source={{ uri: option.icon }}
                          style={styles.optionImage}
                          resizeMode="contain"
                          onError={() => handleOptionImageError(index)}
                          onLoad={() => console.log(`✅ [PatternRecognitionScreen] Option image loaded ${index + 1}: ${option.icon}`)}
                        />
                      ) : (
                        <Text style={styles.optionIcon}>
                          {isImageUrl(option.icon) && optionImageErrors[index] 
                            ? '🖼️' // Fallback emoji when image fails to load
                            : option.icon // Original emoji or fallback
                          }
                        </Text>
                      )}
                    </View>
                    <Text style={getOptionTextStyle(index, option.correct || false)}>
                      {option.label}
                    </Text>
                  </View>
                  
                  {isAnswered && selectedAnswer === option.icon && (
                    <View style={[
                      styles.resultIndicator,
                      option.correct ? styles.resultIndicatorCorrect : styles.resultIndicatorIncorrect
                    ]}>
                      <Text style={[
                        styles.resultIcon,
                        option.correct ? styles.resultIconCorrect : styles.resultIconIncorrect
                      ]}>
                        {option.correct ? '✓' : '✗'}
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

      {/* Game Complete Modal - CONDICIÓN CORREGIDA */}
      <GameCompletionModal
        visible={score === 1 && gameCompleted && !showAnimation && showStars && !showCelebration}
        stats={gameStats}
        onReset={resetGame}
        onContinue={() => navigation.goBack()}
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.firstTrySuccess)}
        gameType="pattern"
        customStats={[
          { 
            label: language === 'es' ? 'Intentos totales' : 'Total attempts', 
            value: gameStats.totalAttempts 
          },
          { 
            label: language === 'es' ? 'Patrón identificado' : 'Pattern identified', 
            value: score === 1 ? (language === 'es' ? 'Sí' : 'Yes') : (language === 'es' ? 'No' : 'No')
          },
          { 
            label: language === 'es' ? 'Tipo de patrón' : 'Pattern type', 
            value: getPatternTypeLabel() 
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
        bonusMessage={gameStats.firstTrySuccess ? (language === 'es' ? "🔍 ¡Patrón perfecto!" : "🔍 Perfect pattern!") : undefined}
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4285f4',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  descriptionText: {
    fontSize: 13,
    color: '#1e40af',
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 18,
  },
  sequenceContainer: {
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
    borderLeftColor: '#9c27b0',
  },
  sequenceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  sequenceItem: {
    width: 50,
    height: 50,
    backgroundColor: '#ffffff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#e8f0fe',
  },
  missingItem: {
    backgroundColor: '#fff3e0',
    borderWidth: 2,
    borderColor: '#ff9800',
    borderStyle: 'dashed',
  },
  sequenceIcon: {
    fontSize: 20,
  },
  sequenceImage: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 0,
  },
  missingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionWrapper: {
    width: (width - 52) / 2,
    marginBottom: 8,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e8f0fe',
    borderTopWidth: 4,
    borderTopColor: '#4285f4',
    position: 'relative',
  },
  optionButtonCorrect: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOpacity: 0.25,
  },
  optionButtonIncorrect: {
    backgroundColor: '#ffeaea',
    borderColor: '#f44336',
    shadowColor: '#f44336',
    shadowOpacity: 0.25,
  },
  optionButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.6,
  },
  optionButtonHelp: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 3,
    shadowColor: '#ffc107',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(66, 133, 244, 0.06)',
    borderRadius: 12,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
  },
  iconContainerCorrect: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  iconContainerIncorrect: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  optionIcon: {
    fontSize: 36,
  },
  optionImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 0,
  },
  optionLabel: {
    fontSize: 13,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  optionLabelCorrect: {
    fontSize: 12,
    textAlign: 'center',
    color: '#2e7d32',
    fontWeight: '700',
    lineHeight: 16,
  },
  optionLabelIncorrect: {
    fontSize: 12,
    textAlign: 'center',
    color: '#c62828',
    fontWeight: '700',
    lineHeight: 16,
  },
  optionLabelDisabled: {
    fontSize: 12,
    textAlign: 'center',
    color: '#9e9e9e',
    fontWeight: '600',
    lineHeight: 16,
  },
  resultIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  resultIndicatorCorrect: {
    backgroundColor: '#4caf50',
  },
  resultIndicatorIncorrect: {
    backgroundColor: '#f44336',
  },
  resultIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultIconCorrect: {
    color: '#ffffff',
  },
  resultIconIncorrect: {
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 4,
  },
});

export default PatternRecognitionScreen;