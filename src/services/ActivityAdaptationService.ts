// src/services/ActivityAdaptationService.ts
// Servicio para adaptar actividades según el perfil neurodivergente

import { NeurodivergentProfile } from './AnalysisService';

export interface ActivityAdaptation {
  timeMultiplier: number; // Multiplicador de tiempo (1.0 = normal, 1.5 = 50% más tiempo)
  difficultyAdjustment: number; // Ajuste de dificultad (-1 = más fácil, 0 = normal, 1 = más difícil)
  visualAids: {
    largerText: boolean;
    highContrast: boolean;
    simplifiedUI: boolean;
    colorBlindFriendly: boolean;
  };
  audioAids: {
    readAloud: boolean;
    slowerSpeech: boolean;
    repeatInstructions: boolean;
    soundEffects: boolean;
  };
  interactionAids: {
    largerButtons: boolean;
    moreSpacing: boolean;
    simplifiedControls: boolean;
    hapticFeedback: boolean;
  };
  cognitiveAids: {
    stepByStep: boolean;
    visualCues: boolean;
    progressIndicators: boolean;
    breakReminders: boolean;
  };
  sessionSettings: {
    maxDuration: number; // en minutos
    breakInterval: number; // en minutos
    maxAttempts: number;
    helpFrequency: number; // en segundos
  };
  rewards: {
    moreStars: boolean;
    frequentPraise: boolean;
    achievementThresholds: number[]; // Umbrales más bajos para logros
  };
}

class ActivityAdaptationService {
  /**
   * Obtiene las adaptaciones necesarias basadas en el perfil neurodivergente
   */
  getActivityAdaptation(profile: NeurodivergentProfile | null): ActivityAdaptation {
    if (!profile) {
      return this.getDefaultAdaptation();
    }

    const diagnosis = profile.primary_diagnosis;
    const severity = profile.severity;

    switch (diagnosis) {
      case 'TDAH':
        return this.getTDAHAdaptation(severity);
      case 'TEA':
        return this.getTEAAdaptation(severity);
      case 'Dislexia':
        return this.getDislexiaAdaptation(severity);
      case 'Discalculia':
        return this.getDiscalculiaAdaptation(severity);
      default:
        return this.getDefaultAdaptation();
    }
  }

  /**
   * Adaptaciones para TDAH
   */
  private getTDAHAdaptation(severity: string): ActivityAdaptation {
    const isSevere = severity === 'Severo';
    const isModerate = severity === 'Moderado';

    return {
      timeMultiplier: isSevere ? 1.8 : isModerate ? 1.5 : 1.2,
      difficultyAdjustment: isSevere ? -1 : isModerate ? -1 : 0,
      visualAids: {
        largerText: true,
        highContrast: isSevere,
        simplifiedUI: isSevere,
        colorBlindFriendly: false,
      },
      audioAids: {
        readAloud: true,
        slowerSpeech: isSevere,
        repeatInstructions: true,
        soundEffects: true,
      },
      interactionAids: {
        largerButtons: true,
        moreSpacing: true,
        simplifiedControls: isSevere,
        hapticFeedback: true,
      },
      cognitiveAids: {
        stepByStep: true,
        visualCues: true,
        progressIndicators: true,
        breakReminders: true,
      },
      sessionSettings: {
        maxDuration: isSevere ? 5 : isModerate ? 8 : 10,
        breakInterval: isSevere ? 2 : isModerate ? 3 : 5,
        maxAttempts: isSevere ? 5 : isModerate ? 4 : 3,
        helpFrequency: isSevere ? 15 : isModerate ? 20 : 30,
      },
      rewards: {
        moreStars: true,
        frequentPraise: true,
        achievementThresholds: isSevere ? [0.6, 0.7, 0.8] : isModerate ? [0.7, 0.8, 0.9] : [0.8, 0.9, 1.0],
      },
    };
  }

