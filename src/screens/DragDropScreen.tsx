import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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

  const handleCorrectDrop = (zone: string, option: Option, index: number) => {
    setCorrectlyPlaced(prev => new Set([...prev, index]));
    setZoneItems(prev => ({
      ...prev,
      [zone]: [...(prev[zone] || []), { option, index }],
    }));
    setScore(prev => prev + 1);
    
    Alert.alert('🎉 ¡Excelente!', `${option.label} es correcto para ${zone}`, [
      { text: 'Continuar', style: 'default' }
    ]);
  };

  const handleIncorrectDrop = (zone: string, option: Option) => {
    Alert.alert('❌ Intenta de nuevo', `${option.label} no pertenece a ${zone}`, [
      { text: 'OK', style: 'default' }
    ]);
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

      {/* Game Complete */}
      {isGameComplete && (
        <View style={styles.completionContainer}>
          <Text style={styles.completionText}>🎉 ¡Felicitaciones!</Text>
          <Text style={styles.completionSubtext}>Has completado la actividad</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Jugar de nuevo</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 8,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
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
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  zoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1e293b',
    marginBottom: 12,
  },
  zoneContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyZoneText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  placedItem: {
    alignItems: 'center',
    marginVertical: 4,
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  placedIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  placedLabel: {
    fontSize: 12,
    color: '#1e293b',
    textAlign: 'center',
    fontWeight: '500',
  },
  optionsContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  draggable: {
    width: 90,
    height: 90,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  draggablePlaced: {
    opacity: 0.5,
    backgroundColor: '#f8fafc',
    borderColor: '#10b981',
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#1e293b',
    fontWeight: '500',
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    backgroundColor: '#10b981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  completionContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  completionSubtext: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DragDropScreen;