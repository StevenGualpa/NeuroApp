
export interface AdaptiveReinforcementConfig {
  inactivityTimeoutMs: number; // 8 seconds = 8000ms
  maxConsecutiveErrors: number; // 2 errors
  helpMessages: {
    [key: string]: string;
  };
}

export interface AdaptiveReinforcementState {
  consecutiveErrors: number;
  lastActionTime: number;
  isHelpActive: boolean;
  inactivityTimer: NodeJS.Timeout | null;
  blinkingTimer: NodeJS.Timeout | null;
  helpAlreadyShown: boolean;
}

export class AdaptiveReinforcementService {
  private static instance: AdaptiveReinforcementService;
  private config: AdaptiveReinforcementConfig;
  private state: AdaptiveReinforcementState;
  private onHelpTriggered?: (correctOptionIndex: number) => void;
  private onPlayHelpAudio?: (message: string, activityType: string) => void;
  private currentActivityType: string = 'default';

  private constructor() {
    this.config = {
      inactivityTimeoutMs: 8000, // 8 seconds
      maxConsecutiveErrors: 2,
      helpMessages: {
        'Selecciona la opción correcta': 'Piensa bien y elige la respuesta correcta',
        'Asocia elementos': 'Conecta los elementos que van juntos',
        'Ordena los pasos': 'Ordena los pasos en el orden correcto',
        'Arrastra y suelta': 'Arrastra cada elemento a su lugar correcto',
        'Memoria visual': 'Recuerda dónde están los pares iguales',
        'Reconocimiento de patrones': 'Observa el patrón y complétalo',
        'default': 'Tómate tu tiempo y piensa bien antes de responder'
      }
    };

    this.state = {
      consecutiveErrors: 0,
      lastActionTime: Date.now(),
      isHelpActive: false,
      inactivityTimer: null,
      blinkingTimer: null,
      helpAlreadyShown: false
    };

    // Cargar configuración desde AsyncStorage
    this.loadInactivityTimeoutFromStorage();
  }

  public static getInstance(): AdaptiveReinforcementService {
    if (!AdaptiveReinforcementService.instance) {
      AdaptiveReinforcementService.instance = new AdaptiveReinforcementService();
    }
    return AdaptiveReinforcementService.instance;
  }

  // Método para actualizar el tiempo de inactividad
  public setInactivityTimeout(timeoutMs: number) {
    this.config.inactivityTimeoutMs = Math.max(1000, Math.min(30000, timeoutMs)); // Entre 1 y 30 segundos
    console.log(`⏱️ [AdaptiveReinforcementService] Tiempo de inactividad actualizado: ${this.config.inactivityTimeoutMs}ms`);
  }

  // Método para obtener el tiempo de inactividad actual
  public getInactivityTimeout(): number {
    return this.config.inactivityTimeoutMs;
  }

