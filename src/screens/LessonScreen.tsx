import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

const LessonScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'lesson'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lesson } = route.params;

  const [currentStep, setCurrentStep] = React.useState(0);
  const [scaleAnim] = React.useState(new Animated.Value(1));
  const [userPoints, setUserPoints] = React.useState(0);
  const [optionScales] = React.useState(
    lesson.steps[0]?.options?.map(() => new Animated.Value(1)) || []
  );
  const headerAnimation = React.useRef(new Animated.Value(0)).current;
  const contentAnimation = React.useRef(new Animated.Value(0)).current;

  const step = lesson.steps[currentStep];

  React.useEffect(() => {
    // Animaciones de entrada
    Animated.sequence([
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    if (step.activityType === 'Memoria visual') {
      navigation.replace('memoryGame', { step, lessonTitle: lesson.title });
    } else if (step.activityType === 'Repetir sonidos') {
      navigation.replace('repeatSound', { step, lessonTitle: lesson.title });
    }
  }, [step, navigation, lesson.title]);

  const completeLession = () => {
    Alert.alert(
      '🎉 ¡Felicitaciones!', 
      '¡Has completado toda la lección! ¡Excelente trabajo!', 
      [
        { 
          text: '¡Genial!', 
          onPress: () => navigation.goBack() 
        },
      ]
    );
  };

  const completeStep = (selectedOptionCorrect?: boolean) => {
    if (step.options && selectedOptionCorrect === undefined) return;

    if (selectedOptionCorrect === false) {
      Alert.alert(
        '🤔 ¡Inténtalo otra vez!', 
        'Esa no es la respuesta correcta. ¡Tú puedes hacerlo!'
      );
      return;
    }

    // Animación de éxito
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setUserPoints((prev) => prev + 10);

    if (currentStep < lesson.steps.length - 1) {
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 500);
    } else {
      setTimeout(() => {
        completeLession();
      }, 500);
    }
  };

  const handleOptionPressIn = (index: number) => {
    if (optionScales[index]) {
      Animated.spring(optionScales[index], {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleOptionPressOut = (index: number) => {
    if (optionScales[index]) {
      Animated.spring(optionScales[index], {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header mejorado */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: headerAnimation,
            transform: [{
              translateY: headerAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              })
            }]
          }
        ]}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{lesson.title}</Text>
          <View style={styles.titleUnderline} />
        </View>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsIcon}>⭐</Text>
          <Text style={styles.points}>{userPoints} puntos</Text>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Paso {currentStep + 1} de {lesson.steps.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / lesson.steps.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.stepContainer} 
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              opacity: contentAnimation,
              transform: [{
                scale: contentAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                })
              }]
            }
          ]}
        >
          {/* Icono del paso */}
          <Animated.View style={[styles.stepIconContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.stepIcon}>
              <Text style={styles.stepIconText}>{step.icon}</Text>
            </View>
          </Animated.View>

          {/* Texto del paso */}
          <View style={styles.textCard}>
            <Text style={styles.stepText}>{step.text}</Text>
            {step.activityType && (
              <View style={styles.activityBadge}>
                <Text style={styles.activityTypeText}>🎯 {step.activityType}</Text>
              </View>
            )}
          </View>

          {/* Opciones o botón de completar */}
          {step.options ? (
            <View style={styles.optionsContainer}>
              <Text style={styles.optionsTitle}>🎯 Elige la opción correcta:</Text>
              <View style={styles.optionsGrid}>
                {step.options.map((option, idx) => (
                  <Animated.View
                    key={idx}
                    style={[
                      styles.optionContainer,
                      { transform: [{ scale: optionScales[idx] || 1 }] }
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={() => completeStep(option.correct)}
                      onPressIn={() => handleOptionPressIn(idx)}
                      onPressOut={() => handleOptionPressOut(idx)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.optionIconContainer}>
                        <Text style={styles.optionIcon}>{option.icon}</Text>
                      </View>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.completeButton} 
              onPress={() => completeStep()}
              activeOpacity={0.8}
            >
              <Text style={styles.completeButtonText}>¡Completado! ✨</Text>
            </TouchableOpacity>
          )}

          {/* Footer motivacional */}
          <View style={styles.footer}>
            <View style={styles.motivationContainer}>
              <Text style={styles.motivationIcon}>🌟</Text>
              <Text style={styles.footerText}>¡Excelente trabajo!</Text>
              <Text style={styles.motivationIcon}>🌟</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  header: {
    backgroundColor: '#4ECDC4',
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    shadowColor: '#26D0CE',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
  },
  pointsIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  points: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  stepContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  stepIconContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  stepIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#4ECDC4',
  },
  stepIconText: {
    fontSize: 50,
  },
  textCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#4ECDC4',
  },
  stepText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3436',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 15,
  },
  activityBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: 'center',
    shadowColor: '#FF4757',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  activityTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  optionsContainer: {
    marginBottom: 25,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  optionContainer: {
    width: (width - 60) / 2,
    maxWidth: 150,
  },
  optionButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    minHeight: 120,
    justifyContent: 'center',
  },
  optionIconContainer: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 40,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionIcon: {
    fontSize: 30,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    textAlign: 'center',
    lineHeight: 18,
  },
  completeButton: {
    backgroundColor: '#55A3FF',
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderRadius: 25,
    alignSelf: 'center',
    shadowColor: '#3742FA',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 25,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  motivationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
  },
  motivationIcon: {
    fontSize: 18,
    marginHorizontal: 8,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
    textAlign: 'center',
  },
});

export default LessonScreen;