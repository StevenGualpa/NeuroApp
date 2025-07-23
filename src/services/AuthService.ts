// src/services/AuthService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService, { User, UserStats, LoginRequest, RegisterRequest } from './ApiService';

const STORAGE_KEYS = {
  USER: '@neuroapp_user',
  USER_STATS: '@neuroapp_user_stats',
  IS_LOGGED_IN: '@neuroapp_is_logged_in',
  LAST_LOGIN: '@neuroapp_last_login',
};

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  userStats: UserStats | null;
  isLoading: boolean;
}

class AuthService {
  private authState: AuthState = {
    isLoggedIn: false,
    user: null,
    userStats: null,
    isLoading: false,
  };

  private listeners: ((state: AuthState) => void)[] = [];

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of state changes
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState));
  }

  // Update auth state
  private updateState(updates: Partial<AuthState>) {
    this.authState = { ...this.authState, ...updates };
    this.notifyListeners();
  }

  // Get current auth state
  getAuthState(): AuthState {
    return this.authState;
  }

  // Initialize auth service (check if user is already logged in)
  async initialize(): Promise<void> {
    try {
      this.updateState({ isLoading: true });

      const [isLoggedIn, userJson, userStatsJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.USER_STATS),
      ]);

      if (isLoggedIn === 'true' && userJson) {
        const user = JSON.parse(userJson);
        const userStats = userStatsJson ? JSON.parse(userStatsJson) : null;

        this.updateState({
          isLoggedIn: true,
          user,
          userStats,
          isLoading: false,
        });
      } else {
        this.updateState({ isLoading: false });
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
      this.updateState({ isLoading: false });
    }
  }

  // Login with email/username and password
  async login(credentials: LoginRequest): Promise<{ success: boolean; message: string }> {
    try {
      this.updateState({ isLoading: true });

      console.log('🔐 Attempting login with:', {
        email: credentials.email,
        username: credentials.username,
        password: '[HIDDEN - LENGTH: ' + credentials.password.length + ']'
      });

      const response = await ApiService.login(credentials);

      console.log('✅ Login successful:', response.message);

      // Store user data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true'),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user)),
        AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(response.stats || {})),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString()),
      ]);

      this.updateState({
        isLoggedIn: true,
        user: response.user,
        userStats: response.stats || null,
        isLoading: false,
      });

      return {
        success: true,
        message: response.message || 'Login exitoso',
      };
    } catch (error) {
      this.updateState({ isLoading: false });
      
      console.error('❌ Login failed:', error);
      
      let message = 'Error de conexión. Verifica tu internet.';
      if (error instanceof Error) {
        console.log('🔍 Error details:', error.message);
        
        if (error.message.includes('401')) {
          message = 'Credenciales incorrectas. Verifica tu email/usuario y contraseña.';
        } else if (error.message.includes('404')) {
          message = 'Usuario no encontrado.';
        } else if (error.message.includes('500')) {
          message = 'Error del servidor. Intenta más tarde.';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          message = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
        } else {
          // Use the actual error message if it's descriptive
          message = error.message;
        }
      }

      return {
        success: false,
        message,
      };
    }
  }

  // Register new user (NO automatic login)
  async register(userData: RegisterRequest): Promise<{ success: boolean; message: string }> {
    try {
      this.updateState({ isLoading: true });

      // Prepare registration data ensuring all fields are properly formatted
      const registrationData: RegisterRequest = {
        username: userData.username.trim(),
        email: userData.email.trim(),
        password: userData.password, // CRITICAL: Send password as-is, don't trim
        first_name: userData.first_name?.trim() || '',
        last_name: userData.last_name?.trim() || '',
      };

      console.log('📝 Attempting registration with data:');
      console.log('📤 Username:', registrationData.username);
      console.log('📤 Email:', registrationData.email);
      console.log('📤 First Name:', registrationData.first_name);
      console.log('📤 Last Name:', registrationData.last_name);
      console.log('📤 Password: [HIDDEN - LENGTH:', registrationData.password.length + ']');

      // Verify password is not empty
      if (!registrationData.password || registrationData.password.length === 0) {
        throw new Error('Password is required and cannot be empty');
      }

      console.log('🚀 Sending registration request to API...');
      const response = await ApiService.register(registrationData);

      console.log('✅ Registration successful:', response.message);

      this.updateState({ isLoading: false });

      return {
        success: true,
        message: 'Usuario creado exitosamente',
      };
    } catch (error) {
      this.updateState({ isLoading: false });
      
      console.error('❌ Registration failed:', error);
      
      let message = 'Error de conexión. Verifica tu internet.';
      if (error instanceof Error) {
        console.log('🔍 Registration error details:', error.message);
        
        if (error.message.includes('409') || error.message.includes('already exists')) {
          message = 'El usuario ya existe. Intenta con otro email o nombre de usuario.';
        } else if (error.message.includes('400') || error.message.includes('Invalid')) {
          message = 'Datos inválidos. Verifica la información ingresada.';
        } else if (error.message.includes('500') || error.message.includes('server')) {
          message = 'Error del servidor. Intenta más tarde.';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          message = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
        } else {
          // Use the actual error message if it's descriptive
          message = error.message;
        }
      }

      return {
        success: false,
        message,
      };
    }
  }

  // Register and login in one step (if needed for testing)
  async registerAndLogin(userData: RegisterRequest): Promise<{ success: boolean; message: string }> {
    try {
      // First register
      const registerResult = await this.register(userData);
      
      if (!registerResult.success) {
        return registerResult;
      }

      console.log('🔄 Registration successful, attempting auto-login...');

      // Wait a moment for the backend to process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then login
      const loginResult = await this.login({
        email: userData.email,
        password: userData.password,
      });

      if (loginResult.success) {
        return {
          success: true,
          message: 'Registro y login exitosos',
        };
      } else {
        return {
          success: true, // Registration was successful
          message: `Registro exitoso, pero hubo un problema con el login automático: ${loginResult.message}. Por favor, inicia sesión manualmente.`,
        };
      }
    } catch (error) {
      console.error('❌ Register and login failed:', error);
      return {
        success: false,
        message: 'Error durante el registro y login',
      };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Clear stored data
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_STATS),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_LOGIN),
      ]);

      this.updateState({
        isLoggedIn: false,
        user: null,
        userStats: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.authState.user) {
        return { success: false, message: 'No user logged in' };
      }

      this.updateState({ isLoading: true });

      const response = await ApiService.updateUserProfile(this.authState.user.id, updates);

      // Update stored user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));

      this.updateState({
        user: response.user,
        isLoading: false,
      });

      return {
        success: true,
        message: response.message || 'Perfil actualizado',
      };
    } catch (error) {
      this.updateState({ isLoading: false });
      return {
        success: false,
        message: 'Error al actualizar el perfil',
      };
    }
  }

  // Refresh user stats
  async refreshUserStats(): Promise<void> {
    try {
      if (!this.authState.user) return;

      const response = await ApiService.getUserStats(this.authState.user.id);
      
      // Update stored stats
      await AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(response.stats));

      this.updateState({
        userStats: response.stats,
      });
    } catch (error) {
      console.error('Error refreshing user stats:', error);
    }
  }

  // Check if user is logged in
  isAuthenticated(): boolean {
    return this.authState.isLoggedIn;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.authState.user;
  }

  // Get current user stats
  getCurrentUserStats(): UserStats | null {
    return this.authState.userStats;
  }

  // Guest login (for demo purposes)
  async guestLogin(): Promise<void> {
    const guestUser: User = {
      id: 0,
      username: 'guest',
      email: 'guest@neuroapp.com',
      first_name: 'Usuario',
      last_name: 'Invitado',
      is_active: true,
    };

    const guestStats: UserStats = {
      ID: 0,
      UserID: 0,
      total_activities_completed: 0,
      total_stars_earned: 0,
      days_playing: 0,
      favorite_activity: '',
      total_play_time: 0,
      helpful_attempts: 0,
      improvement_moments: 0,
      exploration_points: 0,
      last_activity_date: new Date().toISOString(),
    };

    // Store guest data
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true'),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(guestUser)),
      AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(guestStats)),
      AsyncStorage.setItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString()),
    ]);

    this.updateState({
      isLoggedIn: true,
      user: guestUser,
      userStats: guestStats,
      isLoading: false,
    });
  }
}

export default new AuthService();