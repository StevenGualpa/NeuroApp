// src/services/ApiService.ts
import { API_CONFIG, API_ENDPOINTS } from '../config/api';

export interface Activity {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  name: string;
  description: string;
  icon: string; // URL completa de la imagen del servidor
  imagen: string; // Campo del servidor (no se usa en la app)
  is_active: boolean;
  Steps: any[] | null;
}

export interface Category {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  Lessons: any[] | null;
}

export interface Lesson {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  category_id: number;
  title: string;
  icon: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  difficulty: 'easy' | 'medium' | 'hard';
  Category: Category;
  Steps: Step[] | null;
}

export interface Step {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  lesson_id: number;
  activity_type_id: number;
  text: string;
  icon: string;
  description: string;
  image: string;
  help_message: string;
  sort_order: number;
  pattern_type: string;
  sequence: string;
  missing_position: number;
  difficulty: string;
  Lesson: Lesson;
  ActivityType: Activity;
  Options: Option[] | null;
}

export interface Option {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  step_id: number;
  icon: string;
  label: string;
  is_correct: boolean;
  correct_zone: string;
  sort_order: number;
  order_value: number;
  Step: Step;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  is_active: boolean;
  last_login?: string;
}

export interface UserStats {
  ID: number;
  UserID: number;
  total_activities_completed: number;
  total_stars_earned: number;
  days_playing: number;
  favorite_activity: string;
  total_play_time: number;
  helpful_attempts: number;
  improvement_moments: number;
  exploration_points: number;
  last_activity_date: string;
}

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  stats?: UserStats;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface Achievement {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  condition_type: string;
  condition_value: number;
  is_active: boolean;
  sort_order: number;
}

export interface UserAchievement {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  user_id: number;
  achievement_id: number;
  is_unlocked: boolean;
  progress: number;
  unlocked_at?: string;
  Achievement: Achievement;
}

export interface GameSession {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  user_id: number;
  lesson_id?: number;
  step_id?: number;
  activity_type: string;
  start_time: string;
  end_time?: string;
  duration: number;
  completed: boolean;
  stars_earned: number;
  errors_count: number;
  hints_used: number;
  score: number;
  session_data?: any;
}

export interface AppSettings {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  key: string;
  value: string;
  category: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

export interface UserSettings {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  user_id: number;
  key: string;
  value: string;
  category: string;
  is_active: boolean;
  User?: User;
}

export interface SessionStats {
  total_sessions: number;
  total_duration: number;
  average_duration: number;
  total_stars: number;
  average_stars: number;
  completion_rate: number;
  favorite_activity: string;
  best_streak: number;
  current_streak: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

class ApiService {
  private baseURL = API_CONFIG.BASE_URL;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Activities endpoints
  async getActivities(): Promise<Activity[]> {
    return this.makeRequest<Activity[]>(API_ENDPOINTS.ACTIVITIES);
  }

  async getActivityById(id: number): Promise<Activity> {
    return this.makeRequest<Activity>(API_ENDPOINTS.ACTIVITY_BY_ID(id));
  }

  async createActivity(activity: Partial<Activity>): Promise<Activity> {
    return this.makeRequest<Activity>(API_ENDPOINTS.ACTIVITIES, {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  }

  async updateActivity(id: number, activity: Partial<Activity>): Promise<Activity> {
    return this.makeRequest<Activity>(API_ENDPOINTS.ACTIVITY_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(activity),
    });
  }

  async deleteActivity(id: number): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(API_ENDPOINTS.ACTIVITY_BY_ID(id), {
      method: 'DELETE',
    });
  }

  // Categories endpoints
  async getCategories(): Promise<Category[]> {
    return this.makeRequest<Category[]>(API_ENDPOINTS.CATEGORIES);
  }

  async getCategoryById(id: number): Promise<Category> {
    return this.makeRequest<Category>(API_ENDPOINTS.CATEGORY_BY_ID(id));
  }

