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
import ApiService, { Lesson, Category } from '../services/ApiService';
import { useLanguage } from '../contexts/LanguageContext';
import BilingualTextProcessor from '../utils/BilingualTextProcessor';

const { width } = Dimensions.get('window');

type LessonListScreenRouteProp = RouteProp<RootStackParamList, 'lessonList'>;

const LessonListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<LessonListScreenRouteProp>();
  const { t, language } = useLanguage();
  const { category, activityType } = route.params;

  // Estados
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [rawLessons, setRawLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

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
      console.log(`🌍 [LessonListScreen] Procesando ${rawLessons.length} lecciones para idioma: ${language}`);
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
      console.log('📂 [LessonListScreen] Cargando categorías...');
      const categoriesData = await ApiService.getCategories();
      setCategories(categoriesData);
      
      // Encontrar la categoría seleccionada por nombre
      const foundCategory = categoriesData.find(cat => cat.name === category);
      setSelectedCategory(foundCategory || null);
      console.log(`✅ [LessonListScreen] Categoría encontrada: ${foundCategory?.name || 'No encontrada'}`);
    } catch (error) {
      console.error('❌ [LessonListScreen] Error loading categories:', error);
    }
  };

  const loadLessons = async () => {
    try {
      setLoading(true);
      console.log(`📚 [LessonListScreen] Cargando lecciones para categoría: ${category}`);
      
      // Primero obtener todas las categorías para encontrar el ID
      const categoriesData = await ApiService.getCategories();
      const foundCategory = categoriesData.find(cat => cat.name === category);
      
      if (foundCategory) {
        console.log(`✅ [LessonListScreen] Categoría encontrada: ID ${foundCategory.ID}`);
        // Cargar lecciones por categoría
        const lessonsData = await ApiService.getLessonsByCategory(foundCategory.ID);
        console.log(`📋 [LessonListScreen] ${lessonsData.length} lecciones cargadas`);
        
        console.log('📋 [LessonListScreen] Datos originales del servidor:');
        lessonsData.forEach((lesson, index) => {
          console.log(`  ${index + 1}. ID: ${lesson.ID}`);
          console.log(`     Title: "${lesson.title}"`);
          console.log(`     Description: "${lesson.description}"`);
          console.log(`     Has colon in title: ${lesson.title?.includes(':') || false}`);
          console.log(`     Has colon in description: ${lesson.description?.includes(':') || false}`);
          console.log(`     Is active: ${lesson.is_active}`);
        });
        
        // Filtrar por activityType si está presente
        let filteredLessons = lessonsData;
        if (activityType) {
          console.log(`🎯 [LessonListScreen] Filtrando por tipo de actividad: ${activityType}`);
          // Aquí podrías implementar filtrado por tipo de actividad
          // Por ahora mostramos todas las lecciones de la categoría
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
        
        console.log(`✅ [LessonListScreen] ${sortedLessons.length} lecciones cargadas desde servidor`);
      } else {
        console.log('❌ [LessonListScreen] Categoría no encontrada');
        setLessons([]);
      }
    } catch (error) {
      console.error('❌ [LessonListScreen] Error loading lessons:', error);
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

  const processLessonsForLanguage = (lessonsToProcess?: Lesson[]) => {
    const sourceLessons = lessonsToProcess || rawLessons;
    
    console.log(`🌍 [LessonListScreen] NUEVO PROCESAMIENTO - ${sourceLessons.length} lecciones para idioma: ${language}`);
    console.log(`🔧 [LessonListScreen] BilingualTextProcessor disponible: ${typeof BilingualTextProcessor}`);
    
    if (sourceLessons.length === 0) {
      console.log('⚠️ [LessonListScreen] No hay lecciones para procesar');
      return;
    }
    
    // Procesar textos bilingües
    const processedLessons = sourceLessons.map((lesson, index) => {
      const originalTitle = lesson.title || '';
      const originalDescription = lesson.description || '';
      
      console.log(`🧪 [LessonListScreen] ANTES del procesamiento ${index + 1}:`);
      console.log(`   Original title: "${originalTitle}"`);
      console.log(`   Tiene colon: ${originalTitle.includes(':')}`);
      
      const processedTitle = BilingualTextProcessor.extractText(originalTitle, language);
      const processedDescription = BilingualTextProcessor.extractText(originalDescription, language);
      
      console.log(`🎯 [LessonListScreen] DESPUÉS del procesamiento ${index + 1}:`);
      console.log(`   Processed title: "${processedTitle}"`);
      console.log(`   Language usado: ${language}`);
      console.log(`   Cambió: ${originalTitle !== processedTitle ? 'SÍ' : 'NO'}`);
      
      return {
        ...lesson,
        title: processedTitle,
        description: processedDescription,
      };
    });
    
    console.log(`✅ [LessonListScreen] RESULTADO FINAL - Lecciones procesadas para idioma: ${language}`);
    console.log('📋 [LessonListScreen] Lista completa procesada:');
    processedLessons.forEach((lesson, index) => {
      console.log(`  ${index + 1}. "${lesson.title}"`);
    });
    
    setLessons(processedLessons);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLessons();
    setRefreshing(false);
  };

  const goToLesson = (lesson: Lesson) => {
    console.log(`📖 [LessonListScreen] Navegando a lección: ${lesson.title}`);
    // Usar el título original para la navegación (el servidor espera el título original)
    const originalLesson = rawLessons.find(orig => orig.ID === lesson.ID);
    const lessonTitle = originalLesson ? originalLesson.title : lesson.title;
    
    // Convertir la lección de la API al formato esperado por la pantalla de lección
    const convertedLesson = {
      id: lesson.ID,
      title: lessonTitle,
      icon: lesson.icon,
      completed: false, // Por ahora, todas las lecciones están incompletas
      steps: [], // Los pasos se cargarían desde la API
      category: lesson.Category.name,
    };
    
    navigation.navigate('lesson', { lesson: convertedLesson });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return t.language === 'es' ? 'Fácil' : 'Easy';
      case 'medium': return t.language === 'es' ? 'Medio' : 'Medium';
      case 'hard': return t.language === 'es' ? 'Difícil' : 'Hard';
      default: return t.language === 'es' ? 'Normal' : 'Normal';
    }
  };

  const categoryColor = selectedCategory?.color || '#4285f4';
  const categoryIcon = selectedCategory?.icon || '📚';

  // Calcular progreso (simulado por ahora)
  const completedLessons = 0; // Por ahora, ninguna lección está completada
  const progressPercentage = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;

  const renderLoadingState = () => (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: categoryColor }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← {t.common.back}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={styles.categoryIconContainer}>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.categoryTitle}>{category}</Text>
              <Text style={styles.categorySubtitle}>
                {t.language === 'es' ? 'Cargando lecciones...' : 'Loading lessons...'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>
          {t.language === 'es' ? 'Cargando lecciones...' : 'Loading lessons...'}
        </Text>
      </View>
    </SafeAreaView>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📚</Text>
      <Text style={styles.emptyStateTitle}>
        {activityType 
          ? (t.language === 'es' 
              ? 'No hay lecciones para esta actividad'
              : 'No lessons for this activity')
          : t.lessons.noLessons
        }
      </Text>
      <Text style={styles.emptyStateText}>
        {activityType 
          ? (t.language === 'es' 
              ? `No se encontraron lecciones de "${activityType}" en la categoría "${category}". ¡Pronto agregaremos más contenido!`
              : `No "${activityType}" lessons found in category "${category}". We'll add more content soon!`)
          : (t.language === 'es'
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
        {/* Top row con botón volver y progreso */}
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← {t.common.back}</Text>
          </TouchableOpacity>
          
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{Math.round(progressPercentage)}%</Text>
          </View>
        </View>
        
        {/* Título */}
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={styles.categoryIconContainer}>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.categoryTitle}>{category}</Text>
              <Text style={styles.categorySubtitle}>
                {completedLessons}/{lessons.length} {t.language === 'es' ? 'completadas' : 'completed'}
              </Text>
            </View>
          </View>
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

      {/* Lista de lecciones */}
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
          {/* Indicador de filtrado activo */}
          {activityType && (
            <View style={styles.filterIndicator}>
              <Text style={styles.filterIcon}>🎯</Text>
              <Text style={styles.filterText}>
                {t.language === 'es' ? 'Filtrando por' : 'Filtering by'}: {activityType}
              </Text>
            </View>
          )}

          {/* Status */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              🌍 {language === 'es' 
                ? `Lecciones bilingües • Idioma: Español • ${lessons.length} lecciones`
                : `Bilingual lessons • Language: English • ${lessons.length} lessons`
              }
            </Text>
          </View>

          <Text style={styles.sectionTitle}>
            {t.lessons.available} ({lessons.length})
          </Text>
          
          {lessons.length === 0 ? (
            renderEmptyState()
          ) : (
            lessons.map((lesson, index) => (
              <TouchableOpacity
                key={lesson.ID}
                style={[
                  styles.lessonCard,
                  !lesson.is_active && styles.lessonCardInactive
                ]}
                onPress={() => lesson.is_active && goToLesson(lesson)}
                activeOpacity={lesson.is_active ? 0.8 : 1}
              >
                <View style={styles.lessonCardContent}>
                  <View style={[
                    styles.lessonIconContainer,
                    { backgroundColor: `${categoryColor}15` },
                    !lesson.is_active && styles.lessonIconContainerInactive
                  ]}>
                    <Text style={styles.lessonIcon}>{lesson.icon}</Text>
                  </View>
                  
                  <View style={styles.lessonInfo}>
                    <View style={styles.lessonHeader}>
                      <Text style={[
                        styles.lessonTitle,
                        !lesson.is_active && styles.lessonTitleInactive
                      ]}>
                        {lesson.title}
                      </Text>
                      <View style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyColor(lesson.difficulty) }
                      ]}>
                        <Text style={styles.difficultyText}>
                          {getDifficultyLabel(lesson.difficulty)}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={[
                      styles.lessonDescription,
                      !lesson.is_active && styles.lessonDescriptionInactive
                    ]} numberOfLines={2}>
                      {lesson.description}
                    </Text>
                    
                    <View style={styles.lessonMeta}>
                      <View style={styles.lessonMetaItem}>
                        <Text style={styles.lessonMetaIcon}>
                          {lesson.is_active ? '✅' : '❌'}
                        </Text>
                        <Text style={styles.lessonMetaText}>
                          {lesson.is_active 
                            ? (t.language === 'es' ? 'Activa' : 'Active')
                            : (t.language === 'es' ? 'Inactiva' : 'Inactive')
                          }
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.lessonActions}>
                    {lesson.is_active ? (
                      <View style={[styles.startButton, { backgroundColor: categoryColor }]}>
                        <Text style={styles.startButtonText}>{t.lessons.start}</Text>
                      </View>
                    ) : (
                      <View style={styles.inactiveButton}>
                        <Text style={styles.inactiveButtonText}>{t.lessons.notAvailable}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
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
    backgroundColor: '#f8faff',
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
  progressBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 20,
    fontWeight: '800',
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
  filterIndicator: {
    backgroundColor: '#e8f0fe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4285f4',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285f4',
  },
  statusContainer: {
    backgroundColor: '#e8f5e8',
    marginHorizontal: 0,
    marginBottom: 16,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  statusText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  lessonCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  lessonCardInactive: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    opacity: 0.7,
  },
  lessonCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  lessonIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonIconContainerInactive: {
    backgroundColor: '#f1f3f4',
  },
  lessonIcon: {
    fontSize: 24,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  lessonTitleInactive: {
    color: '#6b7280',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  lessonDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  lessonDescriptionInactive: {
    color: '#9ca3af',
  },
  lessonMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lessonMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8faff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  lessonMetaIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  lessonMetaText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  lessonActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  startButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  inactiveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#e9ecef',
  },
  inactiveButtonText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
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
});

export default LessonListScreen;