// src/services/SettingsService.ts
import ApiService, { AppSettings } from './ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_CACHE_KEY = '@app_settings_cache';
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

interface SettingsCache {
  settings: Record<string, string>;
  timestamp: number;
}

export interface AppConfig {
  // UI Settings
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  sounds: boolean;
  vibration: boolean;
  
  // Accessibility Settings
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  largeButtons: boolean;
  
  // Learning Settings
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'adaptive';
  showHints: boolean;
  autoAdvance: boolean;
  sessionTimeout: number; // minutes
  
  // Neurodivergent-friendly Settings
  sensoryMode: 'normal' | 'reduced' | 'enhanced';
  focusMode: boolean;
  breakReminders: boolean;
  customPacing: boolean;
  
  // Content Settings
  language: 'es' | 'en';
  contentFilter: 'all' | 'age_appropriate' | 'custom';
  
  // Privacy Settings
  dataCollection: boolean;
  analytics: boolean;
  crashReporting: boolean;
}

const DEFAULT_SETTINGS: AppConfig = {
  theme: 'light',
  fontSize: 'medium',
  animations: true,
  sounds: true,
  vibration: true,
  highContrast: false,
  reduceMotion: false,
  screenReader: false,
  largeButtons: false,
  difficultyLevel: 'adaptive',
  showHints: true,
  autoAdvance: false,
  sessionTimeout: 30,
  sensoryMode: 'normal',
  focusMode: false,
  breakReminders: true,
  customPacing: true,
  language: 'es',
  contentFilter: 'age_appropriate',
  dataCollection: true,
  analytics: true,
  crashReporting: true,
};

class SettingsService {
  private settingsCache: Record<string, string> = {};
  private lastCacheUpdate: number = 0;

  // Initialize settings
  async initializeSettings(): Promise<void> {
    try {
      // Load from cache first
      await this.loadFromCache();
      
      // Refresh from API if cache is expired
      if (this.shouldRefreshCache()) {
        await this.refreshFromAPI();
      }
    } catch (error) {
      console.error('Error initializing settings:', error);
      // Fallback to default settings
      this.settingsCache = this.configToRecord(DEFAULT_SETTINGS);
    }
  }

