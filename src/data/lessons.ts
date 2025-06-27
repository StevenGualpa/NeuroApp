export interface Step {
  id: number;
  text: string;
  icon: string;
  completed: boolean;
  activityType:
    | 'Selecciona la opción correcta'
    | 'Ordena los pasos'
    | 'Arrastra y suelta'
    | 'Asocia elementos'
    | 'Repetir sonidos'
    | 'Memoria visual'
    | 'Reconocimiento de patrones';
  options?: {
    icon: string;
    label: string;
    correct?: boolean;
    correctZone?: string;
    order?: number;
  }[];
  soundUrl?: string;
  image?: string;
  description?: string;
  audio?: string;
  // Nuevas propiedades para reconocimiento de patrones
  patternType?: 'visual' | 'auditory' | 'conceptual' | 'behavioral';
  sequence?: string[];
  missingPosition?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Lesson {
  id: number;
  title: string;
  icon: string;
  completed: boolean;
  steps: Step[];
  category: string;
}

export const LESSONS_DATA: Lesson[] = [
  {
    id: 1,
    title: "Evitar tocar enchufes",
    icon: "⚡",
    category: "Seguridad en el hogar",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Qué debes hacer si ves un enchufe suelto?",
        icon: "❓",
        completed: false,
        activityType: "Selecciona la opción correcta",
        options: [
          { icon: "🖐️", label: "Tocarlo", correct: false },
          { icon: "🚫", label: "Alejarse y avisar", correct: true }
        ]
      }
    ]
  },
  {
    id: 2,
    title: "Evitar tocar enchufes (Sí / No)",
    icon: "⚠️",
    category: "Seguridad en el hogar",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Está bien tocar un enchufe con las manos mojadas?",
        icon: "💦⚡",
        completed: false,
        activityType: "Selecciona la opción correcta",
        options: [
          { icon: "✅", label: "Sí", correct: false },
          { icon: "❌", label: "No", correct: true }
        ]
      }
    ]
  },
  {
    id: 3,
    title: "Cruzar la calle correctamente",
    icon: "🚶‍♂️",
    category: "Normas Viales y Transporte",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Dónde debes cruzar la calle?",
        icon: "🚦",
        completed: false,
        activityType: "Selecciona la opción correcta",
        options: [
          { icon: "🏞️", label: "En medio del parque", correct: false },
          { icon: "⚫⚪⚫", label: "En el paso de cebra", correct: true }
        ]
      },
    ]
  },
    {
    id: 4,
    title: "Cruzar la calle correctamente",
    icon: "🚶‍♂️",
    category: "Normas Viales y Transporte",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Qué color debe tener el semáforo para cruzar?",
        icon: "🚥",
        completed: false,
        activityType: "Selecciona la opción correcta",
        options: [
          { icon: "🔴", label: "Rojo", correct: false },
          { icon: "🟢", label: "Verde", correct: true }
        ]
      }
    ]
  },
  {
    id: 7,
    title: "Estudiar",
    icon: "🔗",
    category: "Actividades Escolares",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Cuál pictograma representa 'Estudiar'?",
        icon: "📚",
        completed: false,
        activityType: "Asocia elementos",
        options: [
          { icon: "📚", label: "Estudiar", correct: true },
          { icon: "🎮", label: "Jugar", correct: false },
          { icon: "🛌", label: "Dormir", correct: false },
          { icon: "🚪", label: "Salir", correct: false }
        ]
      }
    ]
  },
  {
    id: 8,
    title: "Leer un libro",
    icon: "🔗",
    category: "Actividades Escolares",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Cuál pictograma representa 'Leer un libro'?",
        icon: "📖",
        completed: false,
        activityType: "Asocia elementos",
        options: [
          { icon: "📖", label: "Leer", correct: true },
          { icon: "✏️", label: "Escribir", correct: false },
          { icon: "🎨", label: "Dibujar", correct: false },
          { icon: "🧃", label: "Tomar jugo", correct: false }
        ]
      }
    ]
  },
  {
    id: 9,
    title: "Escribir en clase",
    icon: "🔗",
    category: "Actividades Escolares",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Cuál pictograma representa 'Escribir en clase'?",
        icon: "✏️",
        completed: false,
        activityType: "Asocia elementos",
        options: [
          { icon: "✏️", label: "Escribir", correct: true },
          { icon: "📖", label: "Leer", correct: false },
          { icon: "🛏️", label: "Dormir", correct: false },
          { icon: "🍎", label: "Comer", correct: false }
        ]
      }
    ]
  },
  {
    id: 10,
    title: "Dibujar en clase",
    icon: "🔗",
    category: "Actividades Escolares",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Cuál pictograma representa 'Dibujar en clase'?",
        icon: "🎨",
        completed: false,
        activityType: "Asocia elementos",
        options: [
          { icon: "🎨", label: "Dibujar", correct: true },
          { icon: "📚", label: "Estudiar", correct: false },
          { icon: "🎵", label: "Escuchar música", correct: false },
          { icon: "🏃", label: "Correr", correct: false }
        ]
      }
    ]
  },
  {
    id: 11,
    title: "Ir al recreo",
    icon: "🔗",
    category: "Actividades Escolares",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Cuál pictograma representa 'Ir al recreo'?",
        icon: "🛝",
        completed: false,
        activityType: "Asocia elementos",
        options: [
          { icon: "🛝", label: "Recreo", correct: true },
          { icon: "📖", label: "Leer", correct: false },
          { icon: "🛌", label: "Dormir", correct: false },
          { icon: "✏️", label: "Escribir", correct: false }
        ]
      }
    ]
  },
  {
    id: 12,
    title: "Guardar silencio",
    icon: "🔗",
    category: "Actividades Escolares",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Cuál pictograma representa 'Guardar silencio' en clase?",
        icon: "🤫",
        completed: false,
        activityType: "Asocia elementos",
        options: [
          { icon: "🤫", label: "Silencio", correct: true },
          { icon: "🎉", label: "Fiesta", correct: false },
          { icon: "📣", label: "Hablar fuerte", correct: false },
          { icon: "📱", label: "Usar celular", correct: false }
        ]
      }
    ]
  },
  {
    id: 13,
    title: "Identificar frutas",
    icon: "🔗",
    category: "Alimentación Saludable",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Cuál pictograma representa una fruta?",
        icon: "🍎",
        completed: false,
        activityType: "Asocia elementos",
        options: [
          { icon: "🍎", label: "Manzana", correct: true },
          { icon: "🍔", label: "Hamburguesa", correct: false },
          { icon: "🍩", label: "Dona", correct: false },
          { icon: "🥤", label: "Refresco", correct: false }
        ]
      }
    ]
  },
  {
    id: 14,
    title: "Asociar comida saludable",
    icon: "🔗",
    category: "Alimentación Saludable",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Cuál opción es más saludable?",
        icon: "🥗",
        completed: false,
        activityType: "Asocia elementos",
        options: [
          { icon: "🥗", label: "Ensalada", correct: true },
          { icon: "🍟", label: "Papas fritas", correct: false },
          { icon: "🍕", label: "Pizza", correct: false },
          { icon: "🍰", label: "Pastel", correct: false }
        ]
      }
    ]
  },
  {
    id: 15,
    title: "Buen comportamiento en grupo",
    icon: "🔗",
    category: "Socialización",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Qué pictograma representa 'Compartir'?",
        icon: "🤝",
        completed: false,
        activityType: "Asocia elementos",
        options: [
          { icon: "🤝", label: "Compartir", correct: true },
          { icon: "✋", label: "Detener", correct: false },
          { icon: "🙅", label: "No", correct: false },
          { icon: "😡", label: "Enojado", correct: false }
        ]
      }
    ]
  },
  {
    id: 16,
    title: "Identificar transporte seguro",
    icon: "🔗",
    category: "Transporte y Movilidad",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Cuál pictograma representa un autobús?",
        icon: "🚌",
        completed: false,
        activityType: "Asocia elementos",
        options: [
          { icon: "🚌", label: "Autobús", correct: true },
          { icon: "✈️", label: "Avión", correct: false },
          { icon: "🚲", label: "Bicicleta", correct: false },
          { icon: "🚗", label: "Carro", correct: false }
        ]
      }
    ]
  },
  {
    id: 17,
    title: "Reconocer emoción de felicidad",
    icon: "🔗",
    category: "Emociones",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Cuál pictograma representa estar feliz?",
        icon: "😊",
        completed: false,
        activityType: "Asocia elementos",
        options: [
          { icon: "😊", label: "Feliz", correct: true },
          { icon: "😢", label: "Triste", correct: false },
          { icon: "😠", label: "Enojado", correct: false },
          { icon: "😴", label: "Dormido", correct: false }
        ]
      }
    ]
  },
  {
    id: 18,
    title: "Encuentra los pares de objetos escolares",
    icon: "📚",
    category: "Objetos Escolares",
    completed: false,
    steps: [
      {
        id: 1,
        text: "Empareja los objetos escolares iguales.",
        icon: "🧠",
        completed: false,
        activityType: "Memoria visual",
        options: [
          { icon: "✏️", label: "Lápiz", correct: true },
          { icon: "📐", label: "Escuadra", correct: true }
        ]
      }
    ]
  },
  {
    id: 19,
    title: "Reconoce el sonido correcto",
    icon: "🔊",
    category: "Lenguaje y Comunicación",
    completed: false,
    steps: [
      {
        id: 1,
        text: "Escucha y elige el pictograma que representa lo que oíste.",
        icon: "👂",
        completed: false,
        activityType: "Repetir sonidos",
        audio: "comer",
        options: [
          { icon: "🍽️", label: "Comer", correct: true },
          { icon: "🛁", label: "Bañarse", correct: false },
          { icon: "🏃", label: "Correr", correct: false }
        ]
      }
    ]
  },
  {
    id: 20,
    title: "Clasifica los objetos reciclables",
    icon: "🗑️",
    category: "Medio Ambiente",
    completed: false,
    steps: [
      {
        id: 1,
        text: "Arrastra los elementos a su zona correcta.",
        icon: "🧃",
        completed: false,
        activityType: "Arrastra y suelta",
        options: [
          { icon: "🧃", label: "Jugo", correctZone: "Reciclaje" },
          { icon: "🍕", label: "Pizza", correctZone: "No Reciclaje" },
          { icon: "📰", label: "Periódico", correctZone: "Reciclaje" },
          { icon: "🍔", label: "Hamburguesa", correctZone: "No Reciclaje" }
        ]
      }
    ]
  },
{
  id: 31,
  title: "Separa lo que va al refrigerador",
  icon: "🧊",
  category: "Alimentación Saludable",
  completed: false,
  steps: [
    {
      id: 1,
      text: "Arrastra los alimentos a donde deben guardarse.",
      icon: "🥛",
      completed: false,
      activityType: "Arrastra y suelta",
      options: [
        { icon: "🥛", label: "Leche", correctZone: "Refrigerador" },
        { icon: "🍞", label: "Pan", correctZone: "Despensa" },
        { icon: "🧀", label: "Queso", correctZone: "Refrigerador" },
        { icon: "🍪", label: "Galletas", correctZone: "Despensa" },
        { icon: "🥩", label: "Carne", correctZone: "Refrigerador" },
        { icon: "🍝", label: "Pasta", correctZone: "Despensa" }
      ]
    }
  ]
},
  {
    id: 32,
    title: "Rutina de la mañana",
    icon: "🌞",
    category: "Higiene Personal",
    completed: false,
    steps: [
      {
        id: 1,
        text: "Ordena los pasos para cepillarse los dientes correctamente.",
        icon: "🦷",
        completed: false,
        activityType: "Ordena los pasos",
        options: [
          { icon: "🚿", label: "Mojar el cepillo", correct: true, order: 1 },
          { icon: "🧴", label: "Colocar la pasta dental", correct: true, order: 2 },
          { icon: "🪥", label: "Cepillar durante 2 minutos", correct: true, order: 3 }
        ]
      }
    ]
  },
  // Nuevas actividades de Reconocimiento de patrones
  {
    id: 33,
    title: "Completa el patrón de colores",
    icon: "🎨",
    category: "Habilidades Cognitivas",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Qué color sigue en el patrón?",
        icon: "🔴",
        completed: false,
        activityType: "Reconocimiento de patrones",
        patternType: "visual",
        sequence: ["🔴", "🔵", "🔴", "🔵", "🔴", "?"],
        missingPosition: 5,
        difficulty: "easy",
        options: [
          { icon: "🔵", label: "Azul", correct: true },
          { icon: "🟡", label: "Amarillo", correct: false },
          { icon: "🟢", label: "Verde", correct: false }
        ]
      }
    ]
  },
  {
    id: 34,
    title: "Patrón de formas geométricas",
    icon: "🔺",
    category: "Habilidades Cognitivas",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Qué forma continúa el patrón?",
        icon: "🔺",
        completed: false,
        activityType: "Reconocimiento de patrones",
        patternType: "visual",
        sequence: ["🔺", "⭕", "🔲", "🔺", "⭕", "?"],
        missingPosition: 5,
        difficulty: "medium",
        options: [
          { icon: "🔲", label: "Cuadrado", correct: true },
          { icon: "🔺", label: "Triángulo", correct: false },
          { icon: "⭕", label: "Círculo", correct: false }
        ]
      }
    ]
  },
  {
    id: 35,
    title: "Patrón de actividades escolares",
    icon: "📚",
    category: "Habilidades Cognitivas",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Qué actividad viene después del recreo?",
        icon: "🛝",
        completed: false,
        activityType: "Reconocimiento de patrones",
        patternType: "behavioral",
        sequence: ["📚", "✏️", "🛝", "?", "🍎"],
        missingPosition: 3,
        difficulty: "medium",
        options: [
          { icon: "📖", label: "Lectura", correct: true },
          { icon: "🎨", label: "Arte", correct: false },
          { icon: "⚽", label: "Deportes", correct: false }
        ]
      }
    ]
  },
  {
    id: 36,
    title: "Secuencia de números",
    icon: "🔢",
    category: "Habilidades Cognitivas",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Qué número sigue en la secuencia?",
        icon: "1️⃣",
        completed: false,
        activityType: "Reconocimiento de patrones",
        patternType: "conceptual",
        sequence: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "?"],
        missingPosition: 5,
        difficulty: "easy",
        options: [
          { icon: "6️⃣", label: "Seis", correct: true },
          { icon: "4️⃣", label: "Cuatro", correct: false },
          { icon: "8️⃣", label: "Ocho", correct: false }
        ]
      }
    ]
  },
  {
    id: 37,
    title: "Patrón de emociones",
    icon: "😊",
    category: "Habilidades Cognitivas",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Qué emoción completa el patrón?",
        icon: "😊",
        completed: false,
        activityType: "Reconocimiento de patrones",
        patternType: "visual",
        sequence: ["😊", "😢", "😊", "😢", "😊", "?"],
        missingPosition: 5,
        difficulty: "easy",
        options: [
          { icon: "😢", label: "Triste", correct: true },
          { icon: "😡", label: "Enojado", correct: false },
          { icon: "😴", label: "Dormido", correct: false }
        ]
      }
    ]
  },
  {
    id: 38,
    title: "Patrón de animales",
    icon: "🐱",
    category: "Habilidades Cognitivas",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Qué animal continúa la secuencia?",
        icon: "🐱",
        completed: false,
        activityType: "Reconocimiento de patrones",
        patternType: "visual",
        sequence: ["🐱", "🐶", "🐰", "🐱", "🐶", "?"],
        missingPosition: 5,
        difficulty: "medium",
        options: [
          { icon: "🐰", label: "Conejo", correct: true },
          { icon: "🐸", label: "Rana", correct: false },
          { icon: "🐵", label: "Mono", correct: false }
        ]
      }
    ]
  },
  {
    id: 39,
    title: "Patrón de tamaños",
    icon: "🔴",
    category: "Habilidades Cognitivas",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Qué tamaño sigue en el patrón?",
        icon: "🔴",
        completed: false,
        activityType: "Reconocimiento de patrones",
        patternType: "visual",
        sequence: ["🔴", "🟠", "🔴", "🟠", "🔴", "?"],
        missingPosition: 5,
        difficulty: "easy",
        description: "Grande - Pequeño - Grande - Pequeño - Grande - ?",
        options: [
          { icon: "🟠", label: "Pequeño", correct: true },
          { icon: "🔴", label: "Grande", correct: false },
          { icon: "🟡", label: "Mediano", correct: false }
        ]
      }
    ]
  },
  {
    id: 40,
    title: "Patrón de rutina diaria",
    icon: "🌅",
    category: "Habilidades Cognitivas",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Qué actividad viene después de desayunar?",
        icon: "🍳",
        completed: false,
        activityType: "Reconocimiento de patrones",
        patternType: "behavioral",
        sequence: ["🌅", "🦷", "🍳", "?", "🎒"],
        missingPosition: 3,
        difficulty: "medium",
        description: "Despertar - Cepillar dientes - Desayunar - ? - Ir a la escuela",
        options: [
          { icon: "👕", label: "Vestirse", correct: true },
          { icon: "📺", label: "Ver TV", correct: false },
          { icon: "🛌", label: "Dormir", correct: false }
        ]
      }
    ]
  }
];