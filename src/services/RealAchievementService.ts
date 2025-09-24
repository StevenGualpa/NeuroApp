// src/services/RealAchievementService.ts
import ApiService, { Achievement, UserAchievement } from './ApiService';
import GameEventsService from './GameEventsService';

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

interface ServerAchievementProgress {
  achievementId: number;
  currentProgress: number;
  shouldUpdate: boolean;
}


class RealAchievementService {
  private userAchievements: UserAchievement[] = [];
  private allAchievements: Achievement[] = [];
  private isInitialized = false;
  private currentUserId: number | null = null;
  private achievementUnlockedListeners: (() => void)[] = [];

  /**
   * Inicializar el servicio de logros del servidor
   */
  async initialize(userId: number): Promise<void> {
    try {
      this.currentUserId = userId;
      console.log('🏆 [RealAchievementService] Inicializando para usuario:', userId);

      // Cargar todos los logros disponibles del servidor
      console.log('📡 [RealAchievementService] Cargando achievements del servidor...');
      console.log('📡 [RealAchievementService] Llamando a ApiService.getAchievements()...');
      
      this.allAchievements = await ApiService.getAchievements();
      console.log(`📋 [RealAchievementService] ${this.allAchievements.length} logros cargados del servidor`);
      console.log('📋 [RealAchievementService] Sample achievement:', this.allAchievements[0]);
      
      // Validar que todos los achievements tengan la estructura correcta
      const validAchievements = this.allAchievements.filter(achievement => 
        achievement && 
        typeof achievement.ID === 'number' && 
        (typeof achievement.name === 'string' || typeof achievement.title === 'string') &&
        typeof achievement.category === 'string'
      );
      
      if (validAchievements.length !== this.allAchievements.length) {
        console.warn(`⚠️ [RealAchievementService] ${this.allAchievements.length - validAchievements.length} achievements inválidos filtrados`);
        this.allAchievements = validAchievements;
      }
      
      // Normalizar achievements para usar nombres consistentes
      this.allAchievements = this.allAchievements.map(achievement => ({
        ...achievement,
        name: achievement.name || achievement.title, // Usar name como estándar
        max_progress: achievement.max_progress || achievement.condition_value || 1
      }));
      
      console.log(`✅ [RealAchievementService] ${this.allAchievements.length} achievements válidos y normalizados`);

      // Cargar progreso específico del usuario
      console.log('👤 [RealAchievementService] Cargando user_achievements del servidor...');
      await this.loadUserAchievements(userId);
      console.log(`👤 [RealAchievementService] ${this.userAchievements.length} user_achievements cargados`);
      
      this.isInitialized = true;
      console.log('✅ [RealAchievementService] Servicio marcado como inicializado');
      
      // Inicializar sistema de eventos de juego DESPUÉS de que RealAchievementService esté listo
      console.log('🎮 [RealAchievementService] Inicializando GameEventsService...');
      await GameEventsService.initialize(userId, (achievementId: number) => {
        console.log(`🎉 [RealAchievementService] Logro desbloqueado: ${achievementId}`);
        // Aquí se podría disparar un evento personalizado para notificaciones
      });
      console.log('✅ [RealAchievementService] Inicialización completada exitosamente');
    } catch (error) {
      console.error('❌ [RealAchievementService] Error en inicialización:', error);
      throw error; // Fallar si no se puede conectar al servidor
    }
  }

  /**
   * Cargar logros del usuario desde el servidor
   */
  private async loadUserAchievements(userId: number): Promise<void> {
    try {
      this.userAchievements = await ApiService.getUserAchievements(userId);
      console.log(`👤 [RealAchievementService] ${this.userAchievements.length} logros de usuario cargados`);
      
      // Validar que todos los userAchievements tengan la estructura correcta
      console.log('🔍 [RealAchievementService] Sample userAchievement del servidor:', this.userAchievements[0]);
      
      const validUserAchievements = this.userAchievements.filter(ua => {
        const isValid = ua && 
          (typeof ua.achievement_id === 'number' || typeof ua.AchievementID === 'number') && 
          (typeof ua.progress === 'number' || typeof ua.current_progress === 'number') && 
          typeof ua.is_unlocked === 'boolean';
        
        if (!isValid) {
          console.warn('⚠️ [RealAchievementService] userAchievement inválido encontrado:', ua);
        }
        
        return isValid;
      });
      
      if (validUserAchievements.length !== this.userAchievements.length) {
        console.warn(`⚠️ [RealAchievementService] ${this.userAchievements.length - validUserAchievements.length} userAchievements inválidos filtrados`);
        this.userAchievements = validUserAchievements;
      }
      
      // Normalizar userAchievements para usar nombres consistentes
      this.userAchievements = this.userAchievements.map(ua => ({
        ...ua,
        achievement_id: ua.achievement_id || ua.AchievementID,
        progress: ua.progress || ua.current_progress
      }));
      
      console.log(`✅ [RealAchievementService] ${this.userAchievements.length} userAchievements válidos y normalizados`);
    } catch (error) {
      console.error('❌ [RealAchievementService] Error cargando logros de usuario:', error);
      throw error;
    }
  }