  private async loadFromCache(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(SETTINGS_CACHE_KEY);
      if (cached) {
        const cacheData: SettingsCache = JSON.parse(cached);
        this.settingsCache = cacheData.settings || {};
        this.lastCacheUpdate = cacheData.timestamp || 0;
      }
    } catch (error) {
      console.error('Error loading settings from cache:', error);
    }
  }

  private async saveToCache(): Promise<void> {
    try {
      const cacheData: SettingsCache = {
        settings: this.settingsCache,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(cacheData));
      this.lastCacheUpdate = Date.now();
    } catch (error) {
      console.error('Error saving settings to cache:', error);
    }
  }

  private shouldRefreshCache(): boolean {
    return Date.now() - this.lastCacheUpdate > CACHE_EXPIRY;
  }

  private async refreshFromAPI(): Promise<void> {
    try {
      const settingsMap = await ApiService.getSettingsMap();
      this.settingsCache = { ...this.configToRecord(DEFAULT_SETTINGS), ...settingsMap };
      await this.saveToCache();
    } catch (error) {
      console.error('Error refreshing settings from API:', error);
      // Don't throw, use cached or default settings
    }
  }

  private configToRecord(config: AppConfig): Record<string, string> {
    const record: Record<string, string> = {};
    Object.entries(config).forEach(([key, value]) => {
      record[key] = String(value);
    });
    return record;
  }

  private recordToConfig(record: Record<string, string>): AppConfig {
    const config = { ...DEFAULT_SETTINGS };
    
    Object.entries(record).forEach(([key, value]) => {
      if (key in config) {
        const configKey = key as keyof AppConfig;
        const defaultValue = config[configKey];
        
        if (typeof defaultValue === 'boolean') {
          (config as any)[configKey] = value === 'true';
        } else if (typeof defaultValue === 'number') {
          (config as any)[configKey] = parseInt(value, 10) || defaultValue;
        } else {
          (config as any)[configKey] = value;
        }
      }
    });
    
    return config;
  }

  // Get all settings as AppConfig
  async getSettings(): Promise<AppConfig> {
    await this.initializeSettings();
    return this.recordToConfig(this.settingsCache);
  }

  // Get specific setting by key
  async getSetting<K extends keyof AppConfig>(key: K): Promise<AppConfig[K]> {
    const settings = await this.getSettings();
    return settings[key];
  }

  // Update a single setting
  async updateSetting<K extends keyof AppConfig>(
    key: K, 
    value: AppConfig[K]
  ): Promise<void> {
    try {
      const stringValue = String(value);
      
      // Update on backend
      await ApiService.updateSettingByKey(key, stringValue);
      
      // Update cache
      this.settingsCache[key] = stringValue;
      await this.saveToCache();
      
    } catch (error) {
      console.error('Error updating setting:', error);
      // Update cache anyway for offline functionality
      this.settingsCache[key] = String(value);
      await this.saveToCache();
    }
  }

  // Update multiple settings at once
  async updateSettings(updates: Partial<AppConfig>): Promise<void> {
    try {
      const stringUpdates: Record<string, string> = {};
      Object.entries(updates).forEach(([key, value]) => {
        stringUpdates[key] = String(value);
      });
      
      // Update on backend
      await ApiService.bulkUpdateSettings(stringUpdates);
      
      // Update cache
      Object.assign(this.settingsCache, stringUpdates);
      await this.saveToCache();
      
    } catch (error) {
      console.error('Error updating settings:', error);
      // Update cache anyway for offline functionality
      Object.entries(updates).forEach(([key, value]) => {
        this.settingsCache[key] = String(value);
      });
      await this.saveToCache();
    }
  }

  // Reset all settings to defaults
  async resetSettings(): Promise<void> {
    try {
      // Reset on backend
      await ApiService.resetSettings();
      
      // Reset cache
      this.settingsCache = this.configToRecord(DEFAULT_SETTINGS);
      await this.saveToCache();
      
    } catch (error) {
      console.error('Error resetting settings:', error);
      // Reset cache anyway
      this.settingsCache = this.configToRecord(DEFAULT_SETTINGS);
      await this.saveToCache();
    }
  }

  // Get settings by category
  async getSettingsByCategory(category: string): Promise<AppSettings[]> {
    try {
      return await ApiService.getSettingsByCategory(category);
    } catch (error) {
      console.error('Error getting settings by category:', error);
      return [];
    }
  }

  // Get only active settings
  async getActiveSettings(): Promise<AppSettings[]> {
    try {
      return await ApiService.getActiveSettings();
    } catch (error) {
      console.error('Error getting active settings:', error);
      return [];
    }
  }

  // Force refresh from API
  async forceRefresh(): Promise<void> {
    try {
      await this.refreshFromAPI();
    } catch (error) {
      console.error('Error force refreshing settings:', error);
      throw error;
    }
  }

  // Clear cache (for logout or reset)
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SETTINGS_CACHE_KEY);
      this.settingsCache = {};
      this.lastCacheUpdate = 0;
    } catch (error) {
      console.error('Error clearing settings cache:', error);
    }
  }

  // Get accessibility settings specifically
  async getAccessibilitySettings(): Promise<{
    highContrast: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
    largeButtons: boolean;
    fontSize: 'small' | 'medium' | 'large';
    sounds: boolean;
    vibration: boolean;
  }> {
    const settings = await this.getSettings();
    return {
      highContrast: settings.highContrast,
      reduceMotion: settings.reduceMotion,
      screenReader: settings.screenReader,
      largeButtons: settings.largeButtons,
      fontSize: settings.fontSize,
      sounds: settings.sounds,
      vibration: settings.vibration,
    };
  }

  // Get neurodivergent-friendly settings
  async getNeurodivergentSettings(): Promise<{
    sensoryMode: 'normal' | 'reduced' | 'enhanced';
    focusMode: boolean;
    breakReminders: boolean;
    customPacing: boolean;
    difficultyLevel: 'easy' | 'medium' | 'hard' | 'adaptive';
    showHints: boolean;
    sessionTimeout: number;
  }> {
    const settings = await this.getSettings();
    return {
      sensoryMode: settings.sensoryMode,
      focusMode: settings.focusMode,
      breakReminders: settings.breakReminders,
      customPacing: settings.customPacing,
      difficultyLevel: settings.difficultyLevel,
      showHints: settings.showHints,
      sessionTimeout: settings.sessionTimeout,
    };
  }

  // Apply settings to app (helper method)
  async applySettings(): Promise<AppConfig> {
    const settings = await this.getSettings();
    
    // Here you would apply settings to various app systems
    // For example:
    // - Set theme
    // - Configure animations
    // - Set up accessibility features
    // - Configure sound/vibration
    
    console.log('Applied settings:', settings);
    return settings;
  }

  // Check if setting exists
  async hasSetting(key: string): Promise<boolean> {
    await this.initializeSettings();
    return key in this.settingsCache;
  }

  // Get default value for a setting
  getDefaultSetting<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return DEFAULT_SETTINGS[key];
  }

  // Validate setting value
  isValidSettingValue<K extends keyof AppConfig>(
    key: K, 
    value: any
  ): value is AppConfig[K] {
    const defaultValue = DEFAULT_SETTINGS[key];
    
    if (typeof defaultValue === 'boolean') {
      return typeof value === 'boolean';
    }
    
    if (typeof defaultValue === 'number') {
      return typeof value === 'number' && !isNaN(value);
    }
    
    if (typeof defaultValue === 'string') {
      // For enum-like string values, you might want to add specific validation
      return typeof value === 'string';
    }
    
    return false;
  }
}

export default new SettingsService();