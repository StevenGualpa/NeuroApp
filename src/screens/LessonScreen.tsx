// LessonScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
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

  const [currentStep, setCurrentStep] = useState(0);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [userPoints, setUserPoints] = useState(0);
  const [optionScales, setOptionScales] = useState(
    lesson.steps[0]?.options?.map(() => new Animated.Value(1)) || []
  );
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const contentAnimation = useRef(new Animated.Value(0)).current;

  const step = lesson.steps[currentStep];

  useEffect(() => {
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
    } else if (step.activityType === 'Arrastra y suelta') {
      navigation.replace('dragDrop', { step, lessonTitle: lesson.title }); // ✅ nombre correcto
    }
  }, [step, navigation, lesson.title]);

  const completeLession = () => {
    Alert.alert('🎉 ¡Felicitaciones!', '¡Has completado toda la lección!', [
      { text: '¡Genial!', onPress: () => navigation.goBack() },
    ]);
  };

  const completeStep = (selectedOptionCorrect?: boolean) => {
    if (step.options && selectedOptionCorrect === undefined) return;

    if (selectedOptionCorrect === false) {
      Alert.alert('🤔 ¡Inténtalo otra vez!', 'Esa no es la respuesta correcta.');
      return;
    }

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
        setOptionScales(
          lesson.steps[currentStep + 1]?.options?.map(() => new Animated.Value(1)) || []
        );
      }, 500);
    } else {
      setTimeout(() => {
        completeLession();
      }, 500);
    }
  };

  const handleOptionPressIn = (index: number) => {
    optionScales[index]?.setValue(0.95);
  };

  const handleOptionPressOut = (index: number) => {
    Animated.spring(optionScales[index], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnimation,
            transform: [
              {
                translateY: headerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.points}>⭐ {userPoints} puntos</Text>
        <Text style={styles.progress}>
          Paso {currentStep + 1} de {lesson.steps.length}
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.stepContainer}>
        <Animated.View style={[styles.iconWrapper, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.stepIcon}>{step.icon}</Text>
        </Animated.View>

        <View style={styles.card}>
          <Text style={styles.stepText}>{step.text}</Text>
          {step.activityType && (
            <Text style={styles.activityText}>🎯 {step.activityType}</Text>
          )}
        </View>

        {step.options ? (
          <View style={styles.optionsGrid}>
            {step.options.map((option, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.optionWrapper,
                  { transform: [{ scale: optionScales[idx] || 1 }] },
                ]}
              >
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => completeStep(option.correct)}
                  onPressIn={() => handleOptionPressIn(idx)}
                  onPressOut={() => handleOptionPressOut(idx)}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => completeStep()}
          >
            <Text style={styles.completeButtonText}>¡Completado! ✨</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9ff' },
  header: {
    padding: 20,
    backgroundColor: '#4e91f9',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  points: { marginTop: 8, fontSize: 16, color: '#ffd700' },
  progress: { marginTop: 4, fontSize: 14, color: '#fff' },
  stepContainer: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 60,
  },
  iconWrapper: {
    backgroundColor: '#fff',
    borderRadius: 60,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    marginBottom: 20,
  },
  stepIcon: { fontSize: 50 },
  card: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    width: '100%',
  },
  stepText: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' },
  activityText: { fontSize: 14, fontStyle: 'italic', marginTop: 10, color: '#777' },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  optionWrapper: {
    width: (width - 80) / 2,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 2,
    borderWidth: 2,
    borderColor: '#4e91f9',
  },
  optionIcon: { fontSize: 30 },
  optionLabel: { marginTop: 10, fontSize: 14, fontWeight: '600', color: '#333' },
  completeButton: {
    backgroundColor: '#28c76f',
    padding: 15,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 20,
    paddingHorizontal: 30,
  },
  completeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default LessonScreen;
