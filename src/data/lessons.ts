export interface Step {
  id: number;
  text: string;
  icon: string;
  completed: boolean;
  activityType: 'Selecciona la opción correcta' | 'Ordena los pasos' | 'Asocia elementos'; // puedes agregar más
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
  // … continúa con los siguientes casos agregando "activityType" en cada step
];
