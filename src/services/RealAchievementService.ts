// src/services/RealAchievementService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService, { Achievement, UserAchievement } from './ApiService';
import AuthService from './AuthService';

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

interface AchievementWithProgress extends Achievement {
  isUnlocked: boolean;
  currentProgress: number;
  unlockedAt?: string;
}

interface AchievementStats {
  total: number;
  unlocked: number;
  completionRate: number;
  unlockedPoints: number;
  totalPoints: number;
}

interface UserGameStats {
  totalGamesPlayed: number;
  totalStarsEarned: number;
  perfectGames: number;
  totalPlayTime: number;
  averageStars: number;
  gamesThisWeek: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayDate: string;
}

const STORAGE_KEYS = {
  ACHIEVEMENTS_CACHE: '@neuroapp_achievements_cache',
  USER_ACHIEVEMENTS_CACHE: '@neuroapp_user_achievements_cache',
  USER_STATS_CACHE: '@neuroapp_user_stats_cache',
  LAST_SYNC: '@neuroapp_achievements_last_sync',
};

class RealAchievementService {
  private achievements: Achievement[] = [];
  private userAchievements: UserAchievement[] = [];
  private userStats: UserGameStats = {
    totalGamesPlayed: 0,
    totalStarsEarned: 0,
    perfectGames: 0,
    totalPlayTime: 0,
    averageStars: 0,
    gamesThisWeek: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayDate: '',
  };
  private isInitialized = false;
  private lastSyncTime = 0;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  async initializeAchievements(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🏆 Initializing RealAchievementService...');
      
      const user = AuthService.getCurrentUser();
      if (!user) {
        throw new Error('No user logged in');
      }

      // Load from cache first
      await this.loadFromCache();

      // Check if we need to sync with server
      const shouldSync = this.shouldSyncWithServer();
      
      if (shouldSync) {
        console.log('🔄 Syncing with server...');
        await this.syncWithServer();
      } else {
        console.log('📱 Using cached data');
      }

      this.isInitialized = true;
      console.log('✅ RealAchievementService initialized');
      
    } catch (error) {
      console.error('❌ Error initializing achievements:', error);
      // Try to use cached data as fallback
      await this.loadFromCache();
      this.isInitialized = true;
      throw error;
    }
  }

  private shouldSyncWithServer(): boolean {
    const now = Date.now();
    const timeSinceLastSync = now - this.lastSyncTime;
    return timeSinceLastSync > this.SYNC_INTERVAL || this.achievements.length === 0;
  }

  private async loadFromCache(): Promise<void> {
    try {
      const [achievementsCache, userAchievementsCache, userStatsCache, lastSyncCache] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS_CACHE),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ACHIEVEMENTS_CACHE),
        AsyncStorage.getItem(STORAGE_KEYS.USER_STATS_CACHE),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      if (achievementsCache) {
        this.achievements = JSON.parse(achievementsCache);
        console.log(`📱 Loaded ${this.achievements.length} achievements from cache`);
      }

      if (userAchievementsCache) {
        this.userAchievements = JSON.parse(userAchievementsCache);
        console.log(`📱 Loaded ${this.userAchievements.length} user achievements from cache`);
      }

      if (userStatsCache) {
        this.userStats = JSON.parse(userStatsCache);
        console.log('📱 Loaded user stats from cache');
      }

      if (lastSyncCache) {
        this.lastSyncTime = parseInt(lastSyncCache, 10);
      }

    } catch (error) {
      console.error('❌ Error loading from cache:', error);
    }
  }

  private async saveToCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS_CACHE, JSON.stringify(this.achievements)),
        AsyncStorage.setItem(STORAGE_KEYS.USER_ACHIEVEMENTS_CACHE, JSON.stringify(this.userAchievements)),
        AsyncStorage.setItem(STORAGE_KEYS.USER_STATS_CACHE, JSON.stringify(this.userStats)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, this.lastSyncTime.toString()),
      ]);
      console.log('💾 Saved achievements to cache');
    } catch (error) {
      console.error('❌ Error saving to cache:', error);
    }
  }

  private async syncWithServer(): Promise<void> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        throw new Error('No user logged in');
      }

      console.log('🌐 Fetching achievements from server...');
      
      // Fetch all achievements and user progress in parallel
      const [allAchievements, userAchievements] = await Promise.all([
        ApiService.getAchievements(),
        ApiService.getUserAchievements(user.id),
      ]);

      this.achievements = allAchievements;
      this.userAchievements = userAchievements;
      this.lastSyncTime = Date.now();

      // Update user stats based on achievements
      this.updateUserStatsFromAchievements();

      // Save to cache
      await this.saveToCache();

      console.log(`✅ Synced ${allAchievements.length} achievements and ${userAchievements.length} user achievements`);
      
    } catch (error) {
      console.error('❌ Error syncing with server:', error);
      throw error;
    }
  }

  private updateUserStatsFromAchievements(): void {
    const unlockedAchievements = this.userAchievements.filter(ua => ua.is_unlocked);
    
    this.userStats = {
      ...this.userStats,
      totalStarsEarned: unlockedAchievements.reduce((sum, ua) => sum + ua.Achievement.points, 0),
      // Other stats would be updated from game sessions in a real implementation
    };
  }

  async getAllAchievements(): Promise<AchievementWithProgress[]> {
    if (!this.isInitialized) {
      await this.initializeAchievements();
    }

    return this.achievements.map(achievement => {
      const userAchievement = this.userAchievements.find(ua => ua.achievement_id === achievement.ID);
      
      return {
        ...achievement,
        isUnlocked: userAchievement?.is_unlocked || false,
        currentProgress: userAchievement?.progress || 0,
        unlockedAt: userAchievement?.unlocked_at,
      };
    });
  }

  async getAchievementStats(): Promise<AchievementStats> {
    if (!this.isInitialized) {
      await this.initializeAchievements();
    }

    const unlockedCount = this.userAchievements.filter(ua => ua.is_unlocked).length;
    const totalCount = this.achievements.length;
    const unlockedPoints = this.userAchievements
      .filter(ua => ua.is_unlocked)
      .reduce((sum, ua) => sum + ua.Achievement.points, 0);
    const totalPoints = this.achievements.reduce((sum, a) => sum + a.points, 0);

    return {
      total: totalCount,
      unlocked: unlockedCount,
      completionRate: totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0,
      unlockedPoints,
      totalPoints,
    };
  }

  async recordGameCompletion(gameData: GameCompletionData): Promise<Achievement[]> {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) {
        console.warn('No user logged in, skipping achievement recording');
        return [];
      }

      console.log('🎮 Recording game completion:', gameData);

      // Update local user stats
      this.updateLocalUserStats(gameData);

      // Check for newly unlocked achievements
      const newlyUnlocked = await this.checkAndUnlockAchievements(gameData);

      if (newlyUnlocked.length > 0) {
        console.log(`🏆 Unlocked ${newlyUnlocked.length} new achievements:`, newlyUnlocked.map(a => a.name));
        
        // Sync with server to update progress
        try {
          await this.syncWithServer();
        } catch (error) {
          console.error('❌ Error syncing after achievement unlock:', error);
          // Continue anyway, we have local data
        }
      }

      return newlyUnlocked;
      
    } catch (error) {
      console.error('❌ Error recording game completion:', error);
      return [];
    }
  }

  private updateLocalUserStats(gameData: GameCompletionData): void {
    const now = new Date().toISOString();
    
    this.userStats = {
      ...this.userStats,
      totalGamesPlayed: this.userStats.totalGamesPlayed + 1,
      totalStarsEarned: this.userStats.totalStarsEarned + gameData.stars,
      perfectGames: gameData.isPerfect ? this.userStats.perfectGames + 1 : this.userStats.perfectGames,
      totalPlayTime: this.userStats.totalPlayTime + gameData.completionTime,
      averageStars: (this.userStats.totalStarsEarned + gameData.stars) / (this.userStats.totalGamesPlayed + 1),
      lastPlayDate: now,
    };

    // Update streak
    const today = new Date().toDateString();
    const lastPlayDate = this.userStats.lastPlayDate ? new Date(this.userStats.lastPlayDate).toDateString() : '';
    
    if (lastPlayDate === today) {
      // Same day, no change to streak
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastPlayDate === yesterday.toDateString()) {
        // Consecutive day
        this.userStats.currentStreak += 1;
        this.userStats.bestStreak = Math.max(this.userStats.bestStreak, this.userStats.currentStreak);
      } else {
        // Streak broken
        this.userStats.currentStreak = 1;
      }
    }
  }

  private async checkAndUnlockAchievements(gameData: GameCompletionData): Promise<Achievement[]> {
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of this.achievements) {
      const userAchievement = this.userAchievements.find(ua => ua.achievement_id === achievement.ID);
      
      // Skip if already unlocked
      if (userAchievement?.is_unlocked) continue;

      // Check if achievement should be unlocked
      const shouldUnlock = this.checkAchievementCondition(achievement, gameData);
      
      if (shouldUnlock) {
        // Update or create user achievement
        const existingIndex = this.userAchievements.findIndex(ua => ua.achievement_id === achievement.ID);
        
        if (existingIndex >= 0) {
          this.userAchievements[existingIndex] = {
            ...this.userAchievements[existingIndex],
            is_unlocked: true,
            progress: achievement.condition_value,
            unlocked_at: new Date().toISOString(),
          };
        } else {
          // Create new user achievement
          const newUserAchievement: UserAchievement = {
            ID: Date.now(), // Temporary ID
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
            DeletedAt: null,
            user_id: AuthService.getCurrentUser()!.id,
            achievement_id: achievement.ID,
            is_unlocked: true,
            progress: achievement.condition_value,
            unlocked_at: new Date().toISOString(),
            Achievement: achievement,
          };
          
          this.userAchievements.push(newUserAchievement);
        }

        newlyUnlocked.push(achievement);

        // Try to unlock on server
        try {
          await ApiService.unlockAchievement(AuthService.getCurrentUser()!.id, achievement.ID);
          console.log(`🌐 Unlocked achievement on server: ${achievement.name}`);
        } catch (error) {
          console.error(`❌ Error unlocking achievement on server: ${achievement.name}`, error);
          // Continue anyway, we have local unlock
        }
      } else {
        // Update progress if not unlocked
        const newProgress = this.calculateAchievementProgress(achievement, gameData);
        
        if (newProgress > (userAchievement?.progress || 0)) {
          const existingIndex = this.userAchievements.findIndex(ua => ua.achievement_id === achievement.ID);
          
          if (existingIndex >= 0) {
            this.userAchievements[existingIndex] = {
              ...this.userAchievements[existingIndex],
              progress: newProgress,
            };
          } else {
            // Create new user achievement with progress
            const newUserAchievement: UserAchievement = {
              ID: Date.now(), // Temporary ID
              CreatedAt: new Date().toISOString(),
              UpdatedAt: new Date().toISOString(),
              DeletedAt: null,
              user_id: AuthService.getCurrentUser()!.id,
              achievement_id: achievement.ID,
              is_unlocked: false,
              progress: newProgress,
              Achievement: achievement,
            };
            
            this.userAchievements.push(newUserAchievement);
          }

          // Try to update progress on server
          try {
            await ApiService.updateAchievementProgress(AuthService.getCurrentUser()!.id, achievement.ID, newProgress);
          } catch (error) {
            console.error(`❌ Error updating achievement progress on server: ${achievement.name}`, error);
          }
        }
      }
    }

    // Save updated data to cache
    await this.saveToCache();

    return newlyUnlocked;
  }

  private checkAchievementCondition(achievement: Achievement, gameData: GameCompletionData): boolean {
    switch (achievement.condition_type) {
      case 'games_played':
        return this.userStats.totalGamesPlayed >= achievement.condition_value;
      
      case 'perfect_games':
        return gameData.isPerfect && this.userStats.perfectGames >= achievement.condition_value;
      
      case 'stars_earned':
        return this.userStats.totalStarsEarned >= achievement.condition_value;
      
      case 'consecutive_days':
        return this.userStats.currentStreak >= achievement.condition_value;
      
      case 'activity_type':
        return gameData.activityType === achievement.description && this.userStats.totalGamesPlayed >= achievement.condition_value;
      
      case 'fast_completion':
        return gameData.completionTime <= achievement.condition_value;
      
      case 'no_errors':
        return gameData.errors === 0 && gameData.isPerfect;
      
      case 'improvement':
        return gameData.showedImprovement === true;
      
      default:
        return false;
    }
  }

  private calculateAchievementProgress(achievement: Achievement, gameData: GameCompletionData): number {
    switch (achievement.condition_type) {
      case 'games_played':
        return Math.min(this.userStats.totalGamesPlayed, achievement.condition_value);
      
      case 'perfect_games':
        return Math.min(this.userStats.perfectGames, achievement.condition_value);
      
      case 'stars_earned':
        return Math.min(this.userStats.totalStarsEarned, achievement.condition_value);
      
      case 'consecutive_days':
        return Math.min(this.userStats.currentStreak, achievement.condition_value);
      
      default:
        return 0;
    }
  }

  async forceRefresh(): Promise<void> {
    console.log('🔄 Force refreshing achievements...');
    this.lastSyncTime = 0; // Force sync
    await this.syncWithServer();
  }

  // Utility methods for UI
  async getUnlockedAchievements(): Promise<AchievementWithProgress[]> {
    const allAchievements = await this.getAllAchievements();
    return allAchievements.filter(a => a.isUnlocked);
  }

  async getAchievementsByCategory(category: string): Promise<AchievementWithProgress[]> {
    const allAchievements = await this.getAllAchievements();
    return allAchievements.filter(a => a.category === category);
  }

  async getTotalPoints(): Promise<number> {
    const stats = await this.getAchievementStats();
    return stats.unlockedPoints;
  }

  // Debug methods
  async debugUserStats(): Promise<UserGameStats> {
    return this.userStats;
  }

  async debugClearCache(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS_CACHE),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_ACHIEVEMENTS_CACHE),
      AsyncStorage.removeItem(STORAGE_KEYS.USER_STATS_CACHE),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
    ]);
    
    this.achievements = [];
    this.userAchievements = [];
    this.userStats = {
      totalGamesPlayed: 0,
      totalStarsEarned: 0,
      perfectGames: 0,
      totalPlayTime: 0,
      averageStars: 0,
      gamesThisWeek: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastPlayDate: '',
    };
    this.isInitialized = false;
    this.lastSyncTime = 0;
    
    console.log('🗑️ Achievement cache cleared');
  }
}

export default new RealAchievementService();