// src/screens/ProgressReportScreen.tsx
// Pantalla unificada de reportes de progreso y estadísticas

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
  Animated,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../hooks';
import AnalysisService, { QuickAnalysis, MonthlyAnalysis, NeurodivergentProfile } from '../services/AnalysisService';
import PersonalizationService, { PersonalizedRecommendations, ActivityPriority } from '../services/PersonalizationService';
import { useGoals } from '../hooks/useGoals';
import ApiService from '../services/ApiService';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

type PeriodType = 'weekly' | 'monthly';
type TabType = 'dashboard' | 'analysis' | 'statistics';

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
  stars: number;
  errors: number;
  activity_type: string;
}

const ProgressReportScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<QuickAnalysis | MonthlyAnalysis | null>(null);
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [hasProfile, setHasProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Estados para dashboard personalizado
  const [neurodivergentProfile, setNeurodivergentProfile] = useState<NeurodivergentProfile | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendations | null>(null);
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

  // Obtener progreso de hoy
  const todayProgress = getTodayProgress();
  
  // Estados para estadísticas
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);

  useEffect(() => {
    if (user) {
      checkProfile();
      loadAnalysis();
      loadStatistics();
      loadNeurodivergentProfile();
    }
  }, [user, period]);

  const checkProfile = async () => {
    if (!user) return;
    try {
      const profile = await AnalysisService.getNeurodivergentProfile(user.id);
      setHasProfile(profile !== null);
    } catch (error) {
      console.error('Error checking profile:', error);
      setHasProfile(false);
    }
  };

  const loadAnalysis = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log(`📊 Cargando análisis ${period} para usuario ${user.id}...`);
      
      const data = period === 'monthly' 
        ? await AnalysisService.getMonthlyAnalysis(user.id)
        : await AnalysisService.getQuickAnalysis(user.id);
      
      console.log('✅ Análisis cargado:', data);
      setAnalysis(data);
    } catch (error: any) {
      console.error('❌ Error loading analysis:', error);
      console.error('Error completo:', JSON.stringify(error, null, 2));
      
      const errorMsg = error.message || error.toString() || 'Error desconocido';
      Alert.alert(
        'Error al cargar análisis',
        `${errorMsg}\n\nVerifica:\n• Conexión a internet\n• Servidor activo\n• Usuario tiene sesiones (mínimo 3)\n\nUsuario ID: ${user.id}`,
        [
          { text: 'Reintentar', onPress: loadAnalysis },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!user) return;
    
    try {
      console.log('📈 Cargando estadísticas...');
      const [statsData, sessionsData] = await Promise.all([
        ApiService.getUserStats(user.id),
        ApiService.getUserSessions(user.id),
      ]);

      setUserStats(statsData.stats);
      setRecentSessions(Array.isArray(sessionsData) ? sessionsData.slice(-10) : []);
      console.log('✅ Estadísticas cargadas');
    } catch (error) {
      console.error('❌ Error loading statistics:', error);
    }
  };

  const loadNeurodivergentProfile = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 [ProgressReportScreen] Loading neurodivergent profile for user:', user.id);
      
      const profile = await AnalysisService.getNeurodivergentProfile(user.id);
      console.log('✅ [ProgressReportScreen] Profile loaded:', profile);
      
      setNeurodivergentProfile(profile);
      
      // Obtener recomendaciones personalizadas
      const personalizedRecommendations = PersonalizationService.getPersonalizedRecommendations(profile);
      console.log('📊 [ProgressReportScreen] Recommendations loaded:', personalizedRecommendations);
      
      setRecommendations(personalizedRecommendations);
      
    } catch (error) {
      console.error('❌ [ProgressReportScreen] Error loading profile:', error);
      // No mostrar error al usuario, continuar sin personalización
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${totalSeconds}s`;
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

  // Helper para formatear números con validación
  const safeToFixed = (value: number | undefined | null, decimals: number = 1): string => {
    if (value === undefined || value === null || isNaN(value)) return '0.0';
    return Number(value).toFixed(decimals);
  };

  const calculateAverageStars = () => {
    if (!userStats || userStats.total_activities_completed === 0) return 0;
    return (userStats.total_stars_earned / userStats.total_activities_completed).toFixed(1);
  };

  // Renderizado de estadísticas generales
  const renderStatsOverview = () => (
    <View style={styles.statsGrid}>
      <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
        <Text style={styles.statNumber}>{userStats?.total_activities_completed || 0}</Text>
        <Text style={styles.statCardLabel}>Actividades</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: '#FF9800' }]}>
        <Text style={styles.statNumber}>{userStats?.total_stars_earned || 0}</Text>
        <Text style={styles.statCardLabel}>Estrellas</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
        <Text style={styles.statNumber}>{calculateAverageStars()}</Text>
        <Text style={styles.statCardLabel}>Promedio</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: '#9C27B0' }]}>
        <Text style={styles.statNumber}>{userStats?.days_playing || 0}</Text>
        <Text style={styles.statCardLabel}>Días Jugando</Text>
      </View>
    </View>
  );

  const renderDetailedStats = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📈 Estadísticas Detalladas</Text>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>⏱️ Tiempo total jugado:</Text>
        <Text style={styles.statValue}>{formatTime(userStats?.total_play_time || 0)}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>🤝 Veces que usó ayuda:</Text>
        <Text style={styles.statValue}>{userStats?.helpful_attempts || 0}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>🏆 Juegos perfectos:</Text>
        <Text style={styles.statValue}>{userStats?.improvement_moments || 0}</Text>
      </View>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>🎯 Puntos de exploración:</Text>
        <Text style={styles.statValue}>{userStats?.exploration_points || 0}</Text>
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🕒 Actividad Reciente (Últimas 5)</Text>
      {recentSessions.length > 0 ? (
        <>
          {recentSessions.slice(-5).reverse().map((session) => (
            <View key={session.ID} style={styles.sessionItem}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionDate}>{formatDate(session.CreatedAt)}</Text>
                <Text style={styles.sessionType}>{session.activity_type}</Text>
              </View>
              <View style={styles.sessionStatsRow}>
                <Text style={styles.sessionStat}>⭐ {session.stars}</Text>
                <Text style={styles.sessionStat}>❌ {session.errors}</Text>
                <Text style={styles.sessionStat}>⏱️ {formatTime(session.duration)}</Text>
              </View>
            </View>
          ))}
        </>
      ) : (
        <Text style={styles.noDataText}>No hay actividad reciente</Text>
      )}
    </View>
  );

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text>Debes iniciar sesión para ver tu progreso</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Analizando tu progreso...</Text>
      </View>
    );
  }

  if (!analysis && activeTab === 'analysis') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noDataTitle}>📊 Sin Datos Suficientes</Text>
        <Text style={styles.noDataText}>
          Necesitas completar al menos 3 actividades para ver tu análisis de progreso.
        </Text>
        <Text style={[styles.noDataText, {fontSize: 12, marginTop: 10, color: '#999'}]}>
          Usuario ID: {user?.id}
        </Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('activityMenu')}>
          <Text style={styles.actionButtonText}>Ir a Actividades</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, {backgroundColor: '#2196F3', marginTop: 10}]}
          onPress={loadAnalysis}>
          <Text style={styles.actionButtonText}>🔄 Reintentar Carga</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { overall_progress, neurodivergent_analysis } = analysis?.data || {};

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 Mi Progreso</Text>
        
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'dashboard' && styles.tabActive]}
            onPress={() => setActiveTab('dashboard')}>
            <Text style={[styles.tabText, activeTab === 'dashboard' && styles.tabTextActive]}>
              Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analysis' && styles.tabActive]}
            onPress={() => setActiveTab('analysis')}>
            <Text style={[styles.tabText, activeTab === 'analysis' && styles.tabTextActive]}>
              Análisis
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'statistics' && styles.tabActive]}
            onPress={() => setActiveTab('statistics')}>
            <Text style={[styles.tabText, activeTab === 'statistics' && styles.tabTextActive]}>
              Estadísticas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Warning banner solo en tab de análisis */}
        {activeTab === 'analysis' && !hasProfile && (
          <TouchableOpacity
            style={styles.warningBanner}
            onPress={() => {
              Alert.alert(
                'Perfil Neurodivergente',
                'Para obtener análisis personalizados, crea tu perfil neurodivergente.',
                [
                  { text: 'Más tarde', style: 'cancel' },
                  { text: 'Crear Perfil', onPress: () => {
                    navigation.navigate('NeurodivergentProfile');
                  }},
                ]
              );
            }}>
            <Text style={styles.warningText}>
              ⚠️ Crea tu perfil neurodivergente para análisis personalizados
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CONTENIDO TAB: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {console.log('🔍 [ProgressReportScreen] Dashboard render:', {
            hasProfile: !!neurodivergentProfile,
            hasRecommendations: !!recommendations,
            todayGoal: todayGoal,
            todayProgress: todayProgress
          })}
          {neurodivergentProfile ? (
            <>
              {/* Header del perfil */}
              <View style={styles.profileHeader}>
                <Text style={styles.profileTitle}>
                  🧠 {language === 'es' ? 'Dashboard Personalizado' : 'Personalized Dashboard'}
                </Text>
                <Text style={styles.profileSubtitle}>
                  {language === 'es' ? 'Personalizado para' : 'Personalized for'} {neurodivergentProfile.primary_diagnosis}
                </Text>
              </View>

              {/* Metas del día */}
              <View style={styles.goalCard}>
                <Text style={styles.goalTitle}>🎯 {language === 'es' ? 'Meta del Día' : 'Today\'s Goal'}</Text>
                <Text style={styles.goalText}>
                  {language === 'es' ? 'Completa' : 'Complete'} {todayGoal?.sessions || 0} {language === 'es' ? 'sesiones' : 'sessions'} 
                  {language === 'es' ? ' de actividades' : ' of activities'}
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${todayProgress?.overall?.percentage || 0}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {todayProgress?.overall?.percentage || 0}% {language === 'es' ? 'completado' : 'completed'}
                </Text>
              </View>

              {/* Actividades recomendadas */}
              {recommendations && recommendations.activityPriorities ? (
                <View style={styles.recommendationsCard}>
                  <Text style={styles.recommendationsTitle}>
                    ⭐ {language === 'es' ? 'Actividades Recomendadas' : 'Recommended Activities'}
                  </Text>
                  {recommendations.activityPriorities.map((priority, index) => (
                    <View key={index} style={styles.priorityItem}>
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
                      <Text style={styles.activityName}>{priority.activityType}</Text>
                      <Text style={styles.dailyGoal}>
                        🎯 {priority.dailyGoal} {language === 'es' ? 'sesiones/día' : 'sessions/day'}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.recommendationsCard}>
                  <Text style={styles.recommendationsTitle}>
                    ⭐ {language === 'es' ? 'Actividades Recomendadas' : 'Recommended Activities'}
                  </Text>
                  <Text style={styles.noDataText}>
                    {language === 'es' ? 'Cargando recomendaciones...' : 'Loading recommendations...'}
                  </Text>
                </View>
              )}

              {/* Mensaje motivacional */}
              <View style={styles.motivationCard}>
                <Text style={styles.motivationTitle}>
                  💪 {language === 'es' ? 'Mensaje Motivacional' : 'Motivational Message'}
                </Text>
                <Text style={styles.motivationText}>
                  {typeof getMotivationalMessage === 'function' ? getMotivationalMessage() : '¡Sigue así! 💪'}
                </Text>
              </View>

              {/* Racha actual */}
              <View style={styles.streakCard}>
                <Text style={styles.streakTitle}>
                  🔥 {language === 'es' ? 'Racha Actual' : 'Current Streak'}
                </Text>
                <Text style={styles.streakText}>
                  {typeof getStreakMessage === 'function' ? getStreakMessage() : '¡Mantén la racha! 🔥'}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.noProfileContainer}>
              <Text style={styles.noProfileIcon}>🧠</Text>
              <Text style={styles.noProfileTitle}>
                {language === 'es' ? 'Sin Perfil Personalizado' : 'No Personalized Profile'}
              </Text>
              <Text style={styles.noProfileText}>
                {language === 'es' 
                  ? 'Crea tu perfil neurodivergente para ver recomendaciones personalizadas'
                  : 'Create your neurodivergent profile to see personalized recommendations'
                }
              </Text>
              <TouchableOpacity
                style={styles.createProfileButton}
                onPress={() => navigation.navigate('NeurodivergentProfile')}>
                <Text style={styles.createProfileButtonText}>
                  {language === 'es' ? 'Crear Perfil' : 'Create Profile'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* CONTENIDO TAB: ANÁLISIS */}
      {activeTab === 'analysis' && overall_progress && (
        <>
          {/* Period selector DENTRO del contenido de análisis */}
          <View style={styles.periodSelectorContainer}>
            <Text style={styles.periodLabel}>Período:</Text>
            <View style={styles.periodSelector}>
              <TouchableOpacity
                style={[styles.periodButtonCompact, period === 'weekly' && styles.periodButtonActive]}
                onPress={() => setPeriod('weekly')}>
                <Text style={[styles.periodButtonText, period === 'weekly' && styles.periodButtonTextActive]}>
                  Semanal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButtonCompact, period === 'monthly' && styles.periodButtonActive]}
                onPress={() => setPeriod('monthly')}>
                <Text style={[styles.periodButtonText, period === 'monthly' && styles.periodButtonTextActive]}>
                  Mensual
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Progreso General */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumen General</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Sesiones Completadas:</Text>
              <Text style={styles.statValue}>{overall_progress.total_sessions}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Estrellas Promedio:</Text>
              <Text style={styles.statValue}>{safeToFixed(overall_progress.average_stars)} / 3 ⭐</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Tasa de Error:</Text>
              <Text style={[styles.statValue, { color: (overall_progress.error_rate || 0) < 20 ? '#4CAF50' : (overall_progress.error_rate || 0) < 40 ? '#FFC107' : '#F44336' }]}>
                {safeToFixed(overall_progress.error_rate)}%
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Uso de Ayuda:</Text>
              <Text style={styles.statValue}>{safeToFixed(overall_progress.help_usage_rate)}%</Text>
            </View>

            {/* Indicadores de Mejoría */}
            {overall_progress.improvement_indicators?.is_improving && (
              <View style={styles.improvementBadge}>
                <Text style={styles.improvementText}>📈 ¡Mejorando!</Text>
                {(overall_progress.improvement_indicators.error_rate_change || 0) > 0 && (
                  <Text style={styles.improvementDetail}>
                    Errores: -{safeToFixed(overall_progress.improvement_indicators.error_rate_change)}%
                  </Text>
                )}
                {(overall_progress.improvement_indicators.stars_change || 0) > 0 && (
                  <Text style={styles.improvementDetail}>
                    Estrellas: +{safeToFixed(overall_progress.improvement_indicators.stars_change)}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Análisis Específico por Neurodivergencia */}
          {neurodivergent_analysis && hasProfile && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Análisis Específico - {neurodivergent_analysis.diagnosis}
              </Text>
              
              {/* Para TDAH */}
              {neurodivergent_analysis.diagnosis === 'TDAH' && neurodivergent_analysis.attention_metrics && (
                <>
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⏱️ Atención</Text>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${neurodivergent_analysis.attention_metrics.attention_score || 0}%`,
                              backgroundColor: getScoreColor(neurodivergent_analysis.attention_metrics.attention_score || 0),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.scoreText}>
                        {safeToFixed(neurodivergent_analysis.attention_metrics.attention_score)}/100
                      </Text>
                    </View>
                    <Text style={styles.metricDetail}>
                      Duración promedio: {Math.floor((neurodivergent_analysis.attention_metrics.average_session_duration || 0) / 60)}m {Math.floor((neurodivergent_analysis.attention_metrics.average_session_duration || 0) % 60)}s
                    </Text>
                  </View>

                  {neurodivergent_analysis.impulsivity_metrics && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>🎯 Control de Impulsividad</Text>
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${neurodivergent_analysis.impulsivity_metrics.impulsivity_score || 0}%`,
                                backgroundColor: getScoreColor(neurodivergent_analysis.impulsivity_metrics.impulsivity_score || 0),
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.scoreText}>
                          {safeToFixed(neurodivergent_analysis.impulsivity_metrics.impulsivity_score)}/100
                        </Text>
                      </View>
                      <Text style={styles.metricDetail}>
                        Errores promedio: {safeToFixed(neurodivergent_analysis.impulsivity_metrics.average_errors_per_session)}
                      </Text>
                    </View>
                  )}

                  {neurodivergent_analysis.self_regulation_metrics && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>🧘 Auto-regulación</Text>
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${neurodivergent_analysis.self_regulation_metrics.auto_regulation_score || 0}%`,
                                backgroundColor: getScoreColor(neurodivergent_analysis.self_regulation_metrics.auto_regulation_score || 0),
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.scoreText}>
                          {safeToFixed(neurodivergent_analysis.self_regulation_metrics.auto_regulation_score)}/100
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Score Global TDAH */}
                  {neurodivergent_analysis.tdah_progress_score !== undefined && (
                    <View style={styles.overallScoreContainer}>
                      <Text style={styles.overallScoreLabel}>Score Global TDAH:</Text>
                      <Text style={[
                        styles.overallScoreValue,
                        { color: getScoreColor(neurodivergent_analysis.tdah_progress_score || 0) }
                      ]}>
                        {safeToFixed(neurodivergent_analysis.tdah_progress_score)}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {/* Interpretación */}
              <View style={styles.interpretationBox}>
                <Text style={styles.interpretationTitle}>💡 Interpretación</Text>
                <Text style={styles.interpretationText}>
                  {neurodivergent_analysis.interpretation}
                </Text>
              </View>

              {/* Recomendaciones */}
              {neurodivergent_analysis.recommendations && neurodivergent_analysis.recommendations.length > 0 && (
                <View style={styles.recommendationsBox}>
                  <Text style={styles.recommendationsTitle}>📋 Recomendaciones</Text>
                  {neurodivergent_analysis.recommendations.map((rec: string, index: number) => (
                    <Text key={index} style={styles.recommendationItem}>
                      • {rec}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Botones de Acción */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadAnalysis}>
              <Text style={styles.refreshButtonText}>🔄 Actualizar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.generateReportButton}
              onPress={() => Alert.alert('Próximamente', 'Generación de reportes PDF en desarrollo')}>
              <Text style={styles.generateReportButtonText}>📄 Generar PDF</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* CONTENIDO TAB: ESTADÍSTICAS */}
      {activeTab === 'statistics' && (
        <>
          {renderStatsOverview()}
          {renderDetailedStats()}
          {renderRecentActivity()}

          {/* Botón Refrescar */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadStatistics}>
              <Text style={styles.refreshButtonText}>🔄 Actualizar Estadísticas</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

// Helper function para color según score
const getScoreColor = (score: number): string => {
  if (score >= 80) return '#4CAF50'; // Verde
  if (score >= 60) return '#8BC34A'; // Verde claro
  if (score >= 40) return '#FFC107'; // Amarillo
  return '#FF9800'; // Naranja
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noDataTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    backgroundColor: '#FFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#FFF',
  },
  warningBanner: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  warningText: {
    fontSize: 14,
    color: '#F57C00',
    textAlign: 'center',
  },
  periodSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  periodSelector: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 3,
  },
  periodButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonCompact: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#4CAF50',
  },
  periodButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  },
  periodButtonTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFF',
    margin: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  improvementBadge: {
    marginTop: 15,
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  improvementText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  improvementDetail: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 60,
  },
  metricDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  overallScoreContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overallScoreLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  overallScoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  interpretationBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  interpretationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
  },
  interpretationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  recommendationsBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 10,
  },
  recommendationItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    margin: 10,
  },
  refreshButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  generateReportButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
  },
  generateReportButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos para Estadísticas
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    margin: 10,
  },
  statCard: {
    width: (width - 50) / 2,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  statCardLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  sessionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sessionDate: {
    fontSize: 12,
    color: '#999',
  },
  sessionType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  sessionStatsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  sessionStat: {
    fontSize: 12,
    color: '#666',
  },
  // Estilos del Dashboard
  profileHeader: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  goalCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  goalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  recommendationsCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 12,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  priorityIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  activityName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dailyGoal: {
    fontSize: 12,
    color: '#666',
  },
  motivationCard: {
    backgroundColor: '#F3E5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B1FA2',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  streakCard: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C62828',
    marginBottom: 8,
  },
  streakText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noProfileContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noProfileIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noProfileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  noProfileText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createProfileButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createProfileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ProgressReportScreen;
