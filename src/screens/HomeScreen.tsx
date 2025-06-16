import React, { useEffect, useRef, useMemo } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { LESSONS_DATA } from '../data/lessons';
import type { RouteProp } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'home'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'home'>>();
  const activityType = route.params?.activityType;

  // Animation refs
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const cardsAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Filtrar categorías según el tipo de actividad (si se recibió)
  const categories = Array.from(
    new Set(
      LESSONS_DATA
        .filter(lesson =>
          activityType
            ? lesson.steps.some(step => step.activityType === activityType)
            : true
        )
        .map(lesson => lesson.category)
    )
  );

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const totalLessons = LESSONS_DATA.length;
    const completedLessons = LESSONS_DATA.filter(lesson => lesson.completed).length;
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  }, []);

  const getCategoryStats = (category: string) => {
    const categoryLessons = LESSONS_DATA.filter(lesson => lesson.category === category);
    const completedLessons = categoryLessons.filter(lesson => lesson.completed).length;
    return {
      total: categoryLessons.length,
      completed: completedLessons,
      percentage: categoryLessons.length > 0 ? (completedLessons / categoryLessons.length) * 100 : 0
    };
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

  const getActivityTypeIcon = (activityType?: string) => {
    const iconMap: { [key: string]: string } = {
      'Selecciona la opción correcta': '🎯',
      'Sí / No': '✅',
      'Asocia elementos': '🔗',
      'Memoria visual': '🧠',
      'Repetir sonidos': '🎵',
      'Arrastra y suelta': '🎯',
      'Ordena los pasos': '🔢',
    };
    return iconMap[activityType || ''] || '🌟';
  };

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(cardsAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const goToCategory = (category: string) => {
    navigation.navigate('sublessonList', { category });
  };

  const renderCategoryCard = (category: string, index: number) => {
    const stats = getCategoryStats(category);
    const categoryColor = getCategoryColor(category);
    const categoryIcon = getCategoryIcon(category);
    const isCompleted = stats.percentage === 100;

    return (
      <Animated.View
        key={index}
        style={[
          {
            opacity: cardsAnimation,
            transform: [{
              translateY: cardsAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }, {
              scale: cardsAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.categoryCard,
            isCompleted && styles.categoryCardCompleted
          ]}
          onPress={() => goToCategory(category)}
          activeOpacity={0.8}
        >
          <View style={styles.categoryCardContent}>
            <View style={[
              styles.categoryIconContainer,
              { backgroundColor: `${categoryColor}15` },
              isCompleted && styles.categoryIconContainerCompleted
            ]}>
              <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            </View>
            
            <View style={styles.categoryInfo}>
              <Text style={[
                styles.categoryTitle,
                isCompleted && styles.categoryTitleCompleted
              ]}>
                {category}
              </Text>
              <Text style={styles.categoryStats}>
                {stats.completed} de {stats.total} lecciones
              </Text>
              
              {/* Mini progress bar */}
              <View style={styles.miniProgressBar}>
                <View 
                  style={[
                    styles.miniProgressFill,
                    { 
                      width: `${stats.percentage}%`,
                      backgroundColor: categoryColor
                    }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.categoryActions}>
              {isCompleted ? (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedIcon}>✓</Text>
                </View>
              ) : (
                <View style={styles.progressBadge}>
                  <Text style={[styles.progressText, { color: categoryColor }]}>
                    {Math.round(stats.percentage)}%
                  </Text>
                </View>
              )}
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          </View>

          {isCompleted && (
            <View style={styles.completedRibbon}>
              <Text style={styles.completedRibbonText}>¡Completado!</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4285f4" />
      
      {/* Header mejorado */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerAnimation,
            transform: [{
              translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              })
            }]
          }
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleIcon}>
              {getActivityTypeIcon(activityType)}
            </Text>
            <Text style={styles.title}>
              {activityType ? activityType : 'Mis Normas Básicas'}
            </Text>
            <Text style={styles.subtitle}>
              {activityType 
                ? `Actividades de ${activityType.toLowerCase()}`
                : 'Aprende las normas básicas de convivencia'
              }
            </Text>
          </View>
        </View>

        {/* Overall Progress Section */}
        {!activityType && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Tu Progreso General</Text>
              <Text style={styles.progressPercentage}>{Math.round(overallProgress)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${overallProgress}%`],
                      })
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {LESSONS_DATA.filter(l => l.completed).length} de {LESSONS_DATA.length} lecciones completadas
              </Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <Text style={styles.sectionTitle}>
            {activityType ? 'Categorías Disponibles' : 'Explora por Categorías'}
          </Text>
          
          {categories.length > 0 ? (
            categories.map((category, index) => renderCategoryCard(category, index))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔍</Text>
              <Text style={styles.emptyStateTitle}>
                No hay categorías disponibles
              </Text>
              <Text style={styles.emptyStateText}>
                {activityType 
                  ? `No se encontraron categorías para "${activityType}"`
                  : 'Pronto agregaremos más contenido'
                }
              </Text>
            </View>
          )}

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  header: {
    backgroundColor: '#4285f4',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  progressSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  progressBarContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    marginTop: -15,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  categoryCardCompleted: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e8f5e8',
  },
  categoryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIconContainerCompleted: {
    backgroundColor: '#e8f5e8',
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 22,
  },
  categoryTitleCompleted: {
    color: '#4caf50',
  },
  categoryStats: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  miniProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e8f0fe',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryActions: {
    alignItems: 'center',
    gap: 8,
  },
  progressBadge: {
    backgroundColor: '#f0f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8f0fe',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  completedBadge: {
    backgroundColor: '#4caf50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  completedIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  arrowIcon: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '600',
  },
  completedRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  completedRibbonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  },
  bottomSpacing: {
    height: 40,
  },
});

export default HomeScreen;