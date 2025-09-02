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
import { AchievementService, Achievement, AchievementCategory } from '../services/AchievementService';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

type AchievementsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AchievementsScreen = () => {
  const navigation = useNavigation<AchievementsNavigationProp>();
  const { t, language } = useLanguage();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('all');
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
    { 
      key: 'all' as AchievementCategory, 
      label: language === 'es' ? 'Todos' : 'All', 
      icon: '🏆', 
      color: '#4285f4' 
    },
    { 
      key: 'primeros_pasos' as AchievementCategory, 
      label: language === 'es' ? 'Primeros Pasos' : 'First Steps', 
      icon: '🌟', 
      color: '#FF6B6B' 
    },
    { 
      key: 'progreso' as AchievementCategory, 
      label: language === 'es' ? 'Progreso' : 'Progress', 
      icon: '📈', 
      color: '#4CAF50' 
    },
    { 
      key: 'esfuerzo' as AchievementCategory, 
      label: language === 'es' ? 'Esfuerzo' : 'Effort', 
      icon: '💪', 
      color: '#FFA726' 
    },
    { 
      key: 'especial' as AchievementCategory, 
      label: language === 'es' ? 'Especiales' : 'Special', 
      icon: '💎', 
      color: '#9C27B0' 
    },
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

  // Recargar logros cuando cambie el idioma
  useEffect(() => {
    if (!isLoading) {
      console.log(`🌍 [AchievementsScreen] Idioma cambiado a: ${language}, recargando logros...`);
      loadAchievements();
    }
  }, [language]);

  const initializeAchievements = async () => {
    setIsLoading(true);
    try {
      console.log('🏆 [AchievementsScreen] Initializing achievements...');
      
      // Initialize achievement service
      await AchievementService.initializeAchievements();
      
      // Load achievements
      await loadAchievements();
      
    } catch (error) {
      console.error('❌ [AchievementsScreen] Error initializing achievements:', error);
      Alert.alert(
        'Error de conexión',
        language === 'es' 
          ? 'No se pudieron cargar los logros.'
          : 'Could not load achievements.',
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
      console.log(`📥 [AchievementsScreen] Fetching achievements in ${language}...`);
      
      // Get all achievements with bilingual processing
      const allAchievements = await AchievementService.getAllAchievements(language);
      console.log(`✅ [AchievementsScreen] Loaded ${allAchievements.length} achievements`);
      
      // Log sample for debugging
      if (allAchievements.length > 0) {
        console.log('📋 [AchievementsScreen] Sample achievement:', {
          id: allAchievements[0].id,
          title: allAchievements[0].title,
          description: allAchievements[0].description,
          isUnlocked: allAchievements[0].isUnlocked,
          currentProgress: allAchievements[0].currentProgress,
          maxProgress: allAchievements[0].maxProgress,
        });
        
        // Test bilingual processing
        console.log('🌍 [AchievementsScreen] Bilingual test:');
        console.log('  Original title might be: "¡Bienvenido!:Welcome!"');
        console.log(`  Processed for ${language}:`, allAchievements[0].title);
      }
      
      // Get total points
      const totalPoints = await AchievementService.getTotalPoints(language);
      
      // Calculate stats
      const unlockedAchievements = allAchievements.filter(a => a.isUnlocked);
      const completionPercentage = allAchievements.length > 0 
        ? Math.round((unlockedAchievements.length / allAchievements.length) * 100)
        : 0;
      
      setAchievements(allAchievements);
      setStats({
        totalUnlocked: unlockedAchievements.length,
        totalAchievements: allAchievements.length,
        completionPercentage,
        totalPoints,
      });
      
      console.log('📊 [AchievementsScreen] Stats:', {
        unlocked: unlockedAchievements.length,
        total: allAchievements.length,
        completion: completionPercentage,
        points: totalPoints
      });
      
    } catch (error) {
      console.error('❌ [AchievementsScreen] Error loading achievements:', error);
      throw error;
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 [AchievementsScreen] Refreshing achievements...');
      await loadAchievements();
    } catch (error) {
      console.error('❌ [AchievementsScreen] Error refreshing achievements:', error);
      Alert.alert(
        'Error de carga', 
        language === 'es' 
          ? 'No se pudieron actualizar los logros'
          : 'Could not update achievements'
      );
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
      case 'celebracion': return '#4CAF50';
      case 'genial': return '#2196F3';
      case 'increible': return '#9C27B0';
      case 'super_especial': return '#FF9800';
      default: return '#9ca3af';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'celebracion': return language === 'es' ? 'C' : 'C';
      case 'genial': return language === 'es' ? 'G' : 'G';
      case 'increible': return language === 'es' ? 'I' : 'A';
      case 'super_especial': return language === 'es' ? 'S' : 'S';
      default: return '?';
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
                🎉 {language === 'es' ? 'Desbloqueado el' : 'Unlocked on'} {new Date(achievement.unlockedAt).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
              </Text>
            </View>
          )}

          {/* Encouragement Message for Unlocked Achievements */}
          {achievement.isUnlocked && achievement.encouragementMessage && (
            <View style={styles.encouragementSection}>
              <Text style={styles.encouragementText}>
                💝 {achievement.encouragementMessage}
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
        <Text style={styles.statsLabel}>
          {language === 'es' ? 'Logros' : 'Achievements'}
        </Text>
      </View>
      
      <View style={[styles.statsCard, styles.statsCardRed]}>
        <Text style={styles.statsNumber}>{stats.completionPercentage}%</Text>
        <Text style={styles.statsLabel}>
          {language === 'es' ? 'Progreso' : 'Progress'}
        </Text>
      </View>
      
      <View style={[styles.statsCard, styles.statsCardOrange]}>
        <Text style={styles.statsNumber}>{stats.totalPoints}</Text>
        <Text style={styles.statsLabel}>
          {language === 'es' ? 'Puntos' : 'Points'}
        </Text>
      </View>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4285f4" />
      <Text style={styles.loadingText}>
        {language === 'es' ? 'Cargando logros...' : 'Loading achievements...'}
      </Text>
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
            <Text style={styles.backButtonText}>← {language === 'es' ? 'Volver' : 'Back'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🏆 {language === 'es' ? 'Logros' : 'Achievements'}</Text>
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
          <Text style={styles.backButtonText}>← {language === 'es' ? 'Volver' : 'Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🏆 {language === 'es' ? 'Logros' : 'Achievements'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Stats + Categories */}
      <View style={styles.topSection}>
        {renderStatsHeader()}
        {renderCategoryFilter()}
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
                  ? (language === 'es' ? 'No hay logros disponibles' : 'No achievements available')
                  : (language === 'es' 
                      ? 'No hay logros en esta categoría'
                      : 'No achievements in this category')
                }
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {language === 'es' 
                  ? '¡Sigue jugando para desbloquear más logros!'
                  : 'Keep playing to unlock more achievements!'
                }
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
  encouragementSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  encouragementText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
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