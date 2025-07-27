// src/services/TranslationService.ts
// Servicio para traducir datos del servidor en tiempo real

import { Language } from '../i18n';
import { Activity, Category, Lesson } from './ApiService';

export interface TranslationMap {
  [key: string]: {
    es: string;
    en: string;
  };
}

// Traducciones para nombres de actividades (más completas)
const activityNameTranslations: TranslationMap = {
  // Juegos de memoria
  'Memoria': {
    es: 'Memoria',
    en: 'Memory'
  },
  'Memory': {
    es: 'Memoria',
    en: 'Memory'
  },
  'Memory Game': {
    es: 'Juego de Memoria',
    en: 'Memory Game'
  },
  'Juego de Memoria': {
    es: 'Juego de Memoria',
    en: 'Memory Game'
  },
  'Memorama': {
    es: 'Memorama',
    en: 'Memory Game'
  },
  
  // Matemáticas
  'Matemáticas': {
    es: 'Matemáticas',
    en: 'Mathematics'
  },
  'Mathematics': {
    es: 'Matemáticas',
    en: 'Mathematics'
  },
  'Números': {
    es: 'Números',
    en: 'Numbers'
  },
  'Numbers': {
    es: 'Números',
    en: 'Numbers'
  },
  'Aritmética': {
    es: 'Aritmética',
    en: 'Arithmetic'
  },
  'Arithmetic': {
    es: 'Aritmética',
    en: 'Arithmetic'
  },
  'Cálculo': {
    es: 'Cálculo',
    en: 'Calculation'
  },
  'Calculation': {
    es: 'Cálculo',
    en: 'Calculation'
  },
  
  // Lenguaje
  'Lenguaje': {
    es: 'Lenguaje',
    en: 'Language'
  },
  'Language': {
    es: 'Lenguaje',
    en: 'Language'
  },
  'Lectura': {
    es: 'Lectura',
    en: 'Reading'
  },
  'Reading': {
    es: 'Lectura',
    en: 'Reading'
  },
  'Escritura': {
    es: 'Escritura',
    en: 'Writing'
  },
  'Writing': {
    es: 'Escritura',
    en: 'Writing'
  },
  'Vocabulario': {
    es: 'Vocabulario',
    en: 'Vocabulary'
  },
  'Vocabulary': {
    es: 'Vocabulario',
    en: 'Vocabulary'
  },
  
  // Lógica
  'Lógica': {
    es: 'Lógica',
    en: 'Logic'
  },
  'Logic': {
    es: 'Lógica',
    en: 'Logic'
  },
  'Rompecabezas': {
    es: 'Rompecabezas',
    en: 'Puzzles'
  },
  'Puzzles': {
    es: 'Rompecabezas',
    en: 'Puzzles'
  },
  'Razonamiento': {
    es: 'Razonamiento',
    en: 'Reasoning'
  },
  'Reasoning': {
    es: 'Razonamiento',
    en: 'Reasoning'
  },
  
  // Creatividad
  'Creatividad': {
    es: 'Creatividad',
    en: 'Creativity'
  },
  'Creativity': {
    es: 'Creatividad',
    en: 'Creativity'
  },
  'Arte': {
    es: 'Arte',
    en: 'Art'
  },
  'Art': {
    es: 'Arte',
    en: 'Art'
  },
  'Música': {
    es: 'Música',
    en: 'Music'
  },
  'Music': {
    es: 'Música',
    en: 'Music'
  },
  'Dibujo': {
    es: 'Dibujo',
    en: 'Drawing'
  },
  'Drawing': {
    es: 'Dibujo',
    en: 'Drawing'
  },
  
  // Ciencias
  'Ciencias': {
    es: 'Ciencias',
    en: 'Science'
  },
  'Science': {
    es: 'Ciencias',
    en: 'Science'
  },
  'Naturaleza': {
    es: 'Naturaleza',
    en: 'Nature'
  },
  'Nature': {
    es: 'Naturaleza',
    en: 'Nature'
  },
  'Experimentos': {
    es: 'Experimentos',
    en: 'Experiments'
  },
  'Experiments': {
    es: 'Experimentos',
    en: 'Experiments'
  },
  
  // Habilidades sociales
  'Habilidades Sociales': {
    es: 'Habilidades Sociales',
    en: 'Social Skills'
  },
  'Social Skills': {
    es: 'Habilidades Sociales',
    en: 'Social Skills'
  },
  'Emociones': {
    es: 'Emociones',
    en: 'Emotions'
  },
  'Emotions': {
    es: 'Emociones',
    en: 'Emotions'
  },
  'Comunicación': {
    es: 'Comunicación',
    en: 'Communication'
  },
  'Communication': {
    es: 'Comunicación',
    en: 'Communication'
  },
  
  // Motricidad
  'Motricidad': {
    es: 'Motricidad',
    en: 'Motor Skills'
  },
  'Motor Skills': {
    es: 'Motricidad',
    en: 'Motor Skills'
  },
  'Coordinación': {
    es: 'Coordinación',
    en: 'Coordination'
  },
  'Coordination': {
    es: 'Coordinación',
    en: 'Coordination'
  },
  'Movimiento': {
    es: 'Movimiento',
    en: 'Movement'
  },
  'Movement': {
    es: 'Movimiento',
    en: 'Movement'
  },

  // Actividades comunes del servidor
  'Drag and Drop': {
    es: 'Arrastrar y Soltar',
    en: 'Drag and Drop'
  },
  'Arrastrar y Soltar': {
    es: 'Arrastrar y Soltar',
    en: 'Drag and Drop'
  },
  'Match': {
    es: 'Emparejar',
    en: 'Match'
  },
  'Emparejar': {
    es: 'Emparejar',
    en: 'Match'
  },
  'Select Option': {
    es: 'Seleccionar Opción',
    en: 'Select Option'
  },
  'Seleccionar Opción': {
    es: 'Seleccionar Opción',
    en: 'Select Option'
  },
  'Order Steps': {
    es: 'Ordenar Pasos',
    en: 'Order Steps'
  },
  'Ordenar Pasos': {
    es: 'Ordenar Pasos',
    en: 'Order Steps'
  },
  'Pattern Recognition': {
    es: 'Reconocimiento de Patrones',
    en: 'Pattern Recognition'
  },
  'Reconocimiento de Patrones': {
    es: 'Reconocimiento de Patrones',
    en: 'Pattern Recognition'
  },
};

