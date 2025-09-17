// src/utils/activityTranslations.ts
// Helper para obtener traducciones de tipos de actividad

import { useLanguage } from '../contexts/LanguageContext';

export const getActivityTypeTranslation = (activityType: string, language: 'es' | 'en'): string => {
  // Mapeo de tipos de actividad a claves de traducción
  const activityTypeMap: { [key: string]: string } = {
    'Selecciona la opción correcta': 'selectOption',
    'Ordena los pasos': 'orderSteps',
    'Arrastra y suelta': 'dragDrop',
    'Asocia elementos': 'match',
    'Memoria visual': 'memoryGame',
    'Reconocimiento de patrones': 'patternRecognition',
    // También manejar versiones en inglés
    'Select the correct option': 'selectOption',
    'Order the steps': 'orderSteps',
    'Drag and drop': 'dragDrop',
    'Match elements': 'match',
    'Visual memory': 'memoryGame',
    'Pattern recognition': 'patternRecognition',
  };

  const translationKey = activityTypeMap[activityType];
  if (!translationKey) {
    console.warn(`⚠️ [ActivityTranslations] Tipo de actividad no encontrado: "${activityType}"`);
    return activityType; // Devolver el original si no se encuentra
  }

  // Importar las traducciones directamente para evitar dependencias circulares
  const translations = {
    es: {
      selectOption: 'Selecciona la opción correcta',
      orderSteps: 'Ordena los pasos',
      dragDrop: 'Arrastra y suelta',
      match: 'Asocia elementos',
      memoryGame: 'Memoria visual',
      patternRecognition: 'Reconocimiento de patrones',
    },
    en: {
      selectOption: 'Select the correct option',
      orderSteps: 'Order the steps',
      dragDrop: 'Drag and drop',
      match: 'Match elements',
      memoryGame: 'Visual memory',
      patternRecognition: 'Pattern recognition',
    },
  };

  return translations[language][translationKey] || activityType;
};

export const getActivityTypeColor = (activityType: string): string => {
  const cleanType = extractActivityType(activityType);
  const colorMap: { [key: string]: string } = {
    'Selecciona la opción correcta': '#4CAF50',
    'Ordena los pasos': '#2196F3',
    'Arrastra y suelta': '#FF9800',
    'Asocia elementos': '#9C27B0',
    'Memoria visual': '#F44336',
    'Reconocimiento de patrones': '#607D8B',
    // Versiones en inglés
    'Select the correct option': '#4CAF50',
    'Order the steps': '#2196F3',
    'Drag and drop': '#FF9800',
    'Match elements': '#9C27B0',
    'Visual memory': '#F44336',
    'Pattern recognition': '#607D8B',
  };
  return colorMap[cleanType] || '#4285f4';
};

export const getActivityTypeIcon = (activityType: string): string => {
  const cleanType = extractActivityType(activityType);
  const iconMap: { [key: string]: string } = {
    'Selecciona la opción correcta': '✅',
    'Ordena los pasos': '🔢',
    'Arrastra y suelta': '👆',
    'Asocia elementos': '🔗',
    'Memoria visual': '🧠',
    'Reconocimiento de patrones': '🧩',
    // Versiones en inglés
    'Select the correct option': '✅',
    'Order the steps': '🔢',
    'Drag and drop': '👆',
    'Match elements': '🔗',
    'Visual memory': '🧠',
    'Pattern recognition': '🧩',
  };
  return iconMap[cleanType] || '🎮';
};

// Función para extraer el tipo limpio del formato bilingüe
export const extractActivityType = (activityType: string): string => {
  if (!activityType) return '';
  
  // Si contiene ":", extraer la parte después de ":"
  if (activityType.includes(':')) {
    return activityType.split(':')[1]?.trim() || activityType;
  }
  
  return activityType.trim();
};

// Función para obtener el tipo de actividad normalizado
export const getNormalizedActivityType = (activityType: string): string => {
  const cleanType = extractActivityType(activityType);
  
  // Mapeo para normalizar diferentes variaciones
  const normalizeMap: { [key: string]: string } = {
    'Selecciona la opción correcta': 'selectOption',
    'Select the correct option': 'selectOption',
    'Ordena los pasos': 'orderSteps',
    'Order the steps': 'orderSteps',
    'Arrastra y suelta': 'dragDrop',
    'Drag and drop': 'dragDrop',
    'Asocia elementos': 'match',
    'Match elements': 'match',
    'Memoria visual': 'memoryGame',
    'Visual memory': 'memoryGame',
    'Reconocimiento de patrones': 'patternRecognition',
    'Pattern recognition': 'patternRecognition',
  };
  
  return normalizeMap[cleanType] || cleanType;
};
