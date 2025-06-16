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
import { GameStatsDisplay } from '../components/GameStatsDisplay';
import { GameCompletionModal } from '../components/GameCompletionModal';
import { AchievementService, Achievement } from '../services/AchievementService';

const { width, height } = Dimensions.get('window');

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
}

const DragDropScreen = () => {
  const route = useRoute<DragDropRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle } = route.params;

  // Game state
  const [correctlyPlaced, setCorrectlyPlaced] = useState<Set<number>>(new Set());
  const [zoneItems, setZoneItems] = useState<{ [key: string]: PlacedItem[] }>({});
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Animation states
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'success' | 'error' | 'winner' | 'loser'>('success');

  // Achievement states
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showAchievementNotification, setShowAchievementNotification] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);

  // Gamification states
  const [gameStats, setGameStats] = useState<GameStats>({
    totalAttempts: 0,
    errors: 0,
    stars: 0,
    completionTime: 0,
    perfectRun: true,
    dragCount: 0,
    efficiency: 100,
  });
  const [startTime] = useState<number>(Date.now());
  const [showStars, setShowStars] = useState(false);

  // Memoized values
  const zones = useMemo(() => Array.from(new Set(step.options?.map(o => o.correctZone) || [])), [step.options]);
  const totalItems = useMemo(() => step.options?.length || 0, [step.options]);

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
        console.error('Error initializing achievements:', error);
      }
    };
    initAchievements();
  }, []);

  // Update zone bounds when layout changes
  const updateZoneBounds = useCallback((zone: string) => {
    const zoneRef = zoneRefs.current[zone];
    if (zoneRef && scrollViewRef.current) {
      zoneRef.measureInWindow((x, y, width, height) => {
        zoneBounds.current[zone] = { x, y, width, height };
      });
    }
  }, []);

  const handleZoneLayout = useCallback((zone: string) => {
    setTimeout(() => {
      updateZoneBounds(zone);
    }, 100);
  }, [updateZoneBounds]);

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

  // Record game completion and check for achievements
  const recordGameCompletion = useCallback(async (finalStats: GameStats) => {
    try {
      const gameData = {
        stars: finalStats.stars,
        isPerfect: finalStats.perfectRun,
        completionTime: finalStats.completionTime,
        errors: finalStats.errors,
      };

      const newlyUnlocked = await AchievementService.recordGameCompletion(gameData);
      
      if (newlyUnlocked.length > 0) {
        setAchievementQueue(prev => [...prev, ...newlyUnlocked]);
        
        if (!showAchievementNotification) {
          setTimeout(() => {
            processAchievementQueue();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error recording game completion:', error);
      Alert.alert(
        'Error',
        'No se pudieron guardar los logros. Tu progreso se ha guardado localmente.',
        [{ text: 'OK' }]
      );
    }
  }, [showAchievementNotification, processAchievementQueue]);

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
    setCorrectlyPlaced(prev => new Set([...prev, index]));
    setZoneItems(prev => ({
      ...prev,
      [zone]: [...(prev[zone] || []), { option, index }],
    }));
    const newScore = score + 1;
    setScore(newScore);

    setGameStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
    }));

    showFeedbackAnimation('success');
  }, [score, showFeedbackAnimation]);

  const handleIncorrectDrop = useCallback((zone: string, option: Option) => {
    setGameStats(prev => ({
      ...prev,
      totalAttempts: prev.totalAttempts + 1,
      errors: prev.errors + 1,
      perfectRun: false,
    }));

    showFeedbackAnimation('error');
  }, [showFeedbackAnimation]);

  const checkCollision = useCallback((gestureX: number, gestureY: number): string | null => {
    for (const [zone, bounds] of Object.entries(zoneBounds.current)) {
      if (
        gestureX >= bounds.x &&
        gestureX <= bounds.x + bounds.width &&
        gestureY >= bounds.y &&
        gestureY <= bounds.y + bounds.height
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
          setGameStats(prev => ({
            ...prev,
            dragCount: prev.dragCount + 1,
          }));

          pan.setOffset({
            x: pan.x._value,
            y: pan.y._value,
          });
          pan.setValue({ x: 0, y: 0 });
        },

        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),

        onPanResponderRelease: (_, gesture) => {
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
              handleIncorrectDrop(targetZone, option);
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
      })
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
    });
  }, []);

  const getPerformanceMessage = useCallback((stars: number, perfectRun: boolean, efficiency: number) => {
    if (perfectRun && stars === 3 && efficiency >= 100) {
      return "¡Perfecto! Arrastre eficiente sin errores 🏆";
    } else if (perfectRun && stars === 3) {
      return "¡Excelente! Sin errores 🌟";
    } else if (stars === 3) {
      return "¡Muy bien hecho! 👏";
    } else if (stars === 2) {
      return "¡Buen trabajo! Sigue practicando 💪";
    } else {
      return "¡Completado! Puedes mejorar la precisión 📈";
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

  // Update zone bounds when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      zones.forEach(zone => {
        updateZoneBounds(zone);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [zones, updateZoneBounds]);

  // Process achievement queue when it changes
  useEffect(() => {
    processAchievementQueue();
  }, [processAchievementQueue]);

  const isGameComplete = score === totalItems;

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{lessonTitle}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.activityBadge}>
          <Text style={styles.activityText}>🎯 Arrastrar y Soltar</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{score}/{totalItems}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(score / totalItems) * 100}%` }
              ]} 
            />
          </View>
        </View>

        {/* Compact Stats Display */}
        {gameStats.totalAttempts > 0 && (
          <GameStatsDisplay 
            stats={gameStats}
            showPerfectBadge={true}
            layout="horizontal"
          />
        )}
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionText}>
            Arrastra cada elemento a su zona correcta
          </Text>
        </View>

        {/* Compact Drop Zones */}
        <View style={styles.zonesContainer}>
          <Text style={styles.sectionTitle}>Zonas de destino:</Text>
          <View style={styles.zonesGrid}>
            {zones.map(zone => (
              <View 
                key={zone} 
                ref={(ref) => {
                  zoneRefs.current[zone] = ref;
                }}
                style={styles.zone}
                onLayout={() => handleZoneLayout(zone)}
              >
                <Text style={styles.zoneTitle}>{zone}</Text>
                <View style={styles.zoneContent}>
                  {(zoneItems[zone] || []).map((placedItem, i) => (
                    <View key={i} style={styles.placedItem}>
                      <Text style={styles.placedIcon}>{placedItem.option.icon}</Text>
                      <Text style={styles.placedLabel}>{placedItem.option.label}</Text>
                    </View>
                  ))}
                  {(zoneItems[zone] || []).length === 0 && (
                    <Text style={styles.emptyZoneText}>Suelta aquí</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Compact Draggable Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Elementos para arrastrar:</Text>
          <View style={styles.optionsGrid}>
            {step.options?.map((option, idx) => {
              const { pan, panResponder } = createPanHandlers(option, idx);
              const isPlaced = correctlyPlaced.has(idx);

              return (
                <Animated.View
                  key={idx}
                  {...panResponder.panHandlers}
                  style={[
                    styles.draggable,
                    isPlaced && styles.draggablePlaced,
                    {
                      transform: pan.getTranslateTransform(),
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

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Game Complete Modal */}
      <GameCompletionModal
        visible={isGameComplete && !showAnimation && showStars}
        stats={gameStats}
        onReset={resetGame}
        onContinue={() => navigation.goBack()}
        performanceMessage={getPerformanceMessage(gameStats.stars, gameStats.perfectRun, gameStats.efficiency)}
        gameType="dragdrop"
        showEfficiency={true}
        customStats={[
          { label: 'Arrastres totales', value: gameStats.dragCount },
          { label: 'Elementos colocados', value: `${score}/${totalItems}` }
        ]}
        bonusMessage={gameStats.perfectRun && gameStats.efficiency >= 100 ? "🎯 ¡Arrastre perfecto!" : undefined}
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
    backgroundColor: '#f8faff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4285f4',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285f4',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 60, // Same width as back button for centering
  },
  activityBadge: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 8,
  },
  activityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285f4',
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e8f0fe',
    borderRadius: 3,
    overflow: 'hidden',
    maxWidth: 120,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4285f4',
    borderRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  instructionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  zonesContainer: {
    marginBottom: 20,
  },
  zonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  zone: {
    backgroundColor: '#ffffff',
    width: (width - 44) / 2, // Account for padding and gap
    minHeight: 100,
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
  placedItem: {
    alignItems: 'center',
    marginVertical: 2,
    padding: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4caf50',
    minWidth: 60,
  },
  placedIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  placedLabel: {
    fontSize: 10,
    color: '#2e7d32',
    textAlign: 'center',
    fontWeight: '600',
  },
  optionsContainer: {
    marginBottom: 20,
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
  bottomSpacing: {
    height: 20,
  },
});

export default DragDropScreen;