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
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import AuthService from '../services/AuthService';

const { width, height } = Dimensions.get('window');

const RealLoginScreen = () => {
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [useEmail, setUseEmail] = useState(true);
  
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Animation refs
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const buttonAnimation = useRef(new Animated.Value(1)).current;
  const loadingAnimation = useRef(new Animated.Value(0)).current;
  const modeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initialize auth service
    AuthService.initialize();

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

  const validateForm = () => {
    if (isRegisterMode) {
      if (!username.trim()) {
        Alert.alert('Error', 'El nombre de usuario es requerido');
        return false;
      }
      if (!email.trim()) {
        Alert.alert('Error', 'El email es requerido');
        return false;
      }
      if (!password) {
        Alert.alert('Error', 'La contraseña es requerida');
        return false;
      }
      if (password.length < 5) {
        Alert.alert('Error', 'La contraseña debe tener al menos 5 caracteres');
        return false;
      }
      if (!firstName.trim()) {
        Alert.alert('Error', 'El nombre es requerido');
        return false;
      }
      if (!lastName.trim()) {
        Alert.alert('Error', 'El apellido es requerido');
        return false;
      }
    } else {
      if (useEmail && !email.trim()) {
        Alert.alert('Error', 'El email es requerido');
        return false;
      }
      if (!useEmail && !username.trim()) {
        Alert.alert('Error', 'El nombre de usuario es requerido');
        return false;
      }
      if (!password) {
        Alert.alert('Error', 'La contraseña es requerida');
        return false;
      }
    }
    return true;
  };

  const handleAuth = async () => {
    if (!validateForm()) {
      // Shake animation for validation errors
      Animated.sequence([
        Animated.timing(formAnimation, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(formAnimation, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.timing(formAnimation, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
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
    Animated.loop(
      Animated.timing(loadingAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    try {
      if (isRegisterMode) {
        console.log('🚀 Starting registration process...');
        
        // Register new user
        const result = await AuthService.register({
          username: username.trim(),
          email: email.trim(),
          password: password, // IMPORTANT: Don't trim password
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        });

        if (result.success) {
          // Show success message and switch to login mode
          Alert.alert(
            'Usuario Creado',
            'Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.',
            [
              {
                text: 'Iniciar Sesión',
                onPress: () => {
                  // Switch to login mode and pre-fill email
                  setIsRegisterMode(false);
                  setUseEmail(true);
                  // Keep email and clear other fields
                  setPassword('');
                  setUsername('');
                  setFirstName('');
                  setLastName('');
                  
                  // Animate mode change
                  Animated.timing(modeAnimation, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }).start();
                }
              }
            ]
          );
        } else {
          // Show registration error
          Alert.alert(
            'Error de Registro',
            result.message,
            [{ text: 'OK' }]
          );
        }
      } else {
        console.log('🔐 Starting login process...');
        
        // Login existing user
        const credentials = useEmail 
          ? { email: email.trim(), password: password }
          : { username: username.trim(), password: password };
        
        const result = await AuthService.login(credentials);

        if (result.success) {
          // Success animation and navigation to onboarding
          Animated.timing(formAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            navigation.replace('onboarding');
          });
        } else {
          // Show login error
          Alert.alert(
            'Error de Login',
            result.message,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
      Alert.alert(
        'Error de Conexión',
        'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      
      // Reset button animation
      Animated.timing(buttonAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();

      // Stop loading animation
      loadingAnimation.stopAnimation();
      loadingAnimation.setValue(0);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    
    try {
      await AuthService.guestLogin();
      
      // Success animation and navigation
      Animated.timing(formAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('onboarding');
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar sesión como invitado');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    
    // Clear form
    setEmail('');
    setPassword('');
    setUsername('');
    setFirstName('');
    setLastName('');
    
    // Animate mode change
    Animated.timing(modeAnimation, {
      toValue: isRegisterMode ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const toggleLoginMethod = () => {
    setUseEmail(!useEmail);
    setEmail('');
    setUsername('');
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
              <Text style={styles.realBadge}>REAL API</Text>
            </View>
            <Text style={styles.welcomeText}>
              {isRegisterMode ? '¡Únete a nosotros!' : '¡Bienvenido de vuelta!'}
            </Text>
            <Text style={styles.subtitleText}>
              {isRegisterMode 
                ? 'Crea tu cuenta y comienza tu aventura'
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
              {/* Register Mode Fields */}
              {isRegisterMode && (
                <>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nombre de usuario"
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="none"
                      value={username}
                      onChangeText={setUsername}
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.nameRow}>
                    <View style={[styles.inputWrapper, styles.halfInput]}>
                      <Text style={styles.inputIcon}>👨</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Nombre"
                        placeholderTextColor="#9ca3af"
                        value={firstName}
                        onChangeText={setFirstName}
                        editable={!isLoading}
                      />
                    </View>
                    <View style={[styles.inputWrapper, styles.halfInput]}>
                      <Text style={styles.inputIcon}>👨‍👩‍👧‍👦</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Apellido"
                        placeholderTextColor="#9ca3af"
                        value={lastName}
                        onChangeText={setLastName}
                        editable={!isLoading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>📧</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Correo electrónico"
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      editable={!isLoading}
                    />
                  </View>
                </>
              )}

              {/* Login Mode Fields */}
              {!isRegisterMode && (
                <>
                  {/* Login Method Toggle */}
                  <View style={styles.loginMethodToggle}>
                    <TouchableOpacity
                      style={[styles.methodButton, useEmail && styles.methodButtonActive]}
                      onPress={() => setUseEmail(true)}
                      disabled={isLoading}
                    >
                      <Text style={[styles.methodButtonText, useEmail && styles.methodButtonTextActive]}>
                        📧 Email
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.methodButton, !useEmail && styles.methodButtonActive]}
                      onPress={() => setUseEmail(false)}
                      disabled={isLoading}
                    >
                      <Text style={[styles.methodButtonText, !useEmail && styles.methodButtonTextActive]}>
                        👤 Usuario
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputIcon}>{useEmail ? '📧' : '👤'}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={useEmail ? 'Correo electrónico' : 'Nombre de usuario'}
                      placeholderTextColor="#9ca3af"
                      keyboardType={useEmail ? 'email-address' : 'default'}
                      autoCapitalize="none"
                      value={useEmail ? email : username}
                      onChangeText={useEmail ? setEmail : setUsername}
                      editable={!isLoading}
                    />
                  </View>
                </>
              )}

              {/* Password Field */}
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
                  disabled={isLoading}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Main Action Button */}
            <Animated.View style={{ transform: [{ scale: buttonAnimation }] }}>
              <TouchableOpacity
                style={[styles.authButton, isLoading && styles.authButtonLoading]}
                onPress={handleAuth}
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
                    <Text style={styles.authButtonText}>
                      {isRegisterMode ? 'Creando usuario...' : 'Iniciando sesión...'}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.authButtonIcon}>
                      {isRegisterMode ? '🚀' : '🔑'}
                    </Text>
                    <Text style={styles.authButtonText}>
                      {isRegisterMode ? 'Crear Usuario' : 'Iniciar Sesión'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Mode Toggle */}
            <TouchableOpacity
              style={styles.modeToggle}
              onPress={toggleMode}
              disabled={isLoading}
            >
              <Text style={styles.modeToggleText}>
                {isRegisterMode 
                  ? '¿Ya tienes cuenta? Inicia sesión' 
                  : '¿No tienes cuenta? Regístrate'
                }
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Guest Access */}
            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.guestButtonIcon}>👋</Text>
              <Text style={styles.guestButtonText}>Continuar como invitado</Text>
            </TouchableOpacity>

            {/* API Info */}
            <View style={styles.apiContainer}>
              <Text style={styles.apiTitle}>🌐 Conectado a API Real</Text>
              <Text style={styles.apiText}>facturago.onrender.com</Text>
              <Text style={styles.apiDescription}>
                {isRegisterMode 
                  ? 'Los datos se guardarán en la base de datos'
                  : 'Autenticación con base de datos PostgreSQL'
                }
              </Text>
            </View>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🌟 Aprende, juega y crece con NeuroApp ✨
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
  realBadge: {
    backgroundColor: '#ff4757',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    textAlign: 'center',
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
    marginBottom: 24,
  },
  loginMethodToggle: {
    flexDirection: 'row',
    backgroundColor: '#f8faff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#4285f4',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  methodButtonTextActive: {
    color: '#ffffff',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
  authButton: {
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
    marginBottom: 16,
  },
  authButtonLoading: {
    backgroundColor: '#6b7280',
  },
  authButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  authButtonText: {
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
  modeToggle: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  modeToggleText: {
    fontSize: 14,
    color: '#4285f4',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e8f0fe',
  },
  dividerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginHorizontal: 16,
  },
  guestButton: {
    backgroundColor: '#f8faff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e8f0fe',
    marginBottom: 20,
  },
  guestButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4285f4',
  },
  apiContainer: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  apiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 4,
    textAlign: 'center',
  },
  apiText: {
    fontSize: 12,
    color: '#2e7d32',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
  },
  apiDescription: {
    fontSize: 11,
    color: '#388e3c',
    textAlign: 'center',
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
  },
});

export default RealLoginScreen;