  async createCategory(category: Partial<Category>): Promise<Category> {
    return this.makeRequest<Category>(API_ENDPOINTS.CATEGORIES, {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: number, category: Partial<Category>): Promise<Category> {
    return this.makeRequest<Category>(API_ENDPOINTS.CATEGORY_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: number): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(API_ENDPOINTS.CATEGORY_BY_ID(id), {
      method: 'DELETE',
    });
  }

  // Lessons endpoints
  async getLessons(): Promise<Lesson[]> {
    return this.makeRequest<Lesson[]>(API_ENDPOINTS.LESSONS);
  }

  async getLessonById(id: number): Promise<Lesson> {
    return this.makeRequest<Lesson>(API_ENDPOINTS.LESSON_BY_ID(id));
  }

  async getLessonsByCategory(categoryId: number): Promise<Lesson[]> {
    return this.makeRequest<Lesson[]>(API_ENDPOINTS.LESSONS_BY_CATEGORY(categoryId));
  }

  async getLessonWithSteps(id: number): Promise<Lesson> {
    return this.makeRequest<Lesson>(API_ENDPOINTS.LESSON_WITH_STEPS(id));
  }

  async getLessonsWithSteps(): Promise<Lesson[]> {
    return this.makeRequest<Lesson[]>(API_ENDPOINTS.LESSONS_WITH_STEPS);
  }

  async createLesson(lesson: Partial<Lesson>): Promise<Lesson> {
    return this.makeRequest<Lesson>(API_ENDPOINTS.LESSONS, {
      method: 'POST',
      body: JSON.stringify(lesson),
    });
  }

  async updateLesson(id: number, lesson: Partial<Lesson>): Promise<Lesson> {
    return this.makeRequest<Lesson>(API_ENDPOINTS.LESSON_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(lesson),
    });
  }

  async deleteLesson(id: number): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(API_ENDPOINTS.LESSON_BY_ID(id), {
      method: 'DELETE',
    });
  }

  // Steps endpoints
  async getSteps(): Promise<Step[]> {
    return this.makeRequest<Step[]>(API_ENDPOINTS.STEPS);
  }

  async getStepById(id: number): Promise<Step> {
    return this.makeRequest<Step>(API_ENDPOINTS.STEP_BY_ID(id));
  }

  async getStepsByLesson(lessonId: number): Promise<Step[]> {
    return this.makeRequest<Step[]>(API_ENDPOINTS.STEPS_BY_LESSON(lessonId));
  }

  async getStepWithOptions(id: number): Promise<Step> {
    return this.makeRequest<Step>(API_ENDPOINTS.STEP_WITH_OPTIONS(id));
  }

  async getStepsByLessonWithOptions(lessonId: number): Promise<Step[]> {
    return this.makeRequest<Step[]>(API_ENDPOINTS.STEPS_BY_LESSON_WITH_OPTIONS(lessonId));
  }

  async createStep(step: Partial<Step>): Promise<Step> {
    return this.makeRequest<Step>(API_ENDPOINTS.STEPS, {
      method: 'POST',
      body: JSON.stringify(step),
    });
  }

  async updateStep(id: number, step: Partial<Step>): Promise<Step> {
    return this.makeRequest<Step>(API_ENDPOINTS.STEP_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(step),
    });
  }

  async deleteStep(id: number): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(API_ENDPOINTS.STEP_BY_ID(id), {
      method: 'DELETE',
    });
  }

  // Options endpoints
  async getOptions(): Promise<Option[]> {
    return this.makeRequest<Option[]>(API_ENDPOINTS.OPTIONS);
  }

  async getOptionById(id: number): Promise<Option> {
    return this.makeRequest<Option>(API_ENDPOINTS.OPTION_BY_ID(id));
  }

  async getOptionsByStep(stepId: number): Promise<Option[]> {
    return this.makeRequest<Option[]>(API_ENDPOINTS.OPTIONS_BY_STEP(stepId));
  }

  async createOption(option: Partial<Option>): Promise<Option> {
    return this.makeRequest<Option>(API_ENDPOINTS.OPTIONS, {
      method: 'POST',
      body: JSON.stringify(option),
    });
  }

