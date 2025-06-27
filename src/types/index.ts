import { Animated } from 'react-native';

// Game Types
export interface Card {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
  animation: Animated.Value;
}

export interface GameStats {
  totalAttempts: number;
  errors: number;
  stars: number;
  completionTime: number;
  perfectRun: boolean;
  matchesFound: number;
  flipCount: number;
  efficiency: number;
}

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
}

export interface Lesson {
  id: number;
  title: string;
  icon: string;
  completed: boolean;
  steps: Step[];
  category: string;
}

// Achievement Types
export type AchievementCategory = 'all' | 'primeros_pasos' | 'progreso' | 'esfuerzo' | 'especial';
export type AchievementRarity = 'celebracion' | 'genial' | 'increible' | 'super_especial';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;
  isUnlocked: boolean;
  currentProgress: number;
  maxProgress: number;
  unlockedAt?: string;
  condition: string;
  encouragementMessage: string;
}

export interface UserStats {
  totalActivitiesCompleted: number;
  totalStarsEarned: number;
  daysPlaying: number;
  favoriteActivity: string;
  totalPlayTime: number;
  helpfulAttempts: number;
  improvementMoments: number;
  explorationPoints: number;
}

// Menu Types
export interface MenuOption {
  key: string;
  label: string;
  icon: string;
  color: string;
  shadowColor: string;
}

export interface CreditItem {
  name: string;
  value: string;
}

export interface CreditSection {
  category: string;
  items: CreditItem[];
}

// Component Props Types
export interface FeedbackAnimationProps {
  type: 'success' | 'error' | 'winner' | 'loser';
  onFinish: () => void;
}

export interface AchievementNotificationProps {
  achievement: Achievement;
  visible: boolean;
  onHide: () => void;
}

export interface GameStatsDisplayProps {
  stats: GameStats;
  showPerfectBadge?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export interface GameCompletionModalProps {
  visible: boolean;
  stats: GameStats;
  onReset: () => void;
  onContinue: () => void;
  performanceMessage: string;
  gameType: string;
  showEfficiency?: boolean;
  customStats?: Array<{ label: string; value: string | number }>;
  bonusMessage?: string;
}

export interface MemoryCardProps {
  card: Card;
  onPress: (card: Card) => void;
  size: number;
}

export interface MenuGridProps {
  menuOptions: MenuOption[];
  onMenuPress: (option: string) => void;
}

export interface ProgressBarProps {
  progress: number;
  total: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
}

// Animation Types
export type AnimationType = 'success' | 'error' | 'winner' | 'loser';

export interface AnimationConfig {
  duration: number;
  useNativeDriver: boolean;
  tension?: number;
  friction?: number;
}

// Game Configuration Types
export interface GameConfig {
  maxTimePerPair: number;
  minFlipsMultiplier: number;
  perfectFlipsMultiplier: number;
  goodFlipsMultiplier: number;
}

// Storage Types
export interface StorageKeys {
  achievements: string;
  userStats: string;
  userProgress: string;
  settings: string;
}

// Navigation Types (extending the existing RootStackParamList)
export interface NavigationStep extends Step {
  lessonTitle: string;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Event Handler Types
export type GameEventHandler = (stats: GameStats) => void;
export type AchievementEventHandler = (achievement: Achievement) => void;
export type NavigationEventHandler = (screen: string, params?: any) => void;

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AppError;
}

// Theme Types
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  error: string;
  warning: string;
  background: string;
  white: string;
  gray: string;
  lightGray: string;
  dark: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeBorderRadius {
  small: number;
  medium: number;
  large: number;
  extraLarge: number;
  round: number;
}

export interface ThemeShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}