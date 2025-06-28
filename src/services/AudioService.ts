import Tts from 'react-native-tts';
import { ADAPTIVE_REINFORCEMENT_CONFIG } from '../constants';

export class AudioService {
  private static instance: AudioService;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * Initialize TTS service
   */
  private async initializeTts(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set default language to Spanish
      await Tts.setDefaultLanguage(ADAPTIVE_REINFORCEMENT_CONFIG.TTS_LANGUAGE);
      
      // Set speech rate (0.5 = slower, 1.0 = normal, 2.0 = faster)
      await Tts.setDefaultRate(ADAPTIVE_REINFORCEMENT_CONFIG.TTS_RATE);
      
      // Set pitch (0.5 = lower, 1.0 = normal, 2.0 = higher)
      await Tts.setDefaultPitch(1.0);

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing TTS:', error);
    }
  }

  /**
   * Play text-to-speech audio
   */
  public async playTextToSpeech(text: string, options?: { language?: string; rate?: number; pitch?: number }): Promise<void> {
    try {
      console.log(`🔊 AudioService: Starting TTS for text: "${text}"`);
      
      await this.initializeTts();
      console.log(`🔊 AudioService: TTS initialized`);
      
      // Stop any current speech
      await this.stopTextToSpeech();
      console.log(`🔊 AudioService: Previous speech stopped`);

      // Small delay to ensure TTS is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Set options if provided
      if (options?.language) {
        await Tts.setDefaultLanguage(options.language);
      }
      if (options?.rate) {
        await Tts.setDefaultRate(options.rate);
      }
      if (options?.pitch) {
        await Tts.setDefaultPitch(options.pitch);
      }

      // Speak the text
      console.log(`🔊 AudioService: About to speak: "${text}"`);
      Tts.speak(text);
      console.log(`🔊 AudioService: TTS.speak() called successfully`);
    } catch (error) {
      console.error('🔊 AudioService: Error playing text-to-speech:', error);
    }
  }

  /**
   * Stop current text-to-speech
   */
  public async stopTextToSpeech(): Promise<void> {
    try {
      Tts.stop();
    } catch (error) {
      console.error('Error stopping text-to-speech:', error);
    }
  }

  
  /**
   * Play help audio with predefined messages
   */
  public async playHelpMessage(activityType: string, customMessage?: string): Promise<void> {
    const helpMessages: { [key: string]: string } = {
      'Selecciona la opción correcta': 'Piensa bien y elige la respuesta correcta. Tómate tu tiempo.',
      'Asocia elementos': 'Conecta los elementos que van juntos. Observa bien cada opción.',
      'Ordena los pasos': 'Ordena los pasos en el orden correcto. Piensa en la secuencia lógica.',
      'Arrastra y suelta': 'Arrastra cada elemento a su lugar correcto. Fíjate bien en las zonas.',
      'Memoria visual': 'Recuerda dónde están los pares iguales. Usa tu memoria.',
      'Reconocimiento de patrones': 'Observa el patrón y complétalo. ¿Qué viene después?',
      'default': 'Tómate tu tiempo y piensa bien antes de responder. Tú puedes hacerlo.'
    };

    const message = customMessage || helpMessages[activityType] || helpMessages.default;
    await this.playTextToSpeech(message);
  }

  /**
   * Play encouragement message
   */
  public async playEncouragementMessage(): Promise<void> {
    const encouragementMessages = [
      '¡Muy bien! Sigue así.',
      '¡Excelente trabajo!',
      '¡Lo estás haciendo genial!',
      '¡Perfecto! Continúa.',
      '¡Increíble! Eres muy inteligente.',
      '¡Fantástico! Lo lograste.',
      '¡Bien hecho! Eres increíble.'
    ];

    const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
    
    // Add a small delay to ensure smooth audio playback
    setTimeout(async () => {
      await this.playTextToSpeech(randomMessage);
    }, 300);
  }

  /**
   * Play error guidance message
   */
  public async playErrorGuidanceMessage(): Promise<void> {
    const errorMessages = [
      'No te preocupes, inténtalo de nuevo.',
      'Está bien, todos cometemos errores. Sigue intentando.',
      'Piensa un poco más y vuelve a intentar.',
      'No pasa nada, tómate tu tiempo para pensar.',
      'Tranquilo, puedes hacerlo. Inténtalo otra vez.'
    ];

    const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    
    // Add a small delay before playing error message to avoid overlap
    setTimeout(async () => {
      await this.playTextToSpeech(randomMessage);
    }, 200);
  }

  /**
   * Check if text-to-speech is available
   */
  public async isTextToSpeechAvailable(): Promise<boolean> {
    try {
      await this.initializeTts();
      return true;
    } catch (error) {
      console.error('Error checking text-to-speech availability:', error);
      return false;
    }
  }

  /**
   * Get available voices
   */
  public async getAvailableVoices(): Promise<any[]> {
    try {
      await this.initializeTts();
      return await Tts.voices();
    } catch (error) {
      console.error('Error getting available voices:', error);
      return [];
    }
  }

  /**
   * Cleanup all audio resources
   */
  public async cleanup(): Promise<void> {
    await this.stopTextToSpeech();
  }
}

export default AudioService;