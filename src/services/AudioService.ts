// src/services/AudioService.ts
import { Platform } from 'react-native';
import Tts from 'react-native-tts';

interface AudioConfig {
  volume: number;
  speed: number;
  language: string;
  enabled: boolean;
}

class AudioService {
  private static instance: AudioService;
  private config: AudioConfig = {
    volume: 0.8,
    speed: 1.0,
    language: 'es',
    enabled: true,
  };
  
  private isSpeaking = false;
  private isInitialized = false;

  private constructor() {
    this.initializeAudio();
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private async initializeAudio() {
    try {
      // Initialize TTS
      await this.initializeTTS();
      this.isInitialized = true;
      console.log('✅ [AudioService] Audio inicializado');
    } catch (error) {
      console.error('❌ [AudioService] Error inicializando audio:', error);
    }
  }

  private async initializeTTS() {
    try {
      // Set default language
      await Tts.setDefaultLanguage(this.config.language === 'es' ? 'es-ES' : 'en-US');
      
      // Set default rate
      await Tts.setDefaultRate(this.config.speed);
      
      // Set default pitch
      await Tts.setDefaultPitch(1.0);
      
      // Add event listeners
      Tts.addEventListener('tts-start', () => {
        this.isSpeaking = true;
        console.log('🗣️ [AudioService] TTS iniciado');
      });
      
      Tts.addEventListener('tts-finish', () => {
        this.isSpeaking = false;
        console.log('✅ [AudioService] TTS completado');
      });
      
      Tts.addEventListener('tts-cancel', () => {
        this.isSpeaking = false;
        console.log('⏹️ [AudioService] TTS cancelado');
      });
      
      console.log('✅ [AudioService] TTS inicializado correctamente');
    } catch (error) {
      console.error('❌ [AudioService] Error inicializando TTS:', error);
    }
  }

  // Configuration methods
  async setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 [AudioService] Volumen establecido: ${this.config.volume}`);
  }

  async setSpeed(speed: number) {
    this.config.speed = Math.max(0.5, Math.min(2.0, speed));
    try {
      await Tts.setDefaultRate(this.config.speed);
      console.log(`⚡ [AudioService] Velocidad establecida: ${this.config.speed}`);
    } catch (error) {
      console.error('❌ [AudioService] Error estableciendo velocidad:', error);
    }
  }

  async setLanguage(language: string) {
    this.config.language = language;
    try {
      const ttsLanguage = language === 'es' ? 'es-ES' : 'en-US';
      await Tts.setDefaultLanguage(ttsLanguage);
      console.log(`🌍 [AudioService] Idioma establecido: ${this.config.language}`);
    } catch (error) {
      console.error('❌ [AudioService] Error estableciendo idioma:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    console.log(`🔧 [AudioService] Audio ${enabled ? 'habilitado' : 'deshabilitado'}`);
  }

  // Text-to-Speech methods
  async playTextToSpeech(text: string) {
    if (!this.config.enabled || this.isSpeaking || !this.isInitialized) {
      console.log('🔇 [AudioService] TTS deshabilitado, ya hablando, o no inicializado');
      return;
    }

    try {
      console.log(`🗣️ [AudioService] Reproduciendo TTS: "${text}"`);
      await Tts.speak(text);
    } catch (error) {
      console.error('❌ [AudioService] Error en TTS:', error);
    }
  }

  async stopSpeech() {
    if (this.isSpeaking) {
      try {
        await Tts.stop();
        this.isSpeaking = false;
        console.log('⏹️ [AudioService] TTS detenido');
      } catch (error) {
        console.error('❌ [AudioService] Error deteniendo TTS:', error);
      }
    }
  }

  // Predefined messages for common scenarios
  async playWelcomeMessage() {
    const messages = {
      es: '¡Hola! Bienvenido a NeuroApp. Vamos a aprender juntos.',
      en: 'Hello! Welcome to NeuroApp. Let\'s learn together.',
    };
    await this.playTextToSpeech(messages[this.config.language as keyof typeof messages] || messages.es);
  }

  async playEncouragementMessage() {
    const messages = {
      es: [
        '¡Muy bien! Lo estás haciendo genial.',
        '¡Excelente trabajo! Sigue así.',
        '¡Fantástico! Eres increíble.',
        '¡Perfecto! Lo lograste.',
      ],
      en: [
        'Great job! You\'re doing amazing.',
        'Excellent work! Keep it up.',
        'Fantastic! You\'re incredible.',
        'Perfect! You did it.',
      ],
    };
    
    const messageList = messages[this.config.language as keyof typeof messages] || messages.es;
    const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];
    await this.playTextToSpeech(randomMessage);
  }

  async playErrorGuidanceMessage() {
    const messages = {
      es: [
        'No te preocupes, inténtalo de nuevo.',
        'Está bien, todos cometemos errores. Vuelve a intentar.',
        'Piensa un poco más y vuelve a probar.',
        'No pasa nada, puedes hacerlo mejor.',
      ],
      en: [
        'Don\'t worry, try again.',
        'It\'s okay, everyone makes mistakes. Try again.',
        'Think a little more and try again.',
        'It\'s fine, you can do better.',
      ],
    };
    
    const messageList = messages[this.config.language as keyof typeof messages] || messages.es;
    const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];
    await this.playTextToSpeech(randomMessage);
  }

  async playHelpMessage(customMessage?: string) {
    if (customMessage) {
      await this.playTextToSpeech(customMessage);
      return;
    }

    const messages = {
      es: [
        'Te voy a ayudar. Observa bien las opciones.',
        'Aquí tienes una pista. Fíjate en los detalles.',
        'Déjame darte una ayuda. Mira con atención.',
      ],
      en: [
        'I\'ll help you. Look carefully at the options.',
        'Here\'s a hint. Pay attention to the details.',
        'Let me give you some help. Look carefully.',
      ],
    };
    
    const messageList = messages[this.config.language as keyof typeof messages] || messages.es;
    const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];
    await this.playTextToSpeech(randomMessage);
  }

  async playCompletionMessage() {
    const messages = {
      es: [
        '¡Felicitaciones! Completaste la actividad.',
        '¡Increíble! Terminaste con éxito.',
        '¡Bravo! Lo lograste completar.',
      ],
      en: [
        'Congratulations! You completed the activity.',
        'Amazing! You finished successfully.',
        'Bravo! You managed to complete it.',
      ],
    };
    
    const messageList = messages[this.config.language as keyof typeof messages] || messages.es;
    const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];
    await this.playTextToSpeech(randomMessage);
  }

  // Sound effects methods (placeholders for React Native CLI)
  async playButtonSound() {
    console.log('🔊 [AudioService] Sonido de botón (placeholder)');
    // You can implement actual sound effects using react-native-sound
  }

  async playSuccessSound() {
    console.log('🔊 [AudioService] Sonido de éxito (placeholder)');
  }

  async playErrorSound() {
    console.log('🔊 [AudioService] Sonido de error (placeholder)');
  }

  async playCompletionSound() {
    console.log('🔊 [AudioService] Sonido de completado (placeholder)');
  }

  // Activity-specific guidance
  async playActivityGuidance(activityType: string, customMessage?: string) {
    if (customMessage) {
      await this.playTextToSpeech(customMessage);
      return;
    }

    const guidance = {
      es: {
        'memory': 'Encuentra las parejas de cartas iguales. Toca una carta para voltearla.',
        'selection': 'Lee la pregunta y selecciona la respuesta correcta.',
        'drag_drop': 'Arrastra cada elemento a su lugar correcto.',
        'match': 'Conecta los elementos que van juntos.',
        'order': 'Ordena los pasos en la secuencia correcta.',
        'pattern': 'Observa el patrón y completa la secuencia.',
      },
      en: {
        'memory': 'Find the matching pairs of cards. Tap a card to flip it.',
        'selection': 'Read the question and select the correct answer.',
        'drag_drop': 'Drag each element to its correct place.',
        'match': 'Connect the elements that go together.',
        'order': 'Order the steps in the correct sequence.',
        'pattern': 'Observe the pattern and complete the sequence.',
      },
    };

    const messages = guidance[this.config.language as keyof typeof guidance] || guidance.es;
    const message = messages[activityType as keyof typeof messages] || messages['selection'];
    await this.playTextToSpeech(message);
  }

  // Get available voices
  async getAvailableVoices() {
    try {
      const voices = await Tts.voices();
      console.log('🎤 [AudioService] Voces disponibles:', voices);
      return voices;
    } catch (error) {
      console.error('❌ [AudioService] Error obteniendo voces:', error);
      return [];
    }
  }

  // Cleanup
  async cleanup() {
    try {
      await this.stopSpeech();
      
      // Remove event listeners
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
      
      console.log('🧹 [AudioService] Limpieza completada');
    } catch (error) {
      console.error('❌ [AudioService] Error en limpieza:', error);
    }
  }

  // Status methods
  isTTSEnabled(): boolean {
    return this.config.enabled && this.isInitialized;
  }

  getCurrentConfig(): AudioConfig {
    return { ...this.config };
  }

  isSpeechActive(): boolean {
    return this.isSpeaking;
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }
}

export default AudioService;