  /**
   * Obtener todos los logros del usuario con su progreso
   */
  async getUserAchievements(): Promise<UserAchievement[]> {
    if (!this.isInitialized || !this.currentUserId) {
      throw new Error('RealAchievementService no está inicializado');
    }
    return this.userAchievements;
  }

  /**
   * Obtener todos los logros disponibles
   */
  async getAllAchievements(): Promise<Achievement[]> {
    if (!this.isInitialized) {
      throw new Error('RealAchievementService no está inicializado');
    }
    return this.allAchievements;
  }

  /**
   * Verificar estado del servicio (para debugging)
   */
  getServiceStatus(): { isInitialized: boolean; currentUserId: number | null; achievementsCount: number; userAchievementsCount: number } {
    const status = {
      isInitialized: this.isInitialized,
      currentUserId: this.currentUserId,
      achievementsCount: this.allAchievements.length,
      userAchievementsCount: this.userAchievements.length
    };
    console.log('🔍 [RealAchievementService] getServiceStatus llamado:', status);
    return status;
  }

  /**
   * Suscribirse a eventos de logros desbloqueados
   */
  onAchievementUnlocked(callback: () => void): () => void {
    this.achievementUnlockedListeners.push(callback);
    
    // Retornar función para desuscribirse
    return () => {
      const index = this.achievementUnlockedListeners.indexOf(callback);
      if (index > -1) {
        this.achievementUnlockedListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notificar a todos los listeners que se desbloqueó un logro
   */
  private notifyAchievementUnlocked(): void {
    console.log('🔔 [RealAchievementService] Notificando a listeners sobre logro desbloqueado');
    this.achievementUnlockedListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('❌ [RealAchievementService] Error en listener de logro desbloqueado:', error);
      }
    });
  }

  /**
   * Reinicializar el servicio (para casos de fallo)
   */
  async reinitialize(userId: number): Promise<void> {
    console.log('🔄 [RealAchievementService] Reinicializando servicio...');
    this.isInitialized = false;
    this.currentUserId = null;
    this.allAchievements = [];
    this.userAchievements = [];
    await this.initialize(userId);
  }


  /**
   * Refrescar datos de usuario desde el servidor
   */
  async refreshUserData(): Promise<void> {
    if (!this.currentUserId || !this.isInitialized) {
      console.warn('⚠️ [RealAchievementService] Servicio no inicializado, no se puede refrescar');
      return;
    }

    try {
      console.log('🔄 [RealAchievementService] Refrescando datos de usuario desde el servidor...');
      
      // Recargar user achievements desde el servidor
      await this.loadUserAchievements(this.currentUserId);
      
      console.log('✅ [RealAchievementService] Datos de usuario refrescados exitosamente');
    } catch (error) {
      console.error('❌ [RealAchievementService] Error refrescando datos de usuario:', error);
      // No lanzar error para no interrumpir el flujo de la UI
    }
  }

