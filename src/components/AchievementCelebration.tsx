import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface Achievement {
  ID: number;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  points: number;
  category: string;
}

interface AchievementCelebrationProps {
  achievements: Achievement[];
  visible: boolean;
  onClose: () => void;
}

const AchievementCelebration: React.FC<AchievementCelebrationProps> = ({
  achievements,
  visible,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && achievements.length > 0) {
      showCelebration();
    }
  }, [visible, achievements]);

  const showCelebration = () => {
    setCurrentIndex(0);
    
    // Reset animations
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);
    slideAnim.setValue(50);
    confettiAnim.setValue(0);

    // Start celebration animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const nextAchievement = () => {
    if (currentIndex < achievements.length - 1) {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      setCurrentIndex(currentIndex + 1);
    } else {
      closeCelebration();
    }
  };

  const closeCelebration = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9ca3af';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#4285f4';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return ['#fbbf24', '#f59e0b', '#d97706'];
      case 'epic': return ['#a855f7', '#8b5cf6', '#7c3aed'];
      case 'rare': return ['#60a5fa', '#3b82f6', '#2563eb'];
      default: return ['#9ca3af', '#6b7280', '#4b5563'];
    }
  };

  const renderConfetti = () => {
    const confettiPieces = Array.from({ length: 20 }, (_, i) => (
      <Animated.View
        key={i}
        style={[
          styles.confettiPiece,
          {
            left: Math.random() * width,
            backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][Math.floor(Math.random() * 5)],
            transform: [
              {
                translateY: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, height + 50],
                }),
              },
              {
                rotate: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      />
    ));

    return <View style={styles.confettiContainer}>{confettiPieces}</View>;
  };

  if (!visible || achievements.length === 0) return null;

  const currentAchievement = achievements[currentIndex];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeCelebration}
    >
      <View style={styles.overlay}>
        {renderConfetti()}
        
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.celebrationTitle}>🎉 ¡LOGRO DESBLOQUEADO! 🎉</Text>
            <Text style={styles.achievementCounter}>
              {currentIndex + 1} de {achievements.length}
            </Text>
          </View>

          {/* Achievement Card */}
          <View style={[
            styles.achievementCard,
            { 
              borderColor: getRarityColor(currentAchievement.rarity),
              shadowColor: getRarityColor(currentAchievement.rarity),
            }
          ]}>
            {/* Rarity glow effect */}
            {currentAchievement.rarity === 'legendary' && (
              <View style={[
                styles.glowEffect,
                { backgroundColor: getRarityColor(currentAchievement.rarity) }
              ]} />
            )}

            {/* Achievement Icon */}
            <View style={[
              styles.iconContainer,
              { backgroundColor: getRarityColor(currentAchievement.rarity) + '20' }
            ]}>
              <Text style={styles.achievementIcon}>{currentAchievement.icon}</Text>
            </View>

            {/* Achievement Info */}
            <Text style={styles.achievementName}>{currentAchievement.name}</Text>
            <Text style={styles.achievementDescription}>{currentAchievement.description}</Text>

            {/* Rarity and Points */}
            <View style={styles.rewardContainer}>
              <View style={[
                styles.rarityBadge,
                { backgroundColor: getRarityColor(currentAchievement.rarity) }
              ]}>
                <Text style={styles.rarityText}>{currentAchievement.rarity.toUpperCase()}</Text>
              </View>
              
              <View style={styles.pointsContainer}>
                <Text style={styles.pointsText}>+{currentAchievement.points}</Text>
                <Text style={styles.pointsLabel}>puntos</Text>
              </View>
            </View>

            {/* Category */}
            <Text style={styles.categoryText}>Categoría: {currentAchievement.category}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {currentIndex < achievements.length - 1 ? (
              <TouchableOpacity style={styles.nextButton} onPress={nextAchievement}>
                <Text style={styles.nextButtonText}>Siguiente Logro →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.closeButton} onPress={closeCelebration}>
                <Text style={styles.closeButtonText}>¡Genial! 🎉</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.skipButton} onPress={closeCelebration}>
              <Text style={styles.skipButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Dots */}
          {achievements.length > 1 && (
            <View style={styles.progressDots}>
              {achievements.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentIndex && styles.activeDot,
                    { backgroundColor: index <= currentIndex ? getRarityColor(currentAchievement.rarity) : '#e5e7eb' }
                  ]}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  celebrationTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#4285f4',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementCounter: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  achievementCard: {
    width: '100%',
    backgroundColor: '#f8faff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    opacity: 0.1,
    borderRadius: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  achievementIcon: {
    fontSize: 40,
  },
  achievementName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  pointsContainer: {
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fbbf24',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#4285f4',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  progressDots: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 12,
    height: 8,
    borderRadius: 4,
  },
});

export default AchievementCelebration;