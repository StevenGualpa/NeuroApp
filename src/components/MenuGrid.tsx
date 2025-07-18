import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface MenuOption {
  key: string;
  label: string;
  icon: string;
  color: string;
  shadowColor: string;
}

interface MenuGridProps {
  menuOptions: MenuOption[];
  onMenuPress: (option: string) => void;
}

export interface MenuGridRef {
  restartAnimations: () => void;
}

const MenuGrid = forwardRef<MenuGridRef, MenuGridProps>(({ menuOptions, onMenuPress }, ref) => {
  const scaleValues = useRef(
    menuOptions.map(() => new Animated.Value(1))
  ).current;

  // Animaciones mejoradas para el menú
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const startAnimations = () => {
    // Reset animations to initial state
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    scaleValues.forEach(scale => scale.setValue(1));

    // Start animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Pequeña animación de rebote para las tarjetas
      menuOptions.forEach((_, index) => {
        setTimeout(() => {
          Animated.sequence([
            Animated.spring(scaleValues[index], {
              toValue: 1.1,
              tension: 150,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.spring(scaleValues[index], {
              toValue: 1,
              tension: 150,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start();
        }, index * 200);
      });
    });
  };

  useEffect(() => {
    startAnimations();
  }, []);

  // Expose restart function to parent component
  useImperativeHandle(ref, () => ({
    restartAnimations: startAnimations,
  }));

  const handlePressIn = (index: number) => {
    Animated.spring(scaleValues[index], {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (index: number) => {
    Animated.spring(scaleValues[index], {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.contentContainer}>
      {/* Sección de bienvenida con animaciones */}
      <Animated.View 
        style={[
          styles.welcomeSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.welcomeTitle}>🌟 Bienvenido a NeuroApp 🌟</Text>
        <Text style={styles.welcomeSubtitle}>¿Qué quieres hacer hoy?</Text>
      </Animated.View>
      
      {/* Grid de menú */}
      <Animated.View 
        style={[
          styles.menuGrid,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {menuOptions.map((option, index) => (
          <Animated.View
            key={option.key}
            style={[
              styles.menuCardContainer,
              { 
                transform: [{ scale: scaleValues[index] }]
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.menuCard,
                { 
                  backgroundColor: option.color,
                  shadowColor: option.shadowColor,
                }
              ]}
              onPress={() => onMenuPress(option.key)}
              onPressIn={() => handlePressIn(index)}
              onPressOut={() => handlePressOut(index)}
              activeOpacity={0.8}
            >
              {/* Efecto de brillo en las tarjetas */}
              <View style={styles.cardShine} />
              
              <Text style={styles.menuIcon}>{option.icon}</Text>
              <Text style={styles.menuTitle}>{option.label}</Text>
              
              {/* Indicador de acción */}
              <View style={styles.actionIndicator}>
                <Text style={styles.actionArrow}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Footer motivacional */}
      <Animated.View 
        style={[
          styles.footerSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.footerText}>🚀 ¡Tu aventura de aprendizaje comienza aquí! 🧠</Text>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '500',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 20,
  },
  menuCardContainer: {
    width: (width - 56) / 2, // 20px padding + 16px gap
  },
  menuCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 140,
    aspectRatio: 1, // Mantiene las tarjetas cuadradas
    position: 'relative',
    overflow: 'hidden',
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  menuIcon: {
    fontSize: 48,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 8,
  },
  actionIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionArrow: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '800',
  },
  footerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default MenuGrid;