  /**
   * Registrar finalización de juego y verificar logros
   */
  async recordGameCompletion(gameData: GameCompletionData): Promise<Achievement[]> {
    if (!this.isInitialized || !this.currentUserId) {
      console.error('❌ [RealAchievementService] Servicio no inicializado - no se puede registrar finalización de juego');
      console.error('❌ [RealAchievementService] isInitialized:', this.isInitialized, 'currentUserId:', this.currentUserId);
      return [];
    }

    const newlyUnlocked: Achievement[] = [];

    try {
      console.log('🎮 [RealAchievementService] Procesando finalización de juego:', gameData);

      // Registrar evento de juego diario (solo si es la primera actividad del día)
      try {
        await GameEventsService.registerDailyPlayEvent();
        console.log('📅 [RealAchievementService] Evento diario registrado');
      } catch (dailyEventError) {
        console.warn('⚠️ [RealAchievementService] Error registrando evento diario:', dailyEventError);
        // No fallar si hay error en el evento diario
      }

      // Usar el nuevo sistema de eventos para procesar la lección completada
      // Pasar user achievements actuales para optimizar
      const unlockedAchievementIds = await GameEventsService.processLessonCompletion({
        lessonId: gameData.lessonId || 0,
        stepId: gameData.stepId || 0,
        stars: gameData.stars,
        completionTime: gameData.completionTime,
        errors: gameData.errors,
        usedHelp: gameData.usedHelp || false,
        perfectRun: gameData.isPerfect,
        category: gameData.activityType,
      });

      // Procesar logros desbloqueados (VERIFICAR SI YA ESTÁN REGISTRADOS)
      for (const achievementId of unlockedAchievementIds) {
        try {
          console.log(`🔍 [RealAchievementService] Evaluando logro ${achievementId} (verificando si ya está registrado)`);
          
          // Verificar si ya existe en userAchievements como desbloqueado
          const existingUserAchievement = this.userAchievements.find(ua => ua && ua.achievement_id === achievementId);
          
          console.log(`🔍 [RealAchievementService] Verificando logro ${achievementId}:`, {
            exists: !!existingUserAchievement,
            isUnlocked: existingUserAchievement?.is_unlocked,
            progress: existingUserAchievement?.progress
          });
          
          if (existingUserAchievement && existingUserAchievement.is_unlocked) {
            console.log(`✅ [RealAchievementService] Logro ${achievementId} ya está registrado como desbloqueado - ignorando`);
            continue;
          }
          
          // Si no está registrado, guardarlo en el servidor
          console.log(`💾 [RealAchievementService] Registrando logro ${achievementId} en el servidor...`);
          await this.unlockAchievementInServer(achievementId);
          
          // Agregar a la lista de desbloqueados para mostrar notificación
          const achievement = this.allAchievements.find(a => a.ID === achievementId);
          if (achievement) {
            newlyUnlocked.push(achievement);
            const achievementName = achievement.name || achievement.title || `Logro ID ${achievementId}`;
            console.log(`🏆 [RealAchievementService] ¡Logro registrado en servidor!: ${achievementName}`);
            
            // Notificar a los listeners que se desbloqueó un logro
            this.notifyAchievementUnlocked();
          }
        } catch (error) {
          console.error(`❌ [RealAchievementService] Error procesando logro ${achievementId}:`, error);
          // Continuar con otros logros aunque uno falle
        }
      }

      // Los datos ya están actualizados en memoria

      console.log(`✅ [RealAchievementService] Procesamiento completado. ${newlyUnlocked.length} logros nuevos`);
      return newlyUnlocked;

    } catch (error) {
      console.error('❌ [RealAchievementService] Error procesando finalización:', error);
      // Retornar array vacío en lugar de lanzar error para no romper el flujo del juego
      return [];
    }
  }