  /**
   * Adaptaciones para TEA
   */
  private getTEAAdaptation(severity: string): ActivityAdaptation {
    const isSevere = severity === 'Severo';
    const isModerate = severity === 'Moderado';

    return {
      timeMultiplier: isSevere ? 2.0 : isModerate ? 1.5 : 1.2,
      difficultyAdjustment: isSevere ? -1 : isModerate ? -1 : 0,
      visualAids: {
        largerText: isSevere,
        highContrast: false,
        simplifiedUI: true,
        colorBlindFriendly: true,
      },
      audioAids: {
        readAloud: isSevere,
        slowerSpeech: isSevere,
        repeatInstructions: true,
        soundEffects: false, // Puede ser abrumador
      },
      interactionAids: {
        largerButtons: isSevere,
        moreSpacing: true,
        simplifiedControls: true,
        hapticFeedback: false, // Puede ser molesto
      },
      cognitiveAids: {
        stepByStep: true,
        visualCues: true,
        progressIndicators: true,
        breakReminders: false, // Puede interrumpir el flujo
      },
      sessionSettings: {
        maxDuration: isSevere ? 6 : isModerate ? 10 : 12,
        breakInterval: isSevere ? 3 : isModerate ? 5 : 7,
        maxAttempts: isSevere ? 6 : isModerate ? 5 : 4,
        helpFrequency: isSevere ? 25 : isModerate ? 35 : 45,
      },
      rewards: {
        moreStars: isSevere,
        frequentPraise: false, // Puede ser abrumador
        achievementThresholds: isSevere ? [0.5, 0.6, 0.7] : isModerate ? [0.6, 0.7, 0.8] : [0.7, 0.8, 0.9],
      },
    };
  }

  /**
   * Adaptaciones para Dislexia
   */
  private getDislexiaAdaptation(severity: string): ActivityAdaptation {
    const isSevere = severity === 'Severo';
    const isModerate = severity === 'Moderado';

    return {
      timeMultiplier: isSevere ? 2.5 : isModerate ? 2.0 : 1.5,
      difficultyAdjustment: isSevere ? -1 : isModerate ? -1 : 0,
      visualAids: {
        largerText: true,
        highContrast: true,
        simplifiedUI: isSevere,
        colorBlindFriendly: false,
      },
      audioAids: {
        readAloud: true,
        slowerSpeech: true,
        repeatInstructions: true,
        soundEffects: true,
      },
      interactionAids: {
        largerButtons: true,
        moreSpacing: true,
        simplifiedControls: isSevere,
        hapticFeedback: true,
      },
      cognitiveAids: {
        stepByStep: true,
        visualCues: true,
        progressIndicators: true,
        breakReminders: true,
      },
      sessionSettings: {
        maxDuration: isSevere ? 8 : isModerate ? 12 : 15,
        breakInterval: isSevere ? 3 : isModerate ? 4 : 5,
        maxAttempts: isSevere ? 6 : isModerate ? 5 : 4,
        helpFrequency: isSevere ? 20 : isModerate ? 30 : 40,
      },
      rewards: {
        moreStars: true,
        frequentPraise: true,
        achievementThresholds: isSevere ? [0.5, 0.6, 0.7] : isModerate ? [0.6, 0.7, 0.8] : [0.7, 0.8, 0.9],
      },
    };
  }

  /**
   * Adaptaciones para Discalculia
   */
  private getDiscalculiaAdaptation(severity: string): ActivityAdaptation {
    const isSevere = severity === 'Severo';
    const isModerate = severity === 'Moderado';

    return {
      timeMultiplier: isSevere ? 2.0 : isModerate ? 1.5 : 1.2,
      difficultyAdjustment: isSevere ? -1 : isModerate ? -1 : 0,
      visualAids: {
        largerText: true,
        highContrast: true,
        simplifiedUI: true,
        colorBlindFriendly: false,
      },
      audioAids: {
        readAloud: true,
        slowerSpeech: true,
        repeatInstructions: true,
        soundEffects: true,
      },
      interactionAids: {
        largerButtons: true,
        moreSpacing: true,
        simplifiedControls: isSevere,
        hapticFeedback: true,
      },
      cognitiveAids: {
        stepByStep: true,
        visualCues: true,
        progressIndicators: true,
        breakReminders: true,
      },
      sessionSettings: {
        maxDuration: isSevere ? 6 : isModerate ? 10 : 12,
        breakInterval: isSevere ? 2 : isModerate ? 3 : 4,
        maxAttempts: isSevere ? 6 : isModerate ? 5 : 4,
        helpFrequency: isSevere ? 15 : isModerate ? 25 : 35,
      },
      rewards: {
        moreStars: true,
        frequentPraise: true,
        achievementThresholds: isSevere ? [0.5, 0.6, 0.7] : isModerate ? [0.6, 0.7, 0.8] : [0.7, 0.8, 0.9],
      },
    };
  }

