// src/components/AchievementNotification.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Achievement } from '../services/ApiService';

const { width, height } = Dimensions.get('window');

interface AchievementNotificationProps {
  achievement: Achievement | null;
  visible: boolean;
  onHide: () => void;
  language?: 'es' | 'en';
  title?: string;
  description?: string;
  encouragementMessage?: string;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  visible,
  onHide,
  language = 'es',
  title,
  description,
  encouragementMessage,
}) => {
  // Animation values
  const slideAnim = useRef(new Animated.Value(-height)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const starAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (visible && achievement) {
      // Mostrar notificación
      showNotification();
      
      // Auto-hide después de 4 segundos
      const timer = setTimeout(() => {
        hideNotification();
      }, 4000);

      return () => clearTimeout(timer);
    } else if (!visible) {
      // Ocultar inmediatamente
      slideAnim.setValue(-height);
      scaleAnim.setValue(0);
    }
  }, [visible, achievement]);

  const showNotification = () => {
    // Reset animations
    slideAnim.setValue(-height);
    scaleAnim.setValue(0);
    bounceAnim.setValue(0);
    glowAnim.setValue(0);
    starAnimations.forEach(anim => anim.setValue(0));

    // Secuencia de animaciones
    Animated.sequence([
      // 1. Slide down
      Animated.spring(slideAnim, {
        toValue: Platform.OS === 'ios' ? 60 : 30,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      // 2. Scale in del contenido
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Bounce effect simultáneo
    setTimeout(() => {
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 200,
        friction: 4,
        useNativeDriver: true,
      }).start();
    }, 200);

    // 4. Glow effect (disabled to avoid animation conflicts)
    // setTimeout(() => {
    //   Animated.loop(
    //     Animated.sequence([
    //       Animated.timing(glowAnim, {
    //         toValue: 1,
    //         duration: 800,
    //         useNativeDriver: false,
    //       }),
    //       Animated.timing(glowAnim, {
    //         toValue: 0,
    //         duration: 800,
    //         useNativeDriver: false,
    //       }),
    //     ])
    //   ).start();
    // }, 500);

    // 5. Estrellas secuenciales
    setTimeout(() => {
      starAnimations.forEach((anim, index) => {
        setTimeout(() => {
          Animated.spring(anim, {
            toValue: 1,
            tension: 200,
            friction: 4,
            useNativeDriver: true,
          }).start();
        }, index * 100);
      });
    }, 800);
  };

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!achievement || !visible) {
    return null;
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'celebracion': return '#4CAF50';
      case 'genial': return '#2196F3';
      case 'increible': return '#9C27B0';
      case 'super_especial': return '#FF9800';
      default: return '#4CAF50';
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'celebracion': return ['#4CAF50', '#66BB6A'];
      case 'genial': return ['#2196F3', '#42A5F5'];
      case 'increible': return ['#9C27B0', '#BA68C8'];
      case 'super_especial': return ['#FF9800', '#FFB74D'];
      default: return ['#4CAF50', '#66BB6A'];
    }
  };

  const primaryColor = getRarityColor(achievement.rarity);
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={hideNotification}
        style={styles.touchable}
      >
        <Animated.View
          style={[
            styles.notification,
            {
              borderColor: primaryColor,
              backgroundColor: '#FFFFFF', // Color fijo para evitar conflictos de animación
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header con ícono y título */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Animated.Text
                style={[
                  styles.achievementIcon,
                  {
                    transform: [
                      {
                        scale: bounceAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 1.3, 1.1],
                        }),
                      },
                      {
                        rotate: bounceAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: ['0deg', '10deg', '0deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {achievement.icon}
              </Animated.Text>
              
              {/* Estrellas decorativas */}
              <View style={styles.starsContainer}>
                {starAnimations.map((anim, index) => (
                  <Animated.Text
                    key={index}
                    style={[
                      styles.decorativeStar,
                      {
                        transform: [
                          { scale: anim },
                          { rotate: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          })},
                        ],
                        opacity: anim,
                      },
                      {
                        top: [10, 15, 5, 20, 12][index],
                        left: [15, 35, 55, 75, 95][index],
                      },
                    ]}
                  >
                    ✨
                  </Animated.Text>
                ))}
              </View>
            </View>

            <View style={styles.headerText}>
              <Text style={styles.achievementTitle}>
                🏆 {language === 'es' ? '¡Logro Desbloqueado!' : 'Achievement Unlocked!'}
              </Text>
              <Text style={[styles.achievementName, { color: primaryColor }]}>
                {title || achievement.name}
              </Text>
            </View>
          </View>

          {/* Descripción */}
          <Text style={styles.achievementDescription}>
            {description || achievement.description}
          </Text>

          {/* Mensaje de felicitación */}
          {encouragementMessage && (
            <View style={[styles.encouragementContainer, { borderLeftColor: primaryColor }]}>
              <Text style={styles.encouragementMessage}>
                {encouragementMessage}
              </Text>
            </View>
          )}

          {/* Footer con puntos y rareza */}
          <View style={styles.footer}>
            <View style={[styles.rarityBadge, { backgroundColor: primaryColor }]}>
              <Text style={styles.rarityText}>
                {achievement.rarity.toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.pointsContainer}>
              <Text style={[styles.pointsText, { color: primaryColor }]}>
                +{achievement.points} {language === 'es' ? 'puntos' : 'points'}
              </Text>
            </View>
          </View>

          {/* Indicador de toque */}
          <Text style={styles.tapHint}>
            {language === 'es' ? 'Toca para cerrar' : 'Tap to close'}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  touchable: {
    width: '100%',
  },
  notification: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
    maxWidth: width - 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 15,
  },
  achievementIcon: {
    fontSize: 48,
    textAlign: 'center',
  },
  starsContainer: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 120,
    height: 80,
  },
  decorativeStar: {
    position: 'absolute',
    fontSize: 12,
  },
  headerText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  encouragementContainer: {
    backgroundColor: '#F8F9FF',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    width: '100%',
  },
  encouragementMessage: {
    fontSize: 13,
    color: '#4A5568',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tapHint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default AchievementNotification;