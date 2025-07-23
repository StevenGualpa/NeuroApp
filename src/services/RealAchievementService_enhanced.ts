// src/services/RealAchievementService_enhanced.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiService';
import AuthService from './AuthService';

// ✅ INTERFACES CORREGIDAS SEGÚN LOS DATOS DEL SERVIDOR
interface ServerAchievement {
  ID: number;
  title: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  points: number;
  condition: string;  // ← Servidor usa "condition"
  max_progress: number;  // ← Servidor usa "max_progress"
  is_active: boolean;
}

interface UserAchievement {
  ID: number;
  UserID: number;  // ← Servidor usa "UserID"
  AchievementID: number;  // ← Servidor usa "AchievementID"
  is_unlocked: boolean;
  current_progress: number;  // ← Servidor usa "current_progress"
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
  last_activity_date: string;
}

interface GameCompletionData {
  stars: number;
  isPerfect: boolean;
  completionTime: number;
  errors: number;
  activityType: string;
  showedImprovement?: boolean;
  usedHelp?: boolean;
  tookTime?: boolean;
  lessonId?: number;
  stepId?: number;
}

interface LocalUserStats {
  totalActivitiesCompleted: number;
  totalStarsEarned: number;
  totalPlayTime: number;
  helpfulAttempts: number;
  improvementMoments: number;
  explorationPoints: number;
  lastActivityDate: string;
  daysPlaying: number;
}

interface AchievementWithProgress extends ServerAchievement {
  isUnlocked: boolean;
  currentProgress: number;
  unlockedAt?: string;
}

const STORAGE_KEYS = {
  ACHIEVEMENTS_CACHE: '@neuroapp_achievements_cache_v3',
  USER_ACHIEVEMENTS_CACHE: '@neuroapp_user_achievements_cache_v3',
  LOCAL_STATS_CACHE: '@neuroapp_local_stats_cache_v3',
  LAST_SYNC: '@neuroapp_achievements_last_sync_v3',
};

class RealAchievementServiceEnhanced {
  private achievements: ServerAchievement[] = [];
  private userAchievements: UserAchievement[] = [];
  private localStats: LocalUserStats = {
    totalActivitiesCompleted: 0,
    totalStarsEarned: 0,
    totalPlayTime: 0,
    helpfulAttempts: 0,
    improvementMoments: 0,
    explorationPoints: 0,
    lastActivityDate: '',
    daysPlaying: 0,
  };
  private serverStats: UserStats | null = null;
  private isInitialized = false;
  private lastSyncTime = 0;
  private readonly SYNC_INTERVAL = 2 * 60 * 1000; // 2 minutes

