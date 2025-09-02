import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ApiService from '../services/ApiService';
import AuthService from '../services/AuthService';

const { width } = Dimensions.get('window');

type StatisticsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserStats {
  total_activities_completed: number;
  total_stars_earned: number;
  total_play_time: number;
  helpful_attempts: number;
  improvement_moments: number;
  exploration_points: number;
  days_playing: number;
  last_activity_date: string;
}

interface GameSession {
  ID: number;
  CreatedAt: string;
  duration: number;
  stars_earned: number;
  errors_count: number;
  completed: boolean;
  activity_type: string;
}

interface UserProgress {
  lesson_id: number;
  step_id: number;
  completed: boolean;
  stars: number;
  attempts: number;
  errors: number;
  best_time: number;
}

const StatisticsScreen = () => {
  const navigation = useNavigation<StatisticsNavigationProp>();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const user = AuthService.getCurrentUser();
      
      if (!user) {
        console.error('❌ No hay usuario logueado');
        return;
      }

      console.log('📊 [StatisticsScreen] Cargando estadísticas del usuario...');

      // Cargar todos los datos en paralelo
      const [userStatsData, userSessionsData, userProgressData] = await Promise.all([
        ApiService.getUserStats(user.id),
        ApiService.getUserSessions(user.id),
        ApiService.getUserProgress(user.id),
      ]);

      console.log('✅ [StatisticsScreen] Datos cargados:', {
        stats: userStatsData.stats,
        sessions: Array.isArray(userSessionsData) ? userSessionsData.length : 'undefined',
        progress: userProgressData.progress?.length || 0,
      });

      setUserStats(userStatsData.stats);
      // ✅ CORREGIDO: Verificar que userSessionsData sea un array antes de usar slice
      setRecentSessions(Array.isArray(userSessionsData) ? userSessionsData.slice(-10) : []); // Últimas 10 sesiones
      setUserProgress(userProgressData.progress || []);

    } catch (error) {
      console.error('❌ [StatisticsScreen] Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateAverageStars = () => {
    if (!userStats || userStats.total_activities_completed === 0) return 0;
    return (userStats.total_stars_earned / userStats.total_activities_completed).toFixed(1);
  };

  const calculateSuccessRate = () => {
    const completedActivities = userProgress.filter(p => p.completed).length;
    const totalActivities = userProgress.length;
    if (totalActivities === 0) return 0;
    return Math.round((completedActivities / totalActivities) * 100);
  };

  const getPerformanceTrend = () => {
    if (recentSessions.length < 2) return 'Sin datos suficientes';
    
    const recent = recentSessions.slice(-3);
    const older = recentSessions.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, s) => sum + s.stars_earned, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, s) => sum + s.stars_earned, 0) / older.length : recentAvg;
    
    if (recentAvg > olderAvg) return '📈 Mejorando';
    if (recentAvg < olderAvg) return '📉 Necesita práctica';
    return '➡️ Estable';
  };

  const renderOverviewCards = () => (
    <View style={styles.overviewContainer}>
      <Text style={styles.sectionTitle}>📊 Resumen General</Text>
      <View style={styles.cardsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.statNumber}>{userStats?.total_activities_completed || 0}</Text>
          <Text style={styles.statLabel}>Actividades Completadas</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#FF9800' }]}>
          <Text style={styles.statNumber}>{userStats?.total_stars_earned || 0}</Text>
          <Text style={styles.statLabel}>Estrellas Ganadas</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
          <Text style={styles.statNumber}>{calculateAverageStars()}</Text>
          <Text style={styles.statLabel}>Promedio de Estrellas</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#9C27B0' }]}>
          <Text style={styles.statNumber}>{calculateSuccessRate()}%</Text>
          <Text style={styles.statLabel}>Tasa de Éxito</Text>
        </View>
      </View>
    </View>
  );

  const renderDetailedStats = () => (
    <View style={styles.detailedContainer}>
      <Text style={styles.sectionTitle}>📈 Estadísticas Detalladas</Text>
      
      <View style={styles.detailCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>⏱️ Tiempo total jugado:</Text>
          <Text style={styles.detailValue}>{formatTime(userStats?.total_play_time || 0)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🤝 Veces que usó ayuda:</Text>
          <Text style={styles.detailValue}>{userStats?.helpful_attempts || 0}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🏆 Juegos perfectos:</Text>
          <Text style={styles.detailValue}>{userStats?.improvement_moments || 0}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🎯 Puntos de exploración:</Text>
          <Text style={styles.detailValue}>{userStats?.exploration_points || 0}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📅 Días jugando:</Text>
          <Text style={styles.detailValue}>{userStats?.days_playing || 0}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📊 Tendencia de rendimiento:</Text>
          <Text style={styles.detailValue}>{getPerformanceTrend()}</Text>
        </View>
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.activityContainer}>
      <Text style={styles.sectionTitle}>🕒 Actividad Reciente</Text>
      
      {recentSessions.length > 0 ? (
        <View style={styles.sessionsList}>
          {recentSessions.slice(-5).reverse().map((session, index) => (
            <View key={session.ID} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionDate}>{formatDate(session.CreatedAt)}</Text>
                <View style={styles.sessionBadge}>
                  <Text style={styles.sessionBadgeText}>
                    {session.completed ? '✅' : '⏸️'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.sessionStats}>
                <View style={styles.sessionStat}>
                  <Text style={styles.sessionStatValue}>⭐ {session.stars_earned}</Text>
                </View>
                <View style={styles.sessionStat}>
                  <Text style={styles.sessionStatValue}>❌ {session.errors_count}</Text>
                </View>
                <View style={styles.sessionStat}>
                  <Text style={styles.sessionStatValue}>⏱️ {formatTime(session.duration)}</Text>
                </View>
              </View>
              
              <Text style={styles.sessionType}>{session.activity_type}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>📭 No hay actividad reciente</Text>
          <Text style={styles.noDataSubtext}>¡Completa algunas actividades para ver tus estadísticas!</Text>
        </View>
      )}
    </View>
  );

  const renderProgressByLesson = () => {
    const lessonStats = userProgress.reduce((acc, progress) => {
      if (!acc[progress.lesson_id]) {
        acc[progress.lesson_id] = {
          lessonId: progress.lesson_id,
          totalSteps: 0,
          completedSteps: 0,
          totalStars: 0,
          totalErrors: 0,
        };
      }
      
      acc[progress.lesson_id].totalSteps++;
      if (progress.completed) acc[progress.lesson_id].completedSteps++;
      acc[progress.lesson_id].totalStars += progress.stars;
      acc[progress.lesson_id].totalErrors += progress.errors;
      
      return acc;
    }, {} as Record<number, any>);

    const lessons = Object.values(lessonStats);

    return (
      <View style={styles.progressContainer}>
        <Text style={styles.sectionTitle}>📚 Progreso por Lección</Text>
        
        {lessons.length > 0 ? (
          <View style={styles.lessonsList}>
            {lessons.map((lesson: any) => {
              const completionRate = Math.round((lesson.completedSteps / lesson.totalSteps) * 100);
              const avgStars = (lesson.totalStars / lesson.totalSteps).toFixed(1);
              
              return (
                <View key={lesson.lessonId} style={styles.lessonCard}>
                  <View style={styles.lessonHeader}>
                    <Text style={styles.lessonTitle}>📖 Lección {lesson.lessonId}</Text>
                    <Text style={styles.lessonCompletion}>{completionRate}%</Text>
                  </View>
                  
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${completionRate}%` }
                      ]} 
                    />
                  </View>
                  
                  <View style={styles.lessonStats}>
                    <Text style={styles.lessonStat}>
                      📝 {lesson.completedSteps}/{lesson.totalSteps} pasos
                    </Text>
                    <Text style={styles.lessonStat}>
                      ⭐ {avgStars} promedio
                    </Text>
                    <Text style={styles.lessonStat}>
                      ❌ {lesson.totalErrors} errores
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>📚 No hay progreso registrado</Text>
            <Text style={styles.noDataSubtext}>¡Empieza a completar lecciones!</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285f4" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 Mis Estadísticas</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4285f4']}
            tintColor="#4285f4"
          />
        }
      >
        {renderOverviewCards()}
        {renderDetailedStats()}
        {renderRecentActivity()}
        {renderProgressByLesson()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#4285f4',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  overviewContainer: {
    marginBottom: 24,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  detailedContainer: {
    marginBottom: 24,
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '700',
  },
  activityContainer: {
    marginBottom: 24,
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  sessionBadge: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sessionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  sessionStat: {
    flex: 1,
  },
  sessionStatValue: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  sessionType: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 24,
  },
  lessonsList: {
    gap: 12,
  },
  lessonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lessonTitle: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '700',
  },
  lessonCompletion: {
    fontSize: 14,
    color: '#4285f4',
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4285f4',
    borderRadius: 4,
  },
  lessonStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lessonStat: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  noDataContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default StatisticsScreen;