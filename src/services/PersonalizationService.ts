// src/services/PersonalizationService.ts
// Servicio para personalizar la experiencia basada en el perfil neurodivergente

import { NeurodivergentProfile } from './AnalysisService';

export interface ActivityPriority {
  activityType: string;
  priority: 'high' | 'medium' | 'low';
  dailyGoal: number;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  benefits: string[];
  icon: string;
  color: string;
}

export interface PersonalizedRecommendations {
  dailyGoals: {
    totalSessions: number;
    totalTime: number; // en minutos
    targetStars: number;
  };
  activityPriorities: ActivityPriority[];
  weeklyGoals: {
    totalSessions: number;
    totalTime: number;
    targetStars: number;
  };
  recommendations: string[];
}

class PersonalizationService {
  /**
   * Obtiene recomendaciones personalizadas basadas en el perfil neurodivergente
   */
  getPersonalizedRecommendations(profile: NeurodivergentProfile | null): PersonalizedRecommendations {
    if (!profile) {
      return this.getDefaultRecommendations();
    }

    const diagnosis = profile.primary_diagnosis;
    const severity = profile.severity;

    switch (diagnosis) {
      case 'TDAH':
        return this.getTDAHRecommendations(severity);
      case 'TEA':
        return this.getTEARecommendations(severity);
      case 'Dislexia':
        return this.getDislexiaRecommendations(severity);
      case 'Discalculia':
        return this.getDiscalculiaRecommendations(severity);
      default:
        return this.getDefaultRecommendations();
    }
  }

  /**
   * Recomendaciones para TDAH
   */
  private getTDAHRecommendations(severity: string): PersonalizedRecommendations {
    const isSevere = severity === 'Severo';
    const isModerate = severity === 'Moderado';

    return {
      dailyGoals: {
        totalSessions: isSevere ? 4 : isModerate ? 5 : 6,
        totalTime: isSevere ? 20 : isModerate ? 30 : 40,
        targetStars: isSevere ? 12 : isModerate ? 15 : 18,
      },
      activityPriorities: [
        {
          activityType: 'Memoria visual',
          priority: 'high',
          dailyGoal: isSevere ? 2 : isModerate ? 3 : 4,
          difficulty: isSevere ? 'easy' : isModerate ? 'medium' : 'medium',
          description: 'Mejora la atención sostenida y la concentración',
          benefits: ['Atención sostenida', 'Memoria de trabajo', 'Control de impulsos'],
          icon: '🧠',
          color: '#4CAF50',
        },
        {
          activityType: 'Atención',
          priority: 'high',
          dailyGoal: isSevere ? 1 : isModerate ? 2 : 3,
          difficulty: isSevere ? 'easy' : isModerate ? 'medium' : 'hard',
          description: 'Desarrolla el control de impulsos y la auto-regulación',
          benefits: ['Control de impulsos', 'Auto-regulación', 'Paciencia'],
          icon: '🎯',
          color: '#FF9800',
        },
        {
          activityType: 'Lectura',
          priority: 'medium',
          dailyGoal: isSevere ? 1 : isModerate ? 1 : 2,
          difficulty: isSevere ? 'easy' : isModerate ? 'easy' : 'medium',
          description: 'Fomenta la comprensión lectora y la paciencia',
          benefits: ['Comprensión lectora', 'Paciencia', 'Concentración'],
          icon: '📖',
          color: '#2196F3',
        },
        {
          activityType: 'Asocia elementos',
          priority: 'medium',
          dailyGoal: isSevere ? 1 : isModerate ? 2 : 2,
          difficulty: isSevere ? 'easy' : isModerate ? 'medium' : 'medium',
          description: 'Desarrolla el pensamiento lógico y la organización',
          benefits: ['Pensamiento lógico', 'Organización', 'Clasificación'],
          icon: '🔗',
          color: '#9C27B0',
        },
        {
          activityType: 'Reconocimiento de patrones',
          priority: 'low',
          dailyGoal: isSevere ? 0 : isModerate ? 1 : 1,
          difficulty: isSevere ? 'easy' : isModerate ? 'medium' : 'hard',
          description: 'Mejora la capacidad de análisis y resolución de problemas',
          benefits: ['Análisis', 'Resolución de problemas', 'Pensamiento crítico'],
          icon: '🧩',
          color: '#607D8B',
        },
      ],
      weeklyGoals: {
        totalSessions: isSevere ? 28 : isModerate ? 35 : 42,
        totalTime: isSevere ? 140 : isModerate ? 210 : 280,
        targetStars: isSevere ? 84 : isModerate ? 105 : 126,
      },
      recommendations: [
        'Realiza sesiones cortas de 5-10 minutos para mantener la atención',
        'Prioriza las actividades de memoria visual para mejorar la concentración',
        'Usa recordatorios visuales cada 30 segundos durante las actividades',
        'Celebra cada logro para mantener la motivación',
        'Evita actividades muy largas que puedan causar frustración',
      ],
    };
  }

