import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ApiService, { Lesson, Category, Step, Option, Activity } from '../services/ApiService';
import { useLanguage } from '../contexts/LanguageContext';
import BilingualTextProcessor from '../utils/BilingualTextProcessor';
import GameIntroAnimation from '../components/GameIntroAnimation';

const { width } = Dimensions.get('window');

// Paleta de colores de acento para lecciones
const accentColors = [
  { bg: '#F9FAFB', accent: '#4F46E5', shadow: 'rgba(79, 70, 229, 0.15)' }, // Azul índigo
  { bg: '#F9FAFB', accent: '#22C55E', shadow: 'rgba(34, 197, 94, 0.15)' },  // Verde brillante
  { bg: '#F9FAFB', accent: '#F97316', shadow: 'rgba(249, 115, 22, 0.15)' }, // Naranja cálido
  { bg: '#F9FAFB', accent: '#EAB308', shadow: 'rgba(234, 179, 8, 0.15)' },  // Amarillo dorado
  { bg: '#F9FAFB', accent: '#EC4899', shadow: 'rgba(236, 72, 153, 0.15)' }, // Rosa fuerte
  { bg: '#F9FAFB', accent: '#8B5CF6', shadow: 'rgba(139, 92, 246, 0.15)' }, // Violeta
];

type CombinedLessonScreenRouteProp = RouteProp<RootStackParamList, 'lessonList'>;

interface StepWithLesson extends Step {
  lessonTitle?: string;
  lessonIcon?: string;
  lessonDescription?: string;
}

const CombinedLessonScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CombinedLessonScreenRouteProp>();
  const { t, language } = useLanguage();
  const { category, activityType } = route.params;

  // Estados
  const [allSteps, setAllSteps] = useState<StepWithLesson[]>([]);
  const [rawLessons, setRawLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    activityType: string;
    step: any;
    lessonTitle: string;
  } | null>(null);

  // Animation refs
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const cardsAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadInitialData();
  }, []);

  // Procesar lecciones cuando cambie el idioma
  useEffect(() => {
    if (rawLessons.length > 0) {
      console.log(`🌍 [CombinedLessonScreen] Procesando ${rawLessons.length} lecciones para idioma: ${language}`);
      processLessonsForLanguage();
    }
  }, [language, rawLessons]);

  const loadInitialData = async () => {
    await Promise.all([
      loadCategories(),
      loadLessons()
    ]);
    
    // Animate on mount
    Animated.sequence([
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(cardsAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnimation, {
          toValue: 100, // Simulated progress
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  };

  const loadCategories = async () => {
    try {
      console.log('📂 [CombinedLessonScreen] Cargando categorías...');
      const categoriesData = await ApiService.getCategories();
      setCategories(categoriesData);
      
      // Encontrar la categoría seleccionada por nombre
      const foundCategory = categoriesData.find(cat => cat.name === category);
      setSelectedCategory(foundCategory || null);
      console.log(`✅ [CombinedLessonScreen] Categoría encontrada: ${foundCategory?.name || 'No encontrada'}`);
    } catch (error) {
      console.error('❌ [CombinedLessonScreen] Error loading categories:', error);
    }
  };

  const loadLessons = async () => {
    try {
      setLoading(true);
      console.log(`📚 [CombinedLessonScreen] Cargando lecciones para categoría: ${category}`);
      
      // Primero obtener todas las categorías para encontrar el ID
      const categoriesData = await ApiService.getCategories();
      const foundCategory = categoriesData.find(cat => cat.name === category);
      
      if (foundCategory) {
        console.log(`✅ [CombinedLessonScreen] Categoría encontrada: ID ${foundCategory.ID}`);
        // Cargar lecciones por categoría
        const lessonsData = await ApiService.getLessonsByCategory(foundCategory.ID);
        console.log(`📋 [CombinedLessonScreen] ${lessonsData.length} lecciones cargadas`);
        
        // Filtrar por activityType si está presente
        let filteredLessons = lessonsData;
        if (activityType) {
          console.log(`🎯 [CombinedLessonScreen] Filtrando por tipo de actividad: ${activityType}`);
          filteredLessons = lessonsData;
        }
        
        // Ordenar por sort_order y luego por título
        const sortedLessons = filteredLessons.sort((a, b) => {
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
          }
          return a.title.localeCompare(b.title);
        });
        
        // Guardar datos originales
        setRawLessons(sortedLessons);
        
        // Procesar inmediatamente para el idioma actual
        processLessonsForLanguage(sortedLessons);
        
        console.log(`✅ [CombinedLessonScreen] ${sortedLessons.length} lecciones cargadas desde servidor`);
      } else {
        console.log('❌ [CombinedLessonScreen] Categoría no encontrada');
        setLessons([]);
      }
    } catch (error) {
      console.error('❌ [CombinedLessonScreen] Error loading lessons:', error);
      Alert.alert(
        t.errors.connectionError,
        t.lessons.noLessons,
        [
          { text: t.common.retry, onPress: loadLessons },
          { text: t.common.cancel, style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const processLessonsForLanguage = async (lessonsToProcess?: Lesson[]) => {
    const sourceLessons = lessonsToProcess || rawLessons;
    
    if (sourceLessons.length === 0) {
      console.log('⚠️ [CombinedLessonScreen] No hay lecciones para procesar');
      return;
    }
    
    console.log(`🔄 [CombinedLessonScreen] Cargando todos los pasos de ${sourceLessons.length} lecciones...`);
    
    // Si hay un tipo de actividad específico, obtener su ID
    let activityTypeId = null;
    if (activityType) {
      try {
        const activities = await ApiService.getActivities();
        const selectedActivity = activities.find(activity => activity.name === activityType);
        if (selectedActivity) {
          activityTypeId = selectedActivity.ID;
          console.log(`🎯 [CombinedLessonScreen] Filtrando por tipo de actividad: ${activityType} (ID: ${activityTypeId})`);
        }
      } catch (error) {
        console.error('❌ Error obteniendo tipos de actividad:', error);
      }
    }
    
    // Cargar todos los pasos de todas las lecciones
    const allStepsPromises = sourceLessons.map(async (lesson) => {
      try {
        const stepsData = await ApiService.getStepsByLessonWithOptions(lesson.ID);
        
        // Filtrar pasos por tipo de actividad si está especificado
        let filteredSteps = stepsData;
        if (activityTypeId) {
          filteredSteps = stepsData.filter(step => step.activity_type_id === activityTypeId);
          console.log(`🔍 [CombinedLessonScreen] Lección "${lesson.title}": ${stepsData.length} pasos → ${filteredSteps.length} filtrados`);
        }
        
        // Si no hay pasos que coincidan con el filtro, retornar array vacío
        if (filteredSteps.length === 0) {
          return [];
        }
        
        // Procesar textos bilingües de la lección
        const processedLessonTitle = BilingualTextProcessor.extractText(lesson.title || '', language);
        const processedLessonDescription = BilingualTextProcessor.extractText(lesson.description || '', language);
        
        // Procesar cada paso y agregar información de la lección
        return filteredSteps.map(step => {
          const processedStepText = BilingualTextProcessor.extractText(step.text || '', language);
          
          return {
            ...step,
            text: processedStepText,
            description: processedLessonDescription, // Usar la descripción de la lección, no del paso
            lessonTitle: processedLessonTitle,
            lessonIcon: lesson.icon,
            lessonDescription: processedLessonDescription,
          } as StepWithLesson;
        });
      } catch (error) {
        console.error(`❌ Error cargando pasos para lección ${lesson.ID}:`, error);
        return [];
      }
    });
    
    const allStepsArrays = await Promise.all(allStepsPromises);
    const flattenedSteps = allStepsArrays.flat();
    
    // Ordenar por lección y luego por sort_order
    const sortedSteps = flattenedSteps.sort((a, b) => {
      // Primero por lección (usando el ID de la lección)
      if (a.lesson_id !== b.lesson_id) {
        return a.lesson_id - b.lesson_id;
      }
      // Luego por sort_order dentro de la lección
      return a.sort_order - b.sort_order;
    });
    
    console.log(`✅ [CombinedLessonScreen] ${sortedSteps.length} pasos cargados y procesados${activityType ? ` para actividad "${activityType}"` : ''}`);
    setAllSteps(sortedSteps);
  };

  const loadStepsForLesson = async (lessonId: number) => {
    try {
      console.log(`📝 [CombinedLessonScreen] Cargando pasos para lección ID: ${lessonId}`);
      
      // Cargar pasos por lección con opciones
      const stepsData = await ApiService.getStepsByLessonWithOptions(lessonId);
      
      // Ordenar por sort_order
      const sortedSteps = stepsData.sort((a, b) => a.sort_order - b.sort_order);
      
      console.log(`✅ [CombinedLessonScreen] ${sortedSteps.length} pasos cargados para lección ${lessonId}`);
      
      return sortedSteps;
    } catch (error) {
      console.error(`❌ [CombinedLessonScreen] Error loading steps for lesson ${lessonId}:`, error);
      return [];
    }
  };

  const toggleLessonExpansion = async (lessonId: number) => {
    setLessons(prevLessons => 
      prevLessons.map(lesson => {
        if (lesson.ID === lessonId) {
          const newExpanded = !lesson.expanded;
          
          // Si se está expandiendo y no tiene pasos cargados, cargarlos
          if (newExpanded && (!lesson.steps || lesson.steps.length === 0)) {
            // Marcar como loading
            const updatedLesson = { ...lesson, expanded: newExpanded, loading: true };
            
            // Cargar pasos de forma asíncrona
            loadStepsForLesson(lessonId).then(steps => {
              setLessons(currentLessons => 
                currentLessons.map(l => 
                  l.ID === lessonId 
                    ? { ...l, steps, loading: false }
                    : l
                )
              );
            });
            
            return updatedLesson;
          }
          
          return { ...lesson, expanded: newExpanded };
        }
        return lesson;
      })
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLessons();
    setRefreshing(false);
  };

  // Funciones para manejar pasos (copiadas del LessonScreen)
  const extractActivityType = (bilingualText: string): string => {
    if (bilingualText.includes(':')) {
      return bilingualText.split(':')[0].trim();
    }
    return bilingualText;
  };

  const getActivityAnimationType = (activityType: string): string => {
    const cleanType = extractActivityType(activityType);
    switch (cleanType) {
      case 'Memoria visual':
        return 'memoryGame';
      case 'Arrastra y suelta':
        return 'dragDrop';
      case 'Asocia elementos':
        return 'match';
      case 'Selecciona la opción correcta':
        return 'selectOption';
      case 'Ordena los pasos':
        return 'orderSteps';
      case 'Reconocimiento de patrones':
        return 'patternRecognition';
      default:
        return 'selectOption';
    }
  };

  const navigateToActivity = (activityType: string, convertedStep: any, lessonTitle: string) => {
    const cleanActivityType = extractActivityType(activityType);
    
    console.log(`🚀 [CombinedLessonScreen] Navegando a actividad: "${activityType}" → "${cleanActivityType}"`);
    
    switch (cleanActivityType) {
      case 'Memoria visual':
        navigation.replace('memoryGame', { step: convertedStep, lessonTitle });
        break;
      case 'Arrastra y suelta':
        navigation.replace('dragDrop', { step: convertedStep, lessonTitle });
        break;
      case 'Asocia elementos':
        navigation.replace('match', { step: convertedStep, lessonTitle });
        break;
      case 'Selecciona la opción correcta':
        navigation.replace('selectOption', { step: convertedStep, lessonTitle });
        break;
      case 'Ordena los pasos':
        navigation.replace('orderSteps', { step: convertedStep, lessonTitle });
        break;
      case 'Reconocimiento de patrones':
        navigation.replace('patternRecognition', { step: convertedStep, lessonTitle });
        break;
      default:
        navigation.replace('selectOption', { step: convertedStep, lessonTitle });
        break;
    }
  };

  const showIntroAndNavigate = (activityType: string, convertedStep: any, lessonTitle: string) => {
    setPendingNavigation({ activityType, step: convertedStep, lessonTitle });
    setShowIntro(true);
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    if (pendingNavigation) {
      navigateToActivity(pendingNavigation.activityType, pendingNavigation.step, pendingNavigation.lessonTitle);
      setPendingNavigation(null);
    }
  };

  const goToStep = async (step: Step, lessonTitle: string) => {
    try {
      // Cargar las opciones del paso si no están cargadas
      let stepWithOptions = step;
      if (!step.Options || step.Options.length === 0) {
        const options = await ApiService.getOptionsByStep(step.ID);
        stepWithOptions = { ...step, Options: options };
      }

      // Convertir el paso de la API al formato esperado por las pantallas de juego
      const convertedStep = {
        id: step.ID,
        text: step.text,
        icon: step.icon,
        completed: false,
        activityType: step.ActivityType?.name || 'Selecciona la opción correcta',
        options: stepWithOptions.Options?.map(option => ({
          icon: option.icon,
          label: option.label,
          correct: option.is_correct,
          correctZone: option.correct_zone,
          order: option.order_value,
        })) || [],
        helpMessage: step.help_message,
        description: step.description,
        image: step.image,
        patternType: step.pattern_type as any,
        sequence: step.sequence ? step.sequence.split(',') : [],
        missingPosition: step.missing_position,
        difficulty: step.difficulty as any,
      };

      // Detectar si debería ser "Ordena los pasos" basándose en las opciones
      let activityType = step.ActivityType?.name || 'Selecciona la opción correcta';
      const cleanActivityType = extractActivityType(activityType);
      
      if (cleanActivityType === 'Selecciona la opción correcta') {
        const hasOrderValues = stepWithOptions.Options?.some(option => 
          option.order_value !== null && option.order_value !== undefined && option.order_value > 0
        );
        
        if (hasOrderValues) {
          activityType = 'Ordena los pasos';
          convertedStep.activityType = 'Ordena los pasos';
        }
      }

      // Mostrar introducción antes de navegar a la actividad
      showIntroAndNavigate(activityType, convertedStep, lessonTitle);
    } catch (error) {
      console.error('Error loading step options:', error);
      Alert.alert('Error', 'No se pudieron cargar las opciones del paso.');
    }
  };

  const getActivityTypeColor = (activityType: string) => {
    const cleanType = extractActivityType(activityType);
    const colorMap: { [key: string]: string } = {
      'Selecciona la opción correcta': '#4CAF50',
      'Ordena los pasos': '#2196F3',
      'Arrastra y suelta': '#FF9800',
      'Asocia elementos': '#9C27B0',
      'Memoria visual': '#F44336',
      'Reconocimiento de patrones': '#607D8B',
    };
    return colorMap[cleanType] || '#4285f4';
  };

  const getActivityTypeIcon = (activityType: string) => {
    const cleanType = extractActivityType(activityType);
    const iconMap: { [key: string]: string } = {
      'Selecciona la opción correcta': '✅',
      'Ordena los pasos': '🔢',
      'Arrastra y suelta': '👆',
      'Asocia elementos': '🔗',
      'Memoria visual': '🧠',
      'Reconocimiento de patrones': '🧩',
    };
    return iconMap[cleanType] || '🎯';
  };

  const getLessonColors = (index: number) => {
    return accentColors[index % accentColors.length];
  };

  const categoryColor = selectedCategory?.color || '#4285f4';
  const categoryIcon = selectedCategory?.icon || '📚';

  // Procesar el nombre de la categoría para mostrar solo en el idioma actual
  const processedCategoryName = selectedCategory 
    ? BilingualTextProcessor.extractText(selectedCategory.name, language)
    : BilingualTextProcessor.extractText(category, language);

  const renderLoadingState = () => (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: categoryColor }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← {t.common.back}</Text>
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={styles.categoryIconContainer}>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.categoryTitle}>{processedCategoryName}</Text>
              <Text style={styles.categorySubtitle}>
                {language === 'es' ? 'Cargando lecciones...' : 'Loading lessons...'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>
          {language === 'es' ? 'Cargando lecciones...' : 'Loading lessons...'}
        </Text>
      </View>
    </SafeAreaView>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📚</Text>
      <Text style={styles.emptyStateTitle}>
        {activityType 
          ? (language === 'es' 
              ? 'No hay lecciones para esta actividad'
              : 'No lessons for this activity')
          : t.lessons.noLessons
        }
      </Text>
      <Text style={styles.emptyStateText}>
        {activityType 
          ? (language === 'es' 
              ? `No se encontraron lecciones de "${activityType}" en la categoría "${processedCategoryName}". ¡Pronto agregaremos más contenido!`
              : `No "${activityType}" lessons found in category "${processedCategoryName}". We'll add more content soon!`)
          : (language === 'es'
              ? 'Pronto agregaremos más contenido para esta categoría'
              : 'We will add more content for this category soon')
        }
      </Text>
      {activityType && (
        <TouchableOpacity 
          style={styles.emptyStateButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.emptyStateButtonText}>
            ← {t.common.back} {t.categories.title}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return renderLoadingState();
  }

  // Mostrar animación de introducción si está activa
  if (showIntro && pendingNavigation) {
    return (
      <GameIntroAnimation
        activityType={getActivityAnimationType(pendingNavigation.activityType)}
        onComplete={handleIntroComplete}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={categoryColor} />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { backgroundColor: categoryColor },
          {
            opacity: headerAnimation,
            transform: [{
              translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-30, 0],
              })
            }]
          }
        ]}
      >
        {/* Top row con botón volver */}
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← {t.common.back}</Text>
          </TouchableOpacity>
          
          <View style={styles.headerSpacer} />
        </View>
        
        {/* Título */}
        <View style={styles.headerContent}>
          <Text style={styles.categoryTitle}>{processedCategoryName}</Text>
        </View>

        {/* Barra de progreso */}
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                })
              }
            ]} 
          />
        </View>
      </Animated.View>

      {/* Lista de lecciones combinada */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: cardsAnimation,
            transform: [{
              translateY: cardsAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              })
            }]
          }
        ]}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[categoryColor]}
              tintColor={categoryColor}
            />
          }
        >
                    
          {allSteps.length === 0 ? (
            renderEmptyState()
          ) : (
            allSteps.map((step, index) => {
              const colors = getLessonColors(index);
              const activityType = step.ActivityType?.name || 'Selecciona la opción correcta';
              const activityColor = getActivityTypeColor(activityType);
              const activityIcon = getActivityTypeIcon(activityType);
              
              return (
                <TouchableOpacity
                  key={step.ID}
                  style={[
                    styles.questionCard,
                    { 
                      backgroundColor: colors.bg,
                      shadowColor: colors.shadow,
                      borderWidth: 2,
                      borderColor: colors.accent,
                    }
                  ]}
                  onPress={() => goToStep(step, step.lessonTitle || '')}
                  activeOpacity={0.9}
                >
                  <View style={styles.questionCardContent}>
                    <View style={[
                      styles.questionIconContainer,
                      { backgroundColor: `${activityColor}20` }
                    ]}>
                      <Text style={styles.questionIcon}>{step.icon}</Text>
                    </View>
                    
                    <View style={styles.questionInfo}>
                      <Text style={[styles.questionTitle, { color: '#111827' }]} numberOfLines={3}>
                        {step.text}
                      </Text>
                      
                      {step.description && (
                        <Text style={[styles.questionDescription, { color: '#374151' }]} numberOfLines={2}>
                          {step.description}
                        </Text>
                      )}
                    </View>

                    <View style={styles.questionActions}>
                      <View style={[styles.playButton, { backgroundColor: activityColor }]}>
                        <Text style={styles.playButtonText}>▶</Text>
                      </View>
                    </View>
                  </View>

                  {/* Accent Dot */}
                  <View style={[styles.accentDot, { backgroundColor: colors.accent }]} />
                </TouchableOpacity>
              );
            })
          )}

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 70,
  },
  headerContent: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  titleInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  categorySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
    marginTop: -10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  lessonContainer: {
    marginBottom: 16,
  },
  lessonCard: {
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
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
  lessonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonIcon: {
    fontSize: 24,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  lessonDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  lessonActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  expandButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
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
  stepsContainer: {
    marginTop: 8,
    paddingLeft: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
  },
  stepsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  stepsLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  stepCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  stepCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepIcon: {
    fontSize: 20,
  },
  stepInfo: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 18,
    flex: 1,
    marginRight: 8,
  },
  activityTypeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTypeIcon: {
    fontSize: 12,
    color: 'white',
  },
  stepDescription: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 16,
  },
  stepActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  playButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '800',
    marginLeft: 1,
  },
  helpMessageContainer: {
    backgroundColor: '#fff3cd',
    borderTopWidth: 1,
    borderTopColor: '#ffeaa7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpMessageIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  helpMessageText: {
    fontSize: 10,
    color: '#856404',
    fontWeight: '500',
    flex: 1,
    lineHeight: 14,
  },
  noStepsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  noStepsIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noStepsText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  bottomSpacing: {
    height: 20,
  },
  questionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  questionCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionIcon: {
    fontSize: 24,
  },
  questionInfo: {
    flex: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    flex: 1,
    marginRight: 8,
  },
  questionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  questionActions: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  lessonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  lessonBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  lessonBadgeText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
});

export default CombinedLessonScreen;