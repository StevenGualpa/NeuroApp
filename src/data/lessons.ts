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
}

export const LESSONS_DATA: Lesson[] = [
  {
    id: 1,
    title: "Lavarse las manos",
    icon: "🧼",
    completed: false,
    steps: [
      { id: 1, text: "Abrir el grifo", icon: "🚿", completed: false },
      { id: 2, text: "Mojar las manos", icon: "💧", completed: false },
      { id: 3, text: "Poner jabón", icon: "🧼", completed: false },
      { id: 4, text: "Frotar las manos", icon: "👐", completed: false },
      { id: 5, text: "Enjuagar", icon: "💦", completed: false },
      { id: 6, text: "Secar con toalla", icon: "🏺", completed: false }
    ]
  }, // ← COMA AQUÍ

  {
    id: 2,
    title: "¿Qué haces primero al lavarte las manos?",
    icon: "🧽",
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
    text: "¿Qué haces después?",
    icon: "🧠",
    completed: false,
    options: [
      { icon: "💧", label: "Mojar las manos", correct: true },
      { icon: "👐", label: "Frotar manos", correct: false }
    ]
  }
    ]
  }
];
