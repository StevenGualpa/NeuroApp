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
  const { step, lessonTitle } = route.params;
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
    console.log(`❌ [OrderStepsScreen] Error loading image for option ${optionIndex + 1}`);
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

  // Memoized values
  const totalSteps = useMemo(() => shuffledOptions.length, [shuffledOptions]);
  const totalItems = totalSteps; // Para compatibilidad con ProgressSection

  // Process step content when language changes
  useEffect(() => {
    console.log(`🌍 [OrderStepsScreen] Procesando contenido para idioma: ${language}`);
    processStepForLanguage();
  }, [language]);

  // Process step content for current language
  const processStepForLanguage = useCallback(() => {
    console.log(`🌍 [OrderStepsScreen] NUEVO PROCESAMIENTO - Contenido para idioma: ${language}`);
    console.log(`🔧 [OrderStepsScreen] BilingualTextProcessor disponible: ${typeof BilingualTextProcessor}`);
    
    // Process step text
    const originalText = rawStep.text || '';
    const originalHelpMessage = rawStep.helpMessage || '';
    
    console.log(`🧪 [OrderStepsScreen] ANTES del procesamiento:`);
    console.log(`   Original text: "${originalText}"`);
    console.log(`   Original helpMessage: "${originalHelpMessage}"`);
    console.log(`   Tiene colon en text: ${originalText.includes(':')}`);
    console.log(`   Tiene colon en helpMessage: ${originalHelpMessage.includes(':')}`);
    
    const processedText = BilingualTextProcessor.extractText(originalText, language);
    const processedHelpMessage = BilingualTextProcessor.extractText(originalHelpMessage, language);
    
    // Process options
    const newProcessedOptions = rawStep.options?.map((option, index) => {
      const originalLabel = option.label || '';
      
      console.log(`🧪 [OrderStepsScreen] ANTES del procesamiento paso ${index + 1}:`);
      console.log(`   Original label: "${originalLabel}"`);
      console.log(`   Tiene colon: ${originalLabel.includes(':')}`);
      
      const processedLabel = BilingualTextProcessor.extractText(originalLabel, language);
      
      console.log(`🎯 [OrderStepsScreen] DESPUÉS del procesamiento paso ${index + 1}:`);
      console.log(`   Processed label: "${processedLabel}"`);
      console.log(`   Cambi��: ${originalLabel !== processedLabel ? 'SÍ' : 'NO'}`);
      
      return {
        ...option,
        label: processedLabel,
      };
    }) || [];
    
    console.log(`🎯 [OrderStepsScreen] DESPUÉS del procesamiento principal:`);
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
    
    console.log(`✅ [OrderStepsScreen] RESULTADO FINAL - Contenido procesado para idioma: ${language}`);
    console.log('📋 [OrderStepsScreen] Pasos procesados:');
    newProcessedOptions.forEach((option, index) => {
      console.log(`  ${index + 1}. "${option.label}" (Orden: ${option.order})`);
    });
  }, [rawStep, language]);

  // Initialize achievements service
  useEffect(() => {
    const initAchievements = async () => {
      try {
        console.log('🏆 [OrderStepsScreen] Inicializando servicio de logros mejorado...');
        await AchievementService.initializeAchievements();
        console.log('✅ [OrderStepsScreen] Servicio de logros inicializado');
      } catch (error) {
        console.error('❌ [OrderStepsScreen] Error inicializando logros:', error);
      }
    };
    initAchievements();
  }, []);

  // Initialize adaptive reinforcement service
  useEffect(() => {
    adaptiveService.current.initialize(
      (helpStepIndex) => {
        // Handle help trigger
        if (helpStepIndex === -1) {
          // Inactivity help - find next correct step
          const nextStepOrder = selectedOrder.length + 1;
          const nextCorrectStep = shuffledOptions.findIndex(option => option.order === nextStepOrder);
          if (nextCorrectStep !== -1) {
            triggerHelpForStep(nextCorrectStep);
          }
        } else {
          // Error-based help
          triggerHelpForStep(helpStepIndex);
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
        audioService.current.playTextToSpeech(helpMessage);
      },
      step.activityType // Pass the activity type to the service
    );

    return () => {
      console.log(`🔊 OrderStepsScreen: Cleaning up services`);
      adaptiveService.current.cleanup();
      audioService.current.cleanup();
    };
  }, [step, selectedOrder, shuffledOptions]);

  useEffect(() => {
    const initStatus: any = {};
    shuffledOptions.forEach(opt => initStatus[opt.label] = 'idle');
    setStatus(initStatus);
  }, []);

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
      setIsHelpActive(false);
      setBlinkingStepIndex(null);
      helpBlinkAnimation.setValue(1);
    }, 5000);
  }, [helpBlinkAnimation, isHelpActive]);

  // Calculate stars based on performance
  const calculateStars = useCallback((errors: number, resets: number, completionTime: number, totalSteps: number): number => {
    const maxTime = totalSteps * 10000; // 10 seconds per step as baseline
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
      processAchievementQueue();
    }, 1000);
  }, [processAchievementQueue]);

  // Save progress to backend
  const saveProgressToBackend = useCallback(async (finalStats: GameStats) => {
    try {
      console.log('💾 [OrderStepsScreen] Guardando progreso en backend...');
      
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

      console.log('📊 [OrderStepsScreen] ===== DATOS ENVIADOS AL SERVIDOR =====');
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
        console.log('✅ [OrderStepsScreen] ¡PROGRESO GUARDADO EXITOSAMENTE EN EL SERVIDOR!');
        console.log('📊 [OrderStepsScreen] Todos los datos fueron enviados y procesados correctamente');
      } else {
        console.warn('⚠️ [OrderStepsScreen] No se pudo guardar el progreso en backend');
        if (progressError) {
          console.error('❌ [OrderStepsScreen] Error específico:', progressError);
          Alert.alert(
            'Error de Conexión',
            `No se pudo guardar tu progreso: ${progressError}. Tu progreso local se ha guardado.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('❌ [OrderStepsScreen] Error guardando progreso:', error);
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
      console.log('🎮 [OrderStepsScreen] Registrando finalización del juego...');

      // 1. Save progress to backend first
      await saveProgressToBackend(finalStats);

      // 2. Use the enhanced achievement service that syncs with server
      const gameData = {
        stars: finalStats.stars,
        isPerfect: finalStats.perfectRun,
        completionTime: finalStats.completionTime,
        errors: finalStats.errors,
        activityType: 'Ordena los pasos',
        showedImprovement: finalStats.errors > 0 && finalStats.stars > 1,
        usedHelp: finalStats.usedHelp || false,
        tookTime: finalStats.completionTime > 60000,
        lessonId: (step as any).lesson_id,
        stepId: (step as any).ID || step.id,
      };

      console.log('🏆 [OrderStepsScreen] Verificando logros con datos:', gameData);

      // const newlyUnlocked = await RealAchievementServiceEnhanced.recordGameCompletion(gameData);
      const newlyUnlocked: any[] = []; // Temporalmente deshabilitado
      
      if (newlyUnlocked.length > 0) {
        console.log(`🎉 [OrderStepsScreen] ¡${newlyUnlocked.length} LOGROS DESBLOQUEADOS!:`);
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
        console.log('📊 [OrderStepsScreen] No se desbloquearon nuevos logros esta vez');
        console.log('💡 [OrderStepsScreen] Esto puede ser normal si ya tienes logros desbloqueados');
      }
    } catch (error) {
      console.error('❌ [OrderStepsScreen] Error registrando finalización:', error);
      Alert.alert(
        'Error',
        'No se pudieron verificar los logros. Tu progreso se ha guardado.',
        [{ text: 'OK' }]
      );
    }
  }, [saveProgressToBackend, step]);

  // FUNCIÓN CORREGIDA: handleAnimationFinish
  const handleAnimationFinish = useCallback(() => {
    console.log(`🎬 [OrderStepsScreen] Animación terminada: ${animationType}, score: ${score}, totalSteps: ${totalSteps}, gameCompleted: ${gameCompleted}`);
    setShowAnimation(false);
    
    // CONDICIÓN CORREGIDA: Solo completar el juego si se ordenaron TODOS los pasos
    if (animationType === 'winner' && score === totalSteps && !gameCompleted) {
      console.log('🎯 [OrderStepsScreen] ¡TODOS LOS PASOS COMPLETADOS! Iniciando secuencia de finalización...');
      console.log(`📊 [OrderStepsScreen] Verificación: score=${score}, totalSteps=${totalSteps}, todos completados=${score === totalSteps}`);
      
      // IMPORTANTE: Limpiar toda la ayuda activa inmediatamente
      if (isHelpActive) {
        console.log('🛑 [OrderStepsScreen] Limpiando ayuda activa...');
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

      console.log('📈 [OrderStepsScreen] Estadísticas finales calculadas:', {
        totalAttempts: finalStats.totalAttempts,
        errors: finalStats.errors,
        stars: finalStats.stars,
        completionTime: finalStats.completionTime,
        perfectRun: finalStats.perfectRun,
        resets: finalStats.resets,
        usedHelp: finalStats.usedHelp,
        helpActivations: finalStats.helpActivations,
      });
      
      // Record game completion (includes backend save and achievement check)
      recordGameCompletion(finalStats);
      
      // CAMBIO IMPORTANTE: Mostrar modal directamente después de un delay corto
      setTimeout(() => {
        console.log('🏆 [OrderStepsScreen] Mostrando modal de finalización directamente...');
        setShowStars(true);
        console.log('⭐ [OrderStepsScreen] Modal debería aparecer ahora');
        console.log(`🎯 [OrderStepsScreen] Estados para modal: score=${score}, gameCompleted=true, showAnimation=false, showStars=true, showCelebration=${showCelebration}`);
      }, 800);
    } else if (animationType === 'winner' && score !== totalSteps) {
      console.log(`⚠️ [OrderStepsScreen] Animación winner pero no todos los pasos completados: score=${score}, totalSteps=${totalSteps}`);
    }
  }, [animationType, score, totalSteps, gameCompleted, gameStats, startTime, calculateStars, recordGameCompletion, isHelpActive, helpBlinkAnimation, showCelebration]);

  const handleSelect = useCallback((option: any) => {
    if (disabled || selectedOrder.some(item => item.label === option.label)) return;

    console.log(`🎯 [OrderStepsScreen] Usuario seleccionó: "${option.label}" con orden ${option.order}`);
    console.log(`📊 [OrderStepsScreen] Estado actual: ${selectedOrder.length} pasos seleccionados`);

    const newOrder = [...selectedOrder, option];
    setSelectedOrder(newOrder);
    setScore(newOrder.length);

    // Find what step should be next based on order
    const expectedStep = newOrder.length;
    const isCorrect = option.order === expectedStep;

    console.log(`🔍 [OrderStepsScreen] Verificación de orden:`);
    console.log(`   Paso esperado: ${expectedStep}`);
    console.log(`   Orden del paso seleccionado: ${option.order}`);
    console.log(`   ¿Es correcto?: ${isCorrect ? 'SÍ' : 'NO'}`);
    console.log(`   Total de pasos: ${shuffledOptions.length}`);
    console.log(`   Pasos completados: ${newOrder.length}`);

    // Record action in adaptive reinforcement service
    const nextStepOrder = newOrder.length + 1;
    const nextCorrectStepIndex = shuffledOptions.findIndex(opt => opt.order === nextStepOrder);
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
      console.log('❌ [OrderStepsScreen] PASO INCORRECTO - Mostrando error y reiniciando');
      
      // Update error stats
      setGameStats(prev => ({
        ...prev,
        errors: prev.errors + 1,
        perfectRun: false,
      }));

      setDisabled(true);
      setTimeout(() => {
        showFeedbackAnimation('error');
        // Play error guidance audio
        audioService.current.playErrorGuidanceMessage();
        setTimeout(() => {
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
      console.log('🎉 [OrderStepsScreen] ¡TODOS LOS PASOS ORDENADOS CORRECTAMENTE!');
      console.log(`📊 [OrderStepsScreen] Secuencia completa: ${newOrder.length}/${shuffledOptions.length} pasos`);
      console.log('🏆 [OrderStepsScreen] Mostrando animación WINNER');
      
      setTimeout(() => {
        showFeedbackAnimation('winner');
      }, 500);
    } else {
      // PASO CORRECTO PERO AÚN FALTAN MÁS
      console.log(`✅ [OrderStepsScreen] Paso correcto, pero faltan más. Progreso: ${newOrder.length}/${shuffledOptions.length}`);
      console.log('👍 [OrderStepsScreen] Mostrando animación SUCCESS');
      
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

    return (
      <Animated.View 
        style={[
          styles.optionWrapper,
          { opacity: isBlinking ? helpBlinkAnimation : 1 }
        ]}
      >
        <TouchableOpacity
          disabled={disabled || itemStatus !== 'idle'}
          style={[
            styles.optionCard,
            itemStatus === 'correct' && styles.optionCardCorrect,
            itemStatus === 'wrong' && styles.optionCardWrong,
            itemStatus === 'idle' && styles.optionCardIdle,
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
                  onLoad={() => console.log(`✅ [OrderStepsScreen] Image loaded for step ${index + 1}: ${item.icon}`)}
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
  }, [status, selectedOrder, disabled, handleSelect, isHelpActive, blinkingStepIndex, helpBlinkAnimation]);

  // Process achievement queue when it changes
  useEffect(() => {
    processAchievementQueue();
  }, [processAchievementQueue]);

  // Log component mount
  useEffect(() => {
    console.log('🎮 [OrderStepsScreen] Componente montado');
    console.log('📝 [OrderStepsScreen] Datos del paso:', {
      stepId: (step as any).ID || step.id,
      lessonId: (step as any).lesson_id,
      text: step.text,
      optionsCount: step.options?.length || 0,
    });
  }, [step]);

  // Log state changes for debugging
  useEffect(() => {
    console.log(`🎯 [OrderStepsScreen] Estado del modal: score=${score}, gameCompleted=${gameCompleted}, showAnimation=${showAnimation}, showStars=${showStars}, showCelebration=${showCelebration}`);
    
    // Log modal visibility condition
    const modalShouldBeVisible = gameCompleted && !showAnimation && showStars && !showCelebration;
    console.log(`🎯 [OrderStepsScreen] ¿Modal debería ser visible? ${modalShouldBeVisible ? 'SÍ' : 'NO'}`);
    
    if (gameCompleted && showStars && !showCelebration) {
      console.log(`🎯 [OrderStepsScreen] ✅ Condiciones principales cumplidas para mostrar modal`);
      if (showAnimation) {
        console.log(`🎯 [OrderStepsScreen] ⚠️ Pero showAnimation=${showAnimation} está bloqueando el modal`);
      } else {
        console.log(`🎯 [OrderStepsScreen] ✅ Modal debería estar visible ahora!`);
      }
    }
  }, [score, gameCompleted, showAnimation, showStars, showCelebration]);

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

        {/* Pregunta */}
        <View style={styles.questionContainer}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? 'Pregunta:' : 'Question:'}
          </Text>
          <Text style={styles.questionText}>{processedStep.text}</Text>
        </View>

        {/* Opciones para ordenar */}
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

        {/* Footer motivacional como en otras actividades */}
        <View style={styles.footer}>
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationIcon}>⭐</Text>
            <Text style={styles.footerText}>
              {score === 0 
                ? (language === 'es' ? '¡Piensa en el orden correcto!' : 'Think about the correct order!')
                : score === totalItems 
                  ? (language === 'es' ? '¡Increíble! Lo lograste' : 'Amazing! You did it!')
                  : (language === 'es' ? '¡Excelente! Sigue así, casi terminas' : 'Excellent! Keep going, almost done!')
              }
            </Text>
            <Text style={styles.motivationIcon}>⭐</Text>
          </View>
          
          {/* Mensaje adicional de ánimo */}
          <View style={styles.encouragementFooter}>
            <Text style={styles.encouragementFooterText}>
              {language === 'es' 
                ? '🧠 Cada paso te hace más organizado ✨'
                : '🧠 Every step makes you more organized ✨'
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
  questionContainer: {
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
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 16,
  },
  grid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionWrapper: {
    width: (width - 44) / 2,
    marginHorizontal: 2,
    marginVertical: 8,
  },
  optionCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    position: 'relative',
  },
  optionCardIdle: {
    backgroundColor: '#ffffff',
    borderColor: '#e8f0fe',
    shadowColor: '#4285f4',
  },
  optionCardCorrect: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOpacity: 0.25,
  },
  optionCardWrong: {
    backgroundColor: '#ffeaea',
    borderColor: '#f44336',
    shadowColor: '#f44336',
    shadowOpacity: 0.25,
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
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionIconCorrect: {
    opacity: 0.9,
  },
  optionIconWrong: {
    opacity: 0.7,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 16,
  },
  optionLabelCorrect: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  optionLabelWrong: {
    color: '#c62828',
    fontWeight: '700',
  },
  stepNumber: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    backgroundColor: '#4caf50',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  wrongIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    backgroundColor: '#f44336',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  wrongIndicatorText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resetContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#6b7280',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  resetText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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

export default OrderStepsScreen;