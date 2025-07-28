import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
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

const { width } = Dimensions.get('window');

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
  title: string;
  description: string;
  icon: string;
  rarity: string;
  points: number;
  category: string;
}

const MatchScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'match'>>();
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
  const optionAnimations = useRef(
    step.options?.map(() => new Animated.Value(0)) || []
  ).current;

  // Adaptive reinforcement states
  const [isHelpActive, setIsHelpActive] = useState(false);
  const [blinkingOptionIndex, setBlinkingOptionIndex] = useState<number | null>(null);
  const [helpBlinkAnimation] = useState(new Animated.Value(1));
  const adaptiveService = useRef(AdaptiveReinforcementService.getInstance());
  const audioService = useRef(AudioService.getInstance());

  // Memoized values
  const totalOptions = useMemo(() => processedOptions.length || 0, [processedOptions]);
  const totalItems = 1; // Solo una respuesta correcta en asociar

  // Process step content when language changes
  useEffect(() => {
    console.log(`🌍 [MatchScreen] Procesando contenido para idioma: ${language}`);
    processStepForLanguage();
  }, [language]);

  // Process step content for current language
  const processStepForLanguage = useCallback(() => {
    console.log(`🌍 [MatchScreen] NUEVO PROCESAMIENTO - Contenido para idioma: ${language}`);
    console.log(`🔧 [MatchScreen] BilingualTextProcessor disponible: ${typeof BilingualTextProcessor}`);
    
    // Process step text
    const originalText = rawStep.text || '';
    const originalHelpMessage = rawStep.helpMessage || '';
    
    console.log(`🧪 [MatchScreen] ANTES del procesamiento:`);
    console.log(`   Original text: "${originalText}"`);
    console.log(`   Original helpMessage: "${originalHelpMessage}"`);
    console.log(`   Tiene colon en text: ${originalText.includes(':')}`);
    console.log(`   Tiene colon en helpMessage: ${originalHelpMessage.includes(':')}`);
    
    const processedText = BilingualTextProcessor.extractText(originalText, language);
    const processedHelpMessage = BilingualTextProcessor.extractText(originalHelpMessage, language);
    
    // Process options
    const newProcessedOptions = rawStep.options?.map((option, index) => {
      const originalLabel = option.label || '';
      
      console.log(`🧪 [MatchScreen] ANTES del procesamiento opción ${index + 1}:`);
      console.log(`   Original label: "${originalLabel}"`);
      console.log(`   Icon: "${option.icon}"`);
      console.log(`   Correct: ${option.correct}`);
      console.log(`   Tiene colon: ${originalLabel.includes(':')}`);
      
      const processedLabel = BilingualTextProcessor.extractText(originalLabel, language);
      
      console.log(`🎯 [MatchScreen] DESPUÉS del procesamiento opción ${index + 1}:`);
      console.log(`   Processed label: "${processedLabel}"`);
      console.log(`   Cambió: ${originalLabel !== processedLabel ? 'SÍ' : 'NO'}`);
      
      return {
        ...option,
        label: processedLabel,
      };
    }) || [];
    
    console.log(`🎯 [MatchScreen] DESPUÉS del procesamiento principal:`);
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
    
    console.log(`✅ [MatchScreen] RESULTADO FINAL - Contenido procesado para idioma: ${language}`);
    console.log('🔗 [MatchScreen] Opciones procesadas:');
    newProcessedOptions.forEach((option, index) => {
      console.log(`  ${index + 1}. "${option.icon}" - "${option.label}" (Correcto: ${option.correct})`);
    });
  }, [rawStep, language]);

  // Initialize achievements service
  useEffect(() => {
    const initAchievements = async () => {
      try {
        console.log('🏆 [MatchScreen] Inicializando servicio de logros mejorado...');
        await AchievementService.initializeAchievements();
        console.log('✅ [MatchScreen] Servicio de logros inicializado');
      } catch (error) {
        console.error('❌ [MatchScreen] Error inicializando logros:', error);
      }
    };
    initAchievements();
  }, []);

  // Initialize adaptive reinforcement service
  useEffect(() => {
    adaptiveService.current.initialize(
      (helpOptionIndex) => {
        // Handle help trigger
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
      console.log(`🔊 MatchScreen: Cleaning up services`);
      adaptiveService.current.cleanup();
      audioService.current.cleanup();
    };
  }, [step, processedOptions]);

  useEffect(() => {
    // Entrance animations
    Animated.stagger(150, 
      optionAnimations.map(anim => 
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  // Helper function to trigger help for a specific option
  const triggerHelpForOption = useCallback((optionIndex: number) => {
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
        if (isHelpActive) {
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
  }, [helpBlinkAnimation, isHelpActive]);

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
      processAchievementQueue();
    }, 1000);
  }, [processAchievementQueue]);

  // Save progress to backend
  const saveProgressToBackend = useCallback(async (finalStats: GameStats) => {
    try {
      console.log('💾 [MatchScreen] Guardando progreso en backend...');
      
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

      console.log('📊 [MatchScreen] ===== DATOS ENVIADOS AL SERVIDOR =====');
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
        console.log('✅ [MatchScreen] ¡PROGRESO GUARDADO EXITOSAMENTE EN EL SERVIDOR!');
        console.log('📊 [MatchScreen] Todos los datos fueron enviados y procesados correctamente');
      } else {
        console.warn('⚠️ [MatchScreen] No se pudo guardar el progreso en backend');
        if (progressError) {
          console.error('❌ [MatchScreen] Error específico:', progressError);
          Alert.alert(
            'Error de Conexión',
            `No se pudo guardar tu progreso: ${progressError}. Tu progreso local se ha guardado.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('❌ [MatchScreen] Error guardando progreso:', error);
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
      console.log('🎮 [MatchScreen] Registrando finalización del juego...');

      // 1. Save progress to backend first
      await saveProgressToBackend(finalStats);

      // 2. Use the enhanced achievement service that syncs with server
      const gameData = {
        stars: finalStats.stars,
        isPerfect: finalStats.perfectRun,
        completionTime: finalStats.completionTime,
        errors: finalStats.errors,
        activityType: 'Asocia elementos',
        showedImprovement: finalStats.errors > 0 && finalStats.stars > 1,
        usedHelp: finalStats.usedHelp || false,
        tookTime: finalStats.completionTime > 60000,
        lessonId: (step as any).lesson_id,
        stepId: (step as any).ID || step.id,
      };

      console.log('🏆 [MatchScreen] Verificando logros con datos:', gameData);

      // const newlyUnlocked = await RealAchievementServiceEnhanced.recordGameCompletion(gameData);
      const newlyUnlocked: any[] = []; // Temporalmente deshabilitado
      
      if (newlyUnlocked.length > 0) {
        console.log(`🎉 [MatchScreen] ¡${newlyUnlocked.length} LOGROS DESBLOQUEADOS!:`);
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
        console.log('📊 [MatchScreen] No se desbloquearon nuevos logros esta vez');
        console.log('💡 [MatchScreen] Esto puede ser normal si ya tienes logros desbloqueados');
      }
    } catch (error) {
      console.error('❌ [MatchScreen] Error registrando finalización:', error);
      Alert.alert(
        'Error',
        'No se pudieron verificar los logros. Tu progreso se ha guardado.',
        [{ text: 'OK' }]
      );
    }
  }, [saveProgressToBackend, step]);

  // FUNCIÓN CORREGIDA: handleAnimationFinish
  const handleAnimationFinish = useCallback(() => {
    console.log(`🎬 [MatchScreen] Animación terminada: ${animationType}, score: ${score}, gameCompleted: ${gameCompleted}`);
    setShowAnimation(false);
    
    if (animationType === 'success' && score === 1 && !gameCompleted) {
      console.log('🎯 [MatchScreen] ¡RESPUESTA CORRECTA! Iniciando secuencia de finalización...');
      console.log(`📊 [MatchScreen] Verificación: score=${score}, respuesta correcta=${score === 1}`);
      
      // IMPORTANTE: Limpiar toda la ayuda activa inmediatamente
      if (isHelpActive) {
        console.log('🛑 [MatchScreen] Limpiando ayuda activa...');
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

      console.log('📈 [MatchScreen] Estadísticas finales calculadas:', {
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
      
      // Small delay before showing winner animation
      setTimeout(() => {
        console.log('🏆 [MatchScreen] Mostrando animación winner...');
        showFeedbackAnimation('winner');
      }, 300);
    } else if (animationType === 'winner') {
      console.log('🎊 [MatchScreen] Animación winner terminada, mostrando modal...');
      // Show stars after winner animation
      setTimeout(() => {
        console.log('⭐ [MatchScreen] Modal debería aparecer ahora');
        setShowStars(true);
        console.log(`🎯 [MatchScreen] Estados para modal: score=${score}, gameCompleted=${gameCompleted}, showAnimation=false, showStars=true, showCelebration=${showCelebration}`);
      }, 500);
    }
  }, [animationType, score, gameCompleted, gameStats, startTime, calculateStars, recordGameCompletion, showFeedbackAnimation, isHelpActive, helpBlinkAnimation, showCelebration]);

  const handleOptionPress = useCallback((correct: boolean, index: number) => {
    if (isAnswered || gameCompleted) return;
    
    console.log(`🔗 [MatchScreen] Usuario seleccionó opción ${index + 1}: "${processedOptions[index]?.label}" (Correcto: ${correct})`);
    
    // Record action in adaptive reinforcement service
    const correctOptionIndex = processedOptions.findIndex(option => option.correct) ?? -1;
    adaptiveService.current.recordAction(correct, correctOptionIndex, step.activityType);

    // Clear any active help
    if (isHelpActive) {
      setIsHelpActive(false);
      setBlinkingOptionIndex(null);
      helpBlinkAnimation.setValue(1);
    }

    setSelectedOption(index);
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

    // Animate selected option
    Animated.spring(optionAnimations[index], {
      toValue: 0.95,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(optionAnimations[index], {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });

    setTimeout(() => {
      if (correct) {
        console.log('✅ [MatchScreen] ¡RESPUESTA CORRECTA!');
        setScore(1);
        showFeedbackAnimation('success');
        // Play encouragement audio
        audioService.current.playEncouragementMessage();
      } else {
        console.log('❌ [MatchScreen] Respuesta incorrecta, permitiendo reintentar');
        showFeedbackAnimation('error');
        // Play error guidance audio
        audioService.current.playErrorGuidanceMessage();
        setTimeout(() => {
          setIsAnswered(false);
          setSelectedOption(null);
        }, 1500);
      }
    }, 500);
  }, [isAnswered, gameCompleted, gameStats, optionAnimations, showFeedbackAnimation, processedOptions, step.activityType, isHelpActive, helpBlinkAnimation]);

  const resetGame = useCallback(() => {
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
  }, []);

  const getPerformanceMessage = useCallback((stars: number, perfectRun: boolean, firstTry: boolean) => {
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

  const getOptionStyle = useCallback((index: number, correct: boolean) => {
    if (!isAnswered) return styles.optionButton;
    
    if (selectedOption === index) {
      return correct ? styles.optionButtonCorrect : styles.optionButtonIncorrect;
    }
    
    return styles.optionButtonDisabled;
  }, [isAnswered, selectedOption]);

  // Process achievement queue when it changes
  useEffect(() => {
    processAchievementQueue();
  }, [processAchievementQueue]);

  // Log component mount
  useEffect(() => {
    console.log('🎮 [MatchScreen] Componente montado');
    console.log('📝 [MatchScreen] Datos del paso:', {
      stepId: (step as any).ID || step.id,
      lessonId: (step as any).lesson_id,
      text: step.text,
      optionsCount: step.options?.length || 0,
    });
  }, [step]);

  // Log state changes for debugging
  useEffect(() => {
    console.log(`🎯 [MatchScreen] Estado del modal: score=${score}, gameCompleted=${gameCompleted}, showAnimation=${showAnimation}, showStars=${showStars}, showCelebration=${showCelebration}`);
    
    // Log modal visibility condition
    const modalShouldBeVisible = gameCompleted && !showAnimation && showStars && !showCelebration;
    console.log(`🎯 [MatchScreen] ¿Modal debería ser visible? ${modalShouldBeVisible ? 'SÍ' : 'NO'}`);
    
    if (gameCompleted && showStars && !showCelebration) {
      console.log(`🎯 [MatchScreen] ✅ Condiciones principales cumplidas para mostrar modal`);
      if (showAnimation) {
        console.log(`🎯 [MatchScreen] ⚠️ Pero showAnimation=${showAnimation} está bloqueando el modal`);
      } else {
        console.log(`🎯 [MatchScreen] ✅ Modal debería estar visible ahora!`);
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

        {/* Status bilingüe */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            🌍 {language === 'es' 
              ? `Actividad bilingüe • Idioma: Español • Asocia elementos`
              : `Bilingual activity • Language: English • Associate elements`
            }
          </Text>
        </View>

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
            {processedOptions.map((option, idx) => {
              const isBlinking = isHelpActive && blinkingOptionIndex === idx;
              return (
                <Animated.View
                  key={idx}
                  style={[
                    styles.optionWrapper,
                    {
                      opacity: isBlinking ? helpBlinkAnimation : optionAnimations[idx],
                      transform: [{
                        translateY: optionAnimations[idx].interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        })
                      }, {
                        scale: optionAnimations[idx]
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      getOptionStyle(idx, option.correct || false),
                      isBlinking && styles.optionButtonHelp
                    ]}
                    onPress={() => {
                      // Record user interaction for inactivity tracking
                      adaptiveService.current.recordInactivity();
                      handleOptionPress(option.correct || false, idx);
                    }}
                    activeOpacity={0.8}
                    disabled={isAnswered}
                  >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.iconContainer,
                      isAnswered && selectedOption === idx && option.correct && styles.iconContainerCorrect,
                      isAnswered && selectedOption === idx && !option.correct && styles.iconContainerIncorrect,
                    ]}>
                      <Text style={styles.icon}>{option.icon}</Text>
                    </View>
                    <Text style={[
                      styles.label,
                      isAnswered && selectedOption === idx && option.correct && styles.labelCorrect,
                      isAnswered && selectedOption === idx && !option.correct && styles.labelIncorrect,
                    ]}>{option.label}</Text>
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
                ? '🧠 Cada respuesta te hace más inteligente ✨'
                : '🧠 Every answer makes you smarter ✨'
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
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.firstTrySuccess)}
        gameType="match"
        customStats={[
          { label: 'Intentos totales', value: gameStats.totalAttempts },
          { label: 'Respuesta correcta', value: score === 1 ? 'Sí' : 'No' },
          { label: 'Ayuda usada', value: gameStats.usedHelp ? 'Sí' : 'No' },
          { label: 'Progreso guardado', value: progressLoading ? 'Guardando...' : 'Guardado ✅' },
        ]}
        bonusMessage={gameStats.firstTrySuccess ? "🎯 ¡Primera vez perfecto!" : undefined}
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
  statusContainer: {
    backgroundColor: '#e8f5e8',
    marginHorizontal: 0,
    marginBottom: 16,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  statusText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '600',
    textAlign: 'center',
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
  icon: {
    fontSize: 28,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    lineHeight: 16,
  },
  labelCorrect: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  labelIncorrect: {
    color: '#c62828',
    fontWeight: '700',
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

export default MatchScreen;