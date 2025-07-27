// src/services/UserSettingsService.ts
import ApiService from './ApiService';

export interface UserSettingsConfig {
  // General
  app_language: string;
  voice_language: string;
  
  // Audio
  sound_effects_enabled: boolean;
  voice_help_enabled: boolean;
  voice_speed: 'slow' | 'normal' | 'fast';
  audio_volume: number;
  
  // Gameplay
  help_delay_seconds: number;
  max_attempts_per_activity: number;
  auto_advance_enabled: boolean;
  celebration_animations: boolean;
  hint_button_visible: boolean;
  
  // Accessibility
  font_size: 'small' | 'medium' | 'large';
  high_contrast_mode: boolean;
  animation_speed: 'slow' | 'normal' | 'fast';
  button_size: 'small' | 'medium' | 'large';
  
  // Progress
  daily_goal_minutes: number;
  show_progress_bar: boolean;
  show_stars_count: boolean;
  achievement_notifications: boolean;
  
  // Appearance
  theme_mode: 'light' | 'dark';
  color_scheme: 'default' | 'blue' | 'green' | 'purple';
  show_background_patterns: boolean;
  
  // Parental
  parental_mode_enabled: boolean;
  session_time_limit: number;
  break_reminder_enabled: boolean;
  break_reminder_minutes: number;
}

class UserSettingsService {
  private static instance: UserSettingsService;
  private settings: UserSettingsConfig | null = null;
  private userId: number | null = null;

  private constructor() {}

  static getInstance(): UserSettingsService {
    if (!UserSettingsService.instance) {
      UserSettingsService.instance = new UserSettingsService();
    }
    return UserSettingsService.instance;
  }

  // Initialize settings for a user
  async initializeSettings(userId: number): Promise<void> {
    try {
      this.userId = userId;
      console.log('🔧 [UserSettingsService] Inicializando configuraciones para usuario:', userId);
      
      // First, try to get existing user settings
      let settingsMap: Record<string, string> = {};
      
      try {
        const response = await ApiService.getUserSettingsMap(userId);
        settingsMap = response.settings;
        console.log('📋 [UserSettingsService] Configuraciones existentes encontradas:', Object.keys(settingsMap).length);
      } catch (error) {
        console.log('📋 [UserSettingsService] No se encontraron configuraciones existentes, inicializando...');
        
        // If no settings exist, initialize them from defaults
        try {
          await ApiService.initializeUserSettings(userId);
          console.log('✅ [UserSettingsService] Configuraciones por defecto creadas');
          
          // Now try to get the newly created settings
          const response = await ApiService.getUserSettingsMap(userId);
          settingsMap = response.settings;
          console.log('📋 [UserSettingsService] Configuraciones por defecto cargadas:', Object.keys(settingsMap).length);
        } catch (initError) {
          console.error('❌ [UserSettingsService] Error inicializando configuraciones por defecto:', initError);
          // Fall back to local defaults
          this.settings = this.getDefaultSettings();
          return;
        }
      }
      
      // Convert API response to typed config with fallbacks
      this.settings = {
        // General
        app_language: settingsMap.app_language || 'es',
        voice_language: settingsMap.voice_language || 'es',
        
        // Audio
        sound_effects_enabled: settingsMap.sound_effects_enabled !== undefined ? settingsMap.sound_effects_enabled === 'true' : true,
        voice_help_enabled: settingsMap.voice_help_enabled !== undefined ? settingsMap.voice_help_enabled === 'true' : true,
        voice_speed: (settingsMap.voice_speed as any) || 'normal',
        audio_volume: settingsMap.audio_volume ? parseFloat(settingsMap.audio_volume) : 0.8,
        
        // Gameplay
        help_delay_seconds: settingsMap.help_delay_seconds ? parseInt(settingsMap.help_delay_seconds) : 5,
        max_attempts_per_activity: settingsMap.max_attempts_per_activity ? parseInt(settingsMap.max_attempts_per_activity) : 3,
        auto_advance_enabled: settingsMap.auto_advance_enabled === 'true',
        celebration_animations: settingsMap.celebration_animations !== undefined ? settingsMap.celebration_animations === 'true' : true,
        hint_button_visible: settingsMap.hint_button_visible !== undefined ? settingsMap.hint_button_visible === 'true' : true,
        
        // Accessibility
        font_size: (settingsMap.font_size as any) || 'medium',
        high_contrast_mode: settingsMap.high_contrast_mode === 'true',
        animation_speed: (settingsMap.animation_speed as any) || 'normal',
        button_size: (settingsMap.button_size as any) || 'medium',
        
        // Progress
        daily_goal_minutes: settingsMap.daily_goal_minutes ? parseInt(settingsMap.daily_goal_minutes) : 30,
        show_progress_bar: settingsMap.show_progress_bar !== undefined ? settingsMap.show_progress_bar === 'true' : true,
        show_stars_count: settingsMap.show_stars_count !== undefined ? settingsMap.show_stars_count === 'true' : true,
        achievement_notifications: settingsMap.achievement_notifications !== undefined ? settingsMap.achievement_notifications === 'true' : true,
        
        // Appearance
        theme_mode: (settingsMap.theme_mode as any) || 'light',
        color_scheme: (settingsMap.color_scheme as any) || 'default',
        show_background_patterns: settingsMap.show_background_patterns !== undefined ? settingsMap.show_background_patterns === 'true' : true,
        
        // Parental
        parental_mode_enabled: settingsMap.parental_mode_enabled === 'true',
        session_time_limit: settingsMap.session_time_limit ? parseInt(settingsMap.session_time_limit) : 0,
        break_reminder_enabled: settingsMap.break_reminder_enabled === 'true',
        break_reminder_minutes: settingsMap.break_reminder_minutes ? parseInt(settingsMap.break_reminder_minutes) : 20,
      };
      
      console.log('✅ [UserSettingsService] Configuraciones finales cargadas:');
      console.log('   - Audio: efectos=' + this.settings.sound_effects_enabled + ', voz=' + this.settings.voice_help_enabled);
      console.log('   - Gameplay: ayuda=' + this.settings.help_delay_seconds + 's, intentos=' + this.settings.max_attempts_per_activity);
      console.log('   - Accesibilidad: fuente=' + this.settings.font_size + ', contraste=' + this.settings.high_contrast_mode);
      console.log('   - Progreso: meta=' + this.settings.daily_goal_minutes + 'min, barra=' + this.settings.show_progress_bar);
      
    } catch (error) {
      console.error('❌ [UserSettingsService] Error general cargando configuraciones:', error);
      // Use default settings if everything fails
      this.settings = this.getDefaultSettings();
      console.log('⚠️ [UserSettingsService] Usando configuraciones por defecto locales');
    }
  }

