// src/i18n/index.ts
// Sistema de internacionalización simple para NeuroApp

export type Language = 'es' | 'en';

export interface Translations {
  // Common
  common: {
    back: string;
    save: string;
    cancel: string;
    loading: string;
    error: string;
    retry: string;
    yes: string;
    no: string;
    continue: string;
    finish: string;
    next: string;
    previous: string;
    close: string;
    ok: string;
  };

  // Navigation
  navigation: {
    home: string;
    activities: string;
    achievements: string;
    statistics: string;
    settings: string;
    credits: string;
  };

  // Main Screen
  mainScreen: {
    title: string;
    subtitle: string;
    welcome: string;
  };

  // Settings Screen
  settings: {
    title: string;
    categories: {
      all: string;
      audio: string;
      gameplay: string;
      progress: string;
      appearance: string;
      language: string;
      accessibility: string;
      parental: string;
    };
    
    // Audio Settings
    audio: {
      soundEffects: {
        title: string;
        description: string;
      };
      voiceHelp: {
        title: string;
        description: string;
      };
      voiceSpeed: {
        title: string;
        description: string;
        options: {
          slow: string;
          normal: string;
          fast: string;
        };
      };
      volume: {
        title: string;
        description: string;
      };
    };

    // Gameplay Settings
    gameplay: {
      helpDelay: {
        title: string;
        description: string;
      };
      maxAttempts: {
        title: string;
        description: string;
      };
      autoAdvance: {
        title: string;
        description: string;
      };
      celebrations: {
        title: string;
        description: string;
      };
      hintButton: {
        title: string;
        description: string;
      };
    };

    // Progress Settings
    progress: {
      dailyGoal: {
        title: string;
        description: string;
      };
      progressBar: {
        title: string;
        description: string;
      };
      starsCount: {
        title: string;
        description: string;
      };
      notifications: {
        title: string;
        description: string;
      };
    };

    // Appearance Settings
    appearance: {
      theme: {
        title: string;
        description: string;
        options: {
          light: string;
          dark: string;
        };
      };
      colorScheme: {
        title: string;
        description: string;
        options: {
          default: string;
          blue: string;
          green: string;
          purple: string;
        };
      };
      backgroundPatterns: {
        title: string;
        description: string;
      };
    };

    // Language Settings
    language: {
      appLanguage: {
        title: string;
        description: string;
      };
      voiceLanguage: {
        title: string;
        description: string;
      };
      options: {
        spanish: string;
        english: string;
      };
    };

    // Accessibility Settings
    accessibility: {
      fontSize: {
        title: string;
        description: string;
        options: {
          small: string;
          medium: string;
          large: string;
        };
      };
      highContrast: {
        title: string;
        description: string;
      };
      animationSpeed: {
        title: string;
        description: string;
        options: {
          slow: string;
          normal: string;
          fast: string;
        };
      };
      buttonSize: {
        title: string;
        description: string;
        options: {
          small: string;
          medium: string;
          large: string;
        };
      };
    };

    // Parental Settings
    parental: {
      parentalMode: {
        title: string;
        description: string;
      };
      timeLimit: {
        title: string;
        description: string;
      };
      breakReminder: {
        title: string;
        description: string;
      };
      breakInterval: {
        title: string;
        description: string;
      };
    };

    // Messages
    messages: {
      saving: string;
      saved: string;
      error: string;
      loadingSettings: string;
      noSettings: string;
      tryOtherCategory: string;
    };
  };

  // Activities
  activities: {
    title: string;
    loadingFromAPI: string;
    noActivities: string;
    active: string;
    inactive: string;
  };

  // Categories
  categories: {
    title: string;
    allCategories: string;
    noCategories: string;
  };

  // Lessons
  lessons: {
    title: string;
    available: string;
    noLessons: string;
    start: string;
    notAvailable: string;
    completed: string;
  };

  // Games
  games: {
    memoryGame: string;
    dragDrop: string;
    match: string;
    selectOption: string;
    orderSteps: string;
    patternRecognition: string;
    
    // Common game elements
    question: string;
    options: string;
    correct: string;
    incorrect: string;
    tryAgain: string;
    wellDone: string;
    excellent: string;
    keepGoing: string;
    almostThere: string;
    completed: string;
    nextLevel: string;
    
    // Instructions
    instructions: {
      memoryGame: string;
      dragDrop: string;
      match: string;
      selectOption: string;
      orderSteps: string;
      patternRecognition: string;
    };

    // Activity types
    activityTypes: {
      selectOption: string;
      orderSteps: string;
      dragDrop: string;
      match: string;
      memoryGame: string;
      patternRecognition: string;
    };

    // Activity messages
    messages: {
      perfectMemory: string;
      excellentMemory: string;
      memoryExceptional: string;
      progressSaved: string;
      saving: string;
      saved: string;
    };
  };

