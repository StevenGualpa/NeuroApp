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
  const { step, lessonTitle } = route.params;
  const { t, language } = useLanguage();

  // Real progress hook
  const { completeStep, isLoading: progressLoading, error: progressError } = useRealProgress();

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

  // Image error states for each option
  const [imageErrors, setImageErrors] = useState<boolean[]>([]);

  // Memoized values
  const totalOptions = useMemo(() => step.options?.length || 0, [step.options]);
  const totalItems = 1; // Solo una respuesta correcta en selección

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
    console.log(`❌ [SelectOptionScreen] Error loading image for option ${optionIndex + 1}`);
    setImageErrors(prev => {
      const newErrors = [...prev];
      newErrors[optionIndex] = true;
      return newErrors;
    });
  }, []);

  // Process step content when language changes
  useEffect(() => {
    console.log(`🌍 [SelectOptionScreen] Procesando contenido para idioma: ${language}`);
    processStepForLanguage();
  }, [language, processStepForLanguage]);

  // Initialize achievements service
  useEffect(() => {
    const initAchievements = async () => {
      try {
        console.log('🏆 [SelectOptionScreen] Inicializando servicio de logros mejorado...');
        await AchievementService.initializeAchievements();
        console.log('✅ [SelectOptionScreen] Servicio de logros inicializado');
      } catch (error) {
        console.error('❌ [SelectOptionScreen] Error inicializando logros:', error);
      }
    };
    initAchievements();
  }, []);

  // Process step content for current language
  const processStepForLanguage = useCallback(() => {
    console.log(`🌍 [SelectOptionScreen] NUEVO PROCESAMIENTO - Contenido para idioma: ${language}`);
    console.log(`🔧 [SelectOptionScreen] BilingualTextProcessor disponible: ${typeof BilingualTextProcessor}`);
    
    // Process step text
    const originalText = rawStep.text || '';
    const originalHelpMessage = rawStep.helpMessage || '';
    
    console.log(`🧪 [SelectOptionScreen] ANTES del procesamiento:`);
    console.log(`   Original text: "${originalText}"`);
    console.log(`   Original helpMessage: "${originalHelpMessage}"`);
    console.log(`   Tiene colon en text: ${originalText.includes(':')}`);
    console.log(`   Tiene colon en helpMessage: ${originalHelpMessage.includes(':')}`);
    
    const processedText = BilingualTextProcessor.extractText(originalText, language);
    const processedHelpMessage = BilingualTextProcessor.extractText(originalHelpMessage, language);
    
    // Process options
    const processedOptions = rawStep.options?.map((option, index) => {
      const originalLabel = option.label || '';
      
      console.log(`🧪 [SelectOptionScreen] ANTES del procesamiento opción ${index + 1}:`);
      console.log(`   Original label: "${originalLabel}"`);
      console.log(`   Tiene colon: ${originalLabel.includes(':')}`);
      
      const processedLabel = BilingualTextProcessor.extractText(originalLabel, language);
      
      console.log(`🎯 [SelectOptionScreen] DESPUÉS del procesamiento opción ${index + 1}:`);
      console.log(`   Processed label: "${processedLabel}"`);
      console.log(`   Cambió: ${originalLabel !== processedLabel ? 'SÍ' : 'NO'}`);
      
      return {
        ...option,
        label: processedLabel,
      };
    }) || [];
    
    console.log(`🎯 [SelectOptionScreen] DESPUÉS del procesamiento principal:`);
    console.log(`   Processed text: "${processedText}"`);
    console.log(`   Processed helpMessage: "${processedHelpMessage}"`);
    console.log(`   Language usado: ${language}`);
    console.log(`   Text cambió: ${originalText !== processedText ? 'SÍ' : 'NO'}`);
    console.log(`   HelpMessage cambió: ${originalHelpMessage !== processedHelpMessage ? 'SÍ' : 'NO'}`);
    
    // Update processed step
    const newProcessedStep = {
      ...rawStep,
      text: processedText,
      helpMessage: processedHelpMessage,
      options: processedOptions,
    };
    
    setProcessedStep(newProcessedStep);
    
    console.log(`✅ [SelectOptionScreen] RESULTADO FINAL - Contenido procesado para idioma: ${language}`);
    console.log('📋 [SelectOptionScreen] Opciones procesadas:');
    processedOptions.forEach((option, index) => {
      console.log(`  ${index + 1}. "${option.label}" (${option.correct ? 'Correcta' : 'Incorrecta'})`);
    });
  }, [rawStep, language]);

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
      console.log('🛑 [SelectOptionScreen] Juego completado, no activando ayuda');
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
      setIsHelpActive(false);
      setBlinkingOptionIndex(null);
      helpBlinkAnimation.setValue(1);
    }, 5000);
  }, [helpBlinkAnimation, isHelpActive, gameCompleted, score]);

  // Initialize adaptive reinforcement service
  useEffect(() => {
    const correctOptionIndex = step.options?.findIndex(option => option.correct) ?? -1;
    
    // Sincronizar idioma de voz con el idioma actual
    audioService.current.syncWithAppLanguage(language);
    
    adaptiveService.current.initialize(
      (helpOptionIndex) => {
        // NO ACTIVAR SI EL JUEGO YA TERMINÓ
        if (gameCompleted || score === 1) {
          console.log('🛑 [SelectOptionScreen] Juego completado, ignorando ayuda');
          return;
        }
        
        // Handle help trigger
        if (helpOptionIndex === -1) {
          // Inactivity help - find correct option
          const correctIndex = step.options?.findIndex(option => option.correct) ?? -1;
          if (correctIndex !== -1) {
            triggerHelpForOption(correctIndex);
          }
        } else {
          // Error-based help
          triggerHelpForOption(helpOptionIndex);
        }
      },
      (message, activityType) => {
        // NO REPRODUCIR SI EL JUEGO YA TERMINÓ
        if (gameCompleted || score === 1) {
          console.log('🛑 [SelectOptionScreen] Juego completado, ignorando audio de ayuda');
          return;
        }
        
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
      console.log(`🔊 SelectOptionScreen: Cleaning up services`);
      adaptiveService.current.cleanup();
      audioService.current.cleanup();
    };
  }, [step, gameCompleted, score, triggerHelpForOption, language]);

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
      console.log('💾 [SelectOptionScreen] Guardando progreso en backend...');
      
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

      console.log('📊 [SelectOptionScreen] ===== DATOS ENVIADOS AL SERVIDOR =====');
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
        console.log('✅ [SelectOptionScreen] ¡PROGRESO GUARDADO EXITOSAMENTE EN EL SERVIDOR!');
        console.log('📊 [SelectOptionScreen] Todos los datos fueron enviados y procesados correctamente');
      } else {
        console.warn('⚠️ [SelectOptionScreen] No se pudo guardar el progreso en backend');
        if (progressError) {
          console.error('❌ [SelectOptionScreen] Error específico:', progressError);
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
      console.error('❌ [SelectOptionScreen] Error guardando progreso:', error);
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
      console.log('🎮 [SelectOptionScreen] Registrando finalización del juego...');

      // 1. Save progress to backend first
      await saveProgressToBackend(finalStats);

      // 2. Use the enhanced achievement service that syncs with server
      const gameData = {
        stars: finalStats.stars,
        isPerfect: finalStats.perfectRun,
        completionTime: finalStats.completionTime,
        errors: finalStats.errors,
        activityType: 'Selecciona la opción correcta',
        showedImprovement: finalStats.errors > 0 && finalStats.stars > 1,
        usedHelp: finalStats.usedHelp || false,
        tookTime: finalStats.completionTime > 60000,
        lessonId: (step as any).lesson_id,
        stepId: (step as any).ID || step.id,
      };

      console.log('🏆 [SelectOptionScreen] Verificando logros con datos:', gameData);

      // const newlyUnlocked = await RealAchievementServiceEnhanced.recordGameCompletion(gameData);
      const newlyUnlocked: any[] = []; // Temporalmente deshabilitado
      
      if (newlyUnlocked.length > 0) {
        console.log(`🎉 [SelectOptionScreen] ¡${newlyUnlocked.length} LOGROS DESBLOQUEADOS!:`);
        newlyUnlocked.forEach((achievement, index) => {
          console.log(`   ${index + 1}. 🏆 ${achievement.name} - ${achievement.description}`);
        });
        
        // Convert to server achievement format for celebration
        const serverAchievements: ServerAchievement[] = newlyUnlocked.map(achievement => ({
          ID: achievement.ID || 0,
          name: achievement.name,
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
        console.log('📊 [SelectOptionScreen] No se desbloquearon nuevos logros esta vez');
        console.log('💡 [SelectOptionScreen] Esto puede ser normal si ya tienes logros desbloqueados');
      }
    } catch (error) {
      console.error('❌ [SelectOptionScreen] Error registrando finalización:', error);
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
    console.log(`🎬 [SelectOptionScreen] Animación terminada: ${animationType}, score: ${score}, gameCompleted: ${gameCompleted}`);
    setShowAnimation(false);
    
    // CONDICIÓN CORREGIDA: Verificar que el score sea 1 (ganó)
    if (animationType === 'success' && score === 1 && !gameCompleted) {
      console.log('🎯 [SelectOptionScreen] ¡JUEGO COMPLETADO! Iniciando secuencia de finalización...');
      
      // IMPORTANTE: Limpiar toda la ayuda activa inmediatamente
      if (isHelpActive) {
        console.log('🛑 [SelectOptionScreen] Limpiando ayuda activa...');
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

      console.log('📈 [SelectOptionScreen] Estadísticas finales calculadas:', {
        totalAttempts: finalStats.totalAttempts,
        errors: finalStats.errors,
        stars: finalStats.stars,
        completionTime: finalStats.completionTime,
        perfectRun: finalStats.perfectRun,
        firstTrySuccess: finalStats.firstTrySuccess,
        usedHelp: finalStats.usedHelp,
        helpActivations: finalStats.helpActivations,
      });
      
      // Record game completion (includes backend save and achievement check)
      recordGameCompletion(finalStats);
      
      // CAMBIO IMPORTANTE: Mostrar modal directamente después de un delay corto
      setTimeout(() => {
        console.log('🏆 [SelectOptionScreen] Mostrando modal de finalización directamente...');
        setShowStars(true);
        console.log('⭐ [SelectOptionScreen] Modal debería aparecer ahora');
        console.log(`🎯 [SelectOptionScreen] Estados para modal: score=${score}, gameCompleted=true, showAnimation=false, showStars=true, showCelebration=${showCelebration}`);
      }, 800);
    } else if (animationType === 'winner') {
      console.log('🏆 [SelectOptionScreen] Animación de ganador terminada, mostrando modal...');
      // Show modal after winner animation
      setTimeout(() => {
        setShowStars(true);
        console.log('⭐ [SelectOptionScreen] Modal mostrado después de animación winner');
        console.log(`🎯 [SelectOptionScreen] Estados para modal: score=${score}, gameCompleted=${gameCompleted}, showAnimation=${false}, showStars=true, showCelebration=${showCelebration}`);
      }, 300);
    }
  }, [animationType, score, gameCompleted, gameStats, startTime, calculateStars, recordGameCompletion, isHelpActive, helpBlinkAnimation]);

  const handlePress = useCallback((correct: boolean, index: number) => {
    if (isAnswered || gameCompleted) return;

    console.log(`🎯 [SelectOptionScreen] Usuario seleccionó opción ${index + 1}: ${correct ? 'Correcta' : 'Incorrecta'}`);

    // Record action in adaptive reinforcement service
    const correctOptionIndex = step.options?.findIndex(option => option.correct) ?? -1;
    adaptiveService.current.recordAction(correct, correctOptionIndex, step.activityType);

    // Clear any active help INMEDIATAMENTE
    if (isHelpActive) {
      console.log('🛑 [SelectOptionScreen] Limpiando ayuda activa por respuesta...');
      setIsHelpActive(false);
      setBlinkingOptionIndex(null);
      helpBlinkAnimation.setValue(1);
    }

    setSelectedOption(index);
    setIsAnswered(true);

    // Update stats
    const isFirstAttempt = gameStats.totalAttempts === 0;
    const newStats = {
      ...gameStats,
      totalAttempts: gameStats.totalAttempts + 1,
      errors: correct ? gameStats.errors : gameStats.errors + 1,
      perfectRun: correct ? gameStats.perfectRun : false,
      firstTrySuccess: correct && isFirstAttempt,
      dragCount: gameStats.dragCount + 1,
    };
    
    setGameStats(newStats);

    console.log('📊 [SelectOptionScreen] Estadísticas actualizadas:', {
      totalAttempts: newStats.totalAttempts,
      errors: newStats.errors,
      perfectRun: newStats.perfectRun,
      firstTrySuccess: newStats.firstTrySuccess,
    });

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
      if (correct) {
        console.log('✅ [SelectOptionScreen] ¡Respuesta correcta! Estableciendo score = 1');
        setScore(1);
        showFeedbackAnimation('success');
        // Play encouragement audio
        audioService.current.playEncouragementMessage();
      } else {
        console.log('❌ [SelectOptionScreen] Respuesta incorrecta, permitiendo reintento...');
        showFeedbackAnimation('error');
        // Play error guidance audio
        audioService.current.playErrorGuidanceMessage();
        setTimeout(() => {
          setIsAnswered(false);
          setSelectedOption(null);
          // Reset animation
          Animated.timing(optionScales[index], {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }, 1500);
      }
    }, 600);
  }, [isAnswered, gameCompleted, gameStats, optionScales, showFeedbackAnimation, step.options, step.activityType, isHelpActive, helpBlinkAnimation]);

  const handleOptionPressIn = useCallback((index: number) => {
    if (isAnswered) return;
    
    // Record user interaction for inactivity tracking - SOLO SI NO HA GANADO
    if (!gameCompleted && score !== 1) {
      adaptiveService.current.recordInactivity();
    }
    
    Animated.timing(optionScales[index], {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [isAnswered, optionScales, gameCompleted, score]);

  const handleOptionPressOut = useCallback((index: number) => {
    if (isAnswered) return;
    Animated.spring(optionScales[index], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [isAnswered, optionScales]);

  const resetGame = useCallback(() => {
    console.log('🔄 [SelectOptionScreen] Reiniciando juego...');
    setSelectedOption(null);
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
    });

    // Reset all animations
    optionScales.forEach(scale => {
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [optionScales]);

  const getOptionStyle = useCallback((index: number, correct: boolean) => {
    if (!isAnswered) {
      // Add help highlighting if this option is blinking - SOLO SI NO HA GANADO
      if (isHelpActive && blinkingOptionIndex === index && !gameCompleted && score !== 1) {
        return [styles.optionButton, styles.optionButtonHelp];
      }
      return styles.optionButton;
    }
    
    if (selectedOption === index) {
      return correct ? styles.optionButtonCorrect : styles.optionButtonIncorrect;
    }
    
    return styles.optionButtonDisabled;
  }, [isAnswered, selectedOption, isHelpActive, blinkingOptionIndex, gameCompleted, score]);

  const getOptionTextStyle = useCallback((index: number, correct: boolean) => {
    if (!isAnswered) return styles.optionLabel;
    
    if (selectedOption === index) {
      return correct ? styles.optionLabelCorrect : styles.optionLabelIncorrect;
    }
    
    return styles.optionLabelDisabled;
  }, [isAnswered, selectedOption]);

  const getPerformanceMessage = useCallback((stars: number, perfectRun: boolean, firstTry: boolean) => {
    if (language === 'es') {
      if (perfectRun && stars === 3 && firstTry) {
        return "¡Perfecto! Primera vez sin errores 🏆";
      } else if (perfectRun && stars === 3) {
        return "¡Excelente! Sin errores 🌟";
      } else if (stars === 3) {
        return "¡Muy bien hecho! 👏";
      } else if (stars === 2) {
        return "¡Buen trabajo! Sigue así 💪";
      } else {
        return "¡Completado! Puedes mejorar 📈";
      }
    } else {
      if (perfectRun && stars === 3 && firstTry) {
        return "Perfect! First time without errors 🏆";
      } else if (perfectRun && stars === 3) {
        return "Excellent! No errors 🌟";
      } else if (stars === 3) {
        return "Very well done! 👏";
      } else if (stars === 2) {
        return "Good job! Keep it up 💪";
      } else {
        return "Completed! You can improve 📈";
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

  // Process achievement queue when it changes
  useEffect(() => {
    processAchievementQueue();
  }, [processAchievementQueue]);

  // Log component mount
  useEffect(() => {
    console.log('🎮 [SelectOptionScreen] Componente montado');
    console.log('📝 [SelectOptionScreen] Datos del paso:', {
      stepId: (step as any).ID || step.id,
      lessonId: (step as any).lesson_id,
      text: step.text,
      optionsCount: step.options?.length || 0,
    });
  }, [step]);

  // Log state changes for debugging
  useEffect(() => {
    console.log(`🎯 [SelectOptionScreen] Estado del modal: score=${score}, gameCompleted=${gameCompleted}, showAnimation=${showAnimation}, showStars=${showStars}, showCelebration=${showCelebration}`);
    
    // Log modal visibility condition
    const modalShouldBeVisible = score === 1 && gameCompleted && !showAnimation && showStars && !showCelebration;
    console.log(`🎯 [SelectOptionScreen] ¿Modal debería ser visible? ${modalShouldBeVisible ? 'SÍ' : 'NO'}`);
    
    if (score === 1 && gameCompleted && showStars && !showCelebration) {
      console.log(`🎯 [SelectOptionScreen] ✅ Condiciones principales cumplidas para mostrar modal`);
      if (showAnimation) {
        console.log(`🎯 [SelectOptionScreen] ⚠️ Pero showAnimation=${showAnimation} está bloqueando el modal`);
      } else {
        console.log(`🎯 [SelectOptionScreen] ✅ Modal debería estar visible ahora!`);
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

        {/* Opciones de respuesta */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? 'Opciones disponibles:' : 'Available options:'}
          </Text>
          <View style={styles.optionsGrid}>
            {processedStep.options?.map((option, idx) => {
              const isBlinking = isHelpActive && blinkingOptionIndex === idx && !gameCompleted && score !== 1;
              return (
                <Animated.View
                  key={idx}
                  style={[
                    styles.optionWrapper,
                    { 
                      transform: [{ scale: optionScales[idx] || 1 }],
                      opacity: isBlinking ? helpBlinkAnimation : 1
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={getOptionStyle(idx, option.correct || false)}
                    onPress={() => {
                      // Record user interaction for inactivity tracking - SOLO SI NO HA GANADO
                      if (!gameCompleted && score !== 1) {
                        adaptiveService.current.recordInactivity();
                      }
                      handlePress(option.correct || false, idx);
                    }}
                    onPressIn={() => handleOptionPressIn(idx)}
                    onPressOut={() => handleOptionPressOut(idx)}
                    activeOpacity={0.8}
                    disabled={isAnswered}
                  >
                    <View style={styles.optionContent}>
                      <View style={[
                        styles.iconContainer,
                        isAnswered && selectedOption === idx && option.correct && styles.iconContainerCorrect,
                        isAnswered && selectedOption === idx && !option.correct && styles.iconContainerIncorrect,
                      ]}>
                        {isImageUrl(option.icon) && !imageErrors[idx] ? (
                          <Image
                            source={{ uri: option.icon }}
                            style={styles.optionImage}
                            resizeMode="contain"
                            onError={() => handleImageError(idx)}
                            onLoad={() => console.log(`✅ [SelectOptionScreen] Image loaded for option ${idx + 1}: ${option.icon}`)}
                          />
                        ) : (
                          <Text style={styles.optionIcon}>
                            {isImageUrl(option.icon) && imageErrors[idx] 
                              ? '🖼️' // Fallback emoji when image fails to load
                              : option.icon // Original emoji or fallback
                            }
                          </Text>
                        )}
                      </View>
                      <Text style={getOptionTextStyle(idx, option.correct || false)}>
                        {option.label}
                      </Text>
                    </View>
                    
                    {isAnswered && selectedOption === idx && (
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

        {/* Footer motivacional como en otras actividades */}
        <View style={styles.footer}>
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationIcon}>⭐</Text>
            <Text style={styles.footerText}>
              {score === 0 
                ? (language === 'es' ? '¡Piensa bien antes de elegir!' : 'Think carefully before choosing!')
                : (language === 'es' ? '¡Increíble! Lo lograste' : 'Amazing! You did it!')
              }
            </Text>
            <Text style={styles.motivationIcon}>⭐</Text>
          </View>
          
          {/* Mensaje adicional de ánimo */}
          <View style={styles.encouragementFooter}>
            <Text style={styles.encouragementFooterText}>
              {language === 'es' 
                ? '🧠 Cada decisión te hace más sabio ✨'
                : '🧠 Every decision makes you wiser ✨'
              }
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Game Complete Modal - CONDICIÓN ARREGLADA */}
      <GameCompletionModal
        visible={score === 1 && gameCompleted && !showAnimation && showStars && !showCelebration}
        stats={gameStats}
        onReset={resetGame}
        onContinue={() => navigation.goBack()}
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.firstTrySuccess)}
        gameType="selection"
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
        bonusMessage={gameStats.firstTrySuccess ? (language === 'es' ? "🎯 ¡Primera vez perfecto!" : "🎯 Perfect first time!") : undefined}
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionWrapper: {
    width: (width - 44) / 2,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e8f0fe',
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
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainerCorrect: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  iconContainerIncorrect: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  optionIcon: {
    fontSize: 28,
  },
  optionImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  optionLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    lineHeight: 16,
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

export default SelectOptionScreen;