  async updateOption(id: number, option: Partial<Option>): Promise<Option> {
    return this.makeRequest<Option>(API_ENDPOINTS.OPTION_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(option),
    });
  }

  async deleteOption(id: number): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(API_ENDPOINTS.OPTION_BY_ID(id), {
      method: 'DELETE',
    });
  }

  async createBatchOptions(options: Partial<Option>[]): Promise<Option[]> {
    return this.makeRequest<Option[]>(`${API_ENDPOINTS.OPTIONS}/batch`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async deleteOptionsByStep(stepId: number): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`${API_ENDPOINTS.OPTIONS}/step/${stepId}`, {
      method: 'DELETE',
    });
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>(API_ENDPOINTS.AUTH_LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return this.makeRequest<RegisterResponse>(API_ENDPOINTS.AUTH_REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // User endpoints
  async getUserProfile(id: number): Promise<{ user: User; stats?: UserStats }> {
    return this.makeRequest<{ user: User; stats?: UserStats }>(API_ENDPOINTS.USER_BY_ID(id));
  }

  async updateUserProfile(id: number, userData: Partial<User>): Promise<{ message: string; user: User }> {
    return this.makeRequest<{ message: string; user: User }>(API_ENDPOINTS.USER_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async getUserStats(id: number): Promise<{ stats: UserStats }> {
    return this.makeRequest<{ stats: UserStats }>(API_ENDPOINTS.USER_STATS(id));
  }

  async updateUserStats(id: number, stats: Partial<UserStats>): Promise<{ message: string; stats: UserStats }> {
    return this.makeRequest<{ message: string; stats: UserStats }>(API_ENDPOINTS.USER_STATS(id), {
      method: 'PUT',
      body: JSON.stringify(stats),
    });
  }

  async getUserProgress(id: number): Promise<{ progress: any[] }> {
    return this.makeRequest<{ progress: any[] }>(API_ENDPOINTS.USER_PROGRESS(id));
  }

  async saveUserProgress(id: number, progress: any): Promise<{ message: string; progress: any }> {
    return this.makeRequest<{ message: string; progress: any }>(API_ENDPOINTS.USER_PROGRESS(id), {
      method: 'POST',
      body: JSON.stringify(progress),
    });
  }

  // Achievements endpoints
  async getAchievements(): Promise<Achievement[]> {
    return this.makeRequest<Achievement[]>(API_ENDPOINTS.ACHIEVEMENTS);
  }

  async getAchievementById(id: number): Promise<Achievement> {
    return this.makeRequest<Achievement>(API_ENDPOINTS.ACHIEVEMENT_BY_ID(id));
  }

  async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    return this.makeRequest<Achievement[]>(API_ENDPOINTS.ACHIEVEMENTS_BY_CATEGORY(category));
  }

  async getAchievementsByRarity(rarity: string): Promise<Achievement[]> {
    return this.makeRequest<Achievement[]>(API_ENDPOINTS.ACHIEVEMENTS_BY_RARITY(rarity));
  }

  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return this.makeRequest<UserAchievement[]>(API_ENDPOINTS.USER_ACHIEVEMENTS(userId));
  }

  async unlockAchievement(userId: number, achievementId: number): Promise<{ message: string; achievement: UserAchievement }> {
    return this.makeRequest<{ message: string; achievement: UserAchievement }>(
      API_ENDPOINTS.UNLOCK_ACHIEVEMENT(userId, achievementId),
      { method: 'POST' }
    );
  }

  async updateAchievementProgress(userId: number, achievementId: number, progress: number): Promise<{ message: string; achievement: UserAchievement }> {
    return this.makeRequest<{ message: string; achievement: UserAchievement }>(
      API_ENDPOINTS.UPDATE_ACHIEVEMENT_PROGRESS(userId, achievementId),
      {
        method: 'PUT',
        body: JSON.stringify({ progress }),
      }
    );
  }

  // Sessions endpoints
  async startSession(sessionData: Partial<GameSession>): Promise<{ message: string; session: GameSession }> {
    return this.makeRequest<{ message: string; session: GameSession }>(API_ENDPOINTS.START_SESSION, {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async endSession(sessionId: number, endData: Partial<GameSession>): Promise<{ message: string; session: GameSession }> {
    return this.makeRequest<{ message: string; session: GameSession }>(API_ENDPOINTS.END_SESSION(sessionId), {
      method: 'PUT',
      body: JSON.stringify(endData),
    });
  }

  async updateSession(sessionId: number, sessionData: Partial<GameSession>): Promise<{ message: string; session: GameSession }> {
    return this.makeRequest<{ message: string; session: GameSession }>(API_ENDPOINTS.UPDATE_SESSION(sessionId), {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });
  }

  async getSessionById(sessionId: number): Promise<GameSession> {
    return this.makeRequest<GameSession>(API_ENDPOINTS.SESSION_BY_ID(sessionId));
  }

  async getUserSessions(userId: number): Promise<GameSession[]> {
    return this.makeRequest<GameSession[]>(API_ENDPOINTS.USER_SESSIONS(userId));
  }

  async getLessonSessions(lessonId: number): Promise<GameSession[]> {
    return this.makeRequest<GameSession[]>(API_ENDPOINTS.LESSON_SESSIONS(lessonId));
  }

  async getStepSessions(stepId: number): Promise<GameSession[]> {
    return this.makeRequest<GameSession[]>(API_ENDPOINTS.STEP_SESSIONS(stepId));
  }

  async getUserSessionStats(userId: number): Promise<SessionStats> {
    return this.makeRequest<SessionStats>(API_ENDPOINTS.USER_SESSION_STATS(userId));
  }

  // Settings endpoints
  async getSettings(): Promise<AppSettings[]> {
    return this.makeRequest<AppSettings[]>(API_ENDPOINTS.SETTINGS);
  }

  async getSettingById(id: number): Promise<AppSettings> {
    return this.makeRequest<AppSettings>(API_ENDPOINTS.SETTING_BY_ID(id));
  }

  async getSettingByKey(key: string): Promise<AppSettings> {
    return this.makeRequest<AppSettings>(API_ENDPOINTS.SETTING_BY_KEY(key));
  }

  async getSettingsByCategory(category: string): Promise<AppSettings[]> {
    return this.makeRequest<AppSettings[]>(API_ENDPOINTS.SETTINGS_BY_CATEGORY(category));
  }

  async getActiveSettings(): Promise<AppSettings[]> {
    return this.makeRequest<AppSettings[]>(API_ENDPOINTS.ACTIVE_SETTINGS);
  }

  async getSettingsMap(): Promise<Record<string, string>> {
    return this.makeRequest<Record<string, string>>(API_ENDPOINTS.SETTINGS_MAP);
  }

  async updateSettingByKey(key: string, value: string): Promise<{ message: string; setting: AppSettings }> {
    return this.makeRequest<{ message: string; setting: AppSettings }>(API_ENDPOINTS.SETTING_BY_KEY(key), {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }

  async bulkUpdateSettings(settings: Record<string, string>): Promise<{ message: string; updated_count: number }> {
    return this.makeRequest<{ message: string; updated_count: number }>(API_ENDPOINTS.BULK_UPDATE_SETTINGS, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async resetSettings(): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(API_ENDPOINTS.RESET_SETTINGS, {
      method: 'POST',
    });
  }

  // User Settings endpoints
  async getUserSettings(userId: number, category?: string): Promise<{ user_id: number; settings: UserSettings[] }> {
    const endpoint = category 
      ? `${API_ENDPOINTS.USER_SETTINGS(userId)}?category=${category}`
      : API_ENDPOINTS.USER_SETTINGS(userId);
    return this.makeRequest<{ user_id: number; settings: UserSettings[] }>(endpoint);
  }

  async getUserSettingByKey(userId: number, key: string): Promise<UserSettings> {
    return this.makeRequest<UserSettings>(API_ENDPOINTS.USER_SETTING_BY_KEY(userId, key));
  }

  async createUserSetting(userId: number, setting: Partial<UserSettings>): Promise<{ message: string; setting: UserSettings }> {
    return this.makeRequest<{ message: string; setting: UserSettings }>(API_ENDPOINTS.USER_SETTINGS(userId), {
      method: 'POST',
      body: JSON.stringify(setting),
    });
  }

  async updateUserSetting(userId: number, key: string, updateData: { value: string; category?: string; is_active?: boolean }): Promise<{ message: string; setting: UserSettings }> {
    return this.makeRequest<{ message: string; setting: UserSettings }>(API_ENDPOINTS.USER_SETTING_BY_KEY(userId, key), {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteUserSetting(userId: number, key: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(API_ENDPOINTS.USER_SETTING_BY_KEY(userId, key), {
      method: 'DELETE',
    });
  }

  async getUserSettingsMap(userId: number, category?: string): Promise<{ user_id: number; settings: Record<string, string> }> {
    const endpoint = category 
      ? `${API_ENDPOINTS.USER_SETTINGS_MAP(userId)}?category=${category}`
      : API_ENDPOINTS.USER_SETTINGS_MAP(userId);
    return this.makeRequest<{ user_id: number; settings: Record<string, string> }>(endpoint);
  }

  async bulkUpdateUserSettings(userId: number, settings: Record<string, string>): Promise<{ message: string; user_id: number; updated_count: number }> {
    return this.makeRequest<{ message: string; user_id: number; updated_count: number }>(API_ENDPOINTS.BULK_UPDATE_USER_SETTINGS(userId), {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async initializeUserSettings(userId: number): Promise<{ message: string; user_id: number }> {
    return this.makeRequest<{ message: string; user_id: number }>(API_ENDPOINTS.INITIALIZE_USER_SETTINGS(userId), {
      method: 'POST',
    });
  }

  // Password Recovery endpoints
  async recoverPassword(username: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(API_ENDPOINTS.AUTH_RECOVER_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async verifyRecoveryCode(code: string): Promise<{ 
    state: 'not_found' | 'expired' | 'used' | 'verified'; 
    user_id?: number;
  }> {
    return this.makeRequest<{ 
      state: 'not_found' | 'expired' | 'used' | 'verified'; 
      user_id?: number;
    }>(API_ENDPOINTS.AUTH_VERIFY_CODE, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async consumeRecoveryCode(code: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(API_ENDPOINTS.AUTH_CONSUME_CODE, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async resetPassword(userId: number, password: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(API_ENDPOINTS.AUTH_RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, password }),
    });
  }

  // Health check
  async healthCheck(): Promise<string> {
    return this.makeRequest<string>(API_ENDPOINTS.HEALTH);
  }
}

export default new ApiService();