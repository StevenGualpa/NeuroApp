// src/services/GameEventsService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import AchievementConditionsService, { 
  GameEvent, 
  LessonCompletionEvent, 
  HelpUsedEvent, 
  DailyPlayEvent, 
  StarEarnedEvent,
  UserGameStats 
} from './AchievementConditionsService';

const STORAGE_KEYS = {
  USER_GAME_STATS: '@user_game_stats',
  PLAY_DATES: '@play_dates',
  DAILY_EVENTS: '@daily_events',
};

type EventCallback = (achievementId: number) => void;

class GameEventsService {
  private userStats: UserGameStats;
  private onAchievementUnlocked: EventCallback | null = null;
  private currentUserId: number | null = null;
  private todayEventsSent: Set<string> = new Set(); // Para evitar eventos duplicados del mismo día

  constructor() {
    this.userStats = this.getDefaultStats();
  }

  /**
   * Inicializar el servicio para un usuario
   */
  async initialize(userId: number, onAchievementUnlocked?: EventCallback): Promise<void> {
    this.currentUserId = userId;
    this.onAchievementUnlocked = onAchievementUnlocked || null;
    
    console.log(`🎮 [GameEvents] Inicializando para usuario: ${userId}`);
    
    // Cargar estadísticas existentes
    await this.loadUserStats();
    
    // Registrar evento de juego diario
    await this.registerDailyPlayEvent();
    
    console.log('✅ [GameEvents] Servicio inicializado');
  }

  /**
   * Obtener estadísticas por defecto
   */
  private getDefaultStats(): UserGameStats {
    return {
      totalLessonsCompleted: 0,
      totalStarsEarned: 0,
      totalHelpUsed: 0,
      consecutiveDaysPlayed: 0,
      categoriesCompleted: [],
      playDates: [],
      perfectLessons: 0,
      fastCompletions: 0,
      attemptsHistory: {},
    };
  }

  /**
   * Cargar estadísticas del usuario desde AsyncStorage
   */
  private async loadUserStats(): Promise<void> {
    try {
      const statsKey = `${STORAGE_KEYS.USER_GAME_STATS}_${this.currentUserId}`;
      const datesKey = `${STORAGE_KEYS.PLAY_DATES}_${this.currentUserId}`;
      
      const [statsJson, datesJson] = await Promise.all([
        AsyncStorage.getItem(statsKey),
        AsyncStorage.getItem(datesKey),
      ]);

      if (statsJson) {
        this.userStats = { ...this.getDefaultStats(), ...JSON.parse(statsJson) };
      }

      if (datesJson) {
        this.userStats.playDates = JSON.parse(datesJson);
      }

      // Calcular días consecutivos
      this.userStats.consecutiveDaysPlayed = this.calculateConsecutiveDays();

      console.log('📊 [GameEvents] Estadísticas cargadas:', this.userStats);
    } catch (error) {
      console.error('❌ [GameEvents] Error cargando estadísticas:', error);
      this.userStats = this.getDefaultStats();
    }
  }

  /**
   * Guardar estadísticas del usuario
   */
  private async saveUserStats(): Promise<void> {
    if (!this.currentUserId) return;

    try {
      const statsKey = `${STORAGE_KEYS.USER_GAME_STATS}_${this.currentUserId}`;
      const datesKey = `${STORAGE_KEYS.PLAY_DATES}_${this.currentUserId}`;
      
      const { playDates, ...statsToSave } = this.userStats;
      
      await Promise.all([
        AsyncStorage.setItem(statsKey, JSON.stringify(statsToSave)),
        AsyncStorage.setItem(datesKey, JSON.stringify(playDates)),
      ]);
    } catch (error) {
      console.error('❌ [GameEvents] Error guardando estadísticas:', error);
    }
  }