// Traducciones para descripciones de actividades (más completas)
const activityDescriptionTranslations: TranslationMap = {
  'Juegos para mejorar la memoria y concentración': {
    es: 'Juegos para mejorar la memoria y concentración',
    en: 'Games to improve memory and concentration'
  },
  'Games to improve memory and concentration': {
    es: 'Juegos para mejorar la memoria y concentración',
    en: 'Games to improve memory and concentration'
  },
  
  'Actividades de matemáticas básicas': {
    es: 'Actividades de matemáticas básicas',
    en: 'Basic mathematics activities'
  },
  'Basic mathematics activities': {
    es: 'Actividades de matemáticas básicas',
    en: 'Basic mathematics activities'
  },
  
  'Ejercicios de lectura y escritura': {
    es: 'Ejercicios de lectura y escritura',
    en: 'Reading and writing exercises'
  },
  'Reading and writing exercises': {
    es: 'Ejercicios de lectura y escritura',
    en: 'Reading and writing exercises'
  },
  
  'Rompecabezas y problemas lógicos': {
    es: 'Rompecabezas y problemas lógicos',
    en: 'Puzzles and logic problems'
  },
  'Puzzles and logic problems': {
    es: 'Rompecabezas y problemas lógicos',
    en: 'Puzzles and logic problems'
  },
  
  'Actividades artísticas y creativas': {
    es: 'Actividades artísticas y creativas',
    en: 'Artistic and creative activities'
  },
  'Artistic and creative activities': {
    es: 'Actividades artísticas y creativas',
    en: 'Artistic and creative activities'
  },
  
  'Exploración del mundo natural': {
    es: 'Exploración del mundo natural',
    en: 'Exploring the natural world'
  },
  'Exploring the natural world': {
    es: 'Exploración del mundo natural',
    en: 'Exploring the natural world'
  },
  
  'Desarrollo de habilidades sociales': {
    es: 'Desarrollo de habilidades sociales',
    en: 'Social skills development'
  },
  'Social skills development': {
    es: 'Desarrollo de habilidades sociales',
    en: 'Social skills development'
  },
  
  'Ejercicios de coordinación motriz': {
    es: 'Ejercicios de coordinación motriz',
    en: 'Motor coordination exercises'
  },
  'Motor coordination exercises': {
    es: 'Ejercicios de coordinación motriz',
    en: 'Motor coordination exercises'
  },

  // Descripciones más específicas
  'Encuentra las parejas iguales': {
    es: 'Encuentra las parejas iguales',
    en: 'Find the matching pairs'
  },
  'Find the matching pairs': {
    es: 'Encuentra las parejas iguales',
    en: 'Find the matching pairs'
  },
  
  'Arrastra elementos a su lugar correcto': {
    es: 'Arrastra elementos a su lugar correcto',
    en: 'Drag elements to their correct place'
  },
  'Drag elements to their correct place': {
    es: 'Arrastra elementos a su lugar correcto',
    en: 'Drag elements to their correct place'
  },
  
  'Une cada elemento con su pareja': {
    es: 'Une cada elemento con su pareja',
    en: 'Match each element with its pair'
  },
  'Match each element with its pair': {
    es: 'Une cada elemento con su pareja',
    en: 'Match each element with its pair'
  },
  
  'Elige la respuesta correcta': {
    es: 'Elige la respuesta correcta',
    en: 'Choose the correct answer'
  },
  'Choose the correct answer': {
    es: 'Elige la respuesta correcta',
    en: 'Choose the correct answer'
  },
  
  'Ordena los pasos en el orden correcto': {
    es: 'Ordena los pasos en el orden correcto',
    en: 'Put the steps in the correct order'
  },
  'Put the steps in the correct order': {
    es: 'Ordena los pasos en el orden correcto',
    en: 'Put the steps in the correct order'
  },
  
  'Identifica el patrón que falta': {
    es: 'Identifica el patrón que falta',
    en: 'Identify the missing pattern'
  },
  'Identify the missing pattern': {
    es: 'Identifica el patrón que falta',
    en: 'Identify the missing pattern'
  },

  // Descripciones genéricas comunes
  'Actividad educativa': {
    es: 'Actividad educativa',
    en: 'Educational activity'
  },
  'Educational activity': {
    es: 'Actividad educativa',
    en: 'Educational activity'
  },
  
  'Juego interactivo': {
    es: 'Juego interactivo',
    en: 'Interactive game'
  },
  'Interactive game': {
    es: 'Juego interactivo',
    en: 'Interactive game'
  },
  
  'Ejercicio de práctica': {
    es: 'Ejercicio de práctica',
    en: 'Practice exercise'
  },
  'Practice exercise': {
    es: 'Ejercicio de práctica',
    en: 'Practice exercise'
  },
};