  // Cargar configuración de tiempo de inactividad desde AsyncStorage
  private async loadInactivityTimeoutFromStorage() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const storedDelay = await AsyncStorage.getItem('@NeuroApp:help_delay_seconds');
      if (storedDelay) {
        const delaySeconds = parseInt(storedDelay);
        if (!isNaN(delaySeconds) && delaySeconds >= 1 && delaySeconds <= 30) {
          this.config.inactivityTimeoutMs = delaySeconds * 1000; // Convert to milliseconds
          console.log(`⏱️ [AdaptiveReinforcementService] Tiempo de inactividad cargado desde storage: ${delaySeconds}s`);
        }
      }
    } catch (error) {
      console.error('❌ [AdaptiveReinforcementService] Error cargando tiempo de inactividad desde storage:', error);
    }
  }

  public initialize(
    onHelpTriggered: (correctOptionIndex: number) => void,
    onPlayHelpAudio: (message: string, activityType: string) => void,
    activityType: string = 'default'
  ) {
    this.onHelpTriggered = onHelpTriggered;
    this.onPlayHelpAudio = onPlayHelpAudio;
    this.currentActivityType = activityType;
    this.resetState();
    this.startInactivityTimer();
  }

  public recordAction(isCorrect: boolean, correctOptionIndex?: number, activityType?: string) {
    this.state.lastActionTime = Date.now();
    this.clearTimers();

    // Update current activity type if provided
    if (activityType) {
      this.currentActivityType = activityType;
    }

    if (isCorrect) {
      // Reset everything when user gets it right
      this.state.consecutiveErrors = 0;
      this.state.isHelpActive = false;
      this.state.helpAlreadyShown = false; // Reset help flag on correct answer
      console.log(`🔊 AdaptiveService: Correct answer - resetting help state`);
    } else {
      // Reset help flag on each error to allow new help opportunities
      this.state.helpAlreadyShown = false;
      this.state.consecutiveErrors++;
      console.log(`🔊 AdaptiveService: Error recorded - resetting help flag. Consecutive errors: ${this.state.consecutiveErrors}`);
      
      // Check if we need to trigger help after 2 consecutive errors (and help hasn't been shown yet)
      if (this.state.consecutiveErrors >= this.config.maxConsecutiveErrors && 
          correctOptionIndex !== undefined && 
          !this.state.helpAlreadyShown) {
        console.log(`🔊 AdaptiveService: 2 consecutive errors - triggering help`);
        this.triggerHelp(correctOptionIndex, this.currentActivityType);
        return;
      }
    }

    // Only restart inactivity timer if help is not active and hasn't been shown yet
    if (!this.state.isHelpActive && !this.state.helpAlreadyShown) {
      this.startInactivityTimer();
    }
  }

  public recordInactivity() {
    this.state.lastActionTime = Date.now();
    this.clearTimers();
    
    // Don't restart timer if help is already active or has been shown
    if (!this.state.isHelpActive && !this.state.helpAlreadyShown) {
      this.startInactivityTimer();
    }
  }

  private startInactivityTimer() {
    this.clearInactivityTimer();
    console.log(`🔊 AdaptiveService: Starting inactivity timer for ${this.config.inactivityTimeoutMs}ms. Help already shown: ${this.state.helpAlreadyShown}`);
    
    this.state.inactivityTimer = setTimeout(() => {
      console.log(`🔊 AdaptiveService: Inactivity timer triggered! Help active: ${this.state.isHelpActive}, Help already shown: ${this.state.helpAlreadyShown}`);
      if (!this.state.isHelpActive && !this.state.helpAlreadyShown) {
        // Trigger help for inactivity - we'll let the component handle finding the correct option
        this.triggerInactivityHelp();
      } else {
        console.log(`🔊 AdaptiveService: Skipping inactivity help - already shown or active`);
      }
    }, this.config.inactivityTimeoutMs);
  }

  private triggerInactivityHelp() {
    // This will be called when user is inactive for 8 seconds
    console.log(`🔊 AdaptiveService: triggerInactivityHelp() called for activity: ${this.currentActivityType}`);
    this.state.isHelpActive = true;
    this.state.helpAlreadyShown = true; // Mark help as shown
    this.clearTimers();

    // Trigger visual help (component will handle finding correct option)
    if (this.onHelpTriggered) {
      console.log(`🔊 AdaptiveService: Triggering visual help (inactivity)`);
      this.onHelpTriggered(-1); // -1 indicates inactivity help
    }

    // Play audio help
    console.log(`🔊 AdaptiveService: About to play help audio for inactivity`);
    this.playHelpAudio(this.currentActivityType);

    // Auto-disable help after some time (but don't restart timer)
    setTimeout(() => {
      console.log(`🔊 AdaptiveService: Disabling help after 5 seconds - help will not repeat`);
      this.state.isHelpActive = false;
      // DON'T restart the timer - help should only show once per question
    }, 5000); // Help active for 5 seconds
  }

  private triggerHelp(correctOptionIndex: number, activityType: string = 'default') {
    console.log(`🔊 AdaptiveService: triggerHelp() called for ${activityType}`);
    this.state.isHelpActive = true;
    this.state.helpAlreadyShown = true; // Mark help as shown
    this.clearTimers();

    // Trigger visual help (blinking)
    if (this.onHelpTriggered) {
      this.onHelpTriggered(correctOptionIndex);
    }

    // Play audio help
    this.playHelpAudio(activityType);

    // Auto-disable help after some time (but don't restart timer)
    setTimeout(() => {
      console.log(`🔊 AdaptiveService: Disabling help after 5 seconds - help will not repeat`);
      this.state.isHelpActive = false;
      // DON'T restart the timer - help should only show once per question
    }, 5000); // Help active for 5 seconds
  }

  private async playHelpAudio(activityType: string = 'default') {
    try {
      const message = this.config.helpMessages[activityType] || this.config.helpMessages.default;
      console.log(`🔊 AdaptiveService: Triggering help audio for ${activityType}: ${message}`);
      
      if (this.onPlayHelpAudio) {
        console.log(`🔊 AdaptiveService: Calling onPlayHelpAudio callback`);
        this.onPlayHelpAudio(message, activityType);
      } else {
        console.error(`🔊 AdaptiveService: onPlayHelpAudio callback is not set!`);
      }

      // For now, we'll use a simple text-to-speech approach
      // In a real implementation, you might want to use pre-recorded audio files
      console.log(`🔊 AdaptiveService: Audio Help triggered: ${message}`);
      
    } catch (error) {
      console.error('🔊 AdaptiveService: Error playing help audio:', error);
    }
  }

  public startBlinking(callback: () => void) {
    this.clearBlinkingTimer();
    let isVisible = true;
    
    this.state.blinkingTimer = setInterval(() => {
      callback();
      isVisible = !isVisible;
    }, 500); // Blink every 500ms

    // Stop blinking after 5 seconds
    setTimeout(() => {
      this.clearBlinkingTimer();
    }, 5000);
  }

  private clearTimers() {
    this.clearInactivityTimer();
    this.clearBlinkingTimer();
  }

  private clearInactivityTimer() {
    if (this.state.inactivityTimer) {
      clearTimeout(this.state.inactivityTimer);
      this.state.inactivityTimer = null;
    }
  }

  private clearBlinkingTimer() {
    if (this.state.blinkingTimer) {
      clearInterval(this.state.blinkingTimer);
      this.state.blinkingTimer = null;
    }
  }

  public resetState() {
    this.clearTimers();
    this.state = {
      consecutiveErrors: 0,
      lastActionTime: Date.now(),
      isHelpActive: false,
      inactivityTimer: null,
      blinkingTimer: null,
      helpAlreadyShown: false
    };
  }

  public cleanup() {
    console.log(`🔊 AdaptiveService: Cleaning up - stopping all timers and resetting state`);
    this.clearTimers();
    this.resetState();
    // Also clear the callbacks to prevent any lingering references
    this.onHelpTriggered = undefined;
    this.onPlayHelpAudio = undefined;
  }

  // Getters for component to check state
  public get isHelpActive(): boolean {
    return this.state.isHelpActive;
  }

  public get consecutiveErrors(): number {
    return this.state.consecutiveErrors;
  }

  // Method to trigger help manually (for inactivity)
  public triggerHelpForInactivity(correctOptionIndex: number, activityType: string = 'default') {
    this.triggerHelp(correctOptionIndex, activityType);
  }
}

export default AdaptiveReinforcementService;