  /**
   * Recomendaciones para TEA
   */
  private getTEARecommendations(severity: string): PersonalizedRecommendations {
    const isSevere = severity === 'Severo';
    const isModerate = severity === 'Moderado';

    return {
      dailyGoals: {
        totalSessions: isSevere ? 3 : isModerate ? 4 : 5,
        totalTime: isSevere ? 25 : isModerate ? 35 : 45,
        targetStars: isSevere ? 12 : isModerate ? 16 : 20,
      },
      activityPriorities: [
        {
          activityType: 'Asocia elementos',
          priority: 'high',
          dailyGoal: isSevere ? 2 : isModerate ? 3 : 4,
          difficulty: isSevere ? 'easy' : isModerate ? 'medium' : 'medium',
          description: 'Desarrolla la flexibilidad cognitiva y el pensamiento lógico',
          benefits: ['Flexibilidad cognitiva', 'Pensamiento lógico', 'Clasificación'],
          icon: '🔗',
          color: '#4CAF50',
        },
        {
          activityType: 'Reconocimiento de patrones',
          priority: 'high',
          dailyGoal: isSevere ? 2 : isModerate ? 3 : 3,
          difficulty: isSevere ? 'easy' : isModerate ? 'medium' : 'hard',
          description: 'Fomenta la estructura y la comprensión de reglas',
          benefits: ['Estructura', 'Comprensión de reglas', 'Rutinas'],
          icon: '🧩',
          color: '#FF9800',
        },
        {
          activityType: 'Memoria visual',
          priority: 'medium',
          dailyGoal: isSevere ? 1 : isModerate ? 2 : 2,
          difficulty: isSevere ? 'easy' : isModerate ? 'medium' : 'medium',
          description: 'Mejora la memoria de trabajo y la atención al detalle',
          benefits: ['Memoria de trabajo', 'Atención al detalle', 'Concentración'],
          icon: '🧠',
          color: '#2196F3',
        },
        {
          activityType: 'Lectura',
          priority: 'low',
          dailyGoal: isSevere ? 0 : isModerate ? 1 : 1,
          difficulty: isSevere ? 'easy' : isModerate ? 'easy' : 'medium',
          description: 'Desarrolla la comunicación y comprensión social',
          benefits: ['Comunicación', 'Comprensión social', 'Lenguaje'],
          icon: '📖',
          color: '#9C27B0',
        },
      ],
      weeklyGoals: {
        totalSessions: isSevere ? 21 : isModerate ? 28 : 35,
        totalTime: isSevere ? 175 : isModerate ? 245 : 315,
        targetStars: isSevere ? 84 : isModerate ? 112 : 140,
      },
      recommendations: [
        'Mantén rutinas consistentes para las sesiones de aprendizaje',
        'Usa instrucciones claras y paso a paso',
        'Evita cambios bruscos en la interfaz o actividades',
        'Prioriza actividades que fomenten la flexibilidad cognitiva',
        'Proporciona retroalimentación positiva y específica',
      ],
    };
  }

