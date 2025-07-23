import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import AuthService from '../services/AuthService';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Animation refs
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const buttonAnimation = useRef(new Animated.Value(1)).current;
  const loadingAnimation = useRef(new Animated.Value(0)).current;
  const modeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(formAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu correo electrónico');
      return false;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu contraseña');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (isRegisterMode) {
      if (!name.trim()) {
        Alert.alert('Error', 'Por favor ingresa tu nombre');
        return false;
      }

      if (name.trim().length < 2) {
        Alert.alert('Error', 'El nombre debe tener al menos 2 caracteres');
        return false;
      }

      if (!confirmPassword.trim()) {
        Alert.alert('Error', 'Por favor confirma tu contraseña');
        return false;
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      shakeForm();
      return;
    }

    setIsLoading(true);

    // Button press animation
    Animated.timing(buttonAnimation, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();

    // Loading animation
    const loadingLoop = Animated.loop(
      Animated.timing(loadingAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    loadingLoop.start();

    try {
      if (isRegisterMode) {
        console.log('📝 [LoginScreen] Intentando registro con:', { 
          email: email.trim(), 
          name: name.trim() 
        });
        
        // Split name into first and last name
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const result = await AuthService.register({
          username: email.trim(), // Use email as username for simplicity
          email: email.trim(),
          password: password,
          first_name: firstName,
          last_name: lastName,
        });
        
        if (result.success) {
          console.log('✅ [LoginScreen] Registro exitoso');
          
          // Stop loading animation
          loadingLoop.stop();
          setIsLoading(false);
          
          Alert.alert(
            '¡Registro exitoso!',
            'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Switch to login mode
                  setIsRegisterMode(false);
                  setConfirmPassword('');
                  setName('');
                  // Keep email and password for easy login
                }
              }
            ]
          );
        } else {
          throw new Error(result.message || 'Error en el registro');
        }
      } else {
        console.log('🔐 [LoginScreen] Intentando login con:', { email: email.trim() });
        
        const result = await AuthService.login({
          email: email.trim(),
          password: password,
        });
        
        if (result.success) {
          console.log('✅ [LoginScreen] Login exitoso');
          
          // Stop loading animation
          loadingLoop.stop();
          
          // Success animation and navigation
          Animated.timing(formAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            navigation.replace('onboarding');
          });
        } else {
          throw new Error(result.message || 'Credenciales incorrectas');
        }
      }
    } catch (error) {
      console.error(`❌ [LoginScreen] Error en ${isRegisterMode ? 'registro' : 'login'}:`, error);
      
      // Stop loading animation
      loadingLoop.stop();
      setIsLoading(false);
      
      // Reset button animation
      Animated.timing(buttonAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();

      // Show error
      const errorMessage = error instanceof Error ? error.message : 
        (isRegisterMode 
          ? 'No se pudo crear la cuenta. Es posible que el correo ya esté registrado.'
          : 'Correo electrónico o contraseña incorrectos. Por favor verifica tus credenciales.');
      
      Alert.alert(
        isRegisterMode ? 'Error de registro' : 'Error de inicio de sesión',
        errorMessage,
        [{ text: 'OK' }]
      );
      
      shakeForm();
    }
  };

  const shakeForm = () => {
    Animated.sequence([
      Animated.timing(formAnimation, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(formAnimation, { toValue: 1.05, duration: 100, useNativeDriver: true }),
      Animated.timing(formAnimation, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const toggleMode = () => {
    if (isLoading) return;

    // Animate mode change
    Animated.timing(modeAnimation, {
      toValue: isRegisterMode ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setIsRegisterMode(!isRegisterMode);
    
    // Clear form when switching modes
    if (!isRegisterMode) {
      // Switching to register mode
      setConfirmPassword('');
      setName('');
    } else {
      // Switching to login mode
      setConfirmPassword('');
      setName('');
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperar contraseña',
      'Para recuperar tu contraseña, contacta al administrador del sistema.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4285f4" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo and Welcome Section */}
          <Animated.View 
            style={[
              styles.logoSection,
              {
                opacity: logoAnimation,
                transform: [{
                  translateY: logoAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  })
                }]
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>🧠</Text>
              <Text style={styles.logoText}>NeuroApp</Text>
            </View>
            <Text style={styles.welcomeText}>
              {isRegisterMode ? '¡Únete a nosotros!' : '¡Bienvenido de vuelta!'}
            </Text>
            <Text style={styles.subtitleText}>
              {isRegisterMode 
                ? 'Crea tu cuenta y comienza a aprender'
                : 'Continúa tu aventura de aprendizaje'
              }
            </Text>
          </Animated.View>

          {/* Login/Register Form */}
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: formAnimation,
                transform: [{
                  translateY: formAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }]
              }
            ]}
          >
            <View style={styles.inputContainer}>
              {/* Name field (only for register) */}
              {isRegisterMode && (
                <Animated.View 
                  style={[
                    styles.inputWrapper,
                    {
                      opacity: modeAnimation,
                      transform: [{
                        translateY: modeAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre completo"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={name}
                    onChangeText={setName}
                    editable={!isLoading}
                  />
                </Animated.View>
              )}

              {/* Email field */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                />
              </View>

              {/* Password field */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '👁️' : '🙈'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Confirm Password field (only for register) */}
              {isRegisterMode && (
                <Animated.View 
                  style={[
                    styles.inputWrapper,
                    {
                      opacity: modeAnimation,
                      transform: [{
                        translateY: modeAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.inputIcon}>🔐</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmar contraseña"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Text style={styles.eyeIcon}>
                      {showConfirmPassword ? '👁️' : '🙈'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>

            {/* Forgot Password (only for login) */}
            {!isRegisterMode && (
              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <Animated.View style={{ transform: [{ scale: buttonAnimation }] }}>
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonLoading]}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Animated.View 
                      style={[
                        styles.loadingSpinner,
                        {
                          transform: [{
                            rotate: loadingAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            })
                          }]
                        }
                      ]}
                    >
                      <Text style={styles.loadingIcon}>⚡</Text>
                    </Animated.View>
                    <Text style={styles.submitButtonText}>
                      {isRegisterMode ? 'Creando cuenta...' : 'Iniciando sesión...'}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.submitButtonIcon}>
                      {isRegisterMode ? '📝' : '🚀'}
                    </Text>
                    <Text style={styles.submitButtonText}>
                      {isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Mode Toggle */}
            <View style={styles.modeToggleContainer}>
              <Text style={styles.modeToggleText}>
                {isRegisterMode 
                  ? '¿Ya tienes una cuenta?' 
                  : '¿No tienes una cuenta?'
                }
              </Text>
              <TouchableOpacity
                style={styles.modeToggleButton}
                onPress={toggleMode}
                disabled={isLoading}
              >
                <Text style={styles.modeToggleButtonText}>
                  {isRegisterMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🌟 Aprende, juega y crece con NeuroApp ✨
            </Text>
            <Text style={styles.versionText}>
              Versión 1.0.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4285f4',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    fontSize: 80,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8faff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e8f0fe',
    paddingHorizontal: 16,
    position: 'relative',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4285f4',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4285f4',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  submitButtonLoading: {
    backgroundColor: '#6b7280',
  },
  submitButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginRight: 8,
  },
  loadingIcon: {
    fontSize: 20,
  },
  modeToggleContainer: {
    alignItems: 'center',
  },
  modeToggleText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  modeToggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modeToggleButtonText: {
    fontSize: 16,
    color: '#4285f4',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontWeight: '400',
  },
});

export default LoginScreen;