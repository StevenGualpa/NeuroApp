import React, { useEffect, useRef } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LESSONS_DATA } from '../data/lessons';
import type { Lesson } from '../data/lessons';

const { width } = Dimensions.get('window');

const SubLessonListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'sublessonList'>>();
  const { category, activityType } = route.params;

  // Animation refs
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const cardsAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current; // Animación separada para el progreso

  const filteredLessons: Lesson[] = LESSONS_DATA.filter(
    (lesson) => {
      // Filtrar por categoría
      if (lesson.category !== category) return false;
      
      // Si hay activityType, filtrar también por tipo de actividad
      if (activityType) {
        return lesson.steps.some(step => step.activityType === activityType);
      }
      
      // Si no hay activityType, mostrar todas las lecciones de la categoría
      return true;
    }
  );

  const completedLessons = filteredLessons.filter(lesson => lesson.completed).length;
  const progressPercentage = filteredLessons.length > 0 ? (completedLessons / filteredLessons.length) * 100 : 0;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true, // Puede usar native driver porque solo anima opacity y translateY
      }),
      Animated.parallel([
        Animated.timing(cardsAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true, // Puede usar native driver porque solo anima opacity y translateY
        }),
        Animated.timing(progressAnimation, {
          toValue: progressPercentage,
          duration: 1000,
          useNativeDriver: false, // NO puede usar native driver porque anima width
        }),
      ]),
    ]).start();
  }, [progressPercentage]);

  const goToLesson = (lesson: Lesson) => {
    navigation.navigate('lesson', { lesson });
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'Higiene Personal': '🧼',
      'Seguridad en el hogar': '🏠',
      'Normas Viales y Transporte': '🚦',
      'Actividades Escolares': '📚',
      'Alimentación Saludable': '🥗',
      'Socialización': '👥',
      'Transporte y Movilidad': '🚌',
      'Emociones': '😊',
      'Objetos Escolares': '✏️',
      'Lenguaje y Comunicación': '🗣️',
      'Medio Ambiente': '🌱',
    };
    return iconMap[category] || '📘';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'Higiene Personal': '#4ECDC4',
      'Seguridad en el hogar': '#FF6B6B',
      'Normas Viales y Transporte': '#4285f4',
      'Actividades Escolares': '#9B59B6',
      'Alimentación Saludable': '#2ECC71',
      'Socialización': '#F39C12',
      'Transporte y Movilidad': '#3498DB',
      'Emociones': '#E74C3C',
      'Objetos Escolares': '#1ABC9C',
      'Lenguaje y Comunicación': '#8E44AD',
      'Medio Ambiente': '#27AE60',
    };
    return colorMap[category] || '#4285f4';
  };

  const categoryColor = getCategoryColor(category);
  const categoryIcon = getCategoryIcon(category);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={categoryColor} />
      
      {/* Header compacto */}
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
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{Math.round(progressPercentage)}%</Text>
          </View>
        </View>
        
        {/* Título compacto */}
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={styles.categoryIconContainer}>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.categoryTitle}>{category}</Text>
              <Text style={styles.categorySubtitle}>
                {activityType 
                  ? `${activityType} • ${completedLessons}/${filteredLessons.length} completadas`
                  : `${completedLessons}/${filteredLessons.length} completadas`
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Barra de progreso compacta */}
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

      {/* Lista de lecciones con más espacio */}
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
        >
          {/* Indicador de filtrado activo */}
          {activityType && (
            <View style={styles.filterIndicator}>
              <Text style={styles.filterIcon}>🎯</Text>
              <Text style={styles.filterText}>
                Filtrando por: {activityType}
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>
            {activityType 
              ? `Lecciones Disponibles (${filteredLessons.length})`
              : `Lecciones Disponibles (${filteredLessons.length})`
            }
          </Text>
          
          {filteredLessons.map((lesson, index) => (
            <TouchableOpacity
              key={lesson.id}
              style={[
                styles.lessonCard,
                lesson.completed && styles.lessonCardCompleted
              ]}
              onPress={() => goToLesson(lesson)}
              activeOpacity={0.8}
            >
              <View style={styles.lessonCardContent}>
                <View style={[
                  styles.lessonIconContainer,
                  { backgroundColor: `${categoryColor}15` },
                  lesson.completed && styles.lessonIconContainerCompleted
                ]}>
                  <Text style={styles.lessonIcon}>{lesson.icon}</Text>
                </View>
                
                <View style={styles.lessonInfo}>
                  <Text style={[
                    styles.lessonTitle,
                    lesson.completed && styles.lessonTitleCompleted
                  ]}>
                    {lesson.title}
                  </Text>
                  <View style={styles.lessonMeta}>
                    <Text style={styles.lessonSteps}>
                      {lesson.steps.length} {lesson.steps.length === 1 ? 'paso' : 'pasos'}
                    </Text>
                    {lesson.completed && (
                      <View style={styles.completedTag}>
                        <Text style={styles.completedTagText}>✓ Completado</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.lessonActions}>
                  {lesson.completed ? (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedIcon}>✓</Text>
                    </View>
                  ) : (
                    <View style={[styles.startButton, { backgroundColor: categoryColor }]}>
                      <Text style={styles.startButtonText}>Iniciar</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Empty state */}
          {filteredLessons.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📚</Text>
              <Text style={styles.emptyStateTitle}>
                {activityType 
                  ? 'No hay lecciones para esta actividad'
                  : 'No hay lecciones disponibles'
                }
              </Text>
              <Text style={styles.emptyStateText}>
                {activityType 
                  ? `No se encontraron lecciones de "${activityType}" en la categoría "${category}". ¡Pronto agregaremos más contenido!`
                  : 'Pronto agregaremos más contenido para esta categoría'
                }
              </Text>
              {activityType && (
                <TouchableOpacity 
                  style={styles.emptyStateButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.emptyStateButtonText}>← Volver a Categorías</Text>
                </TouchableOpacity>
              )}
            </View>
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
  lessonCardCompleted: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e8f5e8',
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
  lessonIconContainerCompleted: {
    backgroundColor: '#e8f5e8',
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
    marginBottom: 4,
    lineHeight: 20,
  },
  lessonTitleCompleted: {
    color: '#4caf50',
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lessonSteps: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  completedTag: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completedTagText: {
    fontSize: 10,
    color: '#4caf50',
    fontWeight: '600',
  },
  lessonActions: {
    alignItems: 'center',
  },
  startButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  startButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  completedBadge: {
    backgroundColor: '#4caf50',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  completedIcon: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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

export default SubLessonListScreen;