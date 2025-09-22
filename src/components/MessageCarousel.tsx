import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

interface MessageCarouselProps {
  score: number;
  totalItems: number;
  language: 'es' | 'en';
}

export const MessageCarousel: React.FC<MessageCarouselProps> = ({
  score,
  totalItems,
  language,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Mensajes según el estado del juego
  const getMessages = () => {
    if (score === 0) {
      return language === 'es' 
        ? [
            '¡Piensa en el orden correcto!',
            '🧠 Organiza paso a paso',
            '⭐ Tú puedes hacerlo',
            '🎯 Enfócate en la secuencia'
          ]
        : [
            'Think about the correct order!',
            '🧠 Organize step by step',
            '⭐ You can do it',
            '🎯 Focus on the sequence'
          ];
    } else if (score === totalItems) {
      return language === 'es'
        ? [
            '¡Increíble! Lo lograste',
            '🎉 ¡Perfecto!',
            '🌟 ¡Excelente trabajo!',
            '🏆 ¡Eres genial!'
          ]
        : [
            'Amazing! You did it',
            '🎉 Perfect!',
            '🌟 Excellent work!',
            '🏆 You are great!'
          ];
    } else {
      return language === 'es'
        ? [
            '¡Excelente! Sigue así',
            '💪 ¡Muy bien!',
            '🌟 Casi terminas',
            '🎯 ¡Sigue adelante!'
          ]
        : [
            'Excellent! Keep going',
            '💪 Very good!',
            '🌟 Almost done',
            '🎯 Keep it up!'
          ];
    }
  };

  const messages = getMessages();

  // Cambiar mensaje cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Cambiar mensaje
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [messages.length, fadeAnim]);

  // Reiniciar al primer mensaje cuando cambia el estado del juego
  useEffect(() => {
    setCurrentMessageIndex(0);
    fadeAnim.setValue(1);
  }, [score, totalItems, fadeAnim]);

  return (
    <View style={styles.carouselContainer}>
      <Animated.View 
        style={[
          styles.messageContainer,
          { opacity: fadeAnim }
        ]}
      >
        <Text style={styles.messageIcon}>⭐</Text>
        <Text style={styles.messageText}>
          {messages[currentMessageIndex]}
        </Text>
        <Text style={styles.messageIcon}>⭐</Text>
      </Animated.View>
      
      {/* Indicadores de progreso del carrusel */}
      <View style={styles.indicators}>
        {messages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentMessageIndex ? styles.indicatorActive : styles.indicatorInactive
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(66, 133, 244, 0.05)',
    borderRadius: 16,
    marginHorizontal: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 6,
    minHeight: 40,
    borderTopWidth: 2,
    borderTopColor: '#4285f4',
  },
  messageIcon: {
    fontSize: 16,
    marginHorizontal: 5,
  },
  messageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.1,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  indicatorActive: {
    backgroundColor: '#4285f4',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorInactive: {
    backgroundColor: '#d1d5db',
  },
});