  /**
   * Procesar evento de lección completada
   */
  async processLessonCompletion(data: {
    lessonId: number;
    stepId: number;
    stars: number;
    completionTime: number;
    errors: number;
    usedHelp: boolean;
    perfectRun: boolean;
    category: string;
  }): Promise<number[]> {
    
    console.log('🎯 [GameEvents] Procesando lección completada:', data);
    
    const unlockedAchievements: number[] = [];
    
    // Actualizar estadísticas
    this.userStats.totalLessonsCompleted += 1;
    this.userStats.totalStarsEarned += data.stars;
    
    if (data.usedHelp) {
      this.userStats.totalHelpUsed += 1;
    }
    
    if (data.perfectRun) {
      this.userStats.perfectLessons += 1;
    }
    
    if (data.completionTime < 120) { // Menos de 2 minutos
      this.userStats.fastCompletions += 1;
    }
    
    // Agregar categoría si es nueva
    if (!this.userStats.categoriesCompleted.includes(data.category)) {
      this.userStats.categoriesCompleted.push(data.category);
    }
    
    // Registrar intentos
    const lessonKey = `lesson_${data.lessonId}`;
    this.userStats.attemptsHistory[lessonKey] = (this.userStats.attemptsHistory[lessonKey] || 0) + 1;
    
    // Crear evento
    const event: LessonCompletionEvent = {
      type: 'lesson_completed',
      timestamp: new Date(),
      data,
    };
    
    // Evaluar todos los logros
    const userAchievements = await this.getUserAchievementsSafely();
    const newUnlocked = await this.evaluateAllAchievements(event, userAchievements);
    unlockedAchievements.push(...newUnlocked);
    
    // Guardar estadísticas
    await this.saveUserStats();
    
    console.log(`🏆 [GameEvents] ${unlockedAchievements.length} logros desbloqueados`);
    return unlockedAchievements;
  }

  /**
   * Procesar uso de ayuda
   */
  async processHelpUsed(lessonId: number, stepId: number): Promise<number[]> {
    console.log('💡 [GameEvents] Procesando uso de ayuda');
    
    this.userStats.totalHelpUsed += 1;
    
    const event: HelpUsedEvent = {
      type: 'help_used',
      timestamp: new Date(),
      data: { lessonId, stepId },
    };
    
    const userAchievements = await this.getUserAchievementsSafely();
    const unlockedAchievements = await this.evaluateAllAchievements(event, userAchievements);
    await this.saveUserStats();
    
    return unlockedAchievements;
  }

  /**
   * Registrar evento de juego diario
   */
  private async registerDailyPlayEvent(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    // Evitar eventos duplicados del mismo día
    if (this.todayEventsSent.has(today)) {
      return;
    }
    
    // Agregar fecha de hoy si no existe
    if (!this.userStats.playDates.includes(today)) {
      this.userStats.playDates.push(today);
      this.userStats.playDates.sort(); // Mantener ordenado
    }
    
    // Recalcular días consecutivos
    this.userStats.consecutiveDaysPlayed = this.calculateConsecutiveDays();
    
    const event: DailyPlayEvent = {
      type: 'daily_play',
      timestamp: now,
      data: { date: today, hour, isWeekend },
    };
    
    const userAchievements = await this.getUserAchievementsSafely();
    await this.evaluateAllAchievements(event, userAchievements);
    this.todayEventsSent.add(today);
    await this.saveUserStats();
  }