// Resto de las traducciones (categorías, lecciones, etc.)
const categoryNameTranslations: TranslationMap = {
  // Categorías básicas
  'Básico': {
    es: 'Básico',
    en: 'Basic'
  },
  'Basic': {
    es: 'Básico',
    en: 'Basic'
  },
  'Intermedio': {
    es: 'Intermedio',
    en: 'Intermediate'
  },
  'Intermediate': {
    es: 'Intermedio',
    en: 'Intermediate'
  },
  'Avanzado': {
    es: 'Avanzado',
    en: 'Advanced'
  },
  'Advanced': {
    es: 'Avanzado',
    en: 'Advanced'
  },
  
  // Categorías por edad
  'Preescolar': {
    es: 'Preescolar',
    en: 'Preschool'
  },
  'Preschool': {
    es: 'Preescolar',
    en: 'Preschool'
  },
  'Primaria': {
    es: 'Primaria',
    en: 'Elementary'
  },
  'Elementary': {
    es: 'Primaria',
    en: 'Elementary'
  },
  
  // Categorías temáticas
  'Animales': {
    es: 'Animales',
    en: 'Animals'
  },
  'Animals': {
    es: 'Animales',
    en: 'Animals'
  },
  'Colores': {
    es: 'Colores',
    en: 'Colors'
  },
  'Colors': {
    es: 'Colores',
    en: 'Colors'
  },
  'Formas': {
    es: 'Formas',
    en: 'Shapes'
  },
  'Shapes': {
    es: 'Formas',
    en: 'Shapes'
  },
  'Familia': {
    es: 'Familia',
    en: 'Family'
  },
  'Family': {
    es: 'Familia',
    en: 'Family'
  },
  'Casa': {
    es: 'Casa',
    en: 'Home'
  },
  'Home': {
    es: 'Casa',
    en: 'Home'
  },
  'Escuela': {
    es: 'Escuela',
    en: 'School'
  },
  'School': {
    es: 'Escuela',
    en: 'School'
  },
  'Comida': {
    es: 'Comida',
    en: 'Food'
  },
  'Food': {
    es: 'Comida',
    en: 'Food'
  },
  'Transporte': {
    es: 'Transporte',
    en: 'Transportation'
  },
  'Transportation': {
    es: 'Transporte',
    en: 'Transportation'
  },
};