  // Achievements
  achievements: {
    title: string;
    unlocked: string;
    locked: string;
    progress: string;
    noAchievements: string;
    congratulations: string;
  };

  // Statistics
  statistics: {
    title: string;
    totalTime: string;
    sessionsCompleted: string;
    averageScore: string;
    bestStreak: string;
    noData: string;
  };

  // Login
  login: {
    title: string;
    welcome: string;
    subtitle: string;
    email: string;
    password: string;
    login: string;
    register: string;
    forgotPassword: string;
    loginMode: string;
    registerMode: string;
    firstName: string;
    lastName: string;
    confirmPassword: string;
  };

  // Onboarding
  onboarding: {
    welcome: string;
    features: string;
    ready: string;
    getStarted: string;
    skip: string;
  };

  // Errors
  errors: {
    connectionError: string;
    loadingError: string;
    savingError: string;
    tryAgain: string;
    somethingWrong: string;
  };
}

// Spanish translations
export const es: Translations = {
  common: {
    back: 'Volver',
    save: 'Guardar',
    cancel: 'Cancelar',
    loading: 'Cargando...',
    error: 'Error',
    retry: 'Reintentar',
    yes: 'SÍ',
    no: 'NO',
    continue: 'Continuar',
    finish: 'Terminar',
    next: 'Siguiente',
    previous: 'Anterior',
    close: 'Cerrar',
    ok: 'OK',
  },

  navigation: {
    home: 'Inicio',
    activities: 'Actividades',
    achievements: 'Logros',
    statistics: 'Estadísticas',
    settings: 'Configuraciones',
    credits: 'Créditos',
  },

  mainScreen: {
    title: 'NeuroApp',
    subtitle: '¿Qué quieres hacer hoy?',
    welcome: 'Bienvenido',
  },

  settings: {
    title: 'Mis Configuraciones',
    categories: {
      all: 'Todas',
      audio: 'Sonidos',
      gameplay: 'Juegos',
      progress: 'Progreso',
      appearance: 'Pantalla',
      language: 'Idioma',
      accessibility: 'Ayuda',
      parental: 'Papás',
    },

    audio: {
      soundEffects: {
        title: 'Sonidos Divertidos',
        description: 'Escuchar sonidos cuando tocas',
      },
      voiceHelp: {
        title: 'Voz Amiga',
        description: 'Una voz te ayuda a jugar',
      },
      voiceSpeed: {
        title: 'Velocidad de Voz',
        description: 'Qué tan rápido habla',
        options: {
          slow: 'Lento',
          normal: 'Normal',
          fast: 'Rápido',
        },
      },
      volume: {
        title: 'Volumen',
        description: 'Qué tan fuerte suena',
      },
    },

    gameplay: {
      helpDelay: {
        title: 'Tiempo de Ayuda',
        description: 'Cuánto esperar antes de ayudar',
      },
      maxAttempts: {
        title: 'Intentos',
        description: 'Cuántas veces puedes intentar',
      },
      autoAdvance: {
        title: 'Continuar Solo',
        description: 'Pasar al siguiente solo',
      },
      celebrations: {
        title: 'Celebraciones',
        description: 'Animaciones cuando ganas',
      },
      hintButton: {
        title: 'Botón de Pista',
        description: 'Botón para pedir ayuda',
      },
    },

    progress: {
      dailyGoal: {
        title: 'Meta del Día',
        description: 'Cuánto jugar cada día',
      },
      progressBar: {
        title: 'Barra de Progreso',
        description: 'Ver tu progreso',
      },
      starsCount: {
        title: 'Contar Estrellas',
        description: 'Ver cuántas estrellas tienes',
      },
      notifications: {
        title: 'Avisos de Logros',
        description: 'Te avisa cuando logras algo',
      },
    },

    appearance: {
      theme: {
        title: 'Tema',
        description: 'Colores claros u oscuros',
        options: {
          light: 'Claro',
          dark: 'Oscuro',
        },
      },
      colorScheme: {
        title: 'Colores',
        description: 'Qué colores usar',
        options: {
          default: 'Normal',
          blue: 'Azul',
          green: 'Verde',
          purple: 'Morado',
        },
      },
      backgroundPatterns: {
        title: 'Decoraciones',
        description: 'Dibujos de fondo',
      },
    },

    language: {
      appLanguage: {
        title: 'Idioma de la App',
        description: 'En qué idioma está la app',
      },
      voiceLanguage: {
        title: 'Idioma de Voz',
        description: 'En qué idioma habla la voz',
      },
      options: {
        spanish: 'Español',
        english: 'English',
      },
    },

    accessibility: {
      fontSize: {
        title: 'Tamaño de Letras',
        description: 'Qué tan grandes son las letras',
        options: {
          small: 'Pequeño',
          medium: 'Mediano',
          large: 'Grande',
        },
      },
      highContrast: {
        title: 'Colores Fuertes',
        description: 'Colores más fáciles de ver',
      },
      animationSpeed: {
        title: 'Velocidad de Animación',
        description: 'Qué tan rápido se mueven las cosas',
      },
      buttonSize: {
        title: 'Tamaño de Botones',
        description: 'Qué tan grandes son los botones',
      },
    },

    parental: {
      parentalMode: {
        title: 'Modo Papás',
        description: 'Controles especiales para papás',
      },
      timeLimit: {
        title: 'Tiempo Máximo',
        description: 'Cuánto tiempo puedes jugar',
      },
      breakReminder: {
        title: 'Recordar Descansos',
        description: 'Te recuerda tomar descansos',
      },
      breakInterval: {
        title: 'Cada Cuánto Descansar',
        description: 'Cada cuántos minutos descansar',
      },
    },

    messages: {
      saving: 'Guardando...',
      saved: '¡Guardado!',
      error: '¡Ups! No se pudo guardar',
      loadingSettings: 'Preparando tus configuraciones...',
      noSettings: 'No hay configuraciones aquí',
      tryOtherCategory: 'Prueba otra categoría',
    },
  },

  activities: {
    title: 'Actividades',
    loadingFromAPI: 'Datos desde API',
    noActivities: 'No hay actividades disponibles',
    active: 'Activa',
    inactive: 'Inactiva',
  },

  categories: {
    title: 'Categorías',
    allCategories: 'Todas las categorías',
    noCategories: 'No hay categorías disponibles',
  },

  lessons: {
    title: 'Lecciones',
    available: 'Disponibles',
    noLessons: 'No hay lecciones disponibles',
    start: 'Iniciar',
    notAvailable: 'No disponible',
    completed: 'Completada',
  },

  games: {
    memoryGame: 'Juego de Memoria',
    dragDrop: 'Arrastrar y Soltar',
    match: 'Emparejar',
    selectOption: 'Seleccionar Opción',
    orderSteps: 'Ordenar Pasos',
    patternRecognition: 'Reconocer Patrones',

    question: 'Pregunta',
    options: 'Opciones',
    correct: '¡Correcto!',
    incorrect: 'Incorrecto',
    tryAgain: 'Inténtalo de nuevo',
    wellDone: '¡Bien hecho!',
    excellent: '¡Excelente!',
    keepGoing: '¡Sigue así!',
    almostThere: '¡Casi lo tienes!',
    completed: '¡Completado!',
    nextLevel: 'Siguiente Nivel',

    instructions: {
      memoryGame: 'Encuentra las parejas iguales',
      dragDrop: 'Arrastra cada elemento a su lugar',
      match: 'Une cada elemento con su pareja',
      selectOption: 'Elige la respuesta correcta',
      orderSteps: 'Ordena los pasos correctamente',
      patternRecognition: 'Encuentra el patrón que falta',
    },

    activityTypes: {
      selectOption: 'Selecciona la opción correcta',
      orderSteps: 'Ordena los pasos',
      dragDrop: 'Arrastra y suelta',
      match: 'Asocia elementos',
      memoryGame: 'Memoria visual',
      patternRecognition: 'Reconocimiento de patrones',
    },

    messages: {
      perfectMemory: '¡Memoria perfecta! Increíble 🧠🏆',
      excellentMemory: '¡Excelente memoria! Sin errores 🌟',
      memoryExceptional: '🧠 ¡Memoria excepcional!',
      progressSaved: 'Progreso guardado',
      saving: 'Guardando...',
      saved: 'Guardado ✅',
    },
  },

  achievements: {
    title: 'Logros',
    unlocked: 'Desbloqueado',
    locked: 'Bloqueado',
    progress: 'Progreso',
    noAchievements: 'No hay logros aún',
    congratulations: '¡Felicitaciones!',
  },

  statistics: {
    title: 'Estadísticas',
    totalTime: 'Tiempo Total',
    sessionsCompleted: 'Sesiones Completadas',
    averageScore: 'Puntuación Promedio',
    bestStreak: 'Mejor Racha',
    noData: 'No hay datos aún',
  },

  login: {
    title: 'Iniciar Sesión',
    welcome: 'Bienvenido',
    subtitle: 'Inicia tu aventura de aprendizaje',
    email: 'Correo electrónico',
    password: 'Contraseña',
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    forgotPassword: '¿Olvidaste tu contraseña?',
    loginMode: '¿Ya tienes cuenta?',
    registerMode: '¿No tienes cuenta?',
    firstName: 'Nombre',
    lastName: 'Apellido',
    confirmPassword: 'Confirmar Contraseña',
  },

  onboarding: {
    welcome: 'Bienvenido a NeuroApp',
    features: 'Descubre todas las funciones',
    ready: '¡Estás listo para empezar!',
    getStarted: 'Comenzar',
    skip: 'Saltar',
  },

  errors: {
    connectionError: 'Error de conexión',
    loadingError: 'Error al cargar',
    savingError: 'Error al guardar',
    tryAgain: 'Intentar de nuevo',
    somethingWrong: 'Algo salió mal',
  },
};

