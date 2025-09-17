// src/services/AudioService.ts
import { Platform } from 'react-native';
import Tts from 'react-native-tts';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AudioConfig {
  volume: number;
  speed: number;
  language: string;
  enabled: boolean;
  voiceSpeed: 'slow' | 'normal' | 'fast';
  voiceHelpEnabled: boolean;
}

class AudioService {
  private static instance: AudioService;
  private config: AudioConfig = {
    volume: 0.8,
    speed: 1.0,
    language: 'es',
    enabled: true,
    voiceSpeed: 'normal',
    voiceHelpEnabled: true,
  };
  
  private isSpeaking = false;
  private isInitialized = false;

  private constructor() {
    this.initializeAudio();
    this.loadLanguageFromStorage();
    this.loadVoiceSpeedFromStorage();
    this.loadVolumeFromStorage();
    this.loadVoiceHelpFromStorage();
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

  private async loadLanguageFromStorage() {
    try {
      const storedLanguage = await AsyncStorage.getItem('@NeuroApp:language');
      if (storedLanguage && (storedLanguage === 'es' || storedLanguage === 'en')) {
        await this.setLanguage(storedLanguage);
        console.log(`🌍 [AudioService] Idioma cargado desde storage: ${storedLanguage}`);
      }
    } catch (error) {
      console.error('❌ [AudioService] Error cargando idioma desde storage:', error);
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

  // Método para sincronizar con el idioma de la aplicación
  async syncWithAppLanguage(language: 'es' | 'en') {
    if (this.config.language !== language) {
      await this.setLanguage(language);
      console.log(`🔄 [AudioService] Sincronizado con idioma de la app: ${language}`);
    }
  }

  // Métodos para velocidad de voz
  async setVoiceSpeed(speed: 'slow' | 'normal' | 'fast') {
    this.config.voiceSpeed = speed;
    
    // Convertir velocidad a valor numérico para TTS
    const speedValues = {
      'slow': 0.6,
      'normal': 1.0,
      'fast': 1.4,
    };
    
    const ttsSpeed = speedValues[speed];
    this.config.speed = ttsSpeed; // Actualizar el speed interno
    
    try {
      await Tts.setDefaultRate(ttsSpeed);
      console.log(`⚡ [AudioService] Velocidad de voz establecida: ${speed} (${ttsSpeed})`);
    } catch (error) {
      console.error('❌ [AudioService] Error estableciendo velocidad de voz:', error);
    }
  }

  async getVoiceSpeed(): Promise<'slow' | 'normal' | 'fast'> {
    return this.config.voiceSpeed;
  }

  async getVolume(): Promise<number> {
    return this.config.volume;
  }

  // Métodos para voz amiga
  async setVoiceHelpEnabled(enabled: boolean) {
    this.config.voiceHelpEnabled = enabled;
    console.log(`🗣️ [AudioService] Voz Amiga ${enabled ? 'habilitada' : 'deshabilitada'}`);
  }

  async getVoiceHelpEnabled(): Promise<boolean> {
    return this.config.voiceHelpEnabled;
  }

  // Método de prueba para verificar volumen y velocidad
  async testAudioSettings() {
    if (!this.config.enabled || this.isSpeaking || !this.isInitialized) {
      console.log('🔇 [AudioService] TTS deshabilitado, ya hablando, o no inicializado');
      return;
    }

    try {
      const testMessage = this.config.language === 'es' 
        ? `Prueba de audio. Volumen: ${Math.round(this.config.volume * 100)}%. Velocidad: ${this.config.voiceSpeed}.`
        : `Audio test. Volume: ${Math.round(this.config.volume * 100)}%. Speed: ${this.config.voiceSpeed}.`;
      
      console.log(`🧪 [AudioService] Probando configuración de audio: ${testMessage}`);
      await this.playTextToSpeech(testMessage);
    } catch (error) {
      console.error('❌ [AudioService] Error en prueba de audio:', error);
    }
  }

  // Cargar configuración de velocidad desde storage
  private async loadVoiceSpeedFromStorage() {
    try {
      const storedSpeed = await AsyncStorage.getItem('@NeuroApp:voice_speed');
      if (storedSpeed && ['slow', 'normal', 'fast'].includes(storedSpeed)) {
        await this.setVoiceSpeed(storedSpeed as 'slow' | 'normal' | 'fast');
        console.log(`🌍 [AudioService] Velocidad de voz cargada desde storage: ${storedSpeed}`);
      }
    } catch (error) {
      console.error('❌ [AudioService] Error cargando velocidad de voz desde storage:', error);
    }
  }

  // Cargar configuración de volumen desde storage
  private async loadVolumeFromStorage() {
    try {
      const storedVolume = await AsyncStorage.getItem('@NeuroApp:audio_volume');
      if (storedVolume) {
        const volume = parseFloat(storedVolume);
        if (!isNaN(volume) && volume >= 0 && volume <= 1) {
          await this.setVolume(volume);
          console.log(`🔊 [AudioService] Volumen cargado desde storage: ${volume}`);
        }
      }
    } catch (error) {
      console.error('❌ [AudioService] Error cargando volumen desde storage:', error);
    }
  }

  // Cargar configuración de voz amiga desde storage
  private async loadVoiceHelpFromStorage() {
    try {
      const storedVoiceHelp = await AsyncStorage.getItem('@NeuroApp:voice_help_enabled');
      if (storedVoiceHelp && (storedVoiceHelp === 'true' || storedVoiceHelp === 'false')) {
        const voiceHelpEnabled = storedVoiceHelp === 'true';
        await this.setVoiceHelpEnabled(voiceHelpEnabled);
        console.log(`🗣️ [AudioService] Voz Amiga cargada desde storage: ${voiceHelpEnabled}`);
      }
    } catch (error) {
      console.error('❌ [AudioService] Error cargando Voz Amiga desde storage:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    console.log(`🔧 [AudioService] Audio ${enabled ? 'habilitado' : 'deshabilitado'}`);
  }

  // Text-to-Speech methods
  async playTextToSpeech(text: string, isHelpMessage: boolean = false) {
    if (!this.config.enabled || this.isSpeaking || !this.isInitialized) {
      console.log('🔇 [AudioService] TTS deshabilitado, ya hablando, o no inicializado');
      return;
    }

    // Si es un mensaje de ayuda y la voz amiga está deshabilitada, no reproducir
    if (isHelpMessage && !this.config.voiceHelpEnabled) {
      console.log('🔇 [AudioService] Voz Amiga deshabilitada, no reproduciendo mensaje de ayuda');
      return;
    }

    try {
      console.log(`🗣️ [AudioService] Reproduciendo TTS: "${text}" con volumen: ${this.config.volume}`);
      
      // Usar opciones de speak para aplicar volumen y velocidad
      const options = {
        androidParams: {
          KEY_PARAM_PAN: 0,
          KEY_PARAM_VOLUME: this.config.volume,
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
        },
        iosParams: {
          rate: this.config.speed,
          volume: this.config.volume,
        },
      };
      
      await Tts.speak(text, options);
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