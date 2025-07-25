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
import { AchievementService, Achievement } from '../services/AchievementService';
import RealAchievementServiceEnhanced from '../services/RealAchievementService_enhanced';
import AdaptiveReinforcementService from '../services/AdaptiveReinforcementService';
import AudioService from '../services/AudioService';
import { useRealProgress } from '../hooks/useRealProgress';

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
  const { step, lessonTitle } = route.params;

  // Real progress hook
  const { completeStep, isLoading: progressLoading, error: progressError } = useRealProgress();

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
  const zones = useMemo(() => Array.from(new Set(step.options?.map(o => o.correctZone) || [])), [step.options]);
  const totalItems = useMemo(() => step.options?.length || 0, [step.options]);

  // Adaptive reinforcement states
  const [isHelpActive, setIsHelpActive] = useState(false);
  const [blinkingItemIndex, setBlinkingItemIndex] = useState<number | null>(null);
  const [blinkingZone, setBlinkingZone] = useState<string | null>(null);
  const [helpBlinkAnimation] = useState(new Animated.Value(1));
  const adaptiveService = useRef(AdaptiveReinforcementService.getInstance());
  const audioService = useRef(AudioService.getInstance());

  // Refs for zone positions
  const zoneRefs = useRef<{ [key: string]: View | null }>({});
  const zoneBounds = useRef<{ [key: string]: ZoneBounds }>({});
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize achievements service
  useEffect(() => {
    const initAchievements = async () => {
      try {
        console.log('🏆 [DragDropScreen] Inicializando servicio de logros mejorado...');
        await RealAchievementServiceEnhanced.initializeAchievements();
        console.log('✅ [DragDropScreen] Servicio de logros inicializado');
      } catch (error) {
        console.error('❌ [DragDropScreen] Error inicializando logros:', error);
      }
    };
    initAchievements();
  }, []);

  // Initialize adaptive reinforcement service
  useEffect(() => {
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
      console.log(`🔊 DragDropScreen: Cleaning up services`);
      adaptiveService.current.cleanup();
      audioService.current.cleanup();
    };
  }, [step]);

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
        console.log(`Zone ${zone} bounds updated:`, { x: pageX, y: pageY, width, height });
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
      console.log('💾 [DragDropScreen] Guardando progreso en backend...');
      
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

      console.log('📊 [DragDropScreen] ===== DATOS ENVIADOS AL SERVIDOR =====');
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
        console.log('✅ [DragDropScreen] ¡PROGRESO GUARDADO EXITOSAMENTE EN EL SERVIDOR!');
        console.log('📊 [DragDropScreen] Todos los datos fueron enviados y procesados correctamente');
      } else {
        console.warn('⚠️ [DragDropScreen] No se pudo guardar el progreso en backend');
        if (progressError) {
          console.error('❌ [DragDropScreen] Error específico:', progressError);
          Alert.alert(
            'Error de Conexión',
            `No se pudo guardar tu progreso: ${progressError}. Tu progreso local se ha guardado.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('❌ [DragDropScreen] Error guardando progreso:', error);
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
      console.log('🎮 [DragDropScreen] Registrando finalización del juego...');

      // 1. Save progress to backend first
      await saveProgressToBackend(finalStats);

      // 2. Use the enhanced achievement service that syncs with server
      const gameData = {
        stars: finalStats.stars,
        isPerfect: finalStats.perfectRun,
        completionTime: finalStats.completionTime,
        errors: finalStats.errors,
        activityType: 'Arrastra y suelta',
        showedImprovement: finalStats.errors > 0 && finalStats.stars > 1,
        usedHelp: finalStats.usedHelp || false,
        tookTime: finalStats.completionTime > 60000,
        lessonId: (step as any).lesson_id,
        stepId: (step as any).ID || step.id,
      };

      console.log('🏆 [DragDropScreen] Verificando logros con datos:', gameData);

      const newlyUnlocked = await RealAchievementServiceEnhanced.recordGameCompletion(gameData);
      
      if (newlyUnlocked.length > 0) {
        console.log(`🎉 [DragDropScreen] ¡${newlyUnlocked.length} LOGROS DESBLOQUEADOS!:`);
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
        console.log('📊 [DragDropScreen] No se desbloquearon nuevos logros esta vez');
        console.log('💡 [DragDropScreen] Esto puede ser normal si ya tienes logros desbloqueados');
      }
    } catch (error) {
      console.error('❌ [DragDropScreen] Error registrando finalización:', error);
      Alert.alert(
        'Error',
        'No se pudieron verificar los logros. Tu progreso se ha guardado.',
        [{ text: 'OK' }]
      );
    }
  }, [saveProgressToBackend, step]);

  const handleAnimationFinish = useCallback(() => {
    setShowAnimation(false);
    
    if (animationType === 'success' && score === totalItems && !gameCompleted) {
      setGameCompleted(true);
      
      const completionTime = Date.now() - startTime;
      const efficiency = Math.round((totalItems / (gameStats.dragCount || 1)) * 100);
      const finalStats = {
        ...gameStats,
        completionTime,
        efficiency,
        stars: calculateStars(gameStats.errors, totalItems, completionTime, gameStats.dragCount),
      };
      setGameStats(finalStats);

      console.log('📈 [DragDropScreen] Estadísticas finales calculadas:', {
        totalAttempts: finalStats.totalAttempts,
        errors: finalStats.errors,
        stars: finalStats.stars,
        completionTime: finalStats.completionTime,
        perfectRun: finalStats.perfectRun,
        dragCount: finalStats.dragCount,
        efficiency: finalStats.efficiency,
        usedHelp: finalStats.usedHelp,
        helpActivations: finalStats.helpActivations,
      });
      
      // Record game completion (includes backend save and achievement check)
      recordGameCompletion(finalStats);
      
      setTimeout(() => {
        showFeedbackAnimation('winner');
      }, 300);
    } else if (animationType === 'winner') {
      setTimeout(() => {
        setShowStars(true);
      }, 500);
    }
  }, [animationType, score, totalItems, gameCompleted, startTime, gameStats, calculateStars, recordGameCompletion, showFeedbackAnimation]);

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
    console.log('Checking collision at:', { gestureX, gestureY });
    console.log('Available zones:', Object.keys(zoneBounds.current));
    
    for (const [zone, bounds] of Object.entries(zoneBounds.current)) {
      console.log(`Checking zone ${zone}:`, bounds);
      
      // Add some tolerance for easier dropping
      const tolerance = 20;
      if (
        gestureX >= bounds.x - tolerance &&
        gestureX <= bounds.x + bounds.width + tolerance &&
        gestureY >= bounds.y - tolerance &&
        gestureY <= bounds.y + bounds.height + tolerance
      ) {
        console.log(`Collision detected with zone: ${zone}`);
        return zone;
      }
    }
    console.log('No collision detected');
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
          useNativeDriver: false,
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
  }, []);

  const handleBackPress = useCallback(() => {
    if (gameStats.totalAttempts > 0 && !gameCompleted) {
      Alert.alert(
        'Salir del juego',
        '¿Estás seguro de que quieres salir? Perderás tu progreso actual.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', style: 'destructive', onPress: () => navigation.goBack() },
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

  // Log component mount
  useEffect(() => {
    console.log('🎮 [DragDropScreen] Componente montado');
    console.log('📝 [DragDropScreen] Datos del paso:', {
      stepId: (step as any).ID || step.id,
      lessonId: (step as any).lesson_id,
      text: step.text,
      optionsCount: step.options?.length || 0,
    });
  }, [step]);

  const isGameComplete = score === totalItems;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header simplificado */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        
        {/* Progress indicator */}
        {progressLoading && (
          <View style={styles.progressIndicator}>
            <Text style={styles.progressText}>Guardando...</Text>
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

        {/* Progreso del juego */}
        <ProgressSection 
          score={score}
          totalItems={totalItems}
          gameStats={gameStats}
        />

        {/* Zonas de Destino - Altura Fija */}
        <View style={styles.zonesContainer}>
          <Text style={styles.sectionTitle}>Zonas de destino:</Text>
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
                    { opacity: isBlinkingZone ? helpBlinkAnimation : 1 }
                  ]}
                  onLayout={() => zone && handleZoneLayout(zone)}
                >
                <Text style={styles.zoneTitle}>{zone}</Text>
                <View style={styles.zoneContent}>
                  {(zoneItems[zone] || []).length === 0 ? (
                    <Text style={styles.emptyZoneText}>Suelta aquí</Text>
                  ) : (
                    <View style={styles.placedItemsContainer}>
                      {(zoneItems[zone] || []).map((placedItem: PlacedItem, i: number) => (
                        <View key={i} style={styles.placedItem}>
                          <Text style={styles.placedIcon}>{placedItem.option.icon}</Text>
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
          <Text style={styles.sectionTitle}>Elementos para arrastrar:</Text>
          <View style={styles.optionsGrid}>
            {step.options?.map((option, idx) => {
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
                      opacity: isBlinkingItem ? helpBlinkAnimation : 1,
                    },
                  ]}
                >
                  <Text style={[styles.optionIcon, isPlaced && styles.placedIconStyle]}>
                    {option.icon}
                  </Text>
                  <Text style={[styles.optionLabel, isPlaced && styles.placedLabelStyle]}>
                    {option.label}
                  </Text>
                  {isPlaced && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
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
              {score === 0 ? '¡Tú puedes hacerlo! Empieza arrastrando' :
               score === totalItems ? '¡Increíble! Lo lograste' :
               '¡Excelente! Sigue así, casi terminas'}
            </Text>
            <Text style={styles.motivationIcon}>⭐</Text>
          </View>
          
          {/* Mensaje adicional de ánimo */}
          <View style={styles.encouragementFooter}>
            <Text style={styles.encouragementFooterText}>
              🌟 Cada intento te hace más inteligente 🧠
            </Text>
          </View>
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
          { label: 'Arrastres totales', value: gameStats.dragCount },
          { label: 'Elementos colocados', value: `${score}/${totalItems}` },
          { label: 'Ayuda usada', value: gameStats.usedHelp ? 'Sí' : 'No' },
          { label: 'Progreso guardado', value: progressLoading ? 'Guardando...' : 'Guardado ✅' },
        ]}
        bonusMessage={gameStats.perfectRun && gameStats.efficiency >= 100 ? '🎯 ¡Arrastre perfecto!' : undefined}
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  zonesContainer: {
    marginBottom: 16,
  },
  zonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  zone: {
    backgroundColor: '#ffffff',
    width: (width - 44) / 2,
    // Altura fija para evitar expansión
    height: 120,
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e8f0fe',
    borderStyle: 'dashed',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
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
  optionsContainer: {
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  draggable: {
    width: 70,
    height: 70,
    backgroundColor: '#ffffff',
    borderRadius: 16,
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
    fontSize: 24,
    marginBottom: 2,
  },
  optionLabel: {
    fontSize: 10,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
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
  // Estilos para footer motivacional
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

export default DragDropScreen;