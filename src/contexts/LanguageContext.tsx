// src/contexts/LanguageContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, Translations, translations, DEFAULT_LANGUAGE } from '../i18n';
import { useAuth } from '../hooks/useAuth';
import ApiService from '../services/ApiService';
import AudioService from '../services/AudioService';

interface LanguageContextType {
  language: Language;
  t: Translations;
  changeLanguage: (newLanguage: Language) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@NeuroApp:language';

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Get current translations
  const t = translations[language];

  // Load language on app start
  useEffect(() => {
    loadLanguage();
  }, []);

  // Load language when user changes
  useEffect(() => {
    if (user?.id) {
      loadUserLanguage();
    }
  }, [user?.id]);

  const loadLanguage = async () => {
    try {
      setIsLoading(true);
      
      // Try to load from AsyncStorage first
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLanguage && (storedLanguage === 'es' || storedLanguage === 'en')) {
        setLanguage(storedLanguage as Language);
        console.log('🌍 [LanguageContext] Idioma cargado desde storage:', storedLanguage);
        
        // Sincronizar con AudioService
        try {
          const audioService = AudioService.getInstance();
          await audioService.syncWithAppLanguage(storedLanguage as Language);
          console.log('🔊 [LanguageContext] AudioService sincronizado con idioma cargado');
        } catch (audioError) {
          console.error('❌ [LanguageContext] Error sincronizando AudioService al cargar:', audioError);
        }
      }
    } catch (error) {
      console.error('❌ [LanguageContext] Error loading language from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserLanguage = async () => {
    if (!user?.id) return;

    try {
      // Try to get user's language setting from API
      const userSettings = await ApiService.getUserSettings(user.id);
      const languageSetting = userSettings.settings.find(s => s.key === 'app_language');
      
      if (languageSetting && languageSetting.value) {
        const userLanguage = languageSetting.value as Language;
        if (userLanguage !== language) {
          setLanguage(userLanguage);
          await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, userLanguage);
          console.log('🌍 [LanguageContext] Idioma cargado desde usuario:', userLanguage);
          
          // Sincronizar con AudioService
          try {
            const audioService = AudioService.getInstance();
            await audioService.syncWithAppLanguage(userLanguage);
            console.log('🔊 [LanguageContext] AudioService sincronizado con idioma del usuario');
          } catch (audioError) {
            console.error('❌ [LanguageContext] Error sincronizando AudioService con usuario:', audioError);
          }
        }
      }
    } catch (error) {
      console.error('❌ [LanguageContext] Error loading user language:', error);
    }
  };

  const changeLanguage = async (newLanguage: Language) => {
    try {
      console.log('🌍 [LanguageContext] Cambiando idioma a:', newLanguage);
      
      // Update local state immediately for instant UI change
      setLanguage(newLanguage);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      
      // Sincronizar con AudioService
      try {
        const audioService = AudioService.getInstance();
        await audioService.syncWithAppLanguage(newLanguage);
        console.log('🔊 [LanguageContext] AudioService sincronizado con nuevo idioma');
      } catch (audioError) {
        console.error('❌ [LanguageContext] Error sincronizando AudioService:', audioError);
      }
      
      // Update user setting if user is logged in
      if (user?.id) {
        try {
          await ApiService.updateUserSetting(user.id, 'app_language', { value: newLanguage });
          console.log('✅ [LanguageContext] Idioma actualizado en servidor');
        } catch (apiError) {
          console.error('❌ [LanguageContext] Error updating language on server:', apiError);
          // Don't revert local change even if server update fails
        }
      }
      
      console.log('✅ [LanguageContext] Idioma cambiado exitosamente a:', newLanguage);
    } catch (error) {
      console.error('❌ [LanguageContext] Error changing language:', error);
      throw error;
    }
  };

  const value: LanguageContextType = {
    language,
    t,
    changeLanguage,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;