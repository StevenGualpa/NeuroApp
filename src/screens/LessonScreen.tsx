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
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const LessonScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'lesson'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lesson } = route.params;

  const [currentStep, setCurrentStep] = React.useState(0);
  const [scaleAnim] = React.useState(new Animated.Value(1));
  const [userPoints, setUserPoints] = React.useState(0);

  const step = lesson.steps[currentStep];

  React.useEffect(() => {
    if (step.activityType === 'Memoria visual') {
      navigation.replace('memoryGame', { step, lessonTitle: lesson.title });
    } else if (step.activityType === 'Repetir sonidos') {
      navigation.replace('repeatSound', { step, lessonTitle: lesson.title });
    }
  }, [step, navigation, lesson.title]);

  const completeLession = () => {
    Alert.alert('¡Felicitaciones!', 'Has completado la lección', [
      { text: 'Volver', onPress: () => navigation.goBack() },
    ]);
  };

  const completeStep = (selectedOptionCorrect?: boolean) => {
    if (step.options && selectedOptionCorrect === undefined) return;

    if (selectedOptionCorrect === false) {
      Alert.alert('Inténtalo de nuevo', 'Esa no es la respuesta correcta.');
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
      }, 500);
    } else {
      setTimeout(() => {
        completeLession();
      }, 500);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.points}>Puntos: ⭐ {userPoints}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.stepIcon, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.stepIconText}>{step.icon}</Text>
        </Animated.View>

        <Text style={styles.stepText}>{step.text}</Text>

        {step.activityType && (
          <Text style={styles.activityTypeText}>Actividad: {step.activityType}</Text>
        )}

        {step.options ? (
          step.options.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.optionButton}
              onPress={() => completeStep(option.correct)}
            >
              <Text style={styles.stepIconText}>{option.icon}</Text>
              <Text style={styles.stepText}>{option.label}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <TouchableOpacity style={styles.completeButton} onPress={() => completeStep()}>
            <Text style={styles.completeButtonText}>¡Completado! ✨</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  header: {
    padding: 20,
    backgroundColor: '#4a90e2',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
  points: {
    color: '#ffd700',
    fontSize: 16,
    marginTop: 5,
  },
  stepContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  stepIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
  },
  stepIconText: {
    fontSize: 60,
  },
  stepText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  activityTypeText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  completeButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    marginVertical: 10,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    elevation: 2,
  },
});

export default LessonScreen;