  /**
   * Calcular actualizaciones de progreso basadas en el juego completado
   */
  private calculateProgressUpdates(gameData: GameCompletionData): ServerAchievementProgress[] {
    const updates: ServerAchievementProgress[] = [];

    console.log('🔍 [RealAchievementService] Calculando actualizaciones de progreso...');
    console.log('📊 [RealAchievementService] GameData:', gameData);
    console.log('📋 [RealAchievementService] Total achievements:', this.allAchievements.length);
    console.log('👤 [RealAchievementService] Total userAchievements:', this.userAchievements.length);
    console.log('📋 [RealAchievementService] Sample achievement:', this.allAchievements[0]);
    console.log('👤 [RealAchievementService] Sample userAchievement:', this.userAchievements[0]);

    // Buscar logros que podrían verse afectados por esta actividad
    for (let i = 0; i < this.allAchievements.length; i++) {
      const achievement = this.allAchievements[i];
      
      try {
        // Validar que achievement tenga ID válido
        if (!achievement || !achievement.ID) {
          console.warn(`⚠️ [RealAchievementService] Achievement inválido en índice ${i}:`, achievement);
          continue;
        }
        
        console.log(`🔍 [RealAchievementService] Procesando achievement ${i + 1}/${this.allAchievements.length}: ID=${achievement.ID}, name=${achievement.name}`);
        
        const userAchievement = this.userAchievements.find(ua => ua && ua.achievement_id === achievement.ID);
        
        // Si ya está desbloqueado, no necesita actualización
        if (userAchievement?.is_unlocked) {
          console.log(`✅ [RealAchievementService] Achievement ${achievement.ID} ya desbloqueado, saltando`);
          continue;
        }

        const currentProgress = userAchievement?.progress || 0;
        let newProgress = currentProgress;

      // Lógica para calcular progreso según el tipo de logro
      // Esta lógica debe coincidir con la del servidor
      switch (achievement.category) {
        case 'completion':
          if (gameData.stars > 0) newProgress = currentProgress + 1;
          break;
        case 'perfection':
          if (gameData.isPerfect) newProgress = currentProgress + 1;
          break;
        case 'speed':
          if (gameData.completionTime < 30000) newProgress = currentProgress + 1; // menos de 30 segundos
          break;
        case 'stars':
          newProgress = currentProgress + gameData.stars;
          break;
        case 'improvement':
          if (gameData.showedImprovement) newProgress = currentProgress + 1;
          break;
        case 'perseverance':
          if (gameData.usedHelp) newProgress = currentProgress + 1;
          break;
        // Agregar más categorías según sea necesario
      }

        // Solo actualizar si hay cambios
        if (newProgress > currentProgress) {
          updates.push({
            achievementId: achievement.ID,
            currentProgress: Math.min(newProgress, achievement.max_progress || 1),
            shouldUpdate: true
          });
          console.log(`📈 [RealAchievementService] Achievement ${achievement.ID} progreso: ${currentProgress} → ${newProgress}`);
        }
      } catch (error) {
        console.error(`❌ [RealAchievementService] Error procesando achievement ${i + 1}:`, error);
        console.error(`❌ [RealAchievementService] Achievement data:`, achievement);
        // Continuar con el siguiente achievement
      }
    }

    console.log(`✅ [RealAchievementService] Calculadas ${updates.length} actualizaciones de progreso`);
    return updates;
  }

  /**
   * Actualizar progreso de logro (crear o actualizar user_achievement)
   */
  async updateAchievementProgress(achievementId: number, newProgress: number): Promise<void> {
    if (!this.currentUserId) return;

    try {
      console.log(`📊 [RealAchievementService] Actualizando progreso logro ${achievementId}: ${newProgress}`);
      
      // Determinar si el logro está completamente desbloqueado
      const achievement = this.allAchievements.find(a => a.ID === achievementId);
      const isUnlocked = achievement ? newProgress >= achievement.condition_value : false;
      
      // Buscar si ya existe el user_achievement
      const existingUserAchievement = this.userAchievements.find(ua => ua && ua.achievement_id === achievementId);
      
      if (existingUserAchievement) {
        // Actualizar progreso existente si hay cambios
        if (existingUserAchievement.progress !== newProgress || existingUserAchievement.is_unlocked !== isUnlocked) {
          try {
            const result = await ApiService.updateAchievementProgress(
              this.currentUserId, 
              achievementId, 
              newProgress, 
              isUnlocked
            );
            
            // Actualizar array en memoria
            const index = this.userAchievements.findIndex(ua => ua && ua.achievement_id === achievementId);
            if (index >= 0) {
              this.userAchievements[index] = result.achievement;
            }
            
            console.log(`✅ [RealAchievementService] Progreso actualizado: ${achievementId} -> ${newProgress}${isUnlocked ? ' (DESBLOQUEADO)' : ''}`);
          } catch (updateError) {
            console.error(`❌ [RealAchievementService] Error actualizando progreso del logro ${achievementId}:`, updateError);
          }
        }
      } else {
        // Crear nuevo user_achievement usando endpoints existentes
        if (newProgress > 0 || isUnlocked) {
          try {
            let result;
            if (isUnlocked) {
              // Si está desbloqueado, usar endpoint de unlock (crea automáticamente)
              result = await ApiService.unlockAchievement(this.currentUserId, achievementId);
            } else {
              // Si solo hay progreso, usar endpoint de update progress (crea automáticamente)
              result = await ApiService.updateAchievementProgress(this.currentUserId, achievementId, newProgress);
            }
            
            // Agregar al array en memoria
            this.userAchievements.push(result.achievement);
            
            console.log(`✅ [RealAchievementService] User_achievement registrado: ${achievementId} -> ${newProgress}${isUnlocked ? ' (DESBLOQUEADO)' : ''}`);
          } catch (createError) {
            console.error(`❌ [RealAchievementService] Error registrando user_achievement para logro ${achievementId}:`, createError);
            // Fallar silenciosamente - el logro simplemente no se registra
          }
        } else {
          console.log(`📝 [RealAchievementService] Sin progreso para logro ${achievementId}, no se registra`);
        }
      }
    } catch (error) {
      console.error(`❌ [RealAchievementService] Error general actualizando progreso del logro ${achievementId}:`, error);
    }
  }


