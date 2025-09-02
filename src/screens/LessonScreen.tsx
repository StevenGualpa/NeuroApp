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
import ApiService, { Step, Option, Lesson } from '../services/ApiService';
import GameIntroAnimation from '../components/GameIntroAnimation';

const { width } = Dimensions.get('window');

type RealLessonScreenRouteProp = RouteProp<RootStackParamList, 'lesson'>;

const RealLessonScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RealLessonScreenRouteProp>();
  const { lesson } = route.params;

  // Estados
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lessonData, setLessonData] = useState<Lesson | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{
    activityType: string;
    step: any;
  } | null>(null);

  // Animation refs
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const cardsAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await loadSteps();
    
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

  const loadSteps = async () => {
    try {
      setLoading(true);
      
      // Cargar pasos por lección con opciones
      const stepsData = await ApiService.getStepsByLessonWithOptions(lesson.id);
      
      // Ordenar por sort_order
      const sortedSteps = stepsData.sort((a, b) => a.sort_order - b.sort_order);
      
      setSteps(sortedSteps);
      
      // Si hay pasos, usar la información de la lección del primer paso
      if (sortedSteps.length > 0 && sortedSteps[0].Lesson) {
        setLessonData(sortedSteps[0].Lesson);
      }
      
    } catch (error) {
      console.error('Error loading steps:', error);
      Alert.alert(
        'Error de Conexión',
        'No se pudieron cargar los pasos de la lección. Verifica tu conexión a internet.',
        [
          { text: 'Reintentar', onPress: loadSteps },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSteps();
    setRefreshing(false);
  };

  // Función para extraer el tipo de actividad del formato bilingüe
  const extractActivityType = (bilingualText: string): string => {
    // Si contiene ":", extraer la parte en español (antes del ":")
    if (bilingualText.includes(':')) {
      return bilingualText.split(':')[0].trim();
    }
    return bilingualText;
  };

  // Mapeo de tipos de actividad a tipos de animación
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

  // Función para navegar a la actividad correspondiente
  const navigateToActivity = (activityType: string, convertedStep: any) => {
    // Extraer el tipo de actividad del formato bilingüe
    const cleanActivityType = extractActivityType(activityType);
    
    console.log(`🚀 [LessonScreen] Navegando a actividad: "${activityType}" → "${cleanActivityType}"`);
    console.log(`📊 [LessonScreen] Datos del paso convertido:`, {
      id: convertedStep.id,
      activityType: convertedStep.activityType,
      optionsCount: convertedStep.options?.length || 0,
    });
    
    switch (cleanActivityType) {
      case 'Memoria visual':
        console.log('🧠 [LessonScreen] → Navegando a memoryGame');
        navigation.replace('memoryGame', { step: convertedStep, lessonTitle: lesson.title });
        break;
      case 'Arrastra y suelta':
        console.log('👆 [LessonScreen] → Navegando a dragDrop');
        navigation.replace('dragDrop', { step: convertedStep, lessonTitle: lesson.title });
        break;
      case 'Asocia elementos':
        console.log('🔗 [LessonScreen] → Navegando a match');
        navigation.replace('match', { step: convertedStep, lessonTitle: lesson.title });
        break;
      case 'Selecciona la opción correcta':
        console.log('✅ [LessonScreen] → Navegando a selectOption');
        navigation.replace('selectOption', { step: convertedStep, lessonTitle: lesson.title });
        break;
      case 'Ordena los pasos':
        console.log('🔢 [LessonScreen] → Navegando a orderSteps');
        navigation.replace('orderSteps', { step: convertedStep, lessonTitle: lesson.title });
        break;
      case 'Reconocimiento de patrones':
        console.log('🧩 [LessonScreen] → Navegando a patternRecognition');
        navigation.replace('patternRecognition', { step: convertedStep, lessonTitle: lesson.title });
        break;
      default:
        console.log(`⚠️ [LessonScreen] → Tipo de actividad no reconocido: "${cleanActivityType}", usando selectOption por defecto`);
        navigation.replace('selectOption', { step: convertedStep, lessonTitle: lesson.title });
        break;
    }
  };

  // Función para mostrar la introducción y luego navegar
  const showIntroAndNavigate = (activityType: string, convertedStep: any) => {
    setPendingNavigation({ activityType, step: convertedStep });
    setShowIntro(true);
  };

  // Función que se ejecuta cuando termina la animación de introducción
  const handleIntroComplete = () => {
    setShowIntro(false);
    if (pendingNavigation) {
      navigateToActivity(pendingNavigation.activityType, pendingNavigation.step);
      setPendingNavigation(null);
    }
  };

  const goToStep = async (step: Step) => {
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

      // CORRECCIÓN: Detectar si debería ser "Ordena los pasos" basándose en las opciones
      let activityType = step.ActivityType?.name || 'Selecciona la opción correcta';
      
      // Extraer el tipo limpio del formato bilingüe
      const cleanActivityType = extractActivityType(activityType);
      
      // Si el tipo es "Selecciona la opción correcta" pero las opciones tienen order_value, 
      // entonces debería ser "Ordena los pasos"
      if (cleanActivityType === 'Selecciona la opción correcta') {
        const hasOrderValues = stepWithOptions.Options?.some(option => 
          option.order_value !== null && option.order_value !== undefined && option.order_value > 0
        );
        
        if (hasOrderValues) {
          console.log(`🔄 [LessonScreen] CORRECCIÓN: Detectado que debería ser "Ordena los pasos" por tener order_value`);
          console.log(`📊 [LessonScreen] Opciones con order_value:`, stepWithOptions.Options?.map(opt => ({
            label: opt.label,
            order_value: opt.order_value
          })));
          activityType = 'Ordena los pasos';
          convertedStep.activityType = 'Ordena los pasos';
        }
      }

      console.log(`🎯 [LessonScreen] Tipo de actividad final: "${activityType}"`);
      
      // Mostrar introducción antes de navegar a la actividad
      showIntroAndNavigate(activityType, convertedStep);
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

  // Usar datos de la lección original o de la API
  const displayLesson = lessonData || lesson;
  const lessonColor = displayLesson.Category?.color || '#4285f4';
  const lessonIcon = displayLesson.icon || '📚';

  // Calcular progreso (simulado por ahora)
  const completedSteps = 0; // Por ahora, ningún paso está completado
  const progressPercentage = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  const renderLoadingState = () => (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: lessonColor }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={styles.lessonIconContainer}>
              <Text style={styles.lessonIcon}>{lessonIcon}</Text>
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonSubtitle}>Cargando pasos...</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>Cargando pasos de la lección...</Text>
      </View>
    </SafeAreaView>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📝</Text>
      <Text style={styles.emptyStateTitle}>No hay pasos disponibles</Text>
      <Text style={styles.emptyStateText}>
        Esta lección aún no tiene pasos configurados. ¡Pronto agregaremos más contenido!
      </Text>
      <TouchableOpacity 
        style={styles.emptyStateButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.emptyStateButtonText}>← Volver a Lecciones</Text>
      </TouchableOpacity>
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
      <StatusBar barStyle="light-content" backgroundColor={lessonColor} />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { backgroundColor: lessonColor },
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
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          
          <View style={styles.headerSpacer} />
        </View>
        
        {/* Título */}
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <View style={styles.lessonIconContainer}>
              <Text style={styles.lessonIcon}>{lessonIcon}</Text>
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.lessonTitle}>{displayLesson.title}</Text>
              <Text style={styles.lessonSubtitle}>
                Pasos de la lección
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

      {/* Lista de pasos */}
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
              colors={[lessonColor]}
              tintColor={lessonColor}
            />
          }
        >
          <Text style={styles.sectionTitle}>
            Pasos de la Lección ({steps.length})
          </Text>
          
          {steps.length === 0 ? (
            renderEmptyState()
          ) : (
            steps.map((step, index) => {
              const activityType = step.ActivityType?.name || 'Selecciona la opción correcta';
              const activityColor = getActivityTypeColor(activityType);
              const activityIcon = getActivityTypeIcon(activityType);
              
              return (
                <TouchableOpacity
                  key={step.ID}
                  style={styles.stepCard}
                  onPress={() => goToStep(step)}
                  activeOpacity={0.8}
                >
                  <View style={styles.stepCardContent}>
                    <View style={[
                      styles.stepIconContainer,
                      { backgroundColor: `${activityColor}15` }
                    ]}>
                      <Text style={styles.stepIcon}>{step.icon}</Text>
                    </View>
                    
                    <View style={styles.stepInfo}>
                      <View style={styles.stepHeader}>
                        <Text style={styles.stepTitle} numberOfLines={2}>
                          {step.text}
                        </Text>
                        <View style={[
                          styles.activityTypeBadge,
                          { backgroundColor: activityColor }
                        ]}>
                          <Text style={styles.activityTypeIcon}>{activityIcon}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.stepDescription} numberOfLines={2}>
                        {step.description}
                      </Text>
                    </View>

                    <View style={styles.stepActions}>
                      <View style={[styles.playButton, { backgroundColor: activityColor }]}>
                        <Text style={styles.playButtonText}>▶</Text>
                      </View>
                    </View>
                  </View>
                  
                  {step.help_message && (
                    <View style={styles.helpMessageContainer}>
                      <Text style={styles.helpMessageIcon}>💡</Text>
                      <Text style={styles.helpMessageText} numberOfLines={2}>
                        {step.help_message}
                      </Text>
                    </View>
                  )}
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
  lessonIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonIcon: {
    fontSize: 24,
  },
  titleInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  lessonSubtitle: {
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
  stepCard: {
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
  stepCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  stepIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepIcon: {
    fontSize: 24,
  },
  stepInfo: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  activityTypeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTypeIcon: {
    fontSize: 14,
    color: 'white',
  },
  stepDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  stepActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  playButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '800',
    marginLeft: 2,
  },
  helpMessageContainer: {
    backgroundColor: '#fff3cd',
    borderTopWidth: 1,
    borderTopColor: '#ffeaa7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpMessageIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  helpMessageText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
    flex: 1,
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
});

export default RealLessonScreen;