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
    | 'Repetir sonidos o palabras'
    | 'Sí / No'
    | 'Emparejamiento emocional'
    | 'Construye la rutina'
    | 'Memoria visual'
    | 'Temporizador';
  options?: { icon: string; correct: boolean; label: string }[];
  soundUrl?: string; // para repetir sonidos
  image?: string; // para memorias, emociones u otras
  description?: string; // opcional para narrativas
}

export interface Lesson {
  id: number;
  title: string;
  icon: string;
  completed: boolean;
  steps: Step[];
  category: string; // ✅ nuevo

}

export const LESSONS_DATA: Lesson[] = [
  {
    id: 1,
    title: "Lavarse las manos",
    icon: "🧼",
    category: "Higiene Personal",
    completed: false,
    steps: [
      { id: 1, text: "Abrir el grifo", icon: "🚿", completed: false, activityType: "Ordena los pasos" },
      { id: 2, text: "Mojar las manos", icon: "💧", completed: false, activityType: "Ordena los pasos" },
      { id: 3, text: "Poner jabón", icon: "🧼", completed: false, activityType: "Ordena los pasos" },
      { id: 4, text: "Frotar las manos", icon: "👐", completed: false, activityType: "Ordena los pasos" },
      { id: 5, text: "Enjuagar", icon: "💦", completed: false, activityType: "Ordena los pasos" },
      { id: 6, text: "Secar con toalla", icon: "🏺", completed: false, activityType: "Ordena los pasos" }
    ]
  },
  {
    id: 2,
    title: "¿Qué haces primero al lavarte las manos?",
    icon: "🧽",
    category: "Higiene Personal",
    completed: false,
    steps: [
      {
        id: 1,
        text: "Selecciona la opción correcta",
        icon: "🤔",
        completed: false,
        activityType: "Selecciona la opción correcta",
        options: [
          { icon: "🧼", label: "Poner jabón", correct: false },
          { icon: "🚿", label: "Abrir el grifo", correct: true }
        ]
      },
      {
        id: 2,
        text: "¿Qué sigue después de abrir el grifo?",
        icon: "💧",
        completed: false,
        activityType: "Selecciona la opción correcta",
        options: [
          { icon: "🧻", label: "Secarse las manos", correct: false },
          { icon: "💧", label: "Mojar las manos", correct: true }
        ]
      },
      {
        id: 3,
        text: "¿Cuál es el último paso?",
        icon: "🧴",
        completed: false,
        activityType: "Selecciona la opción correcta",
        options: [
          { icon: "🧴", label: "Aplicar jabón", correct: false },
          { icon: "🏺", label: "Secar con toalla", correct: true }
        ]
      }
    ]
  },
  {
    id: 3,
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
    id: 4,
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
        activityType: "Sí / No",
        options: [
          { icon: "✅", label: "Sí", correct: false },
          { icon: "❌", label: "No", correct: true }
        ]
      }
    ]
  },
  {
  id: 5,
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
    {
      id: 2,
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
  id: 6,
  title: "Prepararse para dormir",
  icon: "🛌",
  category: "Rutinas Diarias",
  completed: false,
  steps: [
    {
      id: 1,
      text: "Ponerse el pijama",
      icon: "👕",
      completed: false,
      activityType: "Ordena los pasos"
    },
    {
      id: 2,
      text: "Cepillarse los dientes",
      icon: "🪥",
      completed: false,
      activityType: "Ordena los pasos"
    },
    {
      id: 3,
      text: "Leer un cuento",
      icon: "📖",
      completed: false,
      activityType: "Ordena los pasos"
    },
    {
      id: 4,
      text: "Ir a la cama",
      icon: "🛏️",
      completed: false,
      activityType: "Ordena los pasos"
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
  },
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
},
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
  id: 11,
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
},
  ]
}


  // … continúa con los siguientes casos agregando "activityType" en cada step
];