// Traducciones para descripciones de categorías
const categoryDescriptionTranslations: TranslationMap = {
  'Actividades para principiantes': {
    es: 'Actividades para principiantes',
    en: 'Activities for beginners'
  },
  'Activities for beginners': {
    es: 'Actividades para principiantes',
    en: 'Activities for beginners'
  },
  
  'Nivel intermedio de dificultad': {
    es: 'Nivel intermedio de dificultad',
    en: 'Intermediate difficulty level'
  },
  'Intermediate difficulty level': {
    es: 'Nivel intermedio de dificultad',
    en: 'Intermediate difficulty level'
  },
  
  'Desafíos avanzados': {
    es: 'Desafíos avanzados',
    en: 'Advanced challenges'
  },
  'Advanced challenges': {
    es: 'Desafíos avanzados',
    en: 'Advanced challenges'
  },
  
  'Aprende sobre animales': {
    es: 'Aprende sobre animales',
    en: 'Learn about animals'
  },
  'Learn about animals': {
    es: 'Aprende sobre animales',
    en: 'Learn about animals'
  },
  
  'Identifica y aprende colores': {
    es: 'Identifica y aprende colores',
    en: 'Identify and learn colors'
  },
  'Identify and learn colors': {
    es: 'Identifica y aprende colores',
    en: 'Identify and learn colors'
  },
  
  'Reconoce formas geométricas': {
    es: 'Reconoce formas geométricas',
    en: 'Recognize geometric shapes'
  },
  'Recognize geometric shapes': {
    es: 'Reconoce formas geométricas',
    en: 'Recognize geometric shapes'
  },
};

// Traducciones para títulos de lecciones
const lessonTitleTranslations: TranslationMap = {
  'Lección 1': {
    es: 'Lección 1',
    en: 'Lesson 1'
  },
  'Lesson 1': {
    es: 'Lección 1',
    en: 'Lesson 1'
  },
  
  'Introducción': {
    es: 'Introducción',
    en: 'Introduction'
  },
  'Introduction': {
    es: 'Introducción',
    en: 'Introduction'
  },
  
  'Práctica': {
    es: 'Práctica',
    en: 'Practice'
  },
  'Practice': {
    es: 'Práctica',
    en: 'Practice'
  },
  
  'Evaluación': {
    es: 'Evaluación',
    en: 'Assessment'
  },
  'Assessment': {
    es: 'Evaluación',
    en: 'Assessment'
  },
};

