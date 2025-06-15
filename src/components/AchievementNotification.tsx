import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Achievement } from '../services/AchievementService';

const { width } = Dimensions.get('window');

interface AchievementNotificationProps {
  achievement: Achievement;
  visible: boolean;
  onHide: () => void;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  visible,
  onHide,
}) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
      ]).start();

      // Auto hide after 4 seconds
      const timer = setTimeout(() => {
        hideNotification();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return '#9ca3af';
      case 'rare':
        return '#3b82f6';
      case 'epic':
        return '#8b5cf6';
      case 'legendary':
        return '#f59e0b';
      default:
        return '#9ca3af';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#fbbf24';
      case 'epic':
        return '#a855f7';
      case 'rare':
        return '#60a5fa';
      default:
        return '#4285f4';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.notification,
          { 
            borderColor: getRarityColor(achievement.rarity),
            shadowColor: getRarityGlow(achievement.rarity),
          }
        ]}
        onPress={hideNotification}
        activeOpacity={0.9}
      >
        {/* Glow effect for legendary achievements */}
        {achievement.rarity === 'legendary' && (
          <View style={[styles.glowEffect, { backgroundColor: getRarityGlow(achievement.rarity) }]} />
        )}
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>🏆 ¡Logro Desbloqueado!</Text>
          <TouchableOpacity onPress={hideNotification} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Achievement Content */}
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: getRarityColor(achievement.rarity) + '20' }]}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.achievementTitle}>{achievement.title}</Text>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>
            
            <View style={styles.rewardContainer}>
              <Text style={styles.rewardText}>+{achievement.points} puntos</Text>
              <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(achievement.rarity) }]}>
                <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressIndicator}>
          <View style={[styles.progressFill, { backgroundColor: getRarityColor(achievement.rarity) }]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  notification: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4285f4',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementIcon: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
  },
  progressIndicator: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    borderRadius: 2,
  },
});

export default AchievementNotification;