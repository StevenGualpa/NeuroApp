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
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import RealAchievementService from '../services/RealAchievementService';
import AuthService from '../services/AuthService';
import { Achievement, UserAchievement } from '../services/ApiService';

const { width } = Dimensions.get('window');

type AchievementsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AchievementWithProgress extends Achievement {
  isUnlocked: boolean;
  currentProgress: number;
  unlockedAt?: string;
}

const RealAchievementsScreen = () => {
  const navigation = useNavigation<AchievementsNavigationProp>();
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUnlocked: 0,
    totalAchievements: 0,
    completionPercentage: 0,
    totalPoints: 0,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const categories = [
    { key: 'all', label: 'Todos', icon: '🏆', color: '#4285f4' },
    { key: 'gameplay', label: 'Juego', icon: '🎮', color: '#FF6B6B' },
    { key: 'learning', label: 'Aprendizaje', icon: '📚', color: '#4CAF50' },
    { key: 'progress', label: 'Progreso', icon: '⭐', color: '#FFA726' },
    { key: 'social', label: 'Social', icon: '👥', color: '#9C27B0' },
    { key: 'special', label: 'Especiales', icon: '💎', color: '#FF5722' },
  ];

  useEffect(() => {
    initializeAchievements();
    
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
    filterAchievements();
  }, [selectedCategory]);

  const initializeAchievements = async () => {
    setIsLoading(true);
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'No hay usuario logueado');
        navigation.goBack();
        return;
      }

      console.log('🏆 Loading achievements for user:', user.id);
      
      // Initialize achievement service
      await RealAchievementService.initializeAchievements();
      
      // Load achievements
      await loadAchievements();
      
    } catch (error) {
      console.error('❌ Error initializing achievements:', error);
      Alert.alert(
        'Error de Conexión',
        'No se pudieron cargar los logros. Verifica tu conexión a internet.',
        [
          { text: 'Reintentar', onPress: initializeAchievements },
          { text: 'Volver', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      console.log('📥 Fetching achievements from API...');
      
      // Get all achievements with user progress
      const allAchievements = await RealAchievementService.getAllAchievements();
      console.log('✅ Loaded achievements:', allAchievements.length);
      
      // Get achievement stats
      const achievementStats = await RealAchievementService.getAchievementStats();
      console.log('📊 Achievement stats:', achievementStats);
      
      setAchievements(allAchievements);
      setStats({
        totalUnlocked: achievementStats.unlocked,
        totalAchievements: achievementStats.total,
        completionPercentage: Math.round(achievementStats.completionRate),
        totalPoints: achievementStats.unlockedPoints,
      });
      
    } catch (error) {
      console.error('❌ Error loading achievements:', error);
      throw error;
    }
  };

  const filterAchievements = () => {
    // This will be handled by the render method
    // since we're filtering in real-time based on selectedCategory
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await RealAchievementService.forceRefresh();
      await loadAchievements();
    } catch (error) {
      console.error('Error refreshing achievements:', error);
      Alert.alert('Error', 'No se pudieron actualizar los logros');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getFilteredAchievements = () => {
    if (selectedCategory === 'all') {
      return achievements;
    }
    return achievements.filter(achievement => achievement.category === selectedCategory);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return '#9ca3af';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#9ca3af';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'C';
      case 'rare': return 'R';
      case 'epic': return 'E';
      case 'legendary': return 'L';
      default: return '?';
    }
  };

  const renderAchievementCard = (achievement: AchievementWithProgress, index: number) => {
    const progressPercentage = achievement.condition_value > 0 
      ? Math.min((achievement.currentProgress / achievement.condition_value) * 100, 100)
      : achievement.isUnlocked ? 100 : 0;

    return (
      <Animated.View
        key={achievement.ID}
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
                {achievement.name}
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
          {achievement.condition_value > 0 && (
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
                {achievement.currentProgress}/{achievement.condition_value}
              </Text>
            </View>
          )}

          {/* Unlock Date */}
          {achievement.isUnlocked && achievement.unlockedAt && (
            <View style={styles.unlockedSection}>
              <Text style={styles.unlockedText}>
                🎉 Desbloqueado el {new Date(achievement.unlockedAt).toLocaleDateString('es-ES')}
              </Text>
            </View>
          )}

          {/* Rarity Badge */}
          <View style={[
            styles.rarityBadge, 
            { backgroundColor: getRarityColor(achievement.rarity) }
          ]}>
            <Text style={styles.rarityText}>{getRarityLabel(achievement.rarity)}</Text>
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

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4285f4" />
      <Text style={styles.loadingText}>Cargando logros...</Text>
      <Text style={styles.loadingSubtext}>Conectando con el servidor</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
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
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  const filteredAchievements = getFilteredAchievements();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏆 Logros</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={isRefreshing}
        >
          <Text style={styles.refreshButtonText}>
            {isRefreshing ? '⟳' : '🔄'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats + Categories */}
      <View style={styles.topSection}>
        {renderStatsHeader()}
        {renderCategoryFilter()}
      </View>

      {/* API Status */}
      <View style={styles.apiStatus}>
        <Text style={styles.apiStatusText}>
          🌐 Conectado a API Real • {achievements.length} logros cargados
        </Text>
      </View>

      {/* Achievements List */}
      <ScrollView 
        style={styles.achievementsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.achievementsContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#4285f4']}
            tintColor="#4285f4"
          />
        }
      >
        {filteredAchievements.length > 0 ? (
          filteredAchievements.map((achievement, index) => renderAchievementCard(achievement, index))
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
              <Text style={styles.emptyStateText}>
                {selectedCategory === 'all' 
                  ? 'No hay logros disponibles' 
                  : 'No hay logros en esta categoría'
                }
              </Text>
              <Text style={styles.emptyStateSubtext}>
                ¡Sigue jugando para desbloquear más logros!
              </Text>
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
    paddingVertical: 15,
    backgroundColor: '#4285f4',
    borderBottomLeftRadius: 20,
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
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
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
    gap: 8,
  },
  statsCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
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
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  statsLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  categoryContainer: {
    maxHeight: 50,
  },
  categoryContent: {
    paddingHorizontal: 15,
    gap: 8,
    alignItems: 'center',
  },
  categoryButton: {
    backgroundColor: '#f8faff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 70,
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
    fontSize: 16,
    marginBottom: 2,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
  },
  categoryLabelActive: {
    color: '#ffffff',
  },
  apiStatus: {
    backgroundColor: '#e8f5e8',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  apiStatusText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285f4',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
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
    marginBottom: 12,
  },
  achievementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 12,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    fontSize: 24,
    zIndex: 1,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9ca3af',
    marginBottom: 4,
  },
  achievementTitleUnlocked: {
    color: '#1a1a1a',
  },
  achievementDescription: {
    fontSize: 13,
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
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  progressSection: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
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
    fontSize: 11,
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
    fontSize: 11,
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

export default RealAchievementsScreen;