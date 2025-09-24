import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import RealAchievementService from '../services/RealAchievementService';
import { Achievement, UserAchievement } from '../services/ApiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuthContext } from '../hooks/useAuth';
import BilingualTextProcessor from '../utils/BilingualTextProcessor';

// Extended interface for achievements with user progress
interface ProcessedAchievement extends Achievement {
  isUnlocked: boolean;
  currentProgress: number;
  max_progress: number;
  unlockedAt?: string;
  encouragementMessage?: string;
}

const { width } = Dimensions.get('window');

type AchievementsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AchievementsScreen = () => {
  const navigation = useNavigation<AchievementsNavigationProp>();
  const { t, language } = useLanguage();
  const { user } = useAuthContext();
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [achievements, setAchievements] = useState<ProcessedAchievement[]>([]);
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
    { 
      key: 'all', 
      label: language === 'es' ? 'Todos' : 'All', 
      icon: '🏆', 
      color: '#4285f4' 
    },
    { 
      key: 'completion', 
      label: language === 'es' ? 'Finalización' : 'Completion', 
      icon: '🌟', 
      color: '#FF6B6B' 
    },
    { 
      key: 'perfection', 
      label: language === 'es' ? 'Perfección' : 'Perfection', 
      icon: '📈', 
      color: '#4CAF50' 
    },
    { 
      key: 'speed', 
      label: language === 'es' ? 'Velocidad' : 'Speed', 
      icon: '💪', 
      color: '#FFA726' 
    },
    { 
      key: 'special', 
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

  // Refresh achievements when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id && !isLoading) {
        console.log('🔄 [AchievementsScreen] Pantalla en foco, refrescando datos...');
        refreshAchievements();
      }
    }, [user?.id, isLoading])
  );

  // Listen for achievement unlocks and refresh data
  useEffect(() => {
    const handleAchievementUnlocked = () => {
      console.log('🏆 [AchievementsScreen] Logro desbloqueado detectado, refrescando...');
      refreshAchievements();
    };

    // Subscribe to achievement unlock events
    const unsubscribe = RealAchievementService.onAchievementUnlocked(handleAchievementUnlocked);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const initializeAchievements = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      console.log('🏆 [AchievementsScreen] Initializing server achievements...');
      
      // Initialize real achievement service
      await RealAchievementService.initialize(user.id);
      
      // Load achievements
      await loadAchievements();
      
    } catch (error) {
      console.error('❌ [AchievementsScreen] Error initializing achievements:', error);
      Alert.alert(
        'Error de conexión',
        language === 'es' 
          ? 'No se pudieron cargar los logros del servidor.'
          : 'Could not load achievements from server.',
        [
          { text: 'Reintentar', onPress: initializeAchievements },
          { text: 'Volver', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAchievements = useCallback(async () => {
    if (!user?.id || isLoading || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      console.log('🔄 [AchievementsScreen] Refrescando logros...');
      
      // Refresh user data from server first
      await RealAchievementService.refreshUserData();
      
      // Then reload achievements
      await loadAchievements();
    } catch (error) {
      console.error('❌ [AchievementsScreen] Error refrescando logros:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id, isLoading, isRefreshing]);

  const loadAchievements = async () => {
    try {
      console.log(`📥 [AchievementsScreen] Fetching server achievements...`);
      
      // Get all achievements and user progress from server (always fresh data)
      const [serverAchievements, serverUserAchievements] = await Promise.all([
        RealAchievementService.getAllAchievements(),
        RealAchievementService.getUserAchievements()
      ]);
      
      console.log(`✅ [AchievementsScreen] Loaded ${serverAchievements.length} achievements from server`);
      console.log(`👤 [AchievementsScreen] Loaded ${serverUserAchievements.length} user achievements`);
      
      // Debug: Log user achievements data
      if (serverUserAchievements.length > 0) {
        console.log('🔍 [AchievementsScreen] User achievements data:', serverUserAchievements);
        console.log('🔍 [AchievementsScreen] Sample user achievement:', serverUserAchievements[0]);
      } else {
        console.log('🔍 [AchievementsScreen] No user achievements found - user should have 0 unlocked achievements');
      }
      
      // Merge achievements with user progress
      const processedAchievements: ProcessedAchievement[] = serverAchievements.map(achievement => {
        const userAchievement = serverUserAchievements.find(ua => ua.achievement_id === achievement.ID);
        
        // Process bilingual texts to show only the configured language
        const rawName = achievement.name || achievement.title || `Logro ${achievement.ID}`;
        const rawDescription = achievement.description || '';
        const rawEncouragement = (achievement as any).encouragement_message || '';
        
        const achievementName = BilingualTextProcessor.extractText(rawName, language);
        const achievementDescription = BilingualTextProcessor.extractText(rawDescription, language);
        const encouragementMessage = BilingualTextProcessor.extractText(rawEncouragement, language);
        
        const isUnlocked = userAchievement?.is_unlocked || false;
        
        // Debug: Log each achievement processing
        if (isUnlocked) {
          console.log(`🔍 [AchievementsScreen] Logro ${achievement.ID} marcado como desbloqueado:`, {
            achievementId: achievement.ID,
            achievementName: achievementName,
            userAchievement: userAchievement,
            isUnlocked: isUnlocked
          });
        }
        
        return {
          ...achievement,
          name: achievementName, // Texto procesado en el idioma correcto
          description: achievementDescription, // Descripción en el idioma correcto
          encouragement_message: encouragementMessage, // Mensaje de aliento en el idioma correcto
          isUnlocked: isUnlocked,
          currentProgress: userAchievement?.progress || 0,
          max_progress: achievement.condition_value || 1, // Use condition_value as max_progress
          unlockedAt: userAchievement?.unlocked_at,
          encouragementMessage: encouragementMessage, // Add processed encouragement message
        };
      });
      
      // Log sample for debugging
      if (processedAchievements.length > 0) {
        console.log('📋 [AchievementsScreen] Sample processed achievement:', {
          id: processedAchievements[0].ID,
          name: processedAchievements[0].name,
          isUnlocked: processedAchievements[0].isUnlocked,
          currentProgress: processedAchievements[0].currentProgress,
          maxProgress: processedAchievements[0].max_progress,
        });
      }
      
      // Calculate stats
      const unlockedAchievements = processedAchievements.filter(a => a.isUnlocked);
      const completionPercentage = processedAchievements.length > 0 
        ? Math.round((unlockedAchievements.length / processedAchievements.length) * 100)
        : 0;
      
      // Calculate total points
      const totalPoints = unlockedAchievements.reduce((sum, achievement) => sum + (achievement.points || 0), 0);
      
      setAllAchievements(serverAchievements);
      setUserAchievements(serverUserAchievements);
      setAchievements(processedAchievements);
      setStats({
        totalUnlocked: unlockedAchievements.length,
        totalAchievements: processedAchievements.length,
        completionPercentage,
        totalPoints,
      });
      
      console.log('📊 [AchievementsScreen] Stats:', {
        unlocked: unlockedAchievements.length,
        total: processedAchievements.length,
        completion: completionPercentage,
        points: totalPoints
      });
      
    } catch (error) {
      console.error('❌ [AchievementsScreen] Error loading achievements:', error);
      throw error;
    }
  };

  const onRefresh = refreshAchievements;

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

  const renderAchievementCard = (achievement: ProcessedAchievement, index: number) => {
    const progressPercentage = achievement.max_progress > 0 
      ? Math.min((achievement.currentProgress / achievement.max_progress) * 100, 100)
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
          {achievement.max_progress > 0 && (
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
                {achievement.currentProgress}/{achievement.max_progress}
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