  async initializeAchievements(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🏆 [RealAchievementServiceEnhanced] Inicializando...');
      
      const user = AuthService.getCurrentUser();
      if (!user) {
        throw new Error('No user logged in');
      }

      // Load from cache first
      await this.loadFromCache();

      // Always try to sync with server for fresh data
      try {
        await this.syncWithServer();
      } catch (error) {
        console.warn('⚠️ [RealAchievementServiceEnhanced] Error syncing with server, using cache:', error);
      }

      this.isInitialized = true;
      console.log('✅ [RealAchievementServiceEnhanced] Inicializado exitosamente');
      
    } catch (error) {
      console.error('❌ [RealAchievementServiceEnhanced] Error inicializando:', error);
      await this.loadFromCache();
      this.isInitialized = true;
      throw error;
    }
  }

  private async loadFromCache(): Promise<void> {
    try {
      const [achievementsCache, userAchievementsCache, localStatsCache, lastSyncCache] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS_CACHE),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ACHIEVEMENTS_CACHE),
        AsyncStorage.getItem(STORAGE_KEYS.LOCAL_STATS_CACHE),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      if (achievementsCache) {
        this.achievements = JSON.parse(achievementsCache);
        console.log(`📱 [Cache] Cargados ${this.achievements.length} logros`);
      }

      if (userAchievementsCache) {
        this.userAchievements = JSON.parse(userAchievementsCache);
        console.log(`📱 [Cache] Cargados ${this.userAchievements.length} logros de usuario`);
      }

      if (localStatsCache) {
        this.localStats = JSON.parse(localStatsCache);
        console.log('📱 [Cache] Estadísticas locales cargadas');
      }

      if (lastSyncCache) {
        this.lastSyncTime = parseInt(lastSyncCache, 10);
      }

    } catch (error) {
      console.error('❌ [Cache] Error cargando desde cache:', error);
    }
  }

  private async saveToCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS_CACHE, JSON.stringify(this.achievements)),
        AsyncStorage.setItem(STORAGE_KEYS.USER_ACHIEVEMENTS_CACHE, JSON.stringify(this.userAchievements)),
        AsyncStorage.setItem(STORAGE_KEYS.LOCAL_STATS_CACHE, JSON.stringify(this.localStats)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime.toString()),
      ]);
      console.log('💾 [Cache] Datos guardados en cache');
    } catch (error) {
      console.error('❌ [Cache] Error guardando en cache:', error);
    }
  }

  private async syncWithServer(): Promise<void> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        throw new Error('No user logged in');
      }

      console.log('🌐 [Sync] Sincronizando con servidor...');
      
      // Fetch all data in parallel
      const [allAchievements, userAchievements, serverUserStats] = await Promise.all([
        ApiService.getAchievements(),
        ApiService.getUserAchievements(user.id),
        ApiService.getUserStats(user.id),
      ]);

      this.achievements = allAchievements;
      this.userAchievements = userAchievements;
      this.serverStats = serverUserStats.stats;
      this.lastSyncTime = Date.now();

      // Merge server stats with local stats
      this.mergeStatsFromServer();

      // Save to cache
      await this.saveToCache();

      console.log(`✅ [Sync] Sincronizado: ${allAchievements.length} logros, ${userAchievements.length} logros de usuario`);
      console.log('📊 [Sync] Estadísticas del servidor:', {
        activitiesCompleted: this.serverStats?.total_activities_completed,
        starsEarned: this.serverStats?.total_stars_earned,
        playTime: this.serverStats?.total_play_time,
      });
      
    } catch (error) {
      console.error('❌ [Sync] Error sincronizando con servidor:', error);
      throw error;
    }
  }

  private mergeStatsFromServer(): void {
    if (!this.serverStats) return;

    // Merge server stats with local tracking
    this.localStats = {
      ...this.localStats,
      totalActivitiesCompleted: this.serverStats.total_activities_completed,
      totalStarsEarned: this.serverStats.total_stars_earned,
      totalPlayTime: this.serverStats.total_play_time,
      daysPlaying: this.serverStats.days_playing,
      lastActivityDate: this.serverStats.last_activity_date || new Date().toISOString(),
    };

    console.log('🔄 [Merge] Estadísticas combinadas:', this.localStats);
  }

  async getAllAchievements(): Promise<AchievementWithProgress[]> {
    if (!this.isInitialized) {
      await this.initializeAchievements();
    }

    return this.achievements.map(achievement => {
      // ✅ MAPEO CORREGIDO: Usar AchievementID en lugar de achievement_id
      const userAchievement = this.userAchievements.find(ua => ua.AchievementID === achievement.ID);
      
      return {
        ...achievement,
        isUnlocked: userAchievement?.is_unlocked || false,
        currentProgress: userAchievement?.current_progress || 0,  // ✅ Usar current_progress
        unlockedAt: userAchievement?.unlocked_at,
      };
    });
  }

  async recordGameCompletion(gameData: GameCompletionData): Promise<ServerAchievement[]> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        console.warn('⚠️ [Achievement] No hay usuario logueado');
        return [];
      }

      console.log('🎮 [Achievement] Registrando finalización del juego:', {
        stars: gameData.stars,
        errors: gameData.errors,
        completionTime: gameData.completionTime,
        activityType: gameData.activityType,
        isPerfect: gameData.isPerfect,
        usedHelp: gameData.usedHelp,
      });

      // Update local stats immediately
      this.updateLocalStats(gameData);

      // Sync with server to get latest stats
      try {
        await this.syncWithServer();
      } catch (error) {
        console.warn('⚠️ [Achievement] Error sincronizando, usando datos locales:', error);
      }

      // Check for newly unlocked achievements
      const newlyUnlocked = await this.checkAndUnlockAchievements(gameData);

      if (newlyUnlocked.length > 0) {
        console.log(`🏆 [Achievement] ¡${newlyUnlocked.length} logros desbloqueados!:`, 
          newlyUnlocked.map(a => a.title));  // ✅ Usar title
        
        // Save to cache
        await this.saveToCache();
      } else {
        console.log('📊 [Achievement] No se desbloquearon nuevos logros');
        console.log('📊 [Achievement] Estadísticas actuales:', {
          activitiesCompleted: this.localStats.totalActivitiesCompleted,
          starsEarned: this.localStats.totalStarsEarned,
          playTime: this.localStats.totalPlayTime,
        });
      }

      return newlyUnlocked;
      
    } catch (error) {
      console.error('❌ [Achievement] Error registrando finalización:', error);
      return [];
    }
  }

  private updateLocalStats(gameData: GameCompletionData): void {
    const now = new Date().toISOString();
    
    this.localStats = {
      ...this.localStats,
      totalActivitiesCompleted: this.localStats.totalActivitiesCompleted + 1,
      totalStarsEarned: this.localStats.totalStarsEarned + gameData.stars,
      totalPlayTime: this.localStats.totalPlayTime + gameData.completionTime,
      helpfulAttempts: gameData.usedHelp ? this.localStats.helpfulAttempts + 1 : this.localStats.helpfulAttempts,
      improvementMoments: gameData.showedImprovement ? this.localStats.improvementMoments + 1 : this.localStats.improvementMoments,
      explorationPoints: this.localStats.explorationPoints + 1,
      lastActivityDate: now,
    };

    console.log('📊 [LocalStats] Estadísticas actualizadas:', this.localStats);
  }

  private async checkAndUnlockAchievements(gameData: GameCompletionData): Promise<ServerAchievement[]> {
    const newlyUnlocked: ServerAchievement[] = [];
    const now = new Date();

    for (const achievement of this.achievements) {
      // ✅ MAPEO CORREGIDO: Usar AchievementID en lugar de achievement_id
      const userAchievement = this.userAchievements.find(ua => ua.AchievementID === achievement.ID);
      
      // Skip if already unlocked
      if (userAchievement?.is_unlocked) continue;

      // Check if achievement should be unlocked
      const shouldUnlock = this.checkAchievementCondition(achievement, gameData, now);
      
      console.log(`🔍 [Achievement] Verificando "${achievement.title}":`, {  // ✅ Usar title
        condition: achievement.condition,  // ✅ Usar condition
        shouldUnlock,
        currentStats: {
          activities: this.localStats.totalActivitiesCompleted,
          stars: this.localStats.totalStarsEarned,
          playTime: this.localStats.totalPlayTime,
        }
      });
      
      if (shouldUnlock) {
        // ✅ MAPEO CORREGIDO: Usar AchievementID en lugar de achievement_id
        const existingIndex = this.userAchievements.findIndex(ua => ua.AchievementID === achievement.ID);
        
        if (existingIndex >= 0) {
          this.userAchievements[existingIndex] = {
            ...this.userAchievements[existingIndex],
            is_unlocked: true,
            current_progress: achievement.max_progress,  // ✅ Usar max_progress
            unlocked_at: now.toISOString(),
          };
        } else {
          // Create new user achievement
          const newUserAchievement: UserAchievement = {
            ID: Date.now(), // Temporary ID
            UserID: user.id,  // ✅ Usar UserID
            AchievementID: achievement.ID,  // ✅ Usar AchievementID
            is_unlocked: true,
            current_progress: achievement.max_progress,  // ✅ Usar current_progress y max_progress
            unlocked_at: now.toISOString(),
            Achievement: achievement,
          };
          
          this.userAchievements.push(newUserAchievement);
        }

        newlyUnlocked.push(achievement);

        // Try to unlock on server
        try {
          await ApiService.unlockAchievement(user.id, achievement.ID);
          console.log(`🌐 [Server] Logro desbloqueado en servidor: ${achievement.title}`);  // ✅ Usar title
        } catch (error) {
          console.error(`❌ [Server] Error desbloqueando en servidor: ${achievement.title}`, error);  // ✅ Usar title
          // Continue anyway, we have local unlock
        }
      } else {
        // Update progress if not unlocked
        const newProgress = this.calculateAchievementProgress(achievement);
        
        // ✅ MAPEO CORREGIDO: Usar current_progress en lugar de progress
        if (newProgress > (userAchievement?.current_progress || 0)) {
          const existingIndex = this.userAchievements.findIndex(ua => ua.AchievementID === achievement.ID);
          
          if (existingIndex >= 0) {
            this.userAchievements[existingIndex] = {
              ...this.userAchievements[existingIndex],
              current_progress: newProgress,  // ✅ Usar current_progress
            };
          } else {
            // Create new user achievement with progress
            const newUserAchievement: UserAchievement = {
              ID: Date.now(), // Temporary ID
              UserID: user.id,  // ✅ Usar UserID
              AchievementID: achievement.ID,  // ✅ Usar AchievementID
              is_unlocked: false,
              current_progress: newProgress,  // ✅ Usar current_progress
              Achievement: achievement,
            };
            
            this.userAchievements.push(newUserAchievement);
          }

          // Try to update progress on server
          try {
            await ApiService.updateAchievementProgress(user.id, achievement.ID, newProgress);
          } catch (error) {
            console.error(`❌ [Server] Error actualizando progreso: ${achievement.title}`, error);  // ✅ Usar title
          }
        }
      }
    }

    return newlyUnlocked;
  }

  private checkAchievementCondition(achievement: ServerAchievement, gameData: GameCompletionData, now: Date): boolean {
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // ✅ USAR CONDITION EN LUGAR DE CONDITION_TYPE
    switch (achievement.condition) {
      case 'complete_first_lesson':
      case 'first_activity':
        return this.localStats.totalActivitiesCompleted >= 1;
      
      case 'games_played':
        return this.localStats.totalActivitiesCompleted >= achievement.max_progress;  // ✅ Usar max_progress
      
      case 'perfect_games':
      case 'perfect_lesson':
        return gameData.isPerfect && this.localStats.totalActivitiesCompleted >= achievement.max_progress;
      
      case 'stars_earned':
      case 'collect_stars':
        return this.localStats.totalStarsEarned >= achievement.max_progress;  // ✅ Usar max_progress
      
      case 'consecutive_days':
        return this.localStats.daysPlaying >= achievement.max_progress;  // ✅ Usar max_progress
      
      case 'activity_type':
        return gameData.activityType === achievement.description && this.localStats.totalActivitiesCompleted >= achievement.max_progress;
      
      case 'fast_completion':
        return gameData.completionTime <= achievement.max_progress;  // ✅ Usar max_progress
      
      case 'no_errors':
        return gameData.errors === 0 && gameData.isPerfect;
      
      case 'improvement':
        return gameData.showedImprovement === true;
      
      case 'used_help':
      case 'help_seeker':
        return gameData.usedHelp === true;
      
      case 'morning_activity':
        return hour >= 6 && hour < 12;
      
      case 'weekend_learning':
        return isWeekend;
      
      case 'patient_learning':
        return gameData.completionTime > 60000; // More than 1 minute
      
      default:
        console.warn(`⚠️ [Achievement] Condición desconocida: ${achievement.condition}`);  // ✅ Usar condition
        return false;
    }
  }

  private calculateAchievementProgress(achievement: ServerAchievement): number {
    // ✅ USAR CONDITION EN LUGAR DE CONDITION_TYPE Y MAX_PROGRESS EN LUGAR DE CONDITION_VALUE
    switch (achievement.condition) {
      case 'games_played':
      case 'complete_first_lesson':
      case 'first_activity':
        return Math.min(this.localStats.totalActivitiesCompleted, achievement.max_progress);
      
      case 'stars_earned':
      case 'collect_stars':
        return Math.min(this.localStats.totalStarsEarned, achievement.max_progress);
      
      case 'consecutive_days':
        return Math.min(this.localStats.daysPlaying, achievement.max_progress);
      
      default:
        return 0;
    }
  }

  async getTotalPoints(): Promise<number> {
    const allAchievements = await this.getAllAchievements();
    return allAchievements
      .filter(a => a.isUnlocked)
      .reduce((total, a) => total + a.points, 0);
  }

  async getUnlockedAchievements(): Promise<AchievementWithProgress[]> {
    const allAchievements = await this.getAllAchievements();
    return allAchievements.filter(a => a.isUnlocked);
  }

  async forceRefresh(): Promise<void> {
    console.log('🔄 [Achievement] Forzando actualización...');
    this.lastSyncTime = 0; // Force sync
    await this.syncWithServer();
  }

  // Debug methods
  async debugStats(): Promise<{ local: LocalUserStats; server: UserStats | null }> {
    return {
      local: this.localStats,
      server: this.serverStats,
    };
  }

  async debugClearCache(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS_CACHE),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_ACHIEVEMENTS_CACHE),
      AsyncStorage.removeItem(STORAGE_KEYS.LOCAL_STATS_CACHE),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
    ]);
    
    this.achievements = [];
    this.userAchievements = [];
    this.localStats = {
      totalActivitiesCompleted: 0,
      totalStarsEarned: 0,
      totalPlayTime: 0,
      helpfulAttempts: 0,
      improvementMoments: 0,
      explorationPoints: 0,
      lastActivityDate: '',
      daysPlaying: 0,
    };
    this.serverStats = null;
    this.isInitialized = false;
    this.lastSyncTime = 0;
    
    console.log('🗑️ [Achievement] Cache limpiado');
  }
}

export default new RealAchievementServiceEnhanced();