// src/screens/ActivityMenuScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

// Configuración de actividades con colores y emojis únicos
const activityConfig = [
  { emoji: '🎯', color: '#FF6B6B', shadowColor: '#FF4757' },
  { emoji: '🔢', color: '#4ECDC4', shadowColor: '#26D0CE' },
  { emoji: '🧩', color: '#45B7D1', shadowColor: '#3742FA' },
  { emoji: '🎨', color: '#FFA726', shadowColor: '#FF9800' },
  { emoji: '🎵', color: '#AB47BC', shadowColor: '#9C27B0' },
  { emoji: '🌟', color: '#66BB6A', shadowColor: '#4CAF50' },
  { emoji: '🚀', color: '#EF5350', shadowColor: '#F44336' },
  { emoji: '🎪', color: '#42A5F5', shadowColor: '#2196F3' },
];

const activityTypes = [
  'Selecciona la opción correcta',
  'Ordena los pasos',
  'Asocia elementos',
  'Memoria visual',
  'Repetir sonidos',
  'Arrastra y suelta',
] as const;

const ActivityMenuScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scaleValues = React.useRef(
    activityTypes.map(() => new Animated.Value(1))
  ).current;

  const goToActivityCategory = (activityType: string) => {
    navigation.navigate('home', { activityType });
  };

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

  const getActivityConfig = (index: number) => {
    return activityConfig[index % activityConfig.length];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌟 ¡Hora de Jugar! 🌟</Text>
        <Text style={styles.subtitle}>Elige tu actividad favorita</Text>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {activityTypes.map((type, index) => {
          const config = getActivityConfig(index);
          return (
            <Animated.View
              key={index}
              style={[
                styles.cardContainer,
                { transform: [{ scale: scaleValues[index] }] }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.card,
                  { 
                    backgroundColor: config.color,
                    shadowColor: config.shadowColor,
                  }
                ]}
                onPress={() => goToActivityCategory(type)}
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                activeOpacity={0.8}
              >
                <View style={styles.emojiContainer}>
                  <Text style={styles.emoji}>{config.emoji}</Text>
                </View>
                <Text style={styles.cardTitle}>{type}</Text>
                <View style={styles.playButton}>
                  <Text style={styles.playButtonText}>¡JUGAR!</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>🎈 ¡Diviértete aprendiendo! 🎈</Text>
      </View>
    </SafeAreaView>
  );
};

export default ActivityMenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#2D3436',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#636E72',
    marginBottom: 10,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  cardContainer: {
    marginBottom: 20,
    width: width - 40,
  },
  card: {
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  emojiContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  emoji: {
    fontSize: 40,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: 24,
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D3436',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#636E72',
    textAlign: 'center',
  },
});