  /**
   * Calcular días consecutivos jugados
   */
  private calculateConsecutiveDays(): number {
    if (this.userStats.playDates.length === 0) return 0;
    
    const sortedDates = [...this.userStats.playDates].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    
    let consecutive = 0;
    let currentDate = new Date(today);
    
    for (const dateStr of sortedDates) {
      const expectedDate = currentDate.toISOString().split('T')[0];
      
      if (dateStr === expectedDate) {
        consecutive++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return consecutive;
  }

  /**
   * Obtener user achievements de manera segura (evita dependencias circulares)
   */
  private async getUserAchievementsSafely(): Promise<any[]> {
    try {
      // Importar RealAchievementService dinámicamente para evitar dependencias circulares
      const { default: RealAchievementService } = await import('./RealAchievementService');
      return await RealAchievementService.getUserAchievements();
    } catch (error) {
      console.warn('⚠️ [GameEvents] No se pudieron obtener user achievements, usando array vacío');
      return [];
    }
  }

  /**
   * Evaluar todos los logros contra el evento actual
   */
  private async evaluateAllAchievements(event: GameEvent, userAchievements?: any[]): Promise<number[]> {
    const unlockedAchievements: number[] = [];
    
    console.log('🔍 [GameEvents] Evaluando logros para evento:', event.type);
    console.log('🔍 [GameEvents] userAchievements recibidos:', userAchievements?.length || 0);
    
    // Obtener achievements del servidor a través de RealAchievementService
    let achievements: any[] = [];
    try {
      const { default: RealAchievementService } = await import('./RealAchievementService');
      achievements = await RealAchievementService.getAllAchievements();
      console.log('📋 [GameEvents] Achievements obtenidos del servidor:', achievements.length);
    } catch (error) {
      console.error('❌ [GameEvents] No se pudieron obtener achievements del servidor:', error);
      return []; // Sin achievements del servidor, no evaluar nada
    }
    
    // Usar userAchievements proporcionados o array vacío como fallback
    const currentUserAchievements = userAchievements || [];
    console.log('👤 [GameEvents] userAchievements a evaluar:', currentUserAchievements.length);
    
    for (const achievement of achievements) {
      console.log(`🔍 [GameEvents] Evaluando achievement ${achievement.ID}: ${achievement.name}`);
      
      // Obtener progreso actual del usuario
      const userAchievement = currentUserAchievements.find((ua: any) => ua.achievement_id === achievement.ID);
      const currentProgress = userAchievement?.progress || 0;
      
      console.log(`📊 [GameEvents] Achievement ${achievement.ID} - Progreso actual: ${currentProgress}, Desbloqueado: ${userAchievement?.is_unlocked || false}`);
      
      // Evaluar condición general
      const generalResult = AchievementConditionsService.evaluateAchievementUnlock(
        achievement.ID, 
        this.userStats, 
        currentProgress
      );
      
      console.log(`🎯 [GameEvents] Achievement ${achievement.ID} - Resultado general:`, generalResult);
      
      // Evaluar evento específico
      const eventResult = AchievementConditionsService.evaluateEvent(
        event, 
        achievement.ID, 
        currentProgress
      );
      
      console.log(`🎯 [GameEvents] Achievement ${achievement.ID} - Resultado evento:`, eventResult);
      
      // Determinar el nuevo progreso más alto
      const newProgress = Math.max(generalResult.newProgress, eventResult.newProgress);
      
      // Si hay progreso o logro desbloqueado, SOLO EVALUAR (NO GUARDAR)
      if (newProgress > currentProgress || generalResult.unlocked || eventResult.unlocked) {
        console.log(`📈 [GameEvents] Achievement ${achievement.ID} - Progreso: ${currentProgress} → ${newProgress}`);
        
        // Si el logro está completamente desbloqueado, agregar a la lista
        if (generalResult.unlocked || eventResult.unlocked) {
          // Solo agregar si no estaba ya desbloqueado
          const wasUnlocked = userAchievement?.is_unlocked || false;
          if (!wasUnlocked) {
            unlockedAchievements.push(achievement.ID);
            console.log(`🏆 [GameEvents] Logro ${achievement.ID} desbloqueado (solo evaluación): ${achievement.name}`);
            
            // Notificar callback si existe
            if (this.onAchievementUnlocked) {
              this.onAchievementUnlocked(achievement.ID);
            }
          } else {
            console.log(`✅ [GameEvents] Achievement ${achievement.ID} ya estaba desbloqueado`);
          }
        } else {
          console.log(`📊 [GameEvents] Achievement ${achievement.ID} - Progreso actualizado (solo evaluación): ${newProgress}`);
        }
      } else {
        console.log(`⏸️ [GameEvents] Achievement ${achievement.ID} - Sin cambios`);
      }
    }
    
    return unlockedAchievements;
  }

  /**
   * Obtener estadísticas actuales
   */
  getCurrentStats(): UserGameStats {
    return { ...this.userStats };
  }

  /**
   * Limpiar datos del usuario (logout)
   */
  async clearUserData(): Promise<void> {
    if (!this.currentUserId) return;
    
    try {
      const keysToRemove = [
        `${STORAGE_KEYS.USER_GAME_STATS}_${this.currentUserId}`,
        `${STORAGE_KEYS.PLAY_DATES}_${this.currentUserId}`,
        `${STORAGE_KEYS.DAILY_EVENTS}_${this.currentUserId}`,
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      
      this.userStats = this.getDefaultStats();
      this.currentUserId = null;
      this.onAchievementUnlocked = null;
      this.todayEventsSent.clear();
      
      console.log('🧹 [GameEvents] Datos del usuario limpiados');
    } catch (error) {
      console.error('❌ [GameEvents] Error limpiando datos:', error);
    }
  }

  /**
   * Forzar evaluación de todos los logros (para testing)
   */
  async forceEvaluateAllAchievements(): Promise<number[]> {
    const dummyEvent: GameEvent = {
      type: 'force_evaluation',
      timestamp: new Date(),
      data: {},
    };
    
    const userAchievements = await this.getUserAchievementsSafely();
    return this.evaluateAllAchievements(dummyEvent, userAchievements);
  }
}

export default new GameEventsService();