class TranslationService {
  /**
   * Traduce el texto usando el mapa de traducciones con logging mejorado
   */
  private static translateText(text: string, translationMap: TranslationMap, language: Language): string {
    if (!text || text.trim() === '') {
      return text;
    }

    const originalText = text.trim();
    
    // Buscar traducción exacta
    const exactMatch = translationMap[originalText];
    if (exactMatch) {
      const translated = exactMatch[language];
      console.log(`🔄 [TranslationService] Traducido: "${originalText}" → "${translated}"`);
      return translated;
    }
    
    // Buscar traducción parcial (case insensitive)
    const lowerText = originalText.toLowerCase();
    for (const [key, translations] of Object.entries(translationMap)) {
      if (key.toLowerCase() === lowerText) {
        const translated = translations[language];
        console.log(`🔄 [TranslationService] Traducido (case insensitive): "${originalText}" → "${translated}"`);
        return translated;
      }
    }
    
    // Si no hay traducción, devolver el texto original
    console.log(`⚠️ [TranslationService] Sin traducción para: "${originalText}"`);
    return originalText;
  }

  /**
   * Traduce una actividad completa
   */
  static translateActivity(activity: Activity, language: Language): Activity {
    console.log(`🎮 [TranslationService] Traduciendo actividad: ${activity.name} (${activity.description})`);
    
    const translatedActivity = {
      ...activity,
      name: this.translateText(activity.name, activityNameTranslations, language),
      description: this.translateText(activity.description, activityDescriptionTranslations, language),
    };
    
    console.log(`✅ [TranslationService] Actividad traducida: ${translatedActivity.name} (${translatedActivity.description})`);
    return translatedActivity;
  }

  /**
   * Traduce un array de actividades
   */
  static translateActivities(activities: Activity[], language: Language): Activity[] {
    console.log(`🌍 [TranslationService] Iniciando traducción de ${activities.length} actividades a ${language}`);
    const translated = activities.map(activity => this.translateActivity(activity, language));
    console.log(`✅ [TranslationService] Traducción completada de ${translated.length} actividades`);
    return translated;
  }

  /**
   * Traduce una categoría completa
   */
  static translateCategory(category: Category, language: Language): Category {
    return {
      ...category,
      name: this.translateText(category.name, categoryNameTranslations, language),
      description: this.translateText(category.description, categoryDescriptionTranslations, language),
    };
  }

  /**
   * Traduce un array de categorías
   */
  static translateCategories(categories: Category[], language: Language): Category[] {
    return categories.map(category => this.translateCategory(category, language));
  }

  /**
   * Traduce una lección completa
   */
  static translateLesson(lesson: Lesson, language: Language): Lesson {
    return {
      ...lesson,
      title: this.translateText(lesson.title, lessonTitleTranslations, language),
      description: this.translateText(lesson.description, categoryDescriptionTranslations, language),
    };
  }

  /**
   * Traduce un array de lecciones
   */
  static translateLessons(lessons: Lesson[], language: Language): Lesson[] {
    return lessons.map(lesson => this.translateLesson(lesson, language));
  }

  /**
   * Agrega una nueva traducción de actividad
   */
  static addActivityTranslation(originalText: string, spanish: string, english: string) {
    activityNameTranslations[originalText] = { es: spanish, en: english };
    console.log(`➕ [TranslationService] Nueva traducción agregada: "${originalText}" → ES: "${spanish}", EN: "${english}"`);
  }

  /**
   * Agrega una nueva traducción de categoría
   */
  static addCategoryTranslation(originalText: string, spanish: string, english: string) {
    categoryNameTranslations[originalText] = { es: spanish, en: english };
  }

  /**
   * Agrega una nueva traducción de lección
   */
  static addLessonTranslation(originalText: string, spanish: string, english: string) {
    lessonTitleTranslations[originalText] = { es: spanish, en: english };
  }

  /**
   * Obtiene todas las traducciones disponibles para debug
   */
  static getAllTranslations() {
    return {
      activities: {
        names: activityNameTranslations,
        descriptions: activityDescriptionTranslations,
      },
      categories: {
        names: categoryNameTranslations,
        descriptions: categoryDescriptionTranslations,
      },
      lessons: {
        titles: lessonTitleTranslations,
      },
    };
  }

  /**
   * Lista todas las traducciones disponibles para actividades
   */
  static listActivityTranslations() {
    console.log('📋 [TranslationService] Traducciones de actividades disponibles:');
    Object.entries(activityNameTranslations).forEach(([key, translations]) => {
      console.log(`  "${key}" → ES: "${translations.es}", EN: "${translations.en}"`);
    });
  }
}

export default TranslationService;