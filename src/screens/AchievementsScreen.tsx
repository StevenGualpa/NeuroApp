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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ApiService from '../services/ApiService';
import AuthService from '../services/AuthService';
import RealAchievementServiceEnhanced from '../services/RealAchievementService_enhanced';

type AchievementsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ✅ INTERFACES CORREGIDAS SEGÚN LOS DATOS DEL SERVIDOR
interface ServerAchievement {
  ID: number;
  title: string;  // ← Servidor usa "title", no "name"
  description: string;
  icon: string;
  category: string;
  rarity: string;
  points: number;
  condition: string;  // ← Servidor usa "condition", no "condition_type"
  max_progress: number;  // ← Servidor usa "max_progress", no "condition_value"
  is_active: boolean;
}

interface UserAchievement {
  ID: number;
  UserID: number;  // ← Servidor usa "UserID", no "user_id"
  AchievementID: number;  // ← Servidor usa "AchievementID", no "achievement_id"
  is_unlocked: boolean;
  current_progress: number;  // ← Servidor usa "current_progress", no "progress"
  unlocked_at?: string;
  Achievement: ServerAchievement;
}

interface UserStats {
  total_activities_completed: number;
  total_stars_earned: number;
  total_play_time: number;
  helpful_attempts: number;
  improvement_moments: number;
  exploration_points: number;
  days_playing: number;
}