  // Get current settings
  getSettings(): UserSettingsConfig {
    if (!this.settings) {
      console.warn('⚠️ [UserSettingsService] Configuraciones no inicializadas, usando valores por defecto');
      return this.getDefaultSettings();
    }
    return this.settings;
  }

  // Get a specific setting value
  getSetting<K extends keyof UserSettingsConfig>(key: K): UserSettingsConfig[K] {
    const settings = this.getSettings();
    return settings[key];
  }

  // Update a setting
  async updateSetting<K extends keyof UserSettingsConfig>(
    key: K, 
    value: UserSettingsConfig[K]
  ): Promise<void> {
    if (!this.userId) {
      console.error('❌ [UserSettingsService] Usuario no inicializado');
      return;
    }

    try {
      // Update in API
      await ApiService.updateUserSetting(this.userId, key, { value: value.toString() });
      
      // Update local cache
      if (this.settings) {
        this.settings[key] = value;
      }
      
      console.log(`✅ [UserSettingsService] Configuración actualizada: ${key} = ${value}`);
    } catch (error) {
      console.error(`❌ [UserSettingsService] Error actualizando ${key}:`, error);
      throw error;
    }
  }

  // Get default settings
  private getDefaultSettings(): UserSettingsConfig {
    return {
      // General
      app_language: 'es',
      voice_language: 'es',
      
      // Audio
      sound_effects_enabled: true,
      voice_help_enabled: true,
      voice_speed: 'normal',
      audio_volume: 0.8,
      
      // Gameplay
      help_delay_seconds: 5,
      max_attempts_per_activity: 3,
      auto_advance_enabled: false,
      celebration_animations: true,
      hint_button_visible: true,
      
      // Accessibility
      font_size: 'medium',
      high_contrast_mode: false,
      animation_speed: 'normal',
      button_size: 'medium',
      
      // Progress
      daily_goal_minutes: 30,
      show_progress_bar: true,
      show_stars_count: true,
      achievement_notifications: true,
      
      // Appearance
      theme_mode: 'light',
      color_scheme: 'default',
      show_background_patterns: true,
      
      // Parental
      parental_mode_enabled: false,
      session_time_limit: 0,
      break_reminder_enabled: false,
      break_reminder_minutes: 20,
    };
  }

