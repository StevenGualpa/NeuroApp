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
import { useLanguage } from '../contexts/LanguageContext';
import BilingualTextProcessor from '../utils/BilingualTextProcessor';
import ActivityImage from '../components/ActivityImage';
import { useAuth } from '../hooks';
import AnalysisService, { NeurodivergentProfile } from '../services/AnalysisService';
import PersonalizationService, { ActivityPriority } from '../services/PersonalizationService';

const { width } = Dimensions.get('window');

// Paleta de colores de acento para actividades
const accentColors = [
  { bg: '#F9FAFB', accent: '#4F46E5', shadow: 'rgba(79, 70, 229, 0.15)' }, // Azul índigo
  { bg: '#F9FAFB', accent: '#22C55E', shadow: 'rgba(34, 197, 94, 0.15)' },  // Verde brillante
  { bg: '#F9FAFB', accent: '#F97316', shadow: 'rgba(249, 115, 22, 0.15)' }, // Naranja cálido
  { bg: '#F9FAFB', accent: '#EAB308', shadow: 'rgba(234, 179, 8, 0.15)' },  // Amarillo dorado
  { bg: '#F9FAFB', accent: '#EC4899', shadow: 'rgba(236, 72, 153, 0.15)' }, // Rosa fuerte
  { bg: '#F9FAFB', accent: '#8B5CF6', shadow: 'rgba(139, 92, 246, 0.15)' }, // Violeta
];

const ActivityMenuScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  // Estados
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rawActivities, setRawActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState(0);
  
  // Estados para personalización
  const [neurodivergentProfile, setNeurodivergentProfile] = useState<NeurodivergentProfile | null>(null);
  const [activityPriorities, setActivityPriorities] = useState<ActivityPriority[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false); // false = filtrado por defecto
  
  // Animaciones
  const scaleValues = React.useRef<Animated.Value[]>([]).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadInitialData();
  }, []);

  // Cargar perfil neurodivergente
  useEffect(() => {
    if (user) {
      loadNeurodivergentProfile();
    }
  }, [user]);

  // Procesar actividades cuando cambie el idioma
  useEffect(() => {
    if (rawActivities.length > 0) {
      processActivitiesForLanguage();
    }
  }, [language, rawActivities]);

  // Reprocesar actividades cuando cambie el filtrado
  useEffect(() => {
    if (rawActivities.length > 0) {
      processActivitiesForLanguage();
    }
  }, [showAllActivities, neurodivergentProfile, activityPriorities]);

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

  const loadNeurodivergentProfile = async () => {
    if (!user) return;
    
    try {
      setLoadingProfile(true);
      console.log('🔍 [ActivityMenuScreen] Loading neurodivergent profile for user:', user.id);
      
      const profile = await AnalysisService.getNeurodivergentProfile(user.id);
      console.log('✅ [ActivityMenuScreen] Profile loaded:', profile);
      
      setNeurodivergentProfile(profile);
      
      // Obtener recomendaciones personalizadas
      const recommendations = PersonalizationService.getPersonalizedRecommendations(profile);
      console.log('📊 [ActivityMenuScreen] Recommendations loaded:', recommendations);
      
      setActivityPriorities(recommendations.activityPriorities);
      
    } catch (error) {
      console.error('❌ [ActivityMenuScreen] Error loading profile:', error);
      // No mostrar error al usuario, continuar sin personalización
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      const activitiesData = await ApiService.getActivities();
      
     
      
      // Guardar datos originales
      setRawActivities(activitiesData);
      
      // Procesar inmediatamente para el idioma actual
      processActivitiesForLanguage(activitiesData);
      
      
      // Initialize scale animations for each activity
      scaleValues.length = 0;
      activitiesData.forEach(() => {
        scaleValues.push(new Animated.Value(1));
      });
      
    } catch (error) {
      console.error('❌ [ActivityMenuScreen] Error loading activities:', error);
      Alert.alert(
        t.errors?.connectionError || 'Error de conexión',
        language === 'es' 
          ? 'No se pudieron cargar las actividades. Verifica tu conexión a internet.'
          : 'Could not load activities. Check your internet connection.',
        [
          { text: t.common?.retry || 'Reintentar', onPress: loadActivities },
          { text: t.common?.cancel || 'Cancelar', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const processActivitiesForLanguage = (activitiesToProcess?: Activity[]) => {
    const sourceActivities = activitiesToProcess || rawActivities;
    
    
    if (sourceActivities.length === 0) {
      console.log('⚠️ [ActivityMenuScreen] No hay actividades para procesar');
      return;
    }
    
    // Procesar textos bilingües
    const processedActivities = sourceActivities.map((activity, index) => {
      const originalName = activity.name || '';
      const originalDescription = activity.description || '';
  
      
      const processedName = BilingualTextProcessor.extractText(originalName, language);
      const processedDescription = BilingualTextProcessor.extractText(originalDescription, language);
      
   
      
      return {
        ...activity,
        name: processedName,
        description: processedDescription,
      };
    });

    // Aplicar filtrado basado en el perfil neurodivergente
    const filteredActivities = filterActivitiesByProfile(processedActivities);
    
    setActivities(filteredActivities);
  };

  const loadAchievementStats = async () => {
    try {
      await AchievementService.initializeAchievements();
      const points = await AchievementService.getTotalPoints(language);
      const achievements = await AchievementService.getAllAchievements(language);
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
    console.log('🎯 [ActivityMenuScreen] Navegando a categorías para actividad:', activity.name);
    // Usar el nombre original para la navegación (el servidor espera el nombre original)
    const originalActivity = rawActivities.find(orig => orig.ID === activity.ID);
    const activityName = originalActivity ? originalActivity.name : activity.name;
    navigation.navigate('categoryMenu', { activityType: activityName });
  };

  const goToAchievements = () => {
    console.log('🏆 [ActivityMenuScreen] Navegando a logros');
    navigation.navigate('Achievements');
  };

  const goBack = () => {
    console.log('⬅️ [ActivityMenuScreen] Volviendo al menú principal');
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

  const getActivityColors = (index: number) => {
    return accentColors[index % accentColors.length];
  };

  // Helper para obtener la prioridad de una actividad
  const getActivityPriority = (activityName: string): ActivityPriority | null => {
    return activityPriorities.find(priority => 
      priority.activityType.toLowerCase().includes(activityName.toLowerCase()) ||
      activityName.toLowerCase().includes(priority.activityType.toLowerCase())
    ) || null;
  };

  // Función para filtrar actividades basada en el perfil neurodivergente
  const filterActivitiesByProfile = (activitiesToFilter: Activity[]): Activity[] => {
    console.log('🔍 [ActivityMenuScreen] filterActivitiesByProfile called:', {
      hasProfile: !!neurodivergentProfile,
      showAllActivities,
      activitiesCount: activitiesToFilter.length,
      activityNames: activitiesToFilter.map(a => a.name)
    });

    if (!neurodivergentProfile || showAllActivities) {
      console.log('📋 [ActivityMenuScreen] No profile or showing all activities, returning all');
      return activitiesToFilter;
    }

    const diagnosis = neurodivergentProfile.primary_diagnosis;
    const severity = neurodivergentProfile.severity;

    console.log('🧠 [ActivityMenuScreen] Profile info:', { diagnosis, severity });

    // Filtrar actividades basado en las prioridades
    const filtered = activitiesToFilter.filter(activity => {
      const priority = getActivityPriority(activity.name);
      
      if (!priority) {
        console.log(`📊 [ActivityMenuScreen] Activity "${activity.name}" has no priority, filtering out`);
        return false; // No mostrar actividades sin prioridad definida en modo filtrado
      }

      console.log(`📊 [ActivityMenuScreen] Activity "${activity.name}" priority:`, priority.priority);
      
      // En modo filtrado, solo mostrar actividades de prioridad alta y media
      // Los opcionales (low) son completamente invisibles en modo filtrado
      if (severity === 'Leve') {
        return priority.priority === 'high' || priority.priority === 'medium';
      }
      
      // Para severidad moderada, mostrar alta y media
      if (severity === 'Moderado') {
        return priority.priority === 'high' || priority.priority === 'medium';
      }
      
      // Para severidad severa, mostrar solo alta
      if (severity === 'Severo') {
        return priority.priority === 'high';
      }
      
      // Por defecto, no mostrar opcionales en modo filtrado
      return priority.priority === 'high' || priority.priority === 'medium';
    });

    console.log('✅ [ActivityMenuScreen] Filtered activities:', filtered.map(a => a.name));

    // Ordenar por prioridad
    return filtered.sort((a, b) => {
      const priorityA = getActivityPriority(a.name);
      const priorityB = getActivityPriority(b.name);
      
      if (!priorityA && !priorityB) return 0;
      if (!priorityA) return 1;
      if (!priorityB) return -1;
      
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      return priorityOrder[priorityA.priority] - priorityOrder[priorityB.priority];
    });
  };

  const getActivityStatus = (activity: Activity) => {
    return activity.is_active 
      ? (language === 'es' ? 'Activo' : 'Active')
      : (language === 'es' ? 'Inactivo' : 'Inactive');
  };

  const getStatusColor = (activity: Activity) => {
    return activity.is_active ? '#4CAF50' : '#F44336';
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4285f4" />
      <Text style={styles.loadingText}>
        {language === 'es' ? 'Cargando actividades...' : 'Loading activities...'}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎮</Text>
      <Text style={styles.emptyTitle}>
        {language === 'es' ? 'No hay actividades' : 'No activities'}
      </Text>
      <Text style={styles.emptyDescription}>
        {language === 'es' 
          ? 'Parece que no hay actividades configuradas en el servidor.'
          : 'It seems there are no activities configured on the server.'
        }
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadActivities}>
        <Text style={styles.retryButtonText}>
          {language === 'es' ? 'Reintentar' : 'Retry'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderActivityCard = (activity: Activity, index: number) => {
    const colors = getActivityColors(index);
    const priority = getActivityPriority(activity.name);
    
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
              backgroundColor: colors.bg,
              shadowColor: colors.shadow,
              borderWidth: 2,
              borderColor: colors.accent,
            }
          ]}
          onPress={() => goToActivityCategory(activity)}
          onPressIn={() => handlePressIn(index)}
          onPressOut={() => handlePressOut(index)}
          activeOpacity={0.9}
        >
          
          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <ActivityImage
              imageUrl={activity.icon}
              fallbackEmoji="🎮"
              size="large"
              style={[styles.activityImage, { width: 160, height: 160 }]}
            />
          </View>

           {/* Content */}
           <View style={styles.cardContent}>
             <Text style={[styles.cardTitle, { color: '#111827' }]} numberOfLines={2}>
               {activity.name}
             </Text>
             <Text style={[styles.cardDescription, { color: '#374151' }]} numberOfLines={3}>
               {activity.description}
             </Text>
             
             {/* Badges de prioridad personalizada */}
             {neurodivergentProfile && priority && (
               <View style={styles.priorityBadges}>
                 <View style={[
                   styles.priorityBadge,
                   { backgroundColor: PersonalizationService.getPriorityColor(priority.priority) }
                 ]}>
                   <Text style={styles.priorityIcon}>
                     {PersonalizationService.getPriorityIcon(priority.priority)}
                   </Text>
                   <Text style={styles.priorityText}>
                     {PersonalizationService.getPriorityText(priority.priority)}
                   </Text>
                 </View>
                 <View style={styles.dailyGoalBadge}>
                   <Text style={styles.dailyGoalText}>
                     🎯 {priority.dailyGoal} sesiones/día
                   </Text>
                 </View>
               </View>
             )}
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
              <Text style={styles.backButtonText}>
                ← {language === 'es' ? 'Volver' : 'Back'}
              </Text>
            </TouchableOpacity>
            <View style={styles.titleSection}>
              <Text style={styles.title}>
                🎮 {language === 'es' ? 'Actividades' : 'Activities'}
              </Text>
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
            <Text style={styles.backButtonText}>
              ← {language === 'es' ? 'Volver' : 'Back'}
            </Text>
          </TouchableOpacity>
          
           <View style={styles.titleSection}>
             <Text style={styles.title}>
               🎮 {language === 'es' ? 'Actividades' : 'Activities'}
             </Text>
             {neurodivergentProfile && (
               <Text style={styles.profileInfo}>
                 {language === 'es' ? 'Personalizado para' : 'Personalized for'} {neurodivergentProfile.primary_diagnosis}
               </Text>
             )}
           </View>
           
           <View style={styles.headerActions}>
             {neurodivergentProfile && (
               <TouchableOpacity 
                 style={[
                   styles.toggleButton,
                   !showAllActivities && styles.toggleButtonActive
                 ]}
                 onPress={() => setShowAllActivities(!showAllActivities)}
               >
                 <Text style={[
                   styles.toggleButtonText,
                   !showAllActivities && styles.toggleButtonTextActive
                 ]}>
                   {showAllActivities ? '📋 Todas' : '🎯 Filtrado'}
                 </Text>
                 {!showAllActivities && (
                   <View style={styles.activeIndicator} />
                 )}
               </TouchableOpacity>
             )}
           </View>
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
    </SafeAreaView>
  );
};

export default ActivityMenuScreen;

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
  profileInfo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  headerActions: {
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleButtonActive: {
    backgroundColor: '#4285f4',
    borderColor: '#4285f4',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: 'white',
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  imageCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
  activityImage: {
    borderRadius: 8,
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
  cardContent: {
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  priorityBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    justifyContent: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityIcon: {
    fontSize: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  dailyGoalBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dailyGoalText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#495057',
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