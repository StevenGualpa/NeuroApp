import React, { useState, useEffect } from 'react';
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
import { AchievementService } from '../services/AchievementService';

const { width } = Dimensions.get('window');

// Configuración de actividades con colores y emojis únicos
const activityConfig = [
  { emoji: '🎯', color: '#FF6B6B', shadowColor: '#FF4757', gradient: ['#FF6B6B', '#FF5252'] },
  { emoji: '🔢', color: '#4ECDC4', shadowColor: '#26D0CE', gradient: ['#4ECDC4', '#26A69A'] },
  { emoji: '🧩', color: '#45B7D1', shadowColor: '#3742FA', gradient: ['#45B7D1', '#2196F3'] },
  { emoji: '🎨', color: '#FFA726', shadowColor: '#FF9800', gradient: ['#FFA726', '#FF9800'] },
  { emoji: '🎵', color: '#AB47BC', shadowColor: '#9C27B0', gradient: ['#AB47BC', '#9C27B0'] },
  { emoji: '🌟', color: '#66BB6A', shadowColor: '#4CAF50', gradient: ['#66BB6A', '#4CAF50'] },
];

const activityTypes = [
  {
    id: 'select-option',
    title: 'Selecciona la opción correcta',
    shortTitle: 'Selección',
    description: 'Elige la respuesta correcta',
    difficulty: 'Fácil',
    estimatedTime: '2-3 min'
  },
  {
    id: 'order-steps',
    title: 'Ordena los pasos',
    shortTitle: 'Ordenar',
    description: 'Organiza en el orden correcto',
    difficulty: 'Medio',
    estimatedTime: '3-4 min'
  },
  {
    id: 'match-elements',
    title: 'Asocia elementos',
    shortTitle: 'Asociar',
    description: 'Conecta elementos relacionados',
    difficulty: 'Medio',
    estimatedTime: '2-4 min'
  },
  {
    id: 'visual-memory',
    title: 'Memoria visual',
    shortTitle: 'Memoria',
    description: 'Recuerda patrones visuales',
    difficulty: 'Difícil',
    estimatedTime: '3-5 min'
  },
  {
    id: 'repeat-sounds',
    title: 'Repetir sonidos',
    shortTitle: 'Sonidos',
    description: 'Reproduce secuencias auditivas',
    difficulty: 'Medio',
    estimatedTime: '2-3 min'
  },
  {
    id: 'drag-drop',
    title: 'Arrastra y suelta',
    shortTitle: 'Arrastrar',
    description: 'Mueve elementos al lugar correcto',
    difficulty: 'Fácil',
    estimatedTime: '2-4 min'
  },
] as const;

const ActivityMenuScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [totalPoints, setTotalPoints] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState(0);
  
  const scaleValues = React.useRef(
    activityTypes.map(() => new Animated.Value(1))
  ).current;

  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Load achievement stats
  useEffect(() => {
    loadAchievementStats();
    
    // Animate cards on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Reload stats when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAchievementStats();
    });

    return unsubscribe;
  }, [navigation]);

  const loadAchievementStats = async () => {
    try {
      await AchievementService.initializeAchievements();
      const points = await AchievementService.getTotalPoints();
      const achievements = await AchievementService.getAllAchievements();
      const unlocked = achievements.filter(a => a.isUnlocked).length;
      
      setTotalPoints(points);
      setUnlockedAchievements(unlocked);
    } catch (error) {
      console.error('Error loading achievement stats:', error);
    }
  };

  const goToActivityCategory = (activityType: string) => {
    navigation.navigate('home', { activityType });
  };

  const goToAchievements = () => {
    navigation.navigate('Achievements');
  };

  const goBack = () => {
    navigation.goBack();
  };

  const handlePressIn = (index: number) => {
    Animated.spring(scaleValues[index], {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 7,
    }).start();
  };

  const handlePressOut = (index: number) => {
    Animated.spring(scaleValues[index], {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 7,
    }).start();
  };

  const getActivityConfig = (index: number) => {
    return activityConfig[index % activityConfig.length];
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil': return '#4CAF50';
      case 'Medio': return '#FF9800';
      case 'Difícil': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const renderActivityCard = (activity: typeof activityTypes[0], index: number) => {
    const config = getActivityConfig(index);
    
    return (
      <Animated.View
        key={activity.id}
        style={[
          styles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleValues[index] },
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                })
              }
            ]
          }
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
          onPress={() => goToActivityCategory(activity.title)}
          onPressIn={() => handlePressIn(index)}
          onPressOut={() => handlePressOut(index)}
          activeOpacity={0.9}
        >
          {/* Difficulty Badge */}
          <View style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(activity.difficulty) }
          ]}>
            <Text style={styles.difficultyText}>{activity.difficulty}</Text>
          </View>

          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Text style={styles.icon}>{config.emoji}</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{activity.shortTitle}</Text>
            <Text style={styles.cardDescription}>{activity.description}</Text>
            
            {/* Time Estimate */}
            <View style={styles.timeContainer}>
              <Text style={styles.timeIcon}>⏱️</Text>
              <Text style={styles.timeText}>{activity.estimatedTime}</Text>
            </View>
          </View>

          {/* Play Button */}
          <View style={styles.playButtonContainer}>
            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>▶</Text>
            </View>
          </View>

          {/* Decorative Elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header mejorado */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={goBack}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          
          <View style={styles.titleSection}>
            <Text style={styles.title}>🎮 Actividades</Text>
            <Text style={styles.subtitle}>Elige tu desafío</Text>
          </View>
          
          {/* Achievements Button */}
          <TouchableOpacity 
            style={styles.achievementsButton}
            onPress={goToAchievements}
            activeOpacity={0.8}
          >
            <View style={styles.achievementsIconContainer}>
              <Text style={styles.achievementsIcon}>🏆</Text>
            </View>
            <View style={styles.achievementsInfo}>
              <Text style={styles.achievementsPoints}>{totalPoints}</Text>
              <Text style={styles.achievementsLabel}>pts</Text>
            </View>
            {unlockedAchievements > 0 && (
              <View style={styles.achievementsBadge}>
                <Text style={styles.achievementsBadgeText}>{unlockedAchievements}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{activityTypes.length}</Text>
          <Text style={styles.statLabel}>Actividades</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalPoints}</Text>
          <Text style={styles.statLabel}>Puntos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{unlockedAchievements}</Text>
          <Text style={styles.statLabel}>Logros</Text>
        </View>
      </View>
      
      {/* Activities Grid */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {activityTypes.map((activity, index) => renderActivityCard(activity, index))}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>🚀 ¡Desafía tu mente y diviértete! 🧠</Text>
      </View>
    </SafeAreaView>
  );
};

export default ActivityMenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  titleSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#2D3436',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#636E72',
  },
  achievementsButton: {
    backgroundColor: '#4285f4',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
    minWidth: 70,
  },
  achievementsIconContainer: {
    marginBottom: 2,
  },
  achievementsIcon: {
    fontSize: 20,
  },
  achievementsInfo: {
    alignItems: 'center',
  },
  achievementsPoints: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 16,
  },
  achievementsLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  achievementsBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  achievementsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4285f4',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 10,
  },
  scrollContainer: {
    flex: 1,
    marginTop: 15,
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  cardContainer: {
    width: (width - 55) / 2, // 20px padding + 15px gap
    marginBottom: 15,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    minHeight: 180,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  timeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },
  playButtonContainer: {
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  playButtonText: {
    fontSize: 16,
    color: '#2D3436',
    fontWeight: '800',
    marginLeft: 2, // Adjust for visual centering
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -15,
    left: -15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 15,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636E72',
    textAlign: 'center',
  },
});