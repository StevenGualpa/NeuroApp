import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FeedbackAnimation from '../components/FeedbackAnimation';

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

const DragDropScreen = () => {
  const route = useRoute<DragDropRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle } = route.params;

  const [correctlyPlaced, setCorrectlyPlaced] = useState<Set<number>>(new Set());
  const [zoneItems, setZoneItems] = useState<{ [key: string]: PlacedItem[] }>({});
  const [score, setScore] = useState(0);
  
  // Animation states
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'success' | 'error' | 'winner' | 'loser'>('success');

  const zones = Array.from(new Set(step.options?.map(o => o.correctZone) || []));
  const totalItems = step.options?.length || 0;

  // Refs for zone positions - using absolute coordinates
  const zoneRefs = useRef<{ [key: string]: View | null }>({});
  const zoneBounds = useRef<{ [key: string]: ZoneBounds }>({});

  // Update zone bounds when layout changes
  const updateZoneBounds = (zone: string) => {
    const zoneRef = zoneRefs.current[zone];
    if (zoneRef) {
      zoneRef.measureInWindow((x, y, width, height) => {
        zoneBounds.current[zone] = { x, y, width, height };
      });
    }
  };

  const handleZoneLayout = (zone: string) => {
    // Small delay to ensure the layout is complete
    setTimeout(() => {
      updateZoneBounds(zone);
    }, 100);
  };

  const showFeedbackAnimation = (type: 'success' | 'error' | 'winner' | 'loser') => {
    setAnimationType(type);
    setShowAnimation(true);
  };

  const handleAnimationFinish = () => {
    setShowAnimation(false);
    
    // Check if game is complete after success animation
    if (animationType === 'success' && score + 1 === totalItems) {
      // Small delay before showing winner animation
      setTimeout(() => {
        showFeedbackAnimation('winner');
      }, 300);
    }
  };

  const handleCorrectDrop = (zone: string, option: Option, index: number) => {
    setCorrectlyPlaced(prev => new Set([...prev, index]));
    setZoneItems(prev => ({
      ...prev,
      [zone]: [...(prev[zone] || []), { option, index }],
    }));
    setScore(prev => prev + 1);
    
    // Show success animation instead of alert
    showFeedbackAnimation('success');
  };

  const handleIncorrectDrop = (zone: string, option: Option) => {
    // Show error animation instead of alert
    showFeedbackAnimation('error');
  };

  const checkCollision = (gestureX: number, gestureY: number): string | null => {
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
  };

  const createPanHandlers = (option: Option, index: number) => {
    const pan = useRef(new Animated.ValueXY()).current;
    
    return {
      pan,
      panResponder: PanResponder.create({
        onStartShouldSetPanResponder: () => !correctlyPlaced.has(index),
        onMoveShouldSetPanResponder: () => !correctlyPlaced.has(index),
        
        onPanResponderGrant: () => {
          // Reset any existing offset
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
          // Flatten the offset
          pan.flattenOffset();
          
          const targetZone = checkCollision(gesture.moveX, gesture.moveY);
          
          if (targetZone) {
            if (option.correctZone === targetZone) {
              // Correct drop - animate to zone center and lock
              handleCorrectDrop(targetZone, option, index);
              
              // Animate back to original position (since item will be shown in zone)
              Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: false,
                tension: 100,
                friction: 8,
              }).start();
            } else {
              // Incorrect drop - return to original position
              handleIncorrectDrop(targetZone, option);
              
              Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: false,
                tension: 150,
                friction: 8,
              }).start();
            }
          } else {
            // No collision - return to original position
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
  };

  const resetGame = () => {
    setCorrectlyPlaced(new Set());
    setZoneItems({});
    setScore(0);
  };

  const isGameComplete = score === totalItems;

  // Update zone bounds when component mounts and when layout changes
  useEffect(() => {
    const timer = setTimeout(() => {
      zones.forEach(zone => {
        updateZoneBounds(zone);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [zones]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{lessonTitle}</Text>
        <Text style={styles.subtitle}>Arrastra cada elemento a su zona correcta</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Progreso: {score}/{totalItems}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(score / totalItems) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Drop Zones */}
      <View style={styles.zonesContainer}>
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

      {/* Draggable Options */}
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsTitle}>Elementos para arrastrar:</Text>
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
                <Text style={[styles.optionIcon, isPlaced && styles.placedIcon]}>
                  {option.icon}
                </Text>
                <Text style={[styles.optionLabel, isPlaced && styles.placedLabel]}>
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

      {/* Game Complete Modal - Only show when winner animation is not showing */}
      {isGameComplete && !showAnimation && (
        <View style={styles.completionContainer}>
          <View style={styles.completionContent}>
            <Text style={styles.completionText}>🎉 ¡Felicitaciones!</Text>
            <Text style={styles.completionSubtext}>Has completado la actividad perfectamente</Text>
            <View style={styles.completionButtons}>
              <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                <Text style={styles.resetButtonText}>🔄 Jugar de nuevo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.continueButton} 
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.continueButtonText}>✨ Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Feedback Animation */}
      {showAnimation && (
        <FeedbackAnimation
          type={animationType}
          onFinish={handleAnimationFinish}
        />
      )}

      {/* Back Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 20,
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285f4',
    marginBottom: 12,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#e8f0fe',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4285f4',
    borderRadius: 4,
  },
  zonesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 20,
    paddingBottom: 10,
  },
  zone: {
    backgroundColor: '#ffffff',
    width: width / 2.3,
    minHeight: 140,
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    borderWidth: 3,
    borderColor: '#e8f0fe',
    borderStyle: 'dashed',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  zoneTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  zoneContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyZoneText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '500',
  },
  placedItem: {
    alignItems: 'center',
    marginVertical: 4,
    padding: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4caf50',
    minWidth: 80,
  },
  placedIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  placedLabel: {
    fontSize: 12,
    color: '#2e7d32',
    textAlign: 'center',
    fontWeight: '600',
  },
  optionsContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 10,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  optionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  draggable: {
    width: 90,
    height: 90,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
    fontSize: 32,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
  },
  placedIcon: {
    opacity: 0.7,
  },
  placedLabel: {
    color: '#6b7280',
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    backgroundColor: '#4caf50',
    borderRadius: 14,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  completionContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  completionText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  completionSubtext: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '500',
  },
  completionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  resetButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#6b7280',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  backButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DragDropScreen;