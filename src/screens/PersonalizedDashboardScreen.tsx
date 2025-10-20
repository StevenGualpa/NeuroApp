// src/screens/PersonalizedDashboardScreen.tsx
// Dashboard personalizado basado en el perfil neurodivergente

import React, { useState, useEffect, useRef } from 'react';
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
import { useAuth } from '../hooks';
import { useLanguage } from '../contexts/LanguageContext';
import AnalysisService, { NeurodivergentProfile } from '../services/AnalysisService';
import PersonalizationService, { PersonalizedRecommendations, ActivityPriority } from '../services/PersonalizationService';
import { useGoals } from '../hooks/useGoals';
import ApiService from '../services/ApiService';

const { width } = Dimensions.get('window');

type PersonalizedDashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const PersonalizedDashboardScreen = () => {
  const navigation = useNavigation<PersonalizedDashboardScreenNavigationProp>();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  // Estados
  const [neurodivergentProfile, setNeurodivergentProfile] = useState<NeurodivergentProfile | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Goals hook
  const { 
    todayGoal, 
    goalProgress, 
    getTodayProgress, 
    getMotivationalMessage, 
    getStreakMessage,
    refreshGoals 
  } = useGoals();

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔍 [PersonalizedDashboard] Loading dashboard data for user:', user.id);

      // Cargar perfil neurodivergente
      const profile = await AnalysisService.getNeurodivergentProfile(user.id);
      setNeurodivergentProfile(profile);

      // Obtener recomendaciones personalizadas
      const personalizedRecs = PersonalizationService.getPersonalizedRecommendations(profile);
      setRecommendations(personalizedRecs);

      // Refrescar metas
      await refreshGoals();

      console.log('✅ [PersonalizedDashboard] Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ [PersonalizedDashboard] Error loading dashboard data:', error);
      Alert.alert(
        'Error',
        'No se pudo cargar la información del dashboard. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const goToActivities = () => {
    navigation.navigate('activityMenu');
  };

  const goToProfile = () => {
    navigation.navigate('NeurodivergentProfile');
  };

  const goToProgress = () => {
    navigation.navigate('ProgressReport');
  };

  // Animar entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>📊 Mi Dashboard</Text>
          {neurodivergentProfile && (
            <Text style={styles.subtitle}>
              {neurodivergentProfile.primary_diagnosis} - {neurodivergentProfile.severity}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={goToProfile}>
          <Text style={styles.profileButtonText}>👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDailyGoals = () => {
    if (!recommendations || !todayGoal) return null;

    const todayProgress = getTodayProgress();
    if (!todayProgress) return null;

    return (
      <Animated.View 
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🎯 Metas de Hoy</Text>
          <Text style={styles.cardSubtitle}>
            {todayProgress.sessions.completed}/{todayProgress.sessions.target} sesiones
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(todayProgress.overall.percentage, 100)}%` }]} />
        </View>

        <View style={styles.goalsGrid}>
          <View style={styles.goalItem}>
            <Text style={styles.goalValue}>{todayProgress.sessions.completed}</Text>
            <Text style={styles.goalLabel}>Sesiones</Text>
            <Text style={styles.goalTarget}>/ {todayProgress.sessions.target}</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalValue}>{todayProgress.time.completed}</Text>
            <Text style={styles.goalLabel}>Minutos</Text>
            <Text style={styles.goalTarget}>/ {todayProgress.time.target}</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalValue}>{todayProgress.stars.completed}</Text>
            <Text style={styles.goalLabel}>Estrellas</Text>
            <Text style={styles.goalTarget}>/ {todayProgress.stars.target}</Text>
          </View>
        </View>

        <View style={styles.motivationalMessage}>
          <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
          {getStreakMessage() && (
            <Text style={styles.streakText}>{getStreakMessage()}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={goToActivities}>
          <Text style={styles.actionButtonText}>
            {todayProgress.overall.isCompleted ? '🎉 ¡Completado!' : '▶️ Continuar'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderActivityPriorities = () => {
    if (!recommendations) return null;

    return (
      <Animated.View 
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📋 Actividades Recomendadas</Text>
          <Text style={styles.cardSubtitle}>Basado en tu perfil</Text>
        </View>

        {recommendations.activityPriorities.map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityIcon}>{activity.icon}</Text>
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{activity.activityType}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>
              </View>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: PersonalizationService.getPriorityColor(activity.priority) }
              ]}>
                <Text style={styles.priorityText}>
                  {PersonalizationService.getPriorityText(activity.priority)}
                </Text>
              </View>
            </View>
            
            <View style={styles.activityDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Meta diaria:</Text>
                <Text style={styles.detailValue}>{activity.dailyGoal} sesiones</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Dificultad:</Text>
                <Text style={styles.detailValue}>{activity.difficulty}</Text>
              </View>
            </View>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Beneficios:</Text>
              <View style={styles.benefitsList}>
                {activity.benefits.map((benefit, benefitIndex) => (
                  <Text key={benefitIndex} style={styles.benefitItem}>
                    • {benefit}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        ))}
      </Animated.View>
    );
  };

  const renderRecommendations = () => {
    if (!recommendations || !recommendations.recommendations.length) return null;

    return (
      <Animated.View 
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>💡 Recomendaciones</Text>
          <Text style={styles.cardSubtitle}>Consejos personalizados</Text>
        </View>

        {recommendations.recommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Text style={styles.recommendationText}>{recommendation}</Text>
          </View>
        ))}
      </Animated.View>
    );
  };

  const renderQuickActions = () => (
    <Animated.View 
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>⚡ Acciones Rápidas</Text>
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.quickAction} onPress={goToActivities}>
          <Text style={styles.quickActionIcon}>🎮</Text>
          <Text style={styles.quickActionText}>Jugar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction} onPress={goToProgress}>
          <Text style={styles.quickActionIcon}>📊</Text>
          <Text style={styles.quickActionText}>Progreso</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickAction} onPress={goToProfile}>
          <Text style={styles.quickActionIcon}>👤</Text>
          <Text style={styles.quickActionText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Cargando dashboard personalizado...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F46E5"
          />
        }
      >
        {renderDailyGoals()}
        {renderActivityPriorities()}
        {renderRecommendations()}
        {renderQuickActions()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

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
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  goalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  goalItem: {
    alignItems: 'center',
  },
  goalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  goalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  goalTarget: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  activityItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  activityDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  activityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  benefitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  benefitItem: {
    fontSize: 11,
    color: '#6B7280',
    marginRight: 8,
    marginBottom: 2,
  },
  recommendationItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    minWidth: 80,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  bottomSpacing: {
    height: 20,
  },
  motivationalMessage: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    alignItems: 'center',
  },
  motivationalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default PersonalizedDashboardScreen;
