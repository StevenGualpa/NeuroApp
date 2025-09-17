import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import AuthService from '../services/AuthService';
import { useLanguage } from '../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface PasswordRecoveryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type RecoveryStep = 'username' | 'code' | 'password' | 'success';

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  // State
  const [currentStep, setCurrentStep] = useState<RecoveryStep>('username');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedInput, setFocusedInput] = useState<string>('');
  const [lastUsername, setLastUsername] = useState<string>('');

  const { language } = useLanguage();

  // Animations
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  // Reset modal state
  const resetModal = () => {
    setCurrentStep('username');
    setUsername('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setUserId(0);
    setErrorMessage('');
    setIsLoading(false);
    setFocusedInput('');
  };

  // Check for active recovery code
  const checkActiveCode = async () => {
    const storedCode = await AsyncStorage.getItem('@neuroapp_recovery_code');
    const storedUsername = await AsyncStorage.getItem('@neuroapp_recovery_username');
    const storedTimestamp = await AsyncStorage.getItem('@neuroapp_recovery_timestamp');

    if (storedCode && storedUsername && storedTimestamp) {
      const timestamp = parseInt(storedTimestamp);
      const now = Date.now();
      const threeMinutes = 3 * 60 * 1000; // 3 minutos en milisegundos

      // Si el código fue enviado hace menos de 3 minutos
      if (now - timestamp < threeMinutes) {
        try {
          const result = await AuthService.verifyRecoveryCode(storedCode);
          
          if (result.success) {
            // El código sigue siendo válido, ir directamente al paso 2
            setUsername(storedUsername);
            setLastUsername(storedUsername);
            setUserId(result.userId || 0);
            setCurrentStep('code');
            return true;
          } else if (result.state === 'expired' || result.state === 'used') {
            // El código expiró o fue usado, limpiar storage
            await clearStoredRecoveryData();
          }
        } catch (error) {
          // Error al verificar, limpiar storage
          await clearStoredRecoveryData();
        }
      } else {
        // El código es muy viejo, limpiar storage
        await clearStoredRecoveryData();
      }
    }
    
    return false;
  };

  // Clear stored recovery data
  const clearStoredRecoveryData = async () => {
    await Promise.all([
      AsyncStorage.removeItem('@neuroapp_recovery_code'),
      AsyncStorage.removeItem('@neuroapp_recovery_username'),
      AsyncStorage.removeItem('@neuroapp_recovery_timestamp'),
    ]);
  };

  // Modal animations and initialization
  useEffect(() => {
    if (visible) {
      resetModal();
      
      // Check for active recovery code first
      checkActiveCode().then((hasActiveCode) => {
        // Start animations after checking for active code
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Loading animation
  const startLoadingAnimation = () => {
    const loop = Animated.loop(
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    loop.start();
    return loop;
  };

  // Validation helpers
  const validateUsername = () => {
    if (!username.trim()) {
      setErrorMessage(language === 'es' ? 'Por favor ingresa tu nombre de usuario' : 'Please enter your username');
      return false;
    }
    return true;
  };

  const validateCode = () => {
    if (!code.trim()) {
      setErrorMessage(language === 'es' ? 'Por favor ingresa el código' : 'Please enter the code');
      return false;
    }
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setErrorMessage(language === 'es' ? 'El código debe tener 6 dígitos' : 'Code must be 6 digits');
      return false;
    }
    return true;
  };

  const validatePasswords = () => {
    if (!newPassword.trim()) {
      setErrorMessage(language === 'es' ? 'Por favor ingresa la nueva contraseña' : 'Please enter new password');
      return false;
    }
    if (newPassword.length < 6) {
      setErrorMessage(language === 'es' ? 'La contraseña debe tener al menos 6 caracteres' : 'Password must be at least 6 characters');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage(language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match');
      return false;
    }
    return true;
  };

  // Step handlers
  const handleStep1 = async () => {
    if (!validateUsername()) return;

    setIsLoading(true);
    setErrorMessage('');
    const loadingLoop = startLoadingAnimation();

    try {
      const result = await AuthService.recoverPassword(username.trim());
      
      if (result.success) {
        // Store recovery data for future sessions
        const timestamp = Date.now().toString();
        await Promise.all([
          AsyncStorage.setItem('@neuroapp_recovery_username', username.trim()),
          AsyncStorage.setItem('@neuroapp_recovery_timestamp', timestamp),
        ]);
        
        setLastUsername(username.trim());
        loadingLoop.stop();
        setIsLoading(false);
        setCurrentStep('code');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      loadingLoop.stop();
      setIsLoading(false);
      setErrorMessage(error instanceof Error ? error.message : 'Error al solicitar código de recuperación');
    }
  };

  const handleStep2 = async () => {
    if (!validateCode()) return;

    setIsLoading(true);
    setErrorMessage('');
    const loadingLoop = startLoadingAnimation();

    try {
      const result = await AuthService.verifyRecoveryCode(code.trim());
      
      if (result.success && result.userId) {
        // Store the verified code for potential re-verification
        await AsyncStorage.setItem('@neuroapp_recovery_code', code.trim());
        
        setUserId(result.userId);
        loadingLoop.stop();
        setIsLoading(false);
        setCurrentStep('password');
      } else {
        // If code is expired, used or invalid, clear stored data
        if (result.state === 'expired' || result.state === 'used') {
          await clearStoredRecoveryData();
        }
        throw new Error(result.message);
      }
    } catch (error) {
      loadingLoop.stop();
      setIsLoading(false);
      setErrorMessage(error instanceof Error ? error.message : 'Error al verificar código');
    }
  };

  const handleStep3 = async () => {
    if (!validatePasswords()) return;

    setIsLoading(true);
    setErrorMessage('');
    const loadingLoop = startLoadingAnimation();

    try {
      const result = await AuthService.resetPassword(userId, newPassword);
      
      if (result.success) {
        // Optional: consume the code
        await AuthService.consumeRecoveryCode(code);
        
        // Clear all stored recovery data since the process is complete
        await clearStoredRecoveryData();
        
        loadingLoop.stop();
        setIsLoading(false);
        setCurrentStep('success');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      loadingLoop.stop();
      setIsLoading(false);
      setErrorMessage(error instanceof Error ? error.message : 'Error al cambiar contraseña');
    }
  };

  const handleClose = () => {
    // Don't clear data on close - let the user continue later if they want
    onClose();
  };

  const handleSuccess = () => {
    onSuccess();
    handleClose();
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'username':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>1/3</Text>
              <Text style={styles.stepTitle}>
                {language === 'es' ? 'Solicitar código' : 'Request code'}
              </Text>
              <Text style={styles.stepDescription}>
                {language === 'es' 
                  ? 'Ingresa tu nombre de usuario para recibir un código de recuperación'
                  : 'Enter your username to receive a recovery code'
                }
              </Text>
            </View>
            
            <View style={styles.inputContainer}>
              <View style={[
                styles.inputWrapper,
                focusedInput === 'username' && styles.inputWrapperFocused
              ]}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder={language === 'es' ? 'Nombre de usuario' : 'Username'}
                  placeholderTextColor="#94a3b8"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedInput('username')}
                  onBlur={() => setFocusedInput('')}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>
          </View>
        );

      case 'code':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>2/3</Text>
              <Text style={styles.stepTitle}>
                {language === 'es' ? 'Verificar código' : 'Verify code'}
              </Text>
              <Text style={[styles.stepDescription, styles.compactDescription]}>
                {lastUsername && username === lastUsername
                  ? (language === 'es' 
                      ? `Código activo detectado. Ingresa los 6 dígitos.`
                      : `Active code detected. Enter the 6 digits.`)
                  : (language === 'es' 
                      ? 'Ingresa el código de 6 dígitos de tu correo'
                      : 'Enter the 6-digit code from your email')
                }
              </Text>
            </View>
            
            <View style={styles.inputContainer}>
              <View style={[
                styles.inputWrapper,
                focusedInput === 'code' && styles.inputWrapperFocused
              ]}>
                <Text style={styles.inputIcon}>🔢</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="123456"
                  placeholderTextColor="#94a3b8"
                  value={code}
                  onChangeText={setCode}
                  onFocus={() => setFocusedInput('code')}
                  onBlur={() => setFocusedInput('')}
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!isLoading}
                />
              </View>
              
              {/* Option to request new code */}
              {lastUsername && username === lastUsername && (
                <TouchableOpacity 
                  style={styles.requestNewCodeButton}
                  onPress={() => {
                    setCurrentStep('username');
                    setCode('');
                    setErrorMessage('');
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.requestNewCodeText}>
                    {language === 'es' ? '¿Solicitar nuevo código?' : 'Request new code?'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );

      case 'password':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepNumber}>3/3</Text>
              <Text style={styles.stepTitle}>
                {language === 'es' ? 'Nueva contraseña' : 'New password'}
              </Text>
              <Text style={[styles.stepDescription, styles.compactDescription]}>
                {language === 'es' 
                  ? 'Nueva contraseña (mín. 6 caracteres)'
                  : 'New password (min. 6 characters)'
                }
              </Text>
            </View>
            
            <View style={styles.inputContainer}>
              <View style={[
                styles.inputWrapper,
                focusedInput === 'newPassword' && styles.inputWrapperFocused
              ]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder={language === 'es' ? 'Nueva contraseña' : 'New password'}
                  placeholderTextColor="#94a3b8"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  onFocus={() => setFocusedInput('newPassword')}
                  onBlur={() => setFocusedInput('')}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={[
                styles.inputWrapper,
                focusedInput === 'confirmPassword' && styles.inputWrapperFocused
              ]}>
                <Text style={styles.inputIcon}>🔐</Text>
                <TextInput
                  style={styles.input}
                  placeholder={language === 'es' ? 'Confirmar contraseña' : 'Confirm password'}
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput('')}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
              </View>
            </View>
          </View>
        );

      case 'success':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>🎉</Text>
              <Text style={styles.successTitle}>
                {language === 'es' ? '¡Contraseña cambiada!' : 'Password changed!'}
              </Text>
              <Text style={styles.successDescription}>
                {language === 'es' 
                  ? 'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
                  : 'Your password has been successfully updated. You can now sign in with your new password.'
                }
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // Render action buttons
  const renderActionButtons = () => {
    if (currentStep === 'success') {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSuccess}
          >
            <Text style={styles.buttonText}>
              {language === 'es' ? 'Continuar' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const stepActions = {
      username: handleStep1,
      code: handleStep2,
      password: handleStep3,
    };

    const actionLabels = {
      username: language === 'es' ? 'Enviar código' : 'Send code',
      code: language === 'es' ? 'Verificar' : 'Verify',
      password: language === 'es' ? 'Cambiar contraseña' : 'Change password',
    };

    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleClose}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, isLoading && styles.disabledButton]}
          onPress={stepActions[currentStep as keyof typeof stepActions]}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Animated.View 
                style={[
                  styles.loadingSpinner,
                  {
                    transform: [{
                      rotate: loadingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }]
                  }
                ]}
              >
                <Text style={styles.loadingIcon}>⚡</Text>
              </Animated.View>
              <Text style={styles.buttonText}>
                {language === 'es' ? 'Procesando...' : 'Processing...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>
              {actionLabels[currentStep as keyof typeof actionLabels]}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View 
                style={[
                  styles.modalContainer,
                  {
                    transform: [{ scale: scaleAnim }]
                  }
                ]}
              >
            <View style={styles.modalContent}>
              {/* Modal Handle */}
              <View style={styles.modalHandle}>
                <View style={styles.handleBar} />
              </View>

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {language === 'es' ? 'Recuperar contraseña' : 'Recover password'}
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={handleClose}
                  disabled={isLoading}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Progress Bar */}
              {currentStep !== 'success' && (
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <Animated.View 
                      style={[
                        styles.progressBar,
                        {
                          width: `${
                            currentStep === 'username' ? 33 : 
                            currentStep === 'code' ? 66 : 
                            currentStep === 'password' ? 100 : 0
                          }%`
                        }
                      ]}
                    />
                  </View>
                </View>
              )}

              {/* Scrollable Content */}
              <ScrollView 
                showsVerticalScrollIndicator={false}
                bounces={true}
                style={styles.scrollableContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Error Message */}
                {errorMessage ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                  </View>
                ) : null}

                {/* Step Content */}
                {renderStepContent()}
              </ScrollView>

              {/* Fixed Action Buttons */}
              <View style={styles.fixedButtonContainer}>
                {renderActionButtons()}
              </View>
            </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: height * 0.15,
    paddingBottom: 20,
  },
  overlayTouchable: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    maxHeight: height * 0.85,
    minHeight: height * 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  modalContent: {
    flex: 1,
  },
  scrollableContent: {
    flex: 1,
  },
  fixedButtonContainer: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  modalHandle: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4285f4',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748b',
  },
  progressBarContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4285f4',
    borderRadius: 2,
  },
  errorContainer: {
    marginHorizontal: 24,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  errorText: {
    fontSize: 15,
    color: '#dc2626',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285f4',
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    fontWeight: '500',
  },
  compactDescription: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  inputContainer: {
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    minHeight: 52,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    transition: 'all 0.2s ease',
  },
  inputWrapperFocused: {
    borderColor: '#4285f4',
    backgroundColor: '#f0f9ff',
    shadowColor: '#4285f4',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIcon: {
    fontSize: 22,
    marginRight: 14,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 6,
    color: '#4285f4',
  },
  eyeButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  eyeIcon: {
    fontSize: 20,
  },
  requestNewCodeButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  requestNewCodeText: {
    fontSize: 14,
    color: '#4285f4',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#f0fdf4',
    marginHorizontal: 24,
    marginVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  successIcon: {
    fontSize: 56,
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  successDescription: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 14,
    paddingTop: 12,
    gap: 14,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: '#4285f4',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  secondaryButtonText: {
    color: '#475569',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginRight: 10,
  },
  loadingIcon: {
    fontSize: 20,
  },
});

export default PasswordRecoveryModal;
