// src/hooks/useAuth.tsx
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService, { User, UserStats, LoginRequest, RegisterRequest } from '../services/ApiService';

export interface AuthUser extends User {
  stats?: UserStats;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  register: (userData: RegisterRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<User>;
  refreshUser: () => Promise<AuthUser | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: '@neuroapp_user',
  TOKEN: '@neuroapp_token',
};

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Cargar usuario desde AsyncStorage
  const loadUserFromStorage = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (err) {
      console.error('Error loading user from storage:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Guardar usuario en AsyncStorage
  const saveUserToStorage = useCallback(async (userData: AuthUser) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    } catch (err) {
      console.error('Error saving user to storage:', err);
    }
  }, []);

  // Limpiar datos de AsyncStorage
  const clearUserFromStorage = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);
    } catch (err) {
      console.error('Error clearing user from storage:', err);
    }
  }, []);

  // Login
  const login = useCallback(async (credentials: LoginRequest): Promise<AuthUser> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.login(credentials);
      const authUser: AuthUser = {
        ...response.user,
        stats: response.stats,
      };
      
      setUser(authUser);
      await saveUserToStorage(authUser);
      
      return authUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error during login';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [saveUserToStorage]);

  // Register
  const register = useCallback(async (userData: RegisterRequest): Promise<AuthUser> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.register(userData);
      const authUser: AuthUser = response.user;
      
      setUser(authUser);
      await saveUserToStorage(authUser);
      
      return authUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error during registration';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [saveUserToStorage]);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setUser(null);
      await clearUserFromStorage();
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setLoading(false);
    }
  }, [clearUserFromStorage]);

  // Actualizar perfil
  const updateProfile = useCallback(async (userData: Partial<User>): Promise<User> => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await ApiService.updateUserProfile(user.id, userData);
      const updatedUser: AuthUser = {
        ...user,
        ...response.user,
      };
      
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
      
      return response.user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, saveUserToStorage]);

  // Refrescar datos del usuario
  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      setError(null);
      
      const [profileResponse, statsResponse] = await Promise.all([
        ApiService.getUserProfile(user.id),
        ApiService.getUserStats(user.id).catch(() => ({ stats: undefined }))
      ]);
      
      const refreshedUser: AuthUser = {
        ...profileResponse.user,
        stats: statsResponse.stats || user.stats,
      };
      
      setUser(refreshedUser);
      await saveUserToStorage(refreshedUser);
      
      return refreshedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error refreshing user data';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, saveUserToStorage]);

  // Actualizar estadísticas del usuario en el contexto
  const updateUserStats = useCallback(async (stats: UserStats) => {
    if (!user) return;

    const updatedUser: AuthUser = {
      ...user,
      stats,
    };
    
    setUser(updatedUser);
    await saveUserToStorage(updatedUser);
  }, [user, saveUserToStorage]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Verificar si el usuario está activo
  const isUserActive = useCallback(() => {
    return user?.is_active || false;
  }, [user]);

  // Obtener nombre completo del usuario
  const getFullName = useCallback(() => {
    if (!user) return '';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  }, [user]);

  // Verificar si el perfil está completo
  const isProfileComplete = useCallback(() => {
    if (!user) return false;
    return !!(user.first_name && user.last_name && user.date_of_birth);
  }, [user]);

  // Cargar usuario al inicializar
  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  return {
    // Estado
    user,
    isAuthenticated,
    loading,
    error,
    
    // Acciones principales
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    
    // Utilidades
    updateUserStats,
    isUserActive,
    getFullName,
    isProfileComplete,
    clearError,
  };
};

// Provider del contexto de autenticación
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto de autenticación
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;