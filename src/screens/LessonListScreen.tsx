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
      const categoriesData = await ApiService.getCategories();
      setCategories(categoriesData);
      
      // Encontrar la categoría seleccionada por nombre
      const foundCategory = categoriesData.find(cat => cat.name === category);
      setSelectedCategory(foundCategory || null);
    } catch (error) {
      console.error('❌ [LessonListScreen] Error loading categories:', error);
    }
  };

  const loadLessons = async () => {
    try {
      setLoading(true);
      
      // Primero obtener todas las categorías para encontrar el ID
      const categoriesData = await ApiService.getCategories();
      const foundCategory = categoriesData.find(cat => cat.name === category);
      
      if (foundCategory) {
        // Cargar lecciones por categoría
        const lessonsData = await ApiService.getLessonsByCategory(foundCategory.ID);
        
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
          <View style={styles.titleRow}>
            <View style={styles.categoryIconContainer}>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.categoryTitle}>{processedCategoryName}</Text>
              <Text style={styles.categorySubtitle}>
                {language === 'es' ? 'Lecciones disponibles' : 'Available lessons'}
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
          <Text style={styles.sectionTitle}>
            {t.lessons.available} ({lessons.length})
          </Text>
          
          {lessons.length === 0 ? (
            renderEmptyState()
          ) : (
            lessons.map((lesson, index) => (
              <TouchableOpacity
                key={lesson.ID}
                style={styles.lessonCard}
                onPress={() => goToLesson(lesson)}
                activeOpacity={0.8}
              >
                <View style={styles.lessonCardContent}>
                  <View style={[
                    styles.lessonIconContainer,
                    { backgroundColor: `${categoryColor}15` }
                  ]}>
                    <Text style={styles.lessonIcon}>{lesson.icon}</Text>
                  </View>
                  
                  <View style={styles.lessonInfo}>
                    <Text style={styles.lessonTitle}>
                      {lesson.title}
                    </Text>
                    
                    <Text style={styles.lessonDescription} numberOfLines={2}>
                      {lesson.description}
                    </Text>
                  </View>

                  <View style={styles.lessonActions}>
                    <View style={[styles.startButton, { backgroundColor: categoryColor }]}>
                      <Text style={styles.startButtonText}>{t.lessons.start}</Text>
                    </View>
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
  lessonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  lessonIcon: {
    fontSize: 24,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 20,
    marginBottom: 6,
  },
  lessonDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
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