// English translations
export const en: Translations = {
  common: {
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    yes: 'YES',
    no: 'NO',
    continue: 'Continue',
    finish: 'Finish',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    ok: 'OK',
  },

  navigation: {
    home: 'Home',
    activities: 'Activities',
    achievements: 'Achievements',
    statistics: 'Statistics',
    settings: 'Settings',
    credits: 'Credits',
  },

  mainScreen: {
    title: 'NeuroApp',
    subtitle: 'What do you want to do today?',
    welcome: 'Welcome',
  },

  settings: {
    title: 'My Settings',
    categories: {
      all: 'All',
      audio: 'Sounds',
      gameplay: 'Games',
      progress: 'Progress',
      appearance: 'Display',
      language: 'Language',
      accessibility: 'Help',
      parental: 'Parents',
    },

    audio: {
      soundEffects: {
        title: 'Fun Sounds',
        description: 'Hear sounds when you tap',
      },
      voiceHelp: {
        title: 'Voice Friend',
        description: 'A voice helps you play',
      },
      voiceSpeed: {
        title: 'Voice Speed',
        description: 'How fast it talks',
        options: {
          slow: 'Slow',
          normal: 'Normal',
          fast: 'Fast',
        },
      },
      volume: {
        title: 'Volume',
        description: 'How loud it sounds',
      },
    },

    gameplay: {
      helpDelay: {
        title: 'Help Time',
        description: 'How long to wait before helping',
      },
      maxAttempts: {
        title: 'Attempts',
        description: 'How many times you can try',
      },
      autoAdvance: {
        title: 'Continue Alone',
        description: 'Go to next automatically',
      },
      celebrations: {
        title: 'Celebrations',
        description: 'Animations when you win',
      },
      hintButton: {
        title: 'Hint Button',
        description: 'Button to ask for help',
      },
    },

    progress: {
      dailyGoal: {
        title: 'Daily Goal',
        description: 'How much to play each day',
      },
      progressBar: {
        title: 'Progress Bar',
        description: 'See your progress',
      },
      starsCount: {
        title: 'Count Stars',
        description: 'See how many stars you have',
      },
      notifications: {
        title: 'Achievement Alerts',
        description: 'Tells you when you achieve something',
      },
    },

    appearance: {
      theme: {
        title: 'Theme',
        description: 'Light or dark colors',
        options: {
          light: 'Light',
          dark: 'Dark',
        },
      },
      colorScheme: {
        title: 'Colors',
        description: 'Which colors to use',
        options: {
          default: 'Default',
          blue: 'Blue',
          green: 'Green',
          purple: 'Purple',
        },
      },
      backgroundPatterns: {
        title: 'Decorations',
        description: 'Background drawings',
      },
    },

    language: {
      appLanguage: {
        title: 'App Language',
        description: 'What language the app is in',
      },
      voiceLanguage: {
        title: 'Voice Language',
        description: 'What language the voice speaks',
      },
      options: {
        spanish: 'Español',
        english: 'English',
      },
    },

    accessibility: {
      fontSize: {
        title: 'Letter Size',
        description: 'How big the letters are',
        options: {
          small: 'Small',
          medium: 'Medium',
          large: 'Large',
        },
      },
      highContrast: {
        title: 'Strong Colors',
        description: 'Colors easier to see',
      },
      animationSpeed: {
        title: 'Animation Speed',
        description: 'How fast things move',
      },
      buttonSize: {
        title: 'Button Size',
        description: 'How big the buttons are',
      },
    },

    parental: {
      parentalMode: {
        title: 'Parent Mode',
        description: 'Special controls for parents',
      },
      timeLimit: {
        title: 'Time Limit',
        description: 'How long you can play',
      },
      breakReminder: {
        title: 'Break Reminders',
        description: 'Reminds you to take breaks',
      },
      breakInterval: {
        title: 'Break Interval',
        description: 'How often to take breaks',
      },
    },

    messages: {
      saving: 'Saving...',
      saved: 'Saved!',
      error: 'Oops! Could not save',
      loadingSettings: 'Preparing your settings...',
      noSettings: 'No settings here',
      tryOtherCategory: 'Try another category',
    },
  },

  activities: {
    title: 'Activities',
    loadingFromAPI: 'Data from API',
    noActivities: 'No activities available',
    active: 'Active',
    inactive: 'Inactive',
  },

  categories: {
    title: 'Categories',
    allCategories: 'All categories',
    noCategories: 'No categories available',
  },

  lessons: {
    title: 'Lessons',
    available: 'Available',
    noLessons: 'No lessons available',
    start: 'Start',
    notAvailable: 'Not available',
    completed: 'Completed',
  },

  games: {
    memoryGame: 'Memory Game',
    dragDrop: 'Drag and Drop',
    match: 'Match',
    selectOption: 'Select Option',
    orderSteps: 'Order Steps',
    patternRecognition: 'Pattern Recognition',

    question: 'Question',
    options: 'Options',
    correct: 'Correct!',
    incorrect: 'Incorrect',
    tryAgain: 'Try again',
    wellDone: 'Well done!',
    excellent: 'Excellent!',
    keepGoing: 'Keep going!',
    almostThere: 'Almost there!',
    completed: 'Completed!',
    nextLevel: 'Next Level',

    instructions: {
      memoryGame: 'Find the matching pairs',
      dragDrop: 'Drag each item to its place',
      match: 'Match each item with its pair',
      selectOption: 'Choose the correct answer',
      orderSteps: 'Put the steps in order',
      patternRecognition: 'Find the missing pattern',
    },

    activityTypes: {
      selectOption: 'Select the correct option',
      orderSteps: 'Order the steps',
      dragDrop: 'Drag and drop',
      match: 'Match elements',
      memoryGame: 'Visual memory',
      patternRecognition: 'Pattern recognition',
    },

    messages: {
      perfectMemory: 'Perfect memory! Incredible 🧠🏆',
      excellentMemory: 'Excellent memory! No errors 🌟',
      memoryExceptional: '🧠 Exceptional memory!',
      progressSaved: 'Progress saved',
      saving: 'Saving...',
      saved: 'Saved ✅',
    },
  },

  achievements: {
    title: 'Achievements',
    unlocked: 'Unlocked',
    locked: 'Locked',
    progress: 'Progress',
    noAchievements: 'No achievements yet',
    congratulations: 'Congratulations!',
  },

  statistics: {
    title: 'Statistics',
    totalTime: 'Total Time',
    sessionsCompleted: 'Sessions Completed',
    averageScore: 'Average Score',
    bestStreak: 'Best Streak',
    noData: 'No data yet',
  },

  login: {
    title: 'Sign In',
    welcome: 'Welcome',
    subtitle: 'Start your learning adventure',
    email: 'Email',
    password: 'Password',
    login: 'Sign In',
    register: 'Sign Up',
    forgotPassword: 'Forgot your password?',
    loginMode: 'Already have an account?',
    registerMode: "Don't have an account?",
    firstName: 'First Name',
    lastName: 'Last Name',
    confirmPassword: 'Confirm Password',
  },

  onboarding: {
    welcome: 'Welcome to NeuroApp',
    features: 'Discover all the features',
    ready: "You're ready to start!",
    getStarted: 'Get Started',
    skip: 'Skip',
  },

  errors: {
    connectionError: 'Connection error',
    loadingError: 'Loading error',
    savingError: 'Saving error',
    tryAgain: 'Try again',
    somethingWrong: 'Something went wrong',
  },
};

// Available translations
export const translations = { es, en };

// Default language
export const DEFAULT_LANGUAGE: Language = 'es';