  /**
   * Desbloquear logro en el servidor (método legacy - ahora usa updateAchievementProgress)
   */
  private async unlockAchievementInServer(achievementId: number): Promise<void> {
    if (!this.currentUserId) return;

    const achievement = this.allAchievements.find(a => a.ID === achievementId);
    const maxProgress = achievement?.condition_value || 100;
    
    // Usar el nuevo método de actualización de progreso con isUnlocked: true
    await this.updateAchievementProgress(achievementId, maxProgress, true);
  }

  /**
   * Desbloquear logro manualmente (para casos especiales)
   */
  async unlockAchievement(achievementId: number): Promise<UserAchievement | null> {
    if (!this.isInitialized || !this.currentUserId) {
      throw new Error('RealAchievementService no está inicializado');
    }

    try {
      const result = await ApiService.unlockAchievement(this.currentUserId, achievementId);
      
      // Actualizar array en memoria
      const index = this.userAchievements.findIndex(ua => ua && ua.achievement_id === achievementId);
      if (index >= 0) {
        this.userAchievements[index] = result.achievement;
      } else {
        this.userAchievements.push(result.achievement);
      }

      return result.achievement;
    } catch (error) {
      console.error('❌ [RealAchievementService] Error desbloqueando logro:', error);
      throw error;
    }
  }

  /**
   * Procesar uso de ayuda
   */
  async processHelpUsed(lessonId: number, stepId: number): Promise<Achievement[]> {
    if (!this.isInitialized || !this.currentUserId) {
      console.error('❌ [RealAchievementService] Servicio no inicializado - no se puede procesar uso de ayuda');
      console.error('❌ [RealAchievementService] isInitialized:', this.isInitialized, 'currentUserId:', this.currentUserId);
      return [];
    }

    try {
      const unlockedAchievementIds = await GameEventsService.processHelpUsed(lessonId, stepId);
      const newlyUnlocked: Achievement[] = [];

      for (const achievementId of unlockedAchievementIds) {
        console.log(`🔍 [RealAchievementService] Evaluando logro de ayuda ${achievementId} (verificando si ya está registrado)`);
        
        // Verificar si ya existe en userAchievements como desbloqueado
        const existingUserAchievement = this.userAchievements.find(ua => ua && ua.achievement_id === achievementId);
        
        if (existingUserAchievement && existingUserAchievement.is_unlocked) {
          console.log(`✅ [RealAchievementService] Logro de ayuda ${achievementId} ya está registrado como desbloqueado - ignorando`);
          continue;
        }
        
        // Si no está registrado, guardarlo en el servidor
        console.log(`💾 [RealAchievementService] Registrando logro de ayuda ${achievementId} en el servidor...`);
        await this.unlockAchievementInServer(achievementId);
        
        const achievement = this.allAchievements.find(a => a.ID === achievementId);
        if (achievement) {
          newlyUnlocked.push(achievement);
          console.log(`🏆 [RealAchievementService] ¡Logro de ayuda registrado en servidor!: ${achievement.name}`);
          
          // Notificar a los listeners que se desbloqueó un logro
          this.notifyAchievementUnlocked();
        }
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('❌ [RealAchievementService] Error procesando uso de ayuda:', error);
      return [];
    }
  }

  /**
   * Sincronizar con el servidor (para uso manual o reconexión)
   */
  async syncWithServer(): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('No hay usuario activo');
    }

    await this.loadUserAchievements(this.currentUserId);
  }

  /**
   * Obtener estadísticas de logros
   */
  getAchievementStats(): { total: number; unlocked: number; percentage: number } {
    const total = this.allAchievements.length;
    const unlocked = this.userAchievements.filter(ua => ua.is_unlocked).length;
    const percentage = total > 0 ? (unlocked / total) * 100 : 0;

    return { total, unlocked, percentage };
  }

  /**
   * Limpiar datos en memoria (para logout)
   */
  async clearCache(): Promise<void> {
    // Limpiar datos del GameEventsService
    await GameEventsService.clearUserData();
    
    this.userAchievements = [];
    this.allAchievements = [];
    this.isInitialized = false;
    this.currentUserId = null;
  }
}

export default new RealAchievementService();
