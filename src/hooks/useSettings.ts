// src/hooks/useSettings.ts
import { useState, useEffect, useCallback } from 'react';
import ApiService, { AppSettings } from '../services/ApiService';

export interface SettingsMap {
  [key: string]: string;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings[]>([]);
  const [settingsMap, setSettingsMap] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener todas las configuraciones
  const getAllSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allSettings = await ApiService.getSettings();
      setSettings(allSettings);
      
      return allSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching settings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener configuraciones activas
  const getActiveSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const activeSettings = await ApiService.getActiveSettings();
      return activeSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching active settings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener mapa de configuraciones (key-value)
  const getSettingsMap = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const map = await ApiService.getSettingsMap();
      setSettingsMap(map);
      
      return map;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching settings map';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener configuración por clave
  const getSettingByKey = useCallback(async (key: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const setting = await ApiService.getSettingByKey(key);
      return setting;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error fetching setting: ${key}`;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener configuraciones por categoría
  const getSettingsByCategory = useCallback(async (category: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const categorySettings = await ApiService.getSettingsByCategory(category);
      return categorySettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error fetching settings for category: ${category}`;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar configuración por clave
  const updateSettingByKey = useCallback(async (key: string, value: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.updateSettingByKey(key, value);
      
      // Actualizar configuraciones locales
      setSettings(prev => 
        prev.map(setting => 
          setting.key === key 
            ? { ...setting, value } 
            : setting
        )
      );
      
      // Actualizar mapa de configuraciones
      setSettingsMap(prev => ({
        ...prev,
        [key]: value
      }));
      
      return response.setting;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Error updating setting: ${key}`;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualización masiva de configuraciones
  const bulkUpdateSettings = useCallback(async (settingsToUpdate: SettingsMap) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.bulkUpdateSettings(settingsToUpdate);
      
      // Actualizar configuraciones locales
      setSettings(prev => 
        prev.map(setting => 
          settingsToUpdate.hasOwnProperty(setting.key)
            ? { ...setting, value: settingsToUpdate[setting.key] }
            : setting
        )
      );
      
      // Actualizar mapa de configuraciones
      setSettingsMap(prev => ({
        ...prev,
        ...settingsToUpdate
      }));
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error bulk updating settings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Resetear configuraciones a valores por defecto
  const resetSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.resetSettings();
      
      // Recargar configuraciones después del reset
      await getAllSettings();
      await getSettingsMap();
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error resetting settings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAllSettings, getSettingsMap]);

  // Obtener valor de configuración del mapa local
  const getSettingValue = useCallback((key: string, defaultValue: string = '') => {
    return settingsMap[key] || defaultValue;
  }, [settingsMap]);

  // Verificar si una configuración está activa
  const isSettingActive = useCallback((key: string) => {
    const setting = settings.find(s => s.key === key);
    return setting?.is_active || false;
  }, [settings]);

  // Obtener configuraciones por categoría del estado local
  const getLocalSettingsByCategory = useCallback((category: string) => {
    return settings.filter(setting => setting.category === category);
  }, [settings]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cargar configuraciones iniciales
  useEffect(() => {
    const loadInitialSettings = async () => {
      try {
        await Promise.all([
          getAllSettings(),
          getSettingsMap()
        ]);
      } catch (err) {
        console.error('Error loading initial settings:', err);
      }
    };

    loadInitialSettings();
  }, [getAllSettings, getSettingsMap]);

  return {
    // Estado
    settings,
    settingsMap,
    loading,
    error,
    
    // Acciones principales
    getAllSettings,
    getActiveSettings,
    getSettingsMap,
    getSettingByKey,
    getSettingsByCategory,
    updateSettingByKey,
    bulkUpdateSettings,
    resetSettings,
    
    // Utilidades locales
    getSettingValue,
    isSettingActive,
    getLocalSettingsByCategory,
    clearError,
  };
};

export default useSettings;