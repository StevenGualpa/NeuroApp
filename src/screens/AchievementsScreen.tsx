import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { AchievementService, Achievement, AchievementCategory } from '../services/AchievementService';

const { width } = Dimensions.get('window');

type AchievementsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AchievementsScreen = () => {
  const navigation = useNavigation<AchievementsNavigationProp>();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('all');
  const [stats, setStats] = useState({
    totalUnlocked: 0,
    totalAchievements: 0,
    completionPercentage: 0,
    totalPoints: 0,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const categories: { key: AchievementCategory; label: string; icon: string; color: string }[] = [
    { key: 'all', label: 'Todos', icon: '🏆', color: '#4285f4' },
    { key: 'gameplay', label: 'Juego', icon: '🎮', color: '#FF6B6B' },
    { key: 'performance', label: 'Rendimiento', icon: '⭐', color: '#FFA726' },
    { key: 'streak', label: 'Rachas', icon: '🔥', color: '#FF5722' },
    { key: 'special', label: 'Especiales', icon: '💎', color: '#9C27B0' },
  ];

  useEffect(() => {
    initializeAndLoadAchievements();
    
    // Animate on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [selectedCategory]);

  const initializeAndLoadAchievements = async () => {
    await AchievementService.initializeAchievements();
    loadAchievements();
  };

  const loadAchievements = async () => {
    try {
      const allAchievements = await AchievementService.getAllAchievements();
      const filteredAchievements = selectedCategory === 'all' 
        ? allAchievements 
        : allAchievements.filter(achievement => achievement.category === selectedCategory);
      
      setAchievements(filteredAchievements);
      
      // Calculate stats
      const unlockedCount = allAchievements.filter(a => a.isUnlocked).length;
      const totalCount = allAchievements.length;
      const percentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
      const totalPoints = await AchievementService.getTotalPoints();
      
      setStats({
        totalUnlocked: unlockedCount,
        totalAchievements: totalCount,
        completionPercentage: percentage,
        totalPoints,
      });
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9ca3af';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#9ca3af';
    }
  };

  const renderAchievementCard = (achievement: Achievement, index: number) => {
    const progressPercentage = achievement.maxProgress > 0 
      ? Math.min((achievement.currentProgress / achievement.maxProgress) * 100, 100)
      : achievement.isUnlocked ? 100 : 0;

    return (
      <Animated.View
        key={achievement.id}
        style={[
          styles.achievementCardContainer,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              })
            }]
          }
        ]}
      >
        <View style={[
          styles.achievementCard,
          achievement.isUnlocked && styles.achievementCardUnlocked
        ]}>
          {/* Rarity Border */}
          {achievement.isUnlocked && (
            <View 
              style={[
                styles.rarityBorder,
                { backgroundColor: getRarityColor(achievement.rarity) }
              ]}
            />
          )}

          <View style={styles.achievementHeader}>
            <View style={[
              styles.achievementIcon,
              achievement.isUnlocked && styles.achievementIconUnlocked,
              { backgroundColor: achievement.isUnlocked ? getRarityColor(achievement.rarity) + '20' : '#f3f4f6' }
            ]}>
              <Text style={styles.achievementIconText}>
                {achievement.isUnlocked ? achievement.icon : '🔒'}
              </Text>
            </View>
            
            <View style={styles.achievementInfo}>
              <Text style={[
                styles.achievementTitle,
                achievement.isUnlocked && styles.achievementTitleUnlocked
              ]}>
                {achievement.title}
              </Text>
              <Text style={[
                styles.achievementDescription,
                achievement.isUnlocked && styles.achievementDescriptionUnlocked
              ]}>
                {achievement.description}
              </Text>
            </View>
            
            <View style={styles.achievementReward}>
              <View style={[
                styles.pointsBadge, 
                { backgroundColor: getRarityColor(achievement.rarity) }
              ]}>
                <Text style={styles.rewardText}>+{achievement.points}</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          {achievement.maxProgress > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: achievement.isUnlocked ? '#4caf50' : '#e5e7eb'
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {achievement.currentProgress}/{achievement.maxProgress}
              </Text>
            </View>
          )}

          {/* Unlock Date */}
          {achievement.isUnlocked && achievement.unlockedAt && (
            <View style={styles.unlockedSection}>
              <Text style={styles.unlockedText}>
                🎉 {new Date(achievement.unlockedAt).toLocaleDateString()}
              </Text>
            </View>
          )}

          {/* Rarity Badge */}
          <View style={[
            styles.rarityBadge, 
            { backgroundColor: getRarityColor(achievement.rarity) }
          ]}>
            <Text style={styles.rarityText}>{achievement.rarity.charAt(0).toUpperCase()}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderCategoryFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryContainer}
      contentContainerStyle={styles.categoryContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.key}
          style={[
            styles.categoryButton,
            selectedCategory === category.key && [
              styles.categoryButtonActive,
              { backgroundColor: category.color }
            ]
          ]}
          onPress={() => setSelectedCategory(category.key)}
        >
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={[
            styles.categoryLabel,
            selectedCategory === category.key && styles.categoryLabelActive
          ]}>
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderStatsHeader = () => (
    <View style={styles.statsHeader}>
      <View style={[styles.statsCard, styles.statsCardBlue]}>
        <Text style={styles.statsNumber}>{stats.totalUnlocked}</Text>
        <Text style={styles.statsLabel}>Logros</Text>
      </View>
      
      <View style={[styles.statsCard, styles.statsCardRed]}>
        <Text style={styles.statsNumber}>{stats.completionPercentage}%</Text>
        <Text style={styles.statsLabel}>Progreso</Text>
      </View>
      
      <View style={[styles.statsCard, styles.statsCardOrange]}>
        <Text style={styles.statsNumber}>{stats.totalPoints}</Text>
        <Text style={styles.statsLabel}>Puntos</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Compacto */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏆 Logros</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats + Categories en una sola sección */}
      <View style={styles.topSection}>
        {/* Stats Header Compacto */}
        {renderStatsHeader()}
        
        {/* Category Filter Compacto */}
        {renderCategoryFilter()}
      </View>

      {/* Achievements List - Más espacio */}
      <ScrollView 
        style={styles.achievementsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.achievementsContent}
      >
        {achievements.length > 0 ? (
          achievements.map((achievement, index) => renderAchievementCard(achievement, index))
        ) : (
          <Animated.View 
            style={[
              styles.emptyState,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>🎯</Text>
              <Text style={styles.emptyStateText}>No hay logros en esta categoría</Text>
              <Text style={styles.emptyStateSubtext}>¡Sigue jugando para desbloquear más!</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15, // Reducido de 20
    backgroundColor: '#4285f4',
    borderBottomLeftRadius: 20, // Reducido de 24
    borderBottomRightRadius: 20,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 24, // Reducido de 28
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSpacer: {
    width: 60, // Reducido de 80
  },
  topSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    paddingVertical: 15,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 15,
    gap: 8, // Reducido de 12
  },
  statsCard: {
    flex: 1,
    borderRadius: 12, // Reducido de 20
    padding: 12, // Reducido de 20
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsCardBlue: {
    backgroundColor: '#4285f4',
  },
  statsCardRed: {
    backgroundColor: '#ff6b6b',
  },
  statsCardOrange: {
    backgroundColor: '#ffa726',
  },
  statsNumber: {
    fontSize: 20, // Reducido de 28
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  statsLabel: {
    fontSize: 10, // Reducido de 12
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  categoryContainer: {
    maxHeight: 50, // Altura fija
  },
  categoryContent: {
    paddingHorizontal: 15,
    gap: 8, // Reducido de 12
    alignItems: 'center',
  },
  categoryButton: {
    backgroundColor: '#f8faff',
    borderRadius: 20, // Reducido de 25
    paddingHorizontal: 16, // Reducido de 20
    paddingVertical: 8, // Reducido de 12
    alignItems: 'center',
    minWidth: 70, // Reducido de 90
    borderWidth: 1.5,
    borderColor: '#e8f0fe',
  },
  categoryButtonActive: {
    borderColor: 'transparent',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 16, // Reducido de 20
    marginBottom: 2,
  },
  categoryLabel: {
    fontSize: 10, // Reducido de 12
    fontWeight: '700',
    color: '#6b7280',
  },
  categoryLabelActive: {
    color: '#ffffff',
  },
  achievementsList: {
    flex: 1,
    marginTop: 10,
  },
  achievementsContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  achievementCardContainer: {
    marginBottom: 12, // Reducido de 16
  },
  achievementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16, // Reducido de 24
    padding: 16, // Reducido de 20
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    opacity: 0.7,
    position: 'relative',
    overflow: 'hidden',
  },
  achievementCardUnlocked: {
    opacity: 1,
    shadowColor: '#4caf50',
    shadowOpacity: 0.15,
  },
  rarityBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12, // Reducido de 16
  },
  achievementIcon: {
    width: 50, // Reducido de 60
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12, // Reducido de 16
    position: 'relative',
  },
  achievementIconUnlocked: {
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementIconText: {
    fontSize: 24, // Reducido de 28
    zIndex: 1,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16, // Reducido de 18
    fontWeight: '800',
    color: '#9ca3af',
    marginBottom: 4,
  },
  achievementTitleUnlocked: {
    color: '#1a1a1a',
  },
  achievementDescription: {
    fontSize: 13, // Reducido de 14
    color: '#9ca3af',
    lineHeight: 18,
  },
  achievementDescriptionUnlocked: {
    color: '#6b7280',
  },
  achievementReward: {
    alignItems: 'center',
  },
  pointsBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  rewardText: {
    fontSize: 14, // Reducido de 16
    fontWeight: '900',
    color: '#ffffff',
  },
  progressSection: {
    marginBottom: 8, // Reducido de 12
  },
  progressBar: {
    height: 6, // Reducido de 8
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11, // Reducido de 12
    color: '#6b7280',
    textAlign: 'right',
    fontWeight: '600',
  },
  unlockedSection: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  unlockedText: {
    fontSize: 11, // Reducido de 12
    color: '#16a34a',
    fontWeight: '600',
    textAlign: 'center',
  },
  rarityBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  rarityText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateContainer: {
    backgroundColor: '#f8faff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8f0fe',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AchievementsScreen;