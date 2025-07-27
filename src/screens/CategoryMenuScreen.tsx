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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ApiService, { Category, Lesson, Step } from '../services/ApiService';
import { AchievementService } from '../services/AchievementService';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

type CategoryMenuScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CategoryMenuScreenRouteProp = {
  params: {
    activityType?: string;
  };
};

const CategoryMenuScreen = () => {
  const navigation = useNavigation<CategoryMenuScreenNavigationProp>();
  const route = useRoute<CategoryMenuScreenRouteProp>();
  const { t } = useLanguage();
  const { activityType } = route.params || {};
  
  // Estados
  const [categories, setCategories] = useState<Category[]>([]);
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
      loadCategories(),
      loadAchievementStats()
    ]);
    
    // Animate cards on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      console.log('📂 [CategoryMenuScreen] Cargando categorías desde API...');
      const categoriesData = await ApiService.getCategories();
      
      let filteredCategories = categoriesData;
      
      // Si hay un tipo de actividad específico, filtrar categorías
      if (activityType) {
        console.log(`🎯 [CategoryMenuScreen] Filtrando categorías para actividad: ${activityType}`);
        // Obtener todas las actividades para encontrar el ID del tipo de actividad
        const activities = await ApiService.getActivities();
        const selectedActivity = activities.find(activity => activity.name === activityType);
        
        if (selectedActivity) {
          console.log(`✅ [CategoryMenuScreen] Actividad encontrada: ID ${selectedActivity.ID}`);
          // Filtrar categorías que tengan lecciones con pasos del tipo de actividad seleccionado
          const categoriesWithMatchingLessons = [];
          
          for (const category of categoriesData) {
            try {
              // Obtener lecciones de esta categoría
              const lessons = await ApiService.getLessonsByCategory(category.ID);
              
              // Verificar si alguna lección tiene pasos con el tipo de actividad seleccionado
              let hasMatchingSteps = false;
              
              for (const lesson of lessons) {
                try {
                  // Obtener pasos de la lección
                  const steps = await ApiService.getStepsByLesson(lesson.ID);
                  
                  // Verificar si algún paso tiene el activity_type_id correcto
                  const hasStepsWithActivityType = steps.some(step => 
                    step.activity_type_id === selectedActivity.ID
                  );
                  
                  if (hasStepsWithActivityType) {
                    hasMatchingSteps = true;
                    break;
                  }
                } catch (stepError) {
                  console.warn(`Error loading steps for lesson ${lesson.ID}:`, stepError);
                }
              }
              
              if (hasMatchingSteps) {
                categoriesWithMatchingLessons.push(category);
              }
            } catch (lessonError) {
              console.warn(`Error loading lessons for category ${category.ID}:`, lessonError);
            }
          }
          
          filteredCategories = categoriesWithMatchingLessons;
          console.log(`📋 [CategoryMenuScreen] ${filteredCategories.length} categorías filtradas`);
        }
      }
      
      // Ordenar por sort_order y luego por nombre
      const sortedCategories = filteredCategories.sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
      });
      
      setCategories(sortedCategories);
      console.log(`✅ [CategoryMenuScreen] ${sortedCategories.length} categorías cargadas`);
      
      // Initialize scale animations for each category
      scaleValues.length = 0;
      sortedCategories.forEach(() => {
        scaleValues.push(new Animated.Value(1));
      });
      
    } catch (error) {
      console.error('❌ [CategoryMenuScreen] Error loading categories:', error);
      Alert.alert(
        t.errors.connectionError,
        t.categories.noCategories,
        [
          { text: t.common.retry, onPress: loadCategories },
          { text: t.common.cancel, style: 'cancel' }
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
    await loadCategories();
    setRefreshing(false);
  };

  const goToSubLessons = (category: Category) => {
    console.log(`📚 [CategoryMenuScreen] Navegando a lecciones para categoría: ${category.name}`);
    // Navegar a la pantalla de lecciones con la categoría seleccionada
    navigation.navigate('lessonList', { 
      category: category.name, 
      activityType 
    });
  };

  const goToAchievements = () => {
    console.log('🏆 [CategoryMenuScreen] Navegando a logros');
    navigation.navigate('Achievements');
  };

  const goBack = () => {
    console.log('⬅️ [CategoryMenuScreen] Volviendo a actividades');
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

  const getCategoryStatus = (category: Category) => {
    return category.is_active 
      ? (t.language === 'es' ? 'Activa' : 'Active')
      : (t.language === 'es' ? 'Inactiva' : 'Inactive');
  };

  const getStatusColor = (category: Category) => {
    return category.is_active ? '#4CAF50' : '#F44336';
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4285f4" />
      <Text style={styles.loadingText}>
        {t.language === 'es' ? 'Cargando categorías...' : 'Loading categories...'}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📂</Text>
      <Text style={styles.emptyTitle}>
        {activityType 
          ? (t.language === 'es' 
              ? `No hay categorías para "${activityType}"`
              : `No categories for "${activityType}"`)
          : t.categories.noCategories
        }
      </Text>
      <Text style={styles.emptyDescription}>
        {activityType 
          ? (t.language === 'es' 
              ? `No se encontraron categorías que contengan lecciones con actividades de tipo "${activityType}". Intenta con otro tipo de actividad.`
              : `No categories found containing lessons with "${activityType}" activities. Try another activity type.`)
          : (t.language === 'es'
              ? 'Parece que no hay categorías configuradas en el servidor.'
              : 'It seems there are no categories configured on the server.')
        }
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadCategories}>
        <Text style={styles.retryButtonText}>{t.common.retry}</Text>
      </TouchableOpacity>
      {activityType && (
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: '#6b7280', marginTop: 10 }]} 
          onPress={goBack}
        >
          <Text style={styles.retryButtonText}>← {t.common.back} {t.navigation.activities}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCategoryCard = (category: Category, index: number) => {
    return (
      <Animated.View
        key={category.ID}
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
              backgroundColor: category.color || '#4285f4',
              shadowColor: category.color || '#4285f4',
            }
          ]}
          onPress={() => goToSubLessons(category)}
          onPressIn={() => handlePressIn(index)}
          onPressOut={() => handlePressOut(index)}
          activeOpacity={0.9}
        >
          {/* Status Badge */}
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(category) }
          ]}>
            <Text style={styles.statusText}>{getCategoryStatus(category)}</Text>
          </View>

          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Text style={styles.icon}>{category.icon || '📚'}</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {category.name}
            </Text>
            <Text style={styles.cardDescription} numberOfLines={3}>
              {category.description}
            </Text>
          </View>

          {/* Play Button */}
          <View style={styles.playButtonContainer}>
            <View style={[
              styles.playButton,
              { opacity: category.is_active ? 1 : 0.5 }
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
              <Text style={styles.backButtonText}>← {t.common.back}</Text>
            </TouchableOpacity>
            <View style={styles.titleSection}>
              <Text style={styles.title}>📂 {t.categories.title}</Text>
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
            <Text style={styles.backButtonText}>← {t.common.back}</Text>
          </TouchableOpacity>
          
          <View style={styles.titleSection}>
            <Text style={styles.title}>📂 {t.categories.title}</Text>
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
              <Text style={styles.achievementsLabel}>
                {t.language === 'es' ? 'pts' : 'pts'}
              </Text>
            </View>
            {unlockedAchievements > 0 && (
              <View style={styles.achievementsBadge}>
                <Text style={styles.achievementsBadgeText}>{unlockedAchievements}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Categories Grid */}
      {categories.length === 0 ? (
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
            {categories.map((category, index) => renderCategoryCard(category, index))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default CategoryMenuScreen;

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
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
});