  /**
   * Adaptaciones por defecto (sin perfil)
   */
  private getDefaultAdaptation(): ActivityAdaptation {
    return {
      timeMultiplier: 1.0,
      difficultyAdjustment: 0,
      visualAids: {
        largerText: false,
        highContrast: false,
        simplifiedUI: false,
        colorBlindFriendly: false,
      },
      audioAids: {
        readAloud: false,
        slowerSpeech: false,
        repeatInstructions: false,
        soundEffects: true,
      },
      interactionAids: {
        largerButtons: false,
        moreSpacing: false,
        simplifiedControls: false,
        hapticFeedback: true,
      },
      cognitiveAids: {
        stepByStep: false,
        visualCues: false,
        progressIndicators: true,
        breakReminders: false,
      },
      sessionSettings: {
        maxDuration: 10,
        breakInterval: 5,
        maxAttempts: 3,
        helpFrequency: 30,
      },
      rewards: {
        moreStars: false,
        frequentPraise: false,
        achievementThresholds: [0.8, 0.9, 1.0],
      },
    };
  }

  /**
   * Aplica las adaptaciones a un tiempo dado
   */
  applyTimeAdaptation(originalTime: number, adaptation: ActivityAdaptation): number {
    return Math.round(originalTime * adaptation.timeMultiplier);
  }

  /**
   * Aplica las adaptaciones a una dificultad dada
   */
  applyDifficultyAdaptation(originalDifficulty: number, adaptation: ActivityAdaptation): number {
    return Math.max(1, Math.min(5, originalDifficulty + adaptation.difficultyAdjustment));
  }

  /**
   * Obtiene el estilo de texto adaptado
   */
  getTextStyle(adaptation: ActivityAdaptation): any {
    return {
      fontSize: adaptation.visualAids.largerText ? 18 : 16,
      fontWeight: adaptation.visualAids.highContrast ? 'bold' : 'normal',
      color: adaptation.visualAids.highContrast ? '#000000' : '#333333',
    };
  }

  /**
   * Obtiene el estilo de botón adaptado
   */
  getButtonStyle(adaptation: ActivityAdaptation): any {
    return {
      minHeight: adaptation.interactionAids.largerButtons ? 50 : 40,
      minWidth: adaptation.interactionAids.largerButtons ? 120 : 100,
      marginVertical: adaptation.interactionAids.moreSpacing ? 8 : 4,
      marginHorizontal: adaptation.interactionAids.moreSpacing ? 8 : 4,
    };
  }

  /**
   * Obtiene el estilo de contenedor adaptado
   */
  getContainerStyle(adaptation: ActivityAdaptation): any {
    return {
      padding: adaptation.interactionAids.moreSpacing ? 20 : 16,
      gap: adaptation.interactionAids.moreSpacing ? 16 : 12,
    };
  }

  /**
   * Verifica si se debe mostrar una ayuda específica
   */
  shouldShowHelp(helpType: keyof ActivityAdaptation['cognitiveAids'], adaptation: ActivityAdaptation): boolean {
    return adaptation.cognitiveAids[helpType];
  }

  /**
   * Obtiene la frecuencia de ayuda en segundos
   */
  getHelpFrequency(adaptation: ActivityAdaptation): number {
    return adaptation.sessionSettings.helpFrequency;
  }

  /**
   * Obtiene la duración máxima de sesión en minutos
   */
  getMaxSessionDuration(adaptation: ActivityAdaptation): number {
    return adaptation.sessionSettings.maxDuration;
  }

  /**
   * Obtiene el intervalo de descanso en minutos
   */
  getBreakInterval(adaptation: ActivityAdaptation): number {
    return adaptation.sessionSettings.breakInterval;
  }

  /**
   * Obtiene el número máximo de intentos
   */
  getMaxAttempts(adaptation: ActivityAdaptation): number {
    return adaptation.sessionSettings.maxAttempts;
  }

  /**
   * Verifica si se debe dar más estrellas
   */
  shouldGiveMoreStars(adaptation: ActivityAdaptation): boolean {
    return adaptation.rewards.moreStars;
  }

  /**
   * Obtiene los umbrales de logros adaptados
   */
  getAchievementThresholds(adaptation: ActivityAdaptation): number[] {
    return adaptation.rewards.achievementThresholds;
  }
}

export default new ActivityAdaptationService();
