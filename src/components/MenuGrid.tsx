import React, { useRef } from 'react';
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

const MenuGrid: React.FC<MenuGridProps> = ({ menuOptions, onMenuPress }) => {
  const scaleValues = useRef(
    menuOptions.map(() => new Animated.Value(1))
  ).current;

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
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>🌟 Bienvenido a NeuroApp 🌟</Text>
        <Text style={styles.welcomeSubtitle}>¿Qué quieres hacer hoy?</Text>
      </View>
      
      <View style={styles.menuGrid}>
        {menuOptions.map((option, index) => (
          <Animated.View
            key={option.key}
            style={[
              styles.menuCardContainer,
              { transform: [{ scale: scaleValues[index] }] }
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
              <Text style={styles.menuIcon}>{option.icon}</Text>
              <Text style={styles.menuTitle}>{option.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

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
  },
  menuIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default MenuGrid;