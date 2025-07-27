// src/hooks/useUserSettings.ts
import { useState, useEffect, useCallback } from 'react';
import UserSettingsService, { UserSettingsConfig } from '../services/UserSettingsService';
import { useAuth } from './useAuth';

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettingsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const settingsService = UserSettingsService.getInstance();

  // Initialize settings when user changes
  useEffect(() => {
    const initializeSettings = async () => {
      if (!user?.id) {
        setSettings(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        await settingsService.initializeSettings(user.id);
        const userSettings = settingsService.getSettings();
        setSettings(userSettings);
        
        console.log('✅ [useUserSettings] Configuraciones inicializadas para usuario:', user.id);
      } catch (err) {
        console.error('❌ [useUserSettings] Error inicializando configuraciones:', err);
        setError('Error cargando configuraciones');
        // Still set default settings
        setSettings(settingsService.getSettings());
      } finally {
        setLoading(false);
      }
    };

    initializeSettings();
  }, [user?.id]);

  // Update a setting
  const updateSetting = useCallback(async <K extends keyof UserSettingsConfig>(
    key: K,
    value: UserSettingsConfig[K]
  ) => {
    try {
      await settingsService.updateSetting(key, value);
      
      // Update local state
      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      
      console.log(`✅ [useUserSettings] Configuración actualizada: ${key} = ${value}`);
    } catch (err) {
      console.error(`❌ [useUserSettings] Error actualizando ${key}:`, err);
      throw err;
    }
  }, []);

  // Get a specific setting
  const getSetting = useCallback(<K extends keyof UserSettingsConfig>(key: K): UserSettingsConfig[K] => {
    return settingsService.getSetting(key);
  }, []);

  // Helper methods
  const helpers = {
    // Audio
    shouldPlaySoundEffects: () => settingsService.shouldPlaySoundEffects(),
    shouldUseVoiceHelp: () => settingsService.shouldUseVoiceHelp(),
    getVoiceSpeed: () => settingsService.getVoiceSpeed(),
    getAudioVolume: () => settingsService.getAudioVolume(),
    
    // Gameplay
    getHelpDelayMs: () => settingsService.getHelpDelayMs(),
    getMaxAttempts: () => settingsService.getMaxAttempts(),
    shouldAutoAdvance: () => settingsService.shouldAutoAdvance(),
    shouldShowCelebrations: () => settingsService.shouldShowCelebrations(),
    shouldShowHintButton: () => settingsService.shouldShowHintButton(),
    
    // Accessibility
    getFontSizeMultiplier: () => settingsService.getFontSizeMultiplier(),
    isHighContrastMode: () => settingsService.isHighContrastMode(),
    getAnimationDuration: (baseMs: number) => settingsService.getAnimationDuration(baseMs),
    
    // Progress
    getDailyGoalMinutes: () => settingsService.getDailyGoalMinutes(),
    shouldShowProgressBar: () => settingsService.shouldShowProgressBar(),
    shouldShowStarsCount: () => settingsService.shouldShowStarsCount(),
    shouldShowAchievementNotifications: () => settingsService.shouldShowAchievementNotifications(),
    
    // Parental
    isParentalModeEnabled: () => settingsService.isParentalModeEnabled(),
    getSessionTimeLimitMs: () => settingsService.getSessionTimeLimitMs(),
    shouldShowBreakReminders: () => settingsService.shouldShowBreakReminders(),
    getBreakReminderIntervalMs: () => settingsService.getBreakReminderIntervalMs(),
    
    // Language
    getAppLanguage: () => settingsService.getAppLanguage(),
    getVoiceLanguage: () => settingsService.getVoiceLanguage(),
    
    // Appearance
    getThemeMode: () => settingsService.getThemeMode(),
    getColorScheme: () => settingsService.getColorScheme(),
    shouldShowBackgroundPatterns: () => settingsService.shouldShowBackgroundPatterns(),
  };

  return {
    settings,
    loading,
    error,
    updateSetting,
    getSetting,
    ...helpers,
  };
};

export default useUserSettings;