  /**
   * Recomendaciones para Dislexia
   */
  private getDislexiaRecommendations(severity: string): PersonalizedRecommendations {
    const isSevere = severity === 'Severo';
    const isModerate = severity === 'Moderado';

    return {
      dailyGoals: {
        totalSessions: isSevere ? 5 : isModerate ? 6 : 7,
        totalTime: isSevere ? 35 : isModerate ? 45 : 55,
        targetStars: isSevere ? 15 : isModerate ? 18 : 21,
      },
      activityPriorities: [
        {
          activityType: 'Lectura',
          priority: 'high',
          dailyGoal: isSevere ? 3 : isModerate ? 4 : 5,
          difficulty: isSevere ? 'easy' : isModerate ? 'medium' : 'hard',
          description: 'Mejora la velocidad de lectura y comprensión',
          benefits: ['Velocidad de lectura', 'Comprensión', 'Fluidez'],
          icon: '📖',
          color: '#4CAF50',
        },
        {
          activityType: 'Escritura',
          priority: 'high',
          dailyGoal: isSevere ? 2 : isModerate ? 3 : 3,
          difficulty: isSevere ? 'easy' : isModerate ? 'medium' : 'medium',
          description: 'Desarrolla la ortografía y la expresión escrita',
          benefits: ['Ortografía', 'Expresión escrita', 'Gramática'],
          icon: '✍️',
          color: '#FF9800',
        },
        {
          activityType: 'Memoria visual',
          priority: 'medium',
          dailyGoal: isSevere ? 1 : isModerate ? 2 : 2,
          difficulty: isSevere ? 'easy' : isModerate ? 'medium' : 'medium',
          description: 'Fortalece el procesamiento visual y la memoria',
          benefits: ['Procesamiento visual', 'Memoria', 'Reconocimiento'],
          icon: '🧠',
          color: '#2196F3',
        },
        {
          activityType: 'Atención',
          priority: 'low',
          dailyGoal: isSevere ? 1 : isModerate ? 1 : 1,
          difficulty: isSevere ? 'easy' : isModerate ? 'easy' : 'medium',
          description: 'Mejora la concentración durante la lectura',
          benefits: ['Concentración', 'Atención sostenida', 'Paciencia'],
          icon: '🎯',
          color: '#9C27B0',
        },
      ],
      weeklyGoals: {
        totalSessions: isSevere ? 35 : isModerate ? 42 : 49,
        totalTime: isSevere ? 245 : isModerate ? 315 : 385,
        targetStars: isSevere ? 105 : isModerate ? 126 : 147,
      },
      recommendations: [
        'Usa fuentes grandes y de fácil lectura',
        'Proporciona audio junto con el texto',
        'Permite más tiempo para completar las actividades',
        'Prioriza la comprensión sobre la velocidad',
        'Usa imágenes y elementos visuales para apoyar el texto',
      ],
    };
  }