  // Helper methods for common settings
  
  // Audio helpers
  shouldPlaySoundEffects(): boolean {
    return this.getSetting('sound_effects_enabled');
  }

  shouldUseVoiceHelp(): boolean {
    return this.getSetting('voice_help_enabled');
  }

  getVoiceSpeed(): number {
    const speed = this.getSetting('voice_speed');
    switch (speed) {
      case 'slow': return 0.7;
      case 'fast': return 1.3;
      default: return 1.0;
    }
  }

  getAudioVolume(): number {
    return this.getSetting('audio_volume');
  }

  // Gameplay helpers
  getHelpDelayMs(): number {
    return this.getSetting('help_delay_seconds') * 1000;
  }

  getMaxAttempts(): number {
    return this.getSetting('max_attempts_per_activity');
  }

  shouldAutoAdvance(): boolean {
    return this.getSetting('auto_advance_enabled');
  }

  shouldShowCelebrations(): boolean {
    return this.getSetting('celebration_animations');
  }

  shouldShowHintButton(): boolean {
    return this.getSetting('hint_button_visible');
  }

  // Accessibility helpers
  getFontSizeMultiplier(): number {
    const size = this.getSetting('font_size');
    switch (size) {
      case 'small': return 0.9;
      case 'large': return 1.2;
      default: return 1.0;
    }
  }

  isHighContrastMode(): boolean {
    return this.getSetting('high_contrast_mode');
  }

  getAnimationDuration(baseMs: number): number {
    const speed = this.getSetting('animation_speed');
    switch (speed) {
      case 'slow': return baseMs * 1.5;
      case 'fast': return baseMs * 0.7;
      default: return baseMs;
    }
  }

  // Progress helpers
  getDailyGoalMinutes(): number {
    return this.getSetting('daily_goal_minutes');
  }

  shouldShowProgressBar(): boolean {
    return this.getSetting('show_progress_bar');
  }

  shouldShowStarsCount(): boolean {
    return this.getSetting('show_stars_count');
  }

  shouldShowAchievementNotifications(): boolean {
    return this.getSetting('achievement_notifications');
  }

  // Parental helpers
  isParentalModeEnabled(): boolean {
    return this.getSetting('parental_mode_enabled');
  }

  getSessionTimeLimitMs(): number {
    const minutes = this.getSetting('session_time_limit');
    return minutes > 0 ? minutes * 60 * 1000 : 0; // 0 means no limit
  }

  shouldShowBreakReminders(): boolean {
    return this.getSetting('break_reminder_enabled');
  }

  getBreakReminderIntervalMs(): number {
    return this.getSetting('break_reminder_minutes') * 60 * 1000;
  }

  // Language helpers
  getAppLanguage(): string {
    return this.getSetting('app_language');
  }

  getVoiceLanguage(): string {
    return this.getSetting('voice_language');
  }

  // Appearance helpers
  getThemeMode(): 'light' | 'dark' {
    return this.getSetting('theme_mode');
  }

  getColorScheme(): string {
    return this.getSetting('color_scheme');
  }

  shouldShowBackgroundPatterns(): boolean {
    return this.getSetting('show_background_patterns');
  }

  // Clear settings (for logout)
  clearSettings(): void {
    this.settings = null;
    this.userId = null;
    console.log('🔧 [UserSettingsService] Configuraciones limpiadas');
  }

  // Debug method to check current settings
  debugSettings(): void {
    console.log('🔍 [UserSettingsService] Estado actual de configuraciones:');
    console.log('   - Usuario ID:', this.userId);
    console.log('   - Configuraciones cargadas:', !!this.settings);
    if (this.settings) {
      console.log('   - Configuraciones:', this.settings);
    }
  }
}

export default UserSettingsService;