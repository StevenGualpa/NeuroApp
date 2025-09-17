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
} from 'react-native';
import AuthService from '../services/AuthService';
import { useLanguage } from '../contexts/LanguageContext';

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
  };

  // Modal animations
  useEffect(() => {
    if (visible) {
      resetModal();
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
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
        setUserId(result.userId);
        loadingLoop.stop();
        setIsLoading(false);
        setCurrentStep('password');
      } else {
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
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder={language === 'es' ? 'Nombre de usuario' : 'Username'}
                  placeholderTextColor="#9ca3af"
                  value={username}
                  onChangeText={setUsername}
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
              <Text style={styles.stepDescription}>
                {language === 'es' 
                  ? 'Ingresa el código de 6 dígitos enviado a tu correo electrónico'
                  : 'Enter the 6-digit code sent to your email'
                }
              </Text>
            </View>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔢</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="123456"
                  placeholderTextColor="#9ca3af"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!isLoading}
                />
              </View>
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
              <Text style={styles.stepDescription}>
                {language === 'es' 
                  ? 'Ingresa tu nueva contraseña (mínimo 6 caracteres)'
                  : 'Enter your new password (minimum 6 characters)'
                }
              </Text>
            </View>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder={language === 'es' ? 'Nueva contraseña' : 'New password'}
                  placeholderTextColor="#9ca3af"
                  value={newPassword}
                  onChangeText={setNewPassword}
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
              
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔐</Text>
                <TextInput
                  style={styles.input}
                  placeholder={language === 'es' ? 'Confirmar contraseña' : 'Confirm password'}
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
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
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim }
                ]
              }
            ]}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              bounces={false}
              style={styles.scrollContent}
            >
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

              {/* Error Message */}
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                </View>
              ) : null}

              {/* Step Content */}
              {renderStepContent()}

              {/* Action Buttons */}
              {renderActionButtons()}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    minHeight: height * 0.6,
  },
  scrollContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  errorContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  stepContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4285f4',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8faff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e8f0fe',
    paddingHorizontal: 16,
    minHeight: 56,
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
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 12,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButton: {
    backgroundColor: '#4285f4',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#6b7280',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginRight: 8,
  },
  loadingIcon: {
    fontSize: 18,
  },
});

export default PasswordRecoveryModal;