  /**
   * Recomendaciones para Discalculia
   */
  private getDiscalculiaRecommendations(severity: string): PersonalizedRecommendations {
    const isSevere = severity === 'Severo';
    const isModerate = severity === 'Moderado';

    return {
      dailyGoals: {
        totalSessions: isSevere ? 4 : isModerate ? 5 : 6,
        totalTime: isSevere ? 30 : isModerate ? 40 : 50,
        targetStars: isSevere ? 12 : isModerate ? 15 : 18,
      },
      activityPriorities: [
        {
          activityType: 'Números',
          priority: 'high',
          dailyGoal: isSevere ? 3 : isModerate ? 4 : 5,
          difficulty: isSevere ? 'easy' : isModerate ? 'medium' : 'hard',
          description: 'Desarrolla el sentido numérico y el cálculo básico',
          benefits: ['Sentido numérico', 'Cálculo básico', 'Operaciones'],
          icon: '🔢',
          color: '#4CAF50',
        },
        {
          activityType: 'Memoria visual',
          priority: 'medium',
          dailyGoal: isSevere ? 1 : isModerate ? 2 : 2,
          difficulty: isSevere ? 'easy' : isModerate ? 'medium' : 'medium',
          description: 'Mejora la memoria de trabajo para operaciones',
          benefits: ['Memoria de trabajo', 'Procesamiento visual', 'Concentración'],
          icon: '🧠',
          color: '#2196F3',
        },
        {
          activityType: 'Atención',
          priority: 'medium',
          dailyGoal: isSevere ? 1 : isModerate ? 1 : 2,
          difficulty: isSevere ? 'easy' : isModerate ? 'medium' : 'medium',
          description: 'Desarrolla la concentración para problemas matemáticos',
          benefits: ['Concentración', 'Atención sostenida', 'Paciencia'],
          icon: '🎯',
          color: '#FF9800',
        },
      ],
      weeklyGoals: {
        totalSessions: isSevere ? 28 : isModerate ? 35 : 42,
        totalTime: isSevere ? 210 : isModerate ? 280 : 350,
        targetStars: isSevere ? 84 : isModerate ? 105 : 126,
      },
      recommendations: [
        'Usa manipulativos visuales para conceptos abstractos',
        'Proporciona más tiempo para resolver problemas',
        'Prioriza la comprensión conceptual sobre la memorización',
        'Usa ejemplos concretos y del mundo real',
        'Celebra pequeños logros para mantener la motivación',
      ],
    };
  }

  /**
   * Recomendaciones por defecto (sin perfil)
   */
  private getDefaultRecommendations(): PersonalizedRecommendations {
    return {
      dailyGoals: {
        totalSessions: 4,
        totalTime: 30,
        targetStars: 12,
      },
      activityPriorities: [
        {
          activityType: 'Memoria visual',
          priority: 'medium',
          dailyGoal: 2,
          difficulty: 'medium',
          description: 'Desarrolla la memoria y la concentración',
          benefits: ['Memoria', 'Concentración', 'Atención'],
          icon: '🧠',
          color: '#4CAF50',
        },
        {
          activityType: 'Atención',
          priority: 'medium',
          dailyGoal: 1,
          difficulty: 'medium',
          description: 'Mejora la atención y el control',
          benefits: ['Atención', 'Control', 'Paciencia'],
          icon: '🎯',
          color: '#FF9800',
        },
        {
          activityType: 'Lectura',
          priority: 'medium',
          dailyGoal: 1,
          difficulty: 'medium',
          description: 'Fomenta la comprensión lectora',
          benefits: ['Comprensión', 'Lenguaje', 'Comunicación'],
          icon: '📖',
          color: '#2196F3',
        },
      ],
      weeklyGoals: {
        totalSessions: 28,
        totalTime: 210,
        targetStars: 84,
      },
      recommendations: [
        'Mantén una rutina consistente de aprendizaje',
        'Celebra tus logros y progresos',
        'Tómate descansos regulares entre sesiones',
        'Disfruta del proceso de aprendizaje',
      ],
    };
  }

  /**
   * Obtiene el color de prioridad
   */
  getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return '#F44336'; // Rojo
      case 'medium':
        return '#FF9800'; // Naranja
      case 'low':
        return '#4CAF50'; // Verde
      default:
        return '#9E9E9E'; // Gris
    }
  }

  /**
   * Obtiene el ícono de prioridad
   */
  getPriorityIcon(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return '🔥';
      case 'medium':
        return '⭐';
      case 'low':
        return '💚';
      default:
        return '⚪';
    }
  }

  /**
   * Obtiene el texto de prioridad
   */
  getPriorityText(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
      case 'high':
        return 'Prioridad Alta';
      case 'medium':
        return 'Recomendado';
      case 'low':
        return 'Opcional';
      default:
        return 'Disponible';
    }
  }
}

export default new PersonalizationService();
