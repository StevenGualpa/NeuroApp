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
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ApiService, { Activity } from '../services/ApiService';
import { AchievementService } from '../services/AchievementService';

const { width } = Dimensions.get('window');

// Configuración de colores y emojis para las actividades
const activityConfig = [
  { emoji: '🎯', color: '#FF6B6B', shadowColor: '#FF4757', gradient: ['#FF6B6B', '#FF5252'] },
  { emoji: '🔢', color: '#4ECDC4', shadowColor: '#26D0CE', gradient: ['#4ECDC4', '#26A69A'] },
  { emoji: '🧩', color: '#45B7D1', shadowColor: '#3742FA', gradient: ['#45B7D1', '#2196F3'] },
  { emoji: '🎨', color: '#FFA726', shadowColor: '#FF9800', gradient: ['#FFA726', '#FF9800'] },
  { emoji: '🎵', color: '#AB47BC', shadowColor: '#9C27B0', gradient: ['#AB47BC', '#9C27B0'] },
  { emoji: '🌟', color: '#66BB6A', shadowColor: '#4CAF50', gradient: ['#66BB6A', '#4CAF50'] },
  { emoji: '🔍', color: '#FF9800', shadowColor: '#F57C00', gradient: ['#FF9800', '#F57C00'] },
  { emoji: '🎪', color: '#E91E63', shadowColor: '#C2185B', gradient: ['#E91E63', '#C2185B'] },
  { emoji: '🚀', color: '#9C27B0', shadowColor: '#7B1FA2', gradient: ['#9C27B0', '#7B1FA2'] },
  { emoji: '⭐', color: '#FF5722', shadowColor: '#D84315', gradient: ['#FF5722', '#D84315'] },
];

const RealActivityMenuScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Estados
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState(0);
  
  // Animaciones
  const scaleValues = React.useRef<Animated.Value[]>([]).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload stats when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAchievementStats();
    });

    return unsubscribe;
  }, [navigation]);

  const loadInitialData = async () => {
    await Promise.all([
      loadActivities(),
      loadAchievementStats()
    ]);
    
    // Animate cards on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      const activitiesData = await ApiService.getActivities();
      setActivities(activitiesData);
      
      // Initialize scale animations for each activity
      scaleValues.length = 0;
      activitiesData.forEach(() => {
        scaleValues.push(new Animated.Value(1));
      });
      
    } catch (error) {
      console.error('Error loading activities:', error);
      Alert.alert(
        'Error de Conexión',
        'No se pudieron cargar las actividades. Verifica tu conexión a internet.',
        [
          { text: 'Reintentar', onPress: loadActivities },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const goToActivityCategory = (activity: Activity) => {
    // Navegar a la pantalla de categorías reales con el tipo de actividad
    navigation.navigate('realCategoryMenu', { activityType: activity.name });
  };

  const goToAchievements = () => {
    navigation.navigate('Achievements');
  };

  const goBack = () => {
    navigation.goBack();
  };

  const handlePressIn = (index: number) => {
    if (scaleValues[index]) {
      Animated.spring(scaleValues[index], {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 7,
      }).start();
    }
  };

  const handlePressOut = (index: number) => {
    if (scaleValues[index]) {
      Animated.spring(scaleValues[index], {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 7,
      }).start();
    }
  };

  const getActivityConfig = (index: number) => {
    return activityConfig[index % activityConfig.length];
  };

  const getActivityStatus = (activity: Activity) => {
    return activity.is_active ? 'Activo' : 'Inactivo';
  };

  const getStatusColor = (activity: Activity) => {
    return activity.is_active ? '#4CAF50' : '#F44336';
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4285f4" />
      <Text style={styles.loadingText}>Cargando actividades...</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎮</Text>
      <Text style={styles.emptyTitle}>No hay actividades disponibles</Text>
      <Text style={styles.emptyDescription}>
        Parece que no hay actividades configuradas en el servidor.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadActivities}>
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderActivityCard = (activity: Activity, index: number) => {
    const config = getActivityConfig(index);
    
    return (
      <Animated.View
        key={activity.ID}
        style={[
          styles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleValues[index] || new Animated.Value(1) },
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
          onPress={() => goToActivityCategory(activity)}
          onPressIn={() => handlePressIn(index)}
          onPressOut={() => handlePressOut(index)}
          activeOpacity={0.9}
        >
          {/* Status Badge */}
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(activity) }
          ]}>
            <Text style={styles.statusText}>{getActivityStatus(activity)}</Text>
          </View>

          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Text style={styles.icon}>{config.emoji}</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {activity.name}
            </Text>
            <Text style={styles.cardDescription} numberOfLines={3}>
              {activity.description}
            </Text>
            
            {/* Activity ID */}
            <View style={styles.idContainer}>
              <Text style={styles.idIcon}>🆔</Text>
              <Text style={styles.idText}>ID: {activity.ID}</Text>
            </View>
          </View>

          {/* Play Button */}
          <View style={styles.playButtonContainer}>
            <View style={[
              styles.playButton,
              { opacity: activity.is_active ? 1 : 0.5 }
            ]}>
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>
            <View style={styles.titleSection}>
              <Text style={styles.title}>🎮 Actividades</Text>
              <Text style={styles.subtitle}>Cargando desde API...</Text>
            </View>
            <View style={styles.achievementsButton} />
          </View>
        </View>
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          
          <View style={styles.titleSection}>
            <Text style={styles.title}>🎮 Actividades</Text>
            <Text style={styles.subtitle}>Datos desde API</Text>
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
          <Text style={styles.statNumber}>{activities.length}</Text>
          <Text style={styles.statLabel}>Actividades</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {activities.filter(a => a.is_active).length}
          </Text>
          <Text style={styles.statLabel}>Activas</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalPoints}</Text>
          <Text style={styles.statLabel}>Puntos</Text>
        </View>
      </View>
      
      {/* Activities Grid */}
      {activities.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4285f4']}
              tintColor="#4285f4"
            />
          }
        >
          <View style={styles.grid}>
            {activities.map((activity, index) => renderActivityCard(activity, index))}
          </View>
        </ScrollView>
      )}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🚀 Datos cargados desde: facturago.onrender.com 🧠
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default RealActivityMenuScreen;

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
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8f0fe',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285f4',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
    width: (width - 55) / 2,
    marginBottom: 15,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    minHeight: 200,
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
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  statusText: {
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
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    minHeight: 32,
  },
  cardDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    minHeight: 42,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  idIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  idText: {
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
    marginLeft: 2,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#636E72',
    textAlign: 'center',
  },
});