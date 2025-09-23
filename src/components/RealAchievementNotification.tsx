import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import { Achievement } from '../services/ApiService';

interface RealAchievementNotificationProps {
  achievement: Achievement;
  visible: boolean;
  onHide: () => void;
}

const { width } = Dimensions.get('window');

const RealAchievementNotification: React.FC<RealAchievementNotificationProps> = ({
  achievement,
  visible,
  onHide,
}) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);
  const glowAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (glowAnimationRef.current) {
        glowAnimationRef.current.stop();
      }
    };
  }, []);

  const hideNotification = useCallback(() => {
    if (glowAnimationRef.current) {
      glowAnimationRef.current.stop();
    }

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (isMountedRef.current) {
        glowAnim.setValue(0);
        onHide();
      }
    });
  }, [slideAnim, scaleAnim, glowAnim, onHide]);

  useEffect(() => {
    if (visible) {
      // Vibration for achievement unlock
      Vibration.vibrate([0, 200, 100, 200]);

      // Show animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 6,
        }),
      ]).start();

      // Glow animation
      glowAnimationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      glowAnimationRef.current.start();

      // Auto hide after 4 seconds
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          hideNotification();
        }
      }, 4000);

      return () => {
        clearTimeout(timer);
        if (glowAnimationRef.current) {
          glowAnimationRef.current.stop();
        }
      };
    }
  }, [visible, slideAnim, scaleAnim, glowAnim, hideNotification]);

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return '#9ca3af';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#4285f4';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return ['#f3f4f6', '#e5e7eb'];
      case 'rare': return ['#dbeafe', '#bfdbfe'];
      case 'epic': return ['#ede9fe', '#ddd6fe'];
      case 'legendary': return ['#fef3c7', '#fde68a'];
      default: return ['#e8f0fe', '#c8e6c9'];
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'Común';
      case 'rare': return 'Raro';
      case 'epic': return 'Épico';
      case 'legendary': return 'Legendario';
      default: return 'Especial';
    }
  };

  if (!visible) return null;

  const rarityColor = getRarityColor(achievement.rarity);
  const rarityLabel = getRarityLabel(achievement.rarity);

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Glow Effect */}
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowAnim,
              shadowColor: rarityColor,
            },
          ]}
        />

        {/* Main Content */}
        <View style={[styles.content, { borderColor: rarityColor }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.achievementUnlockedText}>🏆 ¡LOGRO DESBLOQUEADO!</Text>
              <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                <Text style={styles.rarityText}>{rarityLabel}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={hideNotification}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Achievement Info */}
          <View style={styles.achievementInfo}>
            <View style={[styles.iconContainer, { backgroundColor: rarityColor + '20' }]}>
              <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.achievementName}>{achievement.name}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
            </View>
            
            <View style={styles.pointsContainer}>
              <View style={[styles.pointsBadge, { backgroundColor: rarityColor }]}>
                <Text style={styles.pointsText}>+{achievement.points}</Text>
              </View>
              <Text style={styles.pointsLabel}>puntos</Text>
            </View>
          </View>

          {/* Category Info */}
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryText}>
              📂 {achievement.category} • 🌐 Sincronizado con servidor
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.viewAllButton]}
              onPress={() => {
                hideNotification();
                // Navigate to achievements screen would go here
              }}
            >
              <Text style={styles.actionButtonText}>Ver Todos los Logros</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.continueButton]}
              onPress={hideNotification}
            >
              <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Celebration Effects */}
        <View style={styles.celebrationContainer}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.celebrationEmoji}>✨</Text>
          <Text style={styles.celebrationEmoji}>🎊</Text>
          <Text style={styles.celebrationEmoji}>⭐</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: width - 40,
    maxWidth: 400,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  achievementUnlockedText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4285f4',
    marginBottom: 6,
    textAlign: 'center',
  },
  rarityBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  achievementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementIcon: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    lineHeight: 18,
  },
  pointsContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  pointsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  pointsLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 2,
  },
  categoryInfo: {
    backgroundColor: '#f8faff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8f0fe',
  },
  categoryText: {
    fontSize: 12,
    color: '#4285f4',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewAllButton: {
    backgroundColor: '#f8faff',
    borderWidth: 2,
    borderColor: '#4285f4',
  },
  continueButton: {
    backgroundColor: '#4285f4',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285f4',
  },
  celebrationContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    pointerEvents: 'none',
  },
  celebrationEmoji: {
    fontSize: 24,
    opacity: 0.8,
  },
});

export default RealAchievementNotification;