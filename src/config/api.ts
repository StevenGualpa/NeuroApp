// src/config/api.ts
export const API_CONFIG = {
  BASE_URL: 'https://facturago.onrender.com',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

export const API_ENDPOINTS = {
  // Activities
  ACTIVITIES: '/activities',
  ACTIVITY_BY_ID: (id: number) => `/activities/${id}`,
  
  // Categories
  CATEGORIES: '/categories',
  CATEGORY_BY_ID: (id: number) => `/categories/${id}`,
  
  // Lessons
  LESSONS: '/lessons',
  LESSON_BY_ID: (id: number) => `/lessons/${id}`,
  LESSONS_BY_CATEGORY: (categoryId: number) => `/lessons/category/${categoryId}`,
  LESSON_WITH_STEPS: (id: number) => `/lessons/${id}/with-steps`,
  LESSONS_WITH_STEPS: '/lessons/with-steps',
  
  // Steps
  STEPS: '/steps',
  STEP_BY_ID: (id: number) => `/steps/${id}`,
  STEPS_BY_LESSON: (lessonId: number) => `/steps/lesson/${lessonId}`,
  STEP_WITH_OPTIONS: (id: number) => `/steps/${id}/with-options`,
  STEPS_BY_LESSON_WITH_OPTIONS: (lessonId: number) => `/steps/lesson/${lessonId}/with-options`,
  
  // Options
  OPTIONS: '/options',
  OPTION_BY_ID: (id: number) => `/options/${id}`,
  OPTIONS_BY_STEP: (stepId: number) => `/options/step/${stepId}`,
  
  // Authentication
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  
  // Users
  USERS: '/users',
  USER_BY_ID: (id: number) => `/users/${id}`,
  USER_STATS: (id: number) => `/users/${id}/stats`,
  USER_PROGRESS: (id: number) => `/users/${id}/progress`,
  
  // Achievements
  ACHIEVEMENTS: '/achievements',
  ACHIEVEMENT_BY_ID: (id: number) => `/achievements/${id}`,
  ACHIEVEMENTS_BY_CATEGORY: (category: string) => `/achievements/category/${category}`,
  ACHIEVEMENTS_BY_RARITY: (rarity: string) => `/achievements/rarity/${rarity}`,
  USER_ACHIEVEMENTS: (userId: number) => `/achievements/user/${userId}`,
  UNLOCK_ACHIEVEMENT: (userId: number, achievementId: number) => `/achievements/user/${userId}/${achievementId}/unlock`,
  UPDATE_ACHIEVEMENT_PROGRESS: (userId: number, achievementId: number) => `/achievements/user/${userId}/${achievementId}/progress`,
  
  // Sessions
  SESSIONS: '/sessions',
  SESSION_BY_ID: (id: number) => `/sessions/${id}`,
  START_SESSION: '/sessions',
  END_SESSION: (id: number) => `/sessions/${id}/end`,
  UPDATE_SESSION: (id: number) => `/sessions/${id}`,
  USER_SESSIONS: (userId: number) => `/sessions/user/${userId}`,
  LESSON_SESSIONS: (lessonId: number) => `/sessions/lesson/${lessonId}`,
  STEP_SESSIONS: (stepId: number) => `/sessions/step/${stepId}`,
  USER_SESSION_STATS: (userId: number) => `/sessions/user/${userId}/stats`,
  
  // Settings
  SETTINGS: '/settings',
  SETTING_BY_ID: (id: number) => `/settings/${id}`,
  SETTING_BY_KEY: (key: string) => `/settings/key/${key}`,
  SETTINGS_BY_CATEGORY: (category: string) => `/settings/category/${category}`,
  ACTIVE_SETTINGS: '/settings/active',
  SETTINGS_MAP: '/settings/map',
  BULK_UPDATE_SETTINGS: '/settings/bulk',
  RESET_SETTINGS: '/settings/reset',
  
  // Health
  HEALTH: '/',
};

export default API_CONFIG;