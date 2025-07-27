import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  Vibration,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ApiService, { UserSettings } from '../services/ApiService';
import { useAuth } from '../hooks';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingItem {
  key: string;
  value: string;
  category: string;
  title: string;
  description: string;
  type: 'boolean' | 'number' | 'select';
  icon: string;
  color: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { user } = useAuth();
  const { language, t, changeLanguage } = useLanguage();
  
  // State
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [celebrationAnim] = useState(new Animated.Value(0));
  
  // Categories with translations
  const categories = [
    { key: 'all', title: t.settings.categories.all, icon: '📋', color: '#4285F4' },
    { key: 'audio', title: t.settings.categories.audio, icon: '🔊', color: '#FF6B6B' },
    { key: 'gameplay', title: t.settings.categories.gameplay, icon: '🎮', color: '#4ECDC4' },
    { key: 'progress', title: t.settings.categories.progress, icon: '🏆', color: '#FECA57' },
    { key: 'appearance', title: t.settings.categories.appearance, icon: '🎨', color: '#96CEB4' },
    { key: 'general', title: t.settings.categories.language, icon: '🌍', color: '#A8A8F0' },
    { key: 'accessibility', title: t.settings.categories.accessibility, icon: '🤝', color: '#45B7D1' },
    { key: 'parental', title: t.settings.categories.parental, icon: '👨‍👩‍👧‍👦', color: '#FF9800' },
  ];

  // Load user settings
  const loadSettings = useCallback(async () => {
    if (!user?.id) {
      setError('Usuario no encontrado');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔧 [SettingsScreen] Cargando configuraciones para usuario:', user.id);
      
      let userSettingsResponse;
      try {
        userSettingsResponse = await ApiService.getUserSettings(user.id);
        console.log('📋 [SettingsScreen] Configuraciones existentes:', userSettingsResponse.settings.length);
      } catch (getUserError) {
        console.log('📋 [SettingsScreen] Inicializando configuraciones...');
        await ApiService.initializeUserSettings(user.id);
        userSettingsResponse = await ApiService.getUserSettings(user.id);
      }
      
      if (userSettingsResponse && userSettingsResponse.settings.length > 0) {
        const transformedSettings: SettingItem[] = userSettingsResponse.settings.map(setting => ({
          key: setting.key,
          value: setting.value,
          category: setting.category,
          title: getSettingTitle(setting.key),
          description: getSettingDescription(setting.key),
          type: getSettingType(setting.key),
          icon: getSettingIcon(setting.key),
          color: getSettingColor(setting.key),
          options: getSettingOptions(setting.key),
          min: getSettingMin(setting.key),
          max: getSettingMax(setting.key),
          step: getSettingStep(setting.key),
        }));
        
        setSettings(transformedSettings);
        console.log('✅ [SettingsScreen] Configuraciones cargadas:', transformedSettings.length);
      } else {
        throw new Error('No se encontraron configuraciones');
      }
      
    } catch (error) {
      console.error('❌ [SettingsScreen] Error cargando configuraciones:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Setting metadata with translations
  const getSettingTitle = (key: string): string => {
    switch (key) {
      // Audio
      case 'sound_effects_enabled': return t.settings.audio.soundEffects.title;
      case 'voice_help_enabled': return t.settings.audio.voiceHelp.title;
      case 'voice_speed': return t.settings.audio.voiceSpeed.title;
      case 'audio_volume': return t.settings.audio.volume.title;
      
      // Gameplay
      case 'help_delay_seconds': return t.settings.gameplay.helpDelay.title;
      case 'max_attempts_per_activity': return t.settings.gameplay.maxAttempts.title;
      case 'auto_advance_enabled': return t.settings.gameplay.autoAdvance.title;
      case 'celebration_animations': return t.settings.gameplay.celebrations.title;
      case 'hint_button_visible': return t.settings.gameplay.hintButton.title;
      
      // Accessibility
      case 'font_size': return t.settings.accessibility.fontSize.title;
      case 'high_contrast_mode': return t.settings.accessibility.highContrast.title;
      case 'animation_speed': return t.settings.accessibility.animationSpeed.title;
      case 'button_size': return t.settings.accessibility.buttonSize.title;
      
      // Progress
      case 'daily_goal_minutes': return t.settings.progress.dailyGoal.title;
      case 'show_progress_bar': return t.settings.progress.progressBar.title;
      case 'show_stars_count': return t.settings.progress.starsCount.title;
      case 'achievement_notifications': return t.settings.progress.notifications.title;
      
      // Appearance
      case 'theme_mode': return t.settings.appearance.theme.title;
      case 'color_scheme': return t.settings.appearance.colorScheme.title;
      case 'show_background_patterns': return t.settings.appearance.backgroundPatterns.title;
      
      // Language
      case 'app_language': return t.settings.language.appLanguage.title;
      case 'voice_language': return t.settings.language.voiceLanguage.title;
      
      // Parental
      case 'parental_mode_enabled': return t.settings.parental.parentalMode.title;
      case 'session_time_limit': return t.settings.parental.timeLimit.title;
      case 'break_reminder_enabled': return t.settings.parental.breakReminder.title;
      case 'break_reminder_minutes': return t.settings.parental.breakInterval.title;
      
      default: return key;
    }
  };

  const getSettingDescription = (key: string): string => {
    switch (key) {
      // Audio
      case 'sound_effects_enabled': return t.settings.audio.soundEffects.description;
      case 'voice_help_enabled': return t.settings.audio.voiceHelp.description;
      case 'voice_speed': return t.settings.audio.voiceSpeed.description;
      case 'audio_volume': return t.settings.audio.volume.description;
      
      // Gameplay
      case 'help_delay_seconds': return t.settings.gameplay.helpDelay.description;
      case 'max_attempts_per_activity': return t.settings.gameplay.maxAttempts.description;
      case 'auto_advance_enabled': return t.settings.gameplay.autoAdvance.description;
      case 'celebration_animations': return t.settings.gameplay.celebrations.description;
      case 'hint_button_visible': return t.settings.gameplay.hintButton.description;
      
      // Accessibility
      case 'font_size': return t.settings.accessibility.fontSize.description;
      case 'high_contrast_mode': return t.settings.accessibility.highContrast.description;
      case 'animation_speed': return t.settings.accessibility.animationSpeed.description;
      case 'button_size': return t.settings.accessibility.buttonSize.description;
      
      // Progress
      case 'daily_goal_minutes': return t.settings.progress.dailyGoal.description;
      case 'show_progress_bar': return t.settings.progress.progressBar.description;
      case 'show_stars_count': return t.settings.progress.starsCount.description;
      case 'achievement_notifications': return t.settings.progress.notifications.description;
      
      // Appearance
      case 'theme_mode': return t.settings.appearance.theme.description;
      case 'color_scheme': return t.settings.appearance.colorScheme.description;
      case 'show_background_patterns': return t.settings.appearance.backgroundPatterns.description;
      
      // Language
      case 'app_language': return t.settings.language.appLanguage.description;
      case 'voice_language': return t.settings.language.voiceLanguage.description;
      
      // Parental
      case 'parental_mode_enabled': return t.settings.parental.parentalMode.description;
      case 'session_time_limit': return t.settings.parental.timeLimit.description;
      case 'break_reminder_enabled': return t.settings.parental.breakReminder.description;
      case 'break_reminder_minutes': return t.settings.parental.breakInterval.description;
      
      default: return '';
    }
  };

  const getSettingIcon = (key: string): string => {
    const icons: Record<string, string> = {
      // Audio
      'sound_effects_enabled': '🎵',
      'voice_help_enabled': '🗣️',
      'voice_speed': '⚡',
      'audio_volume': '🔊',
      
      // Gameplay
      'help_delay_seconds': '⏰',
      'max_attempts_per_activity': '🎯',
      'auto_advance_enabled': '➡️',
      'celebration_animations': '🎉',
      'hint_button_visible': '💡',
      
      // Accessibility
      'font_size': '📝',
      'high_contrast_mode': '🌈',
      'animation_speed': '🏃',
      'button_size': '👆',
      
      // Progress
      'daily_goal_minutes': '🎯',
      'show_progress_bar': '📊',
      'show_stars_count': '⭐',
      'achievement_notifications': '🏆',
      
      // Appearance
      'theme_mode': '🌙',
      'color_scheme': '🎨',
      'show_background_patterns': '🖼️',
      
      // General (Language)
      'app_language': '🌍',
      'voice_language': '🗣️',
      
      // Parental
      'parental_mode_enabled': '👨‍👩‍👧‍👦',
      'session_time_limit': '⏱️',
      'break_reminder_enabled': '⏰',
      'break_reminder_minutes': '📅',
    };
    return icons[key] || '⚙️';
  };

  const getSettingColor = (key: string): string => {
    const colors: Record<string, string> = {
      // Audio - Red tones
      'sound_effects_enabled': '#FF6B6B',
      'voice_help_enabled': '#FF8E8E',
      'voice_speed': '#FFB3B3',
      'audio_volume': '#FF6B6B',
      
      // Gameplay - Teal tones
      'help_delay_seconds': '#4ECDC4',
      'max_attempts_per_activity': '#6BCCC4',
      'auto_advance_enabled': '#88D8D1',
      'celebration_animations': '#4ECDC4',
      'hint_button_visible': '#6BCCC4',
      
      // Accessibility - Blue tones
      'font_size': '#45B7D1',
      'high_contrast_mode': '#6BC5D8',
      'animation_speed': '#91D3DF',
      'button_size': '#45B7D1',
      
      // Progress - Yellow tones
      'daily_goal_minutes': '#FECA57',
      'show_progress_bar': '#FED766',
      'show_stars_count': '#FFE066',
      'achievement_notifications': '#FECA57',
      
      // Appearance - Green tones
      'theme_mode': '#96CEB4',
      'color_scheme': '#A8D8C4',
      'show_background_patterns': '#BAE2D4',
      
      // General (Language) - Purple tones
      'app_language': '#A8A8F0',
      'voice_language': '#B8B8F5',
      
      // Parental - Orange tones
      'parental_mode_enabled': '#FF9800',
      'session_time_limit': '#FFB74D',
      'break_reminder_enabled': '#FFCC02',
      'break_reminder_minutes': '#FFC107',
    };
    return colors[key] || '#95A5A6';
  };

  const getSettingType = (key: string): 'boolean' | 'number' | 'select' => {
    const types: Record<string, 'boolean' | 'number' | 'select'> = {
      // Boolean settings
      'sound_effects_enabled': 'boolean',
      'voice_help_enabled': 'boolean',
      'auto_advance_enabled': 'boolean',
      'celebration_animations': 'boolean',
      'hint_button_visible': 'boolean',
      'high_contrast_mode': 'boolean',
      'show_progress_bar': 'boolean',
      'show_stars_count': 'boolean',
      'achievement_notifications': 'boolean',
      'show_background_patterns': 'boolean',
      'parental_mode_enabled': 'boolean',
      'break_reminder_enabled': 'boolean',
      
      // Number settings
      'audio_volume': 'number',
      'help_delay_seconds': 'number',
      'max_attempts_per_activity': 'number',
      'daily_goal_minutes': 'number',
      'session_time_limit': 'number',
      'break_reminder_minutes': 'number',
      
      // Select settings
      'voice_speed': 'select',
      'font_size': 'select',
      'animation_speed': 'select',
      'button_size': 'select',
      'theme_mode': 'select',
      'color_scheme': 'select',
      'app_language': 'select',
      'voice_language': 'select',
    };
    return types[key] || 'select';
  };

  const getSettingOptions = (key: string): string[] | undefined => {
    const options: Record<string, string[]> = {
      'voice_speed': ['slow', 'normal', 'fast'],
      'font_size': ['small', 'medium', 'large'],
      'animation_speed': ['slow', 'normal', 'fast'],
      'button_size': ['small', 'medium', 'large'],
      'theme_mode': ['light', 'dark'],
      'color_scheme': ['default', 'blue', 'green', 'purple'],
      'app_language': ['es', 'en'],
      'voice_language': ['es', 'en'],
    };
    return options[key];
  };

  const getSettingMin = (key: string): number | undefined => {
    const mins: Record<string, number> = {
      'audio_volume': 0,
      'help_delay_seconds': 1,
      'max_attempts_per_activity': 1,
      'daily_goal_minutes': 5,
      'session_time_limit': 0,
      'break_reminder_minutes': 5,
    };
    return mins[key];
  };

  const getSettingMax = (key: string): number | undefined => {
    const maxs: Record<string, number> = {
      'audio_volume': 1,
      'help_delay_seconds': 15,
      'max_attempts_per_activity': 5,
      'daily_goal_minutes': 60,
      'session_time_limit': 180,
      'break_reminder_minutes': 60,
    };
    return maxs[key];
  };

  const getSettingStep = (key: string): number | undefined => {
    const steps: Record<string, number> = {
      'audio_volume': 0.1,
      'help_delay_seconds': 1,
      'max_attempts_per_activity': 1,
      'daily_goal_minutes': 5,
      'session_time_limit': 5,
      'break_reminder_minutes': 5,
    };
    return steps[key];
  };

  // Update setting with celebration and language handling
  const updateSetting = useCallback(async (key: string, value: string) => {
    if (!user?.id) return;
    
    try {
      setSaving(true);
      
      // Haptic feedback
      Vibration.vibrate(50);
      
      console.log(`🔄 [SettingsScreen] Actualizando ${key} = ${value}`);
      
      // Special handling for app_language
      if (key === 'app_language') {
        await changeLanguage(value as 'es' | 'en');
      } else {
        await ApiService.updateUserSetting(user.id, key, { value });
      }
      
      // Update local state
      setSettings(prev => prev.map(setting => 
        setting.key === key ? { ...setting, value } : setting
      ));
      
      // Celebration animation
      Animated.sequence([
        Animated.timing(celebrationAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      console.log(`✅ [SettingsScreen] Configuración actualizada: ${key} = ${value}`);
      
    } catch (error) {
      console.error('❌ [SettingsScreen] Error updating setting:', error);
      Alert.alert(t.errors.somethingWrong, t.settings.messages.error);
    } finally {
      setSaving(false);
    }
  }, [user?.id, celebrationAnim, changeLanguage, t]);

  // Filter settings by category
  const filteredSettings = selectedCategory === 'all' 
    ? settings 
    : settings.filter(setting => setting.category === selectedCategory);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Render different control types
  const renderBooleanControl = (setting: SettingItem) => (
    <TouchableOpacity
      style={[
        styles.booleanControl,
        { backgroundColor: setting.value === 'true' ? setting.color : '#E8E8E8' }
      ]}
      onPress={() => updateSetting(setting.key, setting.value === 'true' ? 'false' : 'true')}
      disabled={saving}
    >
      <Text style={styles.booleanIcon}>
        {setting.value === 'true' ? '✅' : '❌'}
      </Text>
      <Text style={[
        styles.booleanText,
        { color: setting.value === 'true' ? '#FFFFFF' : '#666666' }
      ]}>
        {setting.value === 'true' ? t.common.yes : t.common.no}
      </Text>
    </TouchableOpacity>
  );

  const renderSelectControl = (setting: SettingItem) => (
    <View style={styles.selectContainer}>
      {setting.options?.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.selectOption,
            {
              backgroundColor: setting.value === option ? setting.color : '#F0F0F0',
              borderColor: setting.value === option ? setting.color : '#E0E0E0',
            }
          ]}
          onPress={() => updateSetting(setting.key, option)}
          disabled={saving}
        >
          <Text style={[
            styles.selectText,
            { color: setting.value === option ? '#FFFFFF' : '#666666' }
          ]}>
            {getOptionLabel(option)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderNumberControl = (setting: SettingItem) => (
    <View style={styles.numberContainer}>
      <TouchableOpacity
        style={[styles.numberButton, { backgroundColor: setting.color }]}
        onPress={() => {
          const currentValue = parseFloat(setting.value) || 0;
          const step = setting.step || 1;
          const min = setting.min || 0;
          const newValue = Math.max(min, currentValue - step);
          updateSetting(setting.key, newValue.toString());
        }}
        disabled={saving}
      >
        <Text style={styles.numberButtonText}>−</Text>
      </TouchableOpacity>
      
      <View style={[styles.numberDisplay, { borderColor: setting.color }]}>
        <Text style={styles.numberValue}>
          {setting.key === 'audio_volume' 
            ? Math.round(parseFloat(setting.value) * 100) + '%'
            : setting.value + (setting.key.includes('minutes') ? ' min' : setting.key.includes('seconds') ? ' seg' : '')
          }
        </Text>
      </View>
      
      <TouchableOpacity
        style={[styles.numberButton, { backgroundColor: setting.color }]}
        onPress={() => {
          const currentValue = parseFloat(setting.value) || 0;
          const step = setting.step || 1;
          const max = setting.max || 100;
          const newValue = Math.min(max, currentValue + step);
          updateSetting(setting.key, newValue.toString());
        }}
        disabled={saving}
      >
        <Text style={styles.numberButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSettingCard = (setting: SettingItem) => (
    <Animated.View
      key={setting.key}
      style={[
        styles.settingCard,
        {
          transform: [{
            scale: celebrationAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.05],
            })
          }]
        }
      ]}
    >
      <View style={styles.settingHeader}>
        <View style={[styles.settingIconContainer, { backgroundColor: setting.color }]}>
          <Text style={styles.settingIcon}>{setting.icon}</Text>
        </View>
        <View style={styles.settingTitleContainer}>
          <Text style={styles.settingTitle}>{setting.title}</Text>
          <Text style={styles.settingDescription}>{setting.description}</Text>
        </View>
      </View>
      
      <View style={styles.settingControl}>
        {setting.type === 'boolean' && renderBooleanControl(setting)}
        {setting.type === 'select' && renderSelectControl(setting)}
        {setting.type === 'number' && renderNumberControl(setting)}
      </View>
    </Animated.View>
  );

  const getOptionLabel = (option: string): string => {
    // Language options
    if (option === 'es') return t.settings.language.options.spanish;
    if (option === 'en') return t.settings.language.options.english;
    
    // Voice speed options
    if (option === 'slow') return t.settings.audio.voiceSpeed.options.slow;
    if (option === 'normal') return t.settings.audio.voiceSpeed.options.normal;
    if (option === 'fast') return t.settings.audio.voiceSpeed.options.fast;
    
    // Size options
    if (option === 'small') return t.settings.accessibility.fontSize.options.small;
    if (option === 'medium') return t.settings.accessibility.fontSize.options.medium;
    if (option === 'large') return t.settings.accessibility.fontSize.options.large;
    
    // Theme options
    if (option === 'light') return t.settings.appearance.theme.options.light;
    if (option === 'dark') return t.settings.appearance.theme.options.dark;
    
    // Color scheme options
    if (option === 'default') return t.settings.appearance.colorScheme.options.default;
    if (option === 'blue') return t.settings.appearance.colorScheme.options.blue;
    if (option === 'green') return t.settings.appearance.colorScheme.options.green;
    if (option === 'purple') return t.settings.appearance.colorScheme.options.purple;
    
    return option;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>⚙️</Text>
          <Text style={styles.loadingTitle}>{t.settings.messages.loadingSettings}</Text>
          <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😕</Text>
          <Text style={styles.errorTitle}>{t.errors.somethingWrong}</Text>
          <Text style={styles.errorText}>{t.settings.messages.error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSettings}>
            <Text style={styles.retryIcon}>🔄</Text>
            <Text style={styles.retryText}>{t.common.retry}</Text>
          </TouchableOpacity>
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
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>{t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚙️ {t.settings.title}</Text>
      </View>

      {/* Compact Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryTab,
              {
                backgroundColor: selectedCategory === category.key ? category.color : '#F0F0F0',
                borderColor: selectedCategory === category.key ? category.color : '#E0E0E0',
              }
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Text style={styles.categoryTabIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryTabText,
              { color: selectedCategory === category.key ? '#FFFFFF' : '#666666' }
            ]}>
              {category.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Settings List */}
      <ScrollView style={styles.settingsContainer} showsVerticalScrollIndicator={false}>
        {filteredSettings.length > 0 ? (
          filteredSettings.map(renderSettingCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>{t.settings.messages.noSettings}</Text>
            <Text style={styles.emptyText}>{t.settings.messages.tryOtherCategory}</Text>
          </View>
        )}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Saving Indicator */}
      {saving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingContainer}>
            <Text style={styles.savingIcon}>💾</Text>
            <Text style={styles.savingText}>{t.settings.messages.saving}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E8F0FE',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 15,
  },
  backIcon: {
    fontSize: 18,
    color: '#4285F4',
    marginRight: 5,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285F4',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
  },
  categoryTabs: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0FE',
    maxHeight: 70,
  },
  categoryTabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 8,
    minWidth: 75,
    alignItems: 'center',
    borderWidth: 2,
  },
  categoryTabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  categoryTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  settingsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingIcon: {
    fontSize: 24,
  },
  settingTitleContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  settingControl: {
    alignItems: 'center',
  },
  booleanControl: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 120,
    justifyContent: 'center',
  },
  booleanIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  booleanText: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  selectOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  selectText: {
    fontSize: 14,
    fontWeight: '600',
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  numberButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  numberDisplay: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 2,
    backgroundColor: '#F8F8F8',
    minWidth: 100,
    alignItems: 'center',
  },
  numberValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  bottomSpacing: {
    height: 30,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  savingIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  savingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default SettingsScreen;