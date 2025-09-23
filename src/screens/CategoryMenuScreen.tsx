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
import BilingualTextProcessor from '../utils/BilingualTextProcessor';
import UniversalImage from '../components/UniversalImage';

const { width } = Dimensions.get('window');

// Paleta de colores de acento para categorías
const accentColors = [
  { bg: '#F9FAFB', accent: '#4F46E5', shadow: 'rgba(79, 70, 229, 0.15)' }, // Azul índigo
  { bg: '#F9FAFB', accent: '#22C55E', shadow: 'rgba(34, 197, 94, 0.15)' },  // Verde brillante
  { bg: '#F9FAFB', accent: '#F97316', shadow: 'rgba(249, 115, 22, 0.15)' }, // Naranja cálido
  { bg: '#F9FAFB', accent: '#EAB308', shadow: 'rgba(234, 179, 8, 0.15)' },  // Amarillo dorado
  { bg: '#F9FAFB', accent: '#EC4899', shadow: 'rgba(236, 72, 153, 0.15)' }, // Rosa fuerte
  { bg: '#F9FAFB', accent: '#8B5CF6', shadow: 'rgba(139, 92, 246, 0.15)' }, // Violeta
];

type CategoryMenuScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CategoryMenuScreenRouteProp = {
  params: {
    activityType?: string;
  };
};

const CategoryMenuScreen = () => {
  const navigation = useNavigation<CategoryMenuScreenNavigationProp>();
  const route = useRoute<CategoryMenuScreenRouteProp>();
  const { t, language } = useLanguage();
  const { activityType } = route.params || {};
  
  // Estados
  const [categories, setCategories] = useState<Category[]>([]);
  const [rawCategories, setRawCategories] = useState<Category[]>([]);
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

  // Procesar categorías cuando cambie el idioma
  useEffect(() => {
    if (rawCategories.length > 0) {
      processCategoriesForLanguage();
    }
  }, [language, rawCategories]);

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
      
      // Guardar datos originales
      setRawCategories(sortedCategories);
      
      // Procesar inmediatamente para el idioma actual
      processCategoriesForLanguage(sortedCategories);
      
      
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

  const processCategoriesForLanguage = (categoriesToProcess?: Category[]) => {
    const sourceCategories = categoriesToProcess || rawCategories;
    
    
    if (sourceCategories.length === 0) {
      console.log('⚠️ [CategoryMenuScreen] No hay categorías para procesar');
      return;
    }
    
    // Procesar textos bilingües
    const processedCategories = sourceCategories.map((category, index) => {
      const originalName = category.name || '';
      const originalDescription = category.description || '';
      
      
      const processedName = BilingualTextProcessor.extractText(originalName, language);
      const processedDescription = BilingualTextProcessor.extractText(originalDescription, language);
      
      
      return {
        ...category,
        name: processedName,
        description: processedDescription,
      };
    });

    
    setCategories(processedCategories);
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
    // Usar el nombre original para la navegación (el servidor espera el nombre original)
    const originalCategory = rawCategories.find(orig => orig.ID === category.ID);
    const categoryName = originalCategory ? originalCategory.name : category.name;
    navigation.navigate('lessonList', { 
      category: categoryName, 
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

  const getCategoryColors = (index: number) => {
    return accentColors[index % accentColors.length];
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
    const colors = getCategoryColors(index);
    
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
              backgroundColor: colors.bg,
              shadowColor: colors.shadow,
              borderWidth: 2,
              borderColor: colors.accent,
            }
          ]}
          onPress={() => goToSubLessons(category)}
          onPressIn={() => handlePressIn(index)}
          onPressOut={() => handlePressOut(index)}
          activeOpacity={0.9}
        >
          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <UniversalImage
              imageUrl={category.icon}
              imageType="categorias"
              fallbackEmoji="📚"
              size="large"
              style={[styles.categoryIcon, { width: 160, height: 160 }]}
            />
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: '#111827' }]} numberOfLines={2}>
              {category.name}
            </Text>
            <Text style={[styles.cardDescription, { color: '#374151' }]} numberOfLines={3}>
              {category.description}
            </Text>
          </View>

          {/* Accent Dot */}
          <View style={[styles.accentDot, { backgroundColor: colors.accent }]} />
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
            <View style={styles.headerSpacer} />
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
          
          <View style={styles.headerSpacer} />
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
    backgroundColor: '#F9FAFB',
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
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2D3436',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerSpacer: {
    width: 70,
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
    borderRadius: 16,
    padding: 16,
    minHeight: 220,
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
  imageCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  icon: {
    fontSize: 32,
  },
  categoryIcon: {
    borderRadius: 8,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 6,
    minHeight: 32,
  },
  cardDescription: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 14,
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
  accentDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
});