const AchievementsScreen = () => {
  const navigation = useNavigation<AchievementsNavigationProp>();
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<ServerAchievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUnlocked: 0,
    totalAchievements: 0,
    completionPercentage: 0,
    totalPoints: 0,
  });

  useEffect(() => {
    loadAchievements();
  }, []);

  // ✅ NUEVO: Auto-refresh cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [AchievementsScreen] Pantalla recibió foco, refrescando datos...');
      // Forzar refresh del servicio de logros
      RealAchievementServiceEnhanced.forceRefresh().then(() => {
        loadAchievements();
      }).catch(error => {
        console.error('❌ [AchievementsScreen] Error en force refresh:', error);
        loadAchievements(); // Intentar cargar de todas formas
      });
    }, [])
  );

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const user = AuthService.getCurrentUser();
      
      if (!user) {
        console.error('❌ No hay usuario logueado');
        return;
      }

      console.log('🏆 [AchievementsScreen] Cargando datos del servidor...');

      // Cargar todos los datos en paralelo
      const [allAchievementsData, userAchievementsData, userStatsData] = await Promise.all([
        ApiService.getAchievements(),
        ApiService.getUserAchievements(user.id),
        ApiService.getUserStats(user.id),
      ]);

      console.log(`✅ [AchievementsScreen] Cargados ${allAchievementsData.length} logros totales`);
      console.log(`📊 [AchievementsScreen] Usuario tiene ${userAchievementsData.length} logros con progreso`);
      console.log('📈 [AchievementsScreen] Estadísticas del usuario:', userStatsData.stats);
      
      // DEBUGGING DETALLADO CON CAMPOS CORREGIDOS
      console.log('🔍 [AchievementsScreen] ===== DEBUGGING CON CAMPOS CORREGIDOS =====');
      console.log('📋 PRIMER LOGRO DEL SERVIDOR (campos corregidos):');
      if (allAchievementsData.length > 0) {
        const firstAchievement = allAchievementsData[0];
        console.log(`   ID: ${firstAchievement.ID}`);
        console.log(`   Title: "${firstAchievement.title}"`);
        console.log(`   Condition: "${firstAchievement.condition}"`);
        console.log(`   Max Progress: ${firstAchievement.max_progress}`);
        console.log(`   Points: ${firstAchievement.points}`);
      }
      
      console.log('📊 PRIMER LOGRO DEL USUARIO (campos corregidos):');
      if (userAchievementsData.length > 0) {
        const firstUserAchievement = userAchievementsData[0];
        console.log(`   ID: ${firstUserAchievement.ID}`);
        console.log(`   UserID: ${firstUserAchievement.UserID}`);
        console.log(`   AchievementID: ${firstUserAchievement.AchievementID}`);
        console.log(`   Is Unlocked: ${firstUserAchievement.is_unlocked}`);
        console.log(`   Current Progress: ${firstUserAchievement.current_progress}`);
        console.log(`   Achievement Title: "${firstUserAchievement.Achievement?.title}"`);
      }
      
      console.log('🔍 LOGROS DESBLOQUEADOS ENCONTRADOS:');
      const unlockedAchievements = userAchievementsData.filter(ua => ua.is_unlocked);
      unlockedAchievements.forEach((ua, index) => {
        console.log(`   ${index + 1}. "${ua.Achievement?.title}" - ${ua.Achievement?.points} pts - Desbloqueado: ${ua.unlocked_at}`);
      });
      
      console.log('===============================================');

      setAllAchievements(allAchievementsData);
      setAchievements(userAchievementsData);
      setUserStats(userStatsData.stats);

      // Calcular estadísticas DIRECTAMENTE de userAchievementsData con campos corregidos
      const unlockedCount = userAchievementsData.filter(ua => ua.is_unlocked).length;
      const totalCount = allAchievementsData.length;
      const percentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
      const totalPoints = userAchievementsData
        .filter(ua => ua.is_unlocked)
        .reduce((sum, ua) => sum + (ua.Achievement?.points || 0), 0);

      setStats({
        totalUnlocked: unlockedCount,
        totalAchievements: totalCount,
        completionPercentage: percentage,
        totalPoints,
      });

      console.log('📈 [AchievementsScreen] Estadísticas calculadas (corregidas):', {
        totalUnlocked: unlockedCount,
        totalAchievements: totalCount,
        completionPercentage: percentage,
        totalPoints,
        unlockedAchievements: userAchievementsData
          .filter(ua => ua.is_unlocked)
          .map(ua => `${ua.Achievement?.title || 'Sin título'} (${ua.Achievement?.points || 0} pts)`),
      });

    } catch (error) {
      console.error('❌ [AchievementsScreen] Error cargando logros:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Forzar refresh del servicio antes de cargar
    try {
      await RealAchievementServiceEnhanced.forceRefresh();
    } catch (error) {
      console.error('❌ [AchievementsScreen] Error en force refresh:', error);
    }
    await loadAchievements();
    setRefreshing(false);
  };

  const getAchievementData = (achievement: ServerAchievement) => {
    // ✅ MAPEO CORREGIDO: Buscar por AchievementID en lugar de achievement_id
    const userAchievement = achievements.find(ua => ua.AchievementID === achievement.ID);
    
    console.log(`🔍 Procesando logro ${achievement.ID} (${achievement.title}):`);
    console.log(`   UserAchievement encontrado:`, userAchievement ? 'SÍ' : 'NO');
    if (userAchievement) {
      console.log(`   → Desbloqueado: ${userAchievement.is_unlocked}`);
      console.log(`   → Progreso: ${userAchievement.current_progress}`);
      console.log(`   → Fecha: ${userAchievement.unlocked_at || 'No desbloqueado'}`);
    }
    
    return {
      ...achievement,
      isUnlocked: userAchievement?.is_unlocked || false,
      progress: userAchievement?.current_progress || 0,  // ✅ Usar current_progress
      unlockedAt: userAchievement?.unlocked_at,
    };
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'celebracion': return '#4caf50';
      case 'genial': return '#2196f3';
      case 'increible': return '#9c27b0';
      case 'super_especial': return '#ff9800';
      case 'common': return '#9ca3af';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#4285f4';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString || dateString === '0001-01-01T00:00:00Z') return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderProgressBar = (progress: number, maxProgress: number, isUnlocked: boolean) => {
    const percentage = maxProgress > 0 ? Math.min((progress / maxProgress) * 100, 100) : 0;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                backgroundColor: isUnlocked ? '#4CAF50' : '#2196F3',
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {progress}/{maxProgress} ({Math.round(percentage)}%)
        </Text>
      </View>
    );
  };

  const renderAchievementCard = (achievementData: any) => {
    const { isUnlocked, progress, unlockedAt } = achievementData;
    
    return (
      <View
        key={achievementData.ID}
        style={[
          styles.achievementCard,
          isUnlocked && styles.achievementCardUnlocked
        ]}
      >
        {/* Header del logro */}
        <View style={styles.achievementHeader}>
          <View style={[
            styles.achievementIcon,
            { backgroundColor: getRarityColor(achievementData.rarity || 'common') + '20' }
          ]}>
            <Text style={styles.achievementIconText}>
              {isUnlocked ? (achievementData.icon || '🏆') : '🔒'}
            </Text>
          </View>
          
          <View style={styles.achievementInfo}>
            <Text style={[
              styles.achievementTitle,
              isUnlocked && styles.achievementTitleUnlocked
            ]}>
              {String(achievementData.title || `Logro #${achievementData.ID || 'N/A'}`)}
            </Text>
            <Text style={[
              styles.achievementDescription,
              isUnlocked && styles.achievementDescriptionUnlocked
            ]}>
              {String(achievementData.description || 'Sin descripción')}
            </Text>
            <Text style={styles.debugInfo}>
              ID: {achievementData.ID || 'N/A'} | Condición: {String(achievementData.condition || 'N/A')}
            </Text>
          </View>
          
          <View style={styles.achievementReward}>
            <View style={[
              styles.pointsBadge,
              { backgroundColor: getRarityColor(achievementData.rarity || 'common') }
            ]}>
              <Text style={styles.pointsText}>+{Number(achievementData.points) || 0}</Text>
            </View>
            <Text style={styles.rarityText}>{String(achievementData.rarity || 'common')}</Text>
          </View>
        </View>

        {/* Barra de progreso */}
        {renderProgressBar(progress, achievementData.max_progress || 1, isUnlocked)}

        {/* Estado del logro */}
        <View style={styles.statusContainer}>
          {isUnlocked ? (
            <View style={styles.unlockedStatus}>
              <Text style={styles.unlockedText}>
                ✅ ¡DESBLOQUEADO! {unlockedAt ? `el ${formatDate(unlockedAt)}` : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.lockedStatus}>
              <Text style={styles.lockedText}>
                🔒 Progreso: {progress}/{achievementData.max_progress || 1}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderStatsHeader = () => (
    <View style={styles.statsHeader}>
      <View style={[styles.statsCard, { backgroundColor: '#4CAF50' }]}>
        <Text style={styles.statsNumber}>{stats.totalUnlocked}</Text>
        <Text style={styles.statsLabel}>Desbloqueados</Text>
      </View>
      
      <View style={[styles.statsCard, { backgroundColor: '#2196F3' }]}>
        <Text style={styles.statsNumber}>{stats.completionPercentage}%</Text>
        <Text style={styles.statsLabel}>Completado</Text>
      </View>
      
      <View style={[styles.statsCard, { backgroundColor: '#FF9800' }]}>
        <Text style={styles.statsNumber}>{stats.totalPoints}</Text>
        <Text style={styles.statsLabel}>Puntos</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285f4" />
          <Text style={styles.loadingText}>Cargando logros del servidor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Convertir todos los logros del servidor a formato de visualización
  console.log('🎨 [AchievementsScreen] Convirtiendo logros para visualización (corregido)...');
  const allAchievementsWithProgress = allAchievements.map(achievement => {
    const result = getAchievementData(achievement);
    console.log(`   → ${achievement.title}: ${result.isUnlocked ? 'DESBLOQUEADO' : 'BLOQUEADO'}`);
    return result;
  });

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
        <Text style={styles.title}>🏆 Mis Logros</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.topSection}>
        {renderStatsHeader()}
        
        {/* Debug info */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🔍 Debug Info (Auto-Refresh):</Text>
          <Text style={styles.debugText}>
            Logros del servidor: {allAchievements.length} | 
            Logros del usuario: {achievements.length} | 
            Desbloqueados: {achievements.filter(ua => ua.is_unlocked).length}
          </Text>
        </View>
      </View>

      {/* Lista de logros */}
      <ScrollView 
        style={styles.achievementsList}
        contentContainerStyle={styles.achievementsContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4285f4']}
            tintColor="#4285f4"
          />
        }
      >
        {allAchievementsWithProgress.length > 0 ? (
          allAchievementsWithProgress.map(achievement => renderAchievementCard(achievement))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎯</Text>
            <Text style={styles.emptyStateText}>No hay logros disponibles</Text>
            <Text style={styles.emptyStateSubtext}>¡Sigue jugando para desbloquear logros!</Text>
          </View>
        )}
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
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  topSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  statsCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  debugContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
  },
  achievementsList: {
    flex: 1,
    marginTop: 12,
  },
  achievementsContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  achievementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    opacity: 0.7,
  },
  achievementCardUnlocked: {
    opacity: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    backgroundColor: '#f8fff8',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementIconText: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9ca3af',
    marginBottom: 4,
  },
  achievementTitleUnlocked: {
    color: '#1a1a1a',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 18,
    marginBottom: 4,
  },
  achievementDescriptionUnlocked: {
    color: '#6b7280',
  },
  debugInfo: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  achievementReward: {
    alignItems: 'center',
  },
  pointsBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  rarityText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    fontWeight: '600',
  },
  statusContainer: {
    marginTop: 8,
  },
  unlockedStatus: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  unlockedText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '700',
    textAlign: 'center',
  },
  lockedStatus: {
    backgroundColor: '#f8faff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e8f0fe',
  },
  lockedText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default AchievementsScreen;