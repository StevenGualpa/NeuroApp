export interface Step {
  id: number;
  text: string;
  icon: string;
  completed: boolean;
  options?: { icon: string; correct: boolean; label: string }[];
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
      { id: 1, text: "Abrir el grifo", icon: "🚿", completed: false },
      { id: 2, text: "Mojar las manos", icon: "💧", completed: false },
      { id: 3, text: "Poner jabón", icon: "🧼", completed: false },
      { id: 4, text: "Frotar las manos", icon: "👐", completed: false },
      { id: 5, text: "Enjuagar", icon: "💦", completed: false },
      { id: 6, text: "Secar con toalla", icon: "🏺", completed: false }
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
        options: [
          { icon: "🖐️", label: "Tocarlo", correct: false },
          { icon: "🚫", label: "Alejarse y avisar", correct: true }
        ]
      }
    ]
  },
  {
    id: 4,
    title: "No jugar con fuego",
    icon: "🔥",
    category: "Seguridad en el hogar",
    completed: false,
    steps: [
      {
        id: 1,
        text: "¿Qué debes hacer si ves una vela encendida?",
        icon: "🕯️",
        completed: false,
        options: [
          { icon: "🧒", label: "Jugar con ella", correct: false },
          { icon: "👨‍👩‍👧", label: "Llamar a un adulto", correct: true }
        ]
      }
    ]
  },
  {
  id: 5,
  title: "¿Qué debes hacer antes de cruzar la calle?",
  icon: "🚸",
  category: "Normas Viales y Transporte",
  completed: false,
  steps: [
    {
      id: 1,
      text: "Selecciona la opción correcta",
      icon: "👀",
      completed: false,
      options: [
        { icon: "👟", label: "Correr sin mirar", correct: false },
        { icon: "👀", label: "Mirar a ambos lados", correct: true },
        { icon: "🎧", label: "Escuchar música", correct: false }
      ]
    }
  ]
},
{
  id: 6,
  title: "¿Cuál es la señal para detenerse?",
  icon: "🛑",
  category: "Normas Viales y Transporte",
  completed: false,
  steps: [
    {
      id: 1,
      text: "Selecciona la señal correcta",
      icon: "🚦",
      completed: false,
      options: [
        { icon: "🛑", label: "Pare", correct: true },
        { icon: "⚠️", label: "Precaución", correct: false },
        { icon: "🚀", label: "Avanzar rápido", correct: false }
      ]
    }
  ]
},
{
  id: 7,
  title: "¿Cómo debes comportarte dentro del bus?",
  icon: "🚌",
  category: "Normas Viales y Transporte",
  completed: false,
  steps: [
    {
      id: 1,
      text: "Elige lo correcto",
      icon: "🤔",
      completed: false,
      options: [
        { icon: "📣", label: "Gritar", correct: false },
        { icon: "📱", label: "Jugar con el celular con volumen alto", correct: false },
        { icon: "🔇", label: "Hablar en voz baja y permanecer sentado", correct: true }
      ]
    }
  ]
},
{
  id: 8,
  title: "¿Qué debes hacer si ves un semáforo en rojo?",
  icon: "🚦",
  category: "Normas Viales y Transporte",
  completed: false,
  steps: [
    {
      id: 1,
      text: "Selecciona la acción correcta",
      icon: "🔴",
      completed: false,
      options: [
        { icon: "🚶", label: "Cruzar la calle", correct: false },
        { icon: "🛑", label: "Esperar a que cambie a verde", correct: true },
        { icon: "🏃", label: "Correr", correct: false }
      ]
    }
  ]
}




];

