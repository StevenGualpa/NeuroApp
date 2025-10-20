import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import AuthService from '../services/AuthService';
import { useLanguage } from '../contexts/LanguageContext';
import PasswordRecoveryModal from '../components/PasswordRecoveryModal';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const isMediumScreen = height < 800;

const LoginScreen = () => {
  // States
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, language } = useLanguage();

  // Animations
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const loadingAnimation = useRef(new Animated.Value(0)).current;
  const creditsAnimation = useRef(new Animated.Value(0)).current;

  // Credits data
  const creditsData = [
    {
      category: language === 'es' ? 'Desarrollo' : 'Development',
      items: [
        { name: language === 'es' ? 'Desarrollador Principal' : 'Lead Developer', value: 'Steven Gualpa' },
        { name: language === 'es' ? 'Diseño UI/UX' : 'UI/UX Design', value: 'Steven Gualpa' },
        { name: language === 'es' ? 'Programación' : 'Programming', value: 'Yolo Team' },
      ],
    },
    {
      category: language === 'es' ? 'Información' : 'Information',
      items: [
        { name: language === 'es' ? 'Versión' : 'Version', value: '2.6.0' },
        { name: language === 'es' ? 'Plataforma' : 'Platform', value: 'React Native' },
        { name: language === 'es' ? 'Actualización' : 'Last Update', value: language === 'es' ? 'Oct 2025' : 'Oct 2025' },
      ],
    },
  ];

  useEffect(() => {
    // Entrance animations
    Animated.stagger(300, [
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(formAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Validation helpers
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateForm = () => {
    const { email, password, confirmPassword, name } = formData;
    
    if (!email.trim()) {
      showError(language === 'es' ? 'Por favor ingresa tu correo electrónico' : 'Please enter your email');
      return false;
    }

    if (!validateEmail(email.trim())) {
      showError(language === 'es' ? 'Por favor ingresa un correo electrónico válido' : 'Please enter a valid email');
      return false;
    }

    if (!password.trim() || password.length < 6) {
      showError(language === 'es' ? 'La contraseña debe tener al menos 6 caracteres' : 'Password must be at least 6 characters');
      return false;
    }

    if (isRegisterMode) {
      if (!name.trim() || name.trim().length < 2) {
        showError(language === 'es' ? 'El nombre debe tener al menos 2 caracteres' : 'Name must be at least 2 characters');
        return false;
      }

      if (password !== confirmPassword) {
        showError(language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const showError = (message: string) => {
    Alert.alert(t.common.error, message, [{ text: t.common.ok }]);
    shakeForm();
  };

  const shakeForm = () => {
    Animated.sequence([
      Animated.timing(formAnimation, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(formAnimation, { toValue: 1.05, duration: 100, useNativeDriver: true }),
      Animated.timing(formAnimation, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const startLoadingAnimation = () => {
    const loop = Animated.loop(
      Animated.timing(loadingAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return loop;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    const loadingLoop = startLoadingAnimation();

    try {
      const { email, password, name } = formData;
      
      if (isRegisterMode) {
        const nameParts = name.trim().split(' ');
        const result = await AuthService.register({
          username: email.trim(),
          email: email.trim(),
          password,
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
        });
        
        if (result.success) {
          loadingLoop.stop();
          setIsLoading(false);
          
          Alert.alert(
            language === 'es' ? '¡Registro exitoso!' : 'Registration successful!',
            language === 'es' 
              ? 'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.'
              : 'Your account has been created successfully. You can now sign in.',
            [{
              text: t.common.ok,
              onPress: () => {
                setIsRegisterMode(false);
                setFormData(prev => ({ ...prev, confirmPassword: '', name: '' }));
              }
            }]
          );
        } else {
          throw new Error(result.message || (language === 'es' ? 'Error en el registro' : 'Registration error'));
        }
      } else {
        const result = await AuthService.login({ email: email.trim(), password });
        
        if (result.success) {
          loadingLoop.stop();
          Animated.timing(formAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            navigation.replace('onboarding');
          });
        } else {
          throw new Error(result.message || (language === 'es' ? 'Credenciales incorrectas' : 'Invalid credentials'));
        }
      }
    } catch (error) {
      loadingLoop.stop();
      setIsLoading(false);
      
      const errorMessage = error instanceof Error ? error.message : 
        (isRegisterMode 
          ? (language === 'es' ? 'No se pudo crear la cuenta. Es posible que el correo ya esté registrado.' : 'Could not create account. Email might already be registered.')
          : (language === 'es' ? 'Correo electrónico o contraseña incorrectos.' : 'Incorrect email or password.'));
      
      showError(errorMessage);
    }
  };

  const toggleMode = () => {
    if (isLoading) return;
    setIsRegisterMode(!isRegisterMode);
    setFormData(prev => ({ ...prev, confirmPassword: '', name: '' }));
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Password recovery handlers
  const handleForgotPassword = () => {
    setShowRecoveryModal(true);
  };

  const handleRecoveryModalClose = () => {
    setShowRecoveryModal(false);
  };

  const handleRecoverySuccess = () => {
    Alert.alert(
      language === 'es' ? '¡Contraseña actualizada!' : 'Password updated!',
      language === 'es' 
        ? 'Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
        : 'Your password has been successfully changed. You can now sign in with your new password.',
      [{ text: t.common.ok }]
    );
  };

  const showCreditsScreen = () => {
    setShowCredits(true);
    Animated.timing(creditsAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideCreditsScreen = () => {
    Animated.timing(creditsAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowCredits(false));
  };

  const renderInput = (
    field: keyof typeof formData,
    placeholder: string,
    icon: string,
    options: {
      keyboardType?: 'email-address' | 'default';
      autoCapitalize?: 'none' | 'words';
      secureTextEntry?: boolean;
      showEyeButton?: boolean;
    } = {}
  ) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={formData[field]}
        onChangeText={(value) => updateFormData(field, value)}
        editable={!isLoading}
        keyboardType={options.keyboardType || 'default'}
        autoCapitalize={options.autoCapitalize || 'none'}
        autoCorrect={false}
        secureTextEntry={options.secureTextEntry && !showPassword}
      />
      {options.showEyeButton && (
        <TouchableOpacity 
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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
          {/* Logo Section */}
          <Animated.View 
            style={[
              styles.logoSection,
              {
                opacity: logoAnimation,
                transform: [{
                  translateY: logoAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  })
                }]
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <View style={styles.logoImageContainer}>
                <Image 
                  source={require('../assets/Logoapp.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.logoText}>NeuroApp</Text>
            </View>
            <Text style={styles.welcomeText}>
              {isRegisterMode 
                ? (language === 'es' ? '¡Únete a nosotros!' : 'Join us!')
                : t.login.welcome
              }
            </Text>
            <Text style={styles.subtitleText}>
              {isRegisterMode 
                ? (language === 'es' ? 'Crea tu cuenta y comienza a aprender' : 'Create your account and start learning')
                : t.login.subtitle
              }
            </Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: formAnimation,
                transform: [{
                  translateY: formAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }]
              }
            ]}
          >
            {/* Form Inputs */}
            <View style={styles.inputContainer}>
              {isRegisterMode && renderInput(
                'name',
                language === 'es' ? 'Nombre completo' : 'Full name',
                '👤',
                { autoCapitalize: 'words' }
              )}
              
              {renderInput(
                'email',
                t.login.email,
                '📧',
                { keyboardType: 'email-address' }
              )}
              
              {renderInput(
                'password',
                t.login.password,
                '🔒',
                { secureTextEntry: true, showEyeButton: true }
              )}
              
              {isRegisterMode && renderInput(
                'confirmPassword',
                t.login.confirmPassword,
                '🔐',
                { secureTextEntry: true }
              )}
            </View>

            {/* Forgot Password */}
            {!isRegisterMode && (
              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>{t.login.forgotPassword}</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
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
                    {isRegisterMode 
                      ? (language === 'es' ? 'Creando cuenta...' : 'Creating account...')
                      : (language === 'es' ? 'Iniciando sesión...' : 'Signing in...')
                    }
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.submitButtonIcon}>
                    {isRegisterMode ? '📝' : '🚀'}
                  </Text>
                  <Text style={styles.submitButtonText}>
                    {isRegisterMode ? t.login.register : t.login.login}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Mode Toggle */}
            <View style={styles.modeToggleContainer}>
              <Text style={styles.modeToggleText}>
                {isRegisterMode ? t.login.loginMode : t.login.registerMode}
              </Text>
              <TouchableOpacity
                style={styles.modeToggleButton}
                onPress={toggleMode}
                disabled={isLoading}
              >
                <Text style={styles.modeToggleButtonText}>
                  {isRegisterMode ? t.login.login : t.login.register}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {language === 'es' 
                ? '🌟 Aprende, juega y crece con NeuroApp ✨'
                : '🌟 Learn, play and grow with NeuroApp ✨'
              }
            </Text>
            <TouchableOpacity 
              style={styles.creditsButton}
              onPress={showCreditsScreen}
              activeOpacity={0.7}
            >
              <Text style={styles.creditsButtonText}>
                👥 {language === 'es' ? 'Créditos' : 'Credits'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>
              {language === 'es' ? 'Versión 1.0.0' : 'Version 1.0.0'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Password Recovery Modal */}
      <PasswordRecoveryModal
        visible={showRecoveryModal}
        onClose={handleRecoveryModalClose}
        onSuccess={handleRecoverySuccess}
      />

      {/* Credits Overlay */}
      {showCredits && (
        <Animated.View 
          style={[
            styles.creditsContainer,
            {
              opacity: creditsAnimation,
              transform: [{
                scale: creditsAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }]
            }
          ]}
        >
          <View style={styles.creditsContent}>
            <View style={styles.creditsHeader}>
              <Text style={styles.creditsTitle}>👥 {language === 'es' ? 'Créditos' : 'Credits'}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={hideCreditsScreen}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.creditsScroll}
              showsVerticalScrollIndicator={false}
            >
              {creditsData.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.creditsSection}>
                  <Text style={styles.sectionTitle}>{section.category}</Text>
                  {section.items.map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.creditsItem}>
                      <Text style={styles.itemLabel}>{item.name}</Text>
                      <Text style={styles.itemValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              ))}
              
              <View style={styles.thankYouSection}>
                <Text style={styles.thankYouText}>
                  ❤️ {language === 'es' 
                    ? 'Gracias por usar NeuroApp'
                    : 'Thank you for using NeuroApp'
                  }
                </Text>
                <Text style={styles.thankYouSubtext}>
                  {language === 'es'
                    ? 'Juntos hacemos el aprendizaje divertido'
                    : 'Together we make learning fun'
                  }
                </Text>
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      )}
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
    paddingVertical: isSmallScreen ? 20 : 30,
    minHeight: height,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 20 : isMediumScreen ? 30 : 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 10 : 15,
  },
  logoImageContainer: {
    width: isSmallScreen ? 100 : isMediumScreen ? 120 : 140,
    height: isSmallScreen ? 100 : isMediumScreen ? 120 : 140,
    borderRadius: isSmallScreen ? 50 : isMediumScreen ? 60 : 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallScreen ? 8 : 12,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoImage: {
    width: isSmallScreen ? 80 : isMediumScreen ? 95 : 110,
    height: isSmallScreen ? 80 : isMediumScreen ? 95 : 110,
    borderRadius: isSmallScreen ? 40 : isMediumScreen ? 47.5 : 55,
  },
  logoText: {
    fontSize: isSmallScreen ? 28 : isMediumScreen ? 32 : 36,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  welcomeText: {
    fontSize: isSmallScreen ? 18 : isMediumScreen ? 20 : 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: isSmallScreen ? 13 : isMediumScreen ? 14 : 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 10,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: isSmallScreen ? 16 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: isSmallScreen ? 10 : 15,
  },
  inputContainer: {
    marginBottom: isSmallScreen ? 8 : 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8faff',
    borderRadius: 14,
    marginBottom: isSmallScreen ? 10 : 12,
    borderWidth: 2,
    borderColor: '#e8f0fe',
    paddingHorizontal: 14,
    minHeight: isSmallScreen ? 50 : 56,
  },
  inputIcon: {
    fontSize: isSmallScreen ? 18 : 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: isSmallScreen ? 12 : 16,
    fontSize: isSmallScreen ? 14 : 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 16,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: isSmallScreen ? 16 : 20,
  },
  forgotPasswordText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#4285f4',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4285f4',
    borderRadius: 14,
    paddingVertical: isSmallScreen ? 14 : 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: isSmallScreen ? 12 : 16,
    minHeight: isSmallScreen ? 48 : 52,
  },
  submitButtonLoading: {
    backgroundColor: '#6b7280',
  },
  submitButtonIcon: {
    fontSize: isSmallScreen ? 18 : 20,
    marginRight: 6,
  },
  submitButtonText: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginRight: 6,
  },
  loadingIcon: {
    fontSize: isSmallScreen ? 18 : 20,
  },
  modeToggleContainer: {
    alignItems: 'center',
  },
  modeToggleText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#6b7280',
    marginBottom: 6,
  },
  modeToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  modeToggleButtonText: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#4285f4',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: isSmallScreen ? 10 : 15,
  },
  footerText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: isSmallScreen ? 10 : 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontWeight: '400',
  },
  creditsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  creditsButtonText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Credits overlay styles
  creditsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  creditsContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  creditsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e8f0fe',
  },
  creditsTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '700',
    color: '#4285f4',
  },
  closeButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  creditsScroll: {
    maxHeight: 400,
  },
  creditsSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '700',
    color: '#4285f4',
    marginBottom: 10,
  },
  creditsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemLabel: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  itemValue: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#1a1a1a',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  thankYouSection: {
    backgroundColor: '#4285f4',
    margin: 20,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  thankYouText: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  thankYouSubtext: {
    fontSize: isSmallScreen ? 12 : 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LoginScreen;