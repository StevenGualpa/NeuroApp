import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

type SelectOptionRouteProp = RouteProp<RootStackParamList, 'selectOption'>;

const SelectOptionScreen = () => {
  const route = useRoute<SelectOptionRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle } = route.params;

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [optionScales] = useState(
    step.options?.map(() => new Animated.Value(1)) || []
  );
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = (correct: boolean, index: number) => {
    if (isAnswered) return;

    setSelectedOption(index);
    setIsAnswered(true);

    // Animate the selected option
    Animated.sequence([
      Animated.timing(optionScales[index], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(optionScales[index], {
        toValue: 1.05,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      if (correct) {
        Alert.alert(
          '🎉 ¡Excelente!',
          'Has seleccionado la respuesta correcta.',
          [
            {
              text: 'Continuar',
              onPress: () => {
                setIsAnswered(false);
                setSelectedOption(null);
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          '❌ Incorrecto',
          'Esa no es la respuesta correcta. ¡Inténtalo de nuevo!',
          [
            {
              text: 'Intentar nuevamente',
              onPress: () => {
                setIsAnswered(false);
                setSelectedOption(null);
                // Reset all animations
                optionScales.forEach(scale => {
                  Animated.timing(scale, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                  }).start();
                });
              },
            },
          ]
        );
      }
    }, 600);
  };

  const handleOptionPressIn = (index: number) => {
    if (isAnswered) return;
    Animated.timing(optionScales[index], {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleOptionPressOut = (index: number) => {
    if (isAnswered) return;
    Animated.spring(optionScales[index], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getOptionStyle = (index: number, correct: boolean) => {
    if (!isAnswered) return styles.optionButton;
    
    if (selectedOption === index) {
      return correct ? styles.optionButtonCorrect : styles.optionButtonIncorrect;
    }
    
    return styles.optionButtonDisabled;
  };

  const getOptionTextStyle = (index: number, correct: boolean) => {
    if (!isAnswered) return styles.optionLabel;
    
    if (selectedOption === index) {
      return correct ? styles.optionLabelCorrect : styles.optionLabelIncorrect;
    }
    
    return styles.optionLabelDisabled;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.title}>{lessonTitle}</Text>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.questionContainer}>
          <Text style={styles.activityType}>Selecciona la opción correcta</Text>
          <Text style={styles.instruction}>{step.text}</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.optionsGrid}
          showsVerticalScrollIndicator={false}
        >
          {step.options?.map((option, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.optionWrapper,
                { transform: [{ scale: optionScales[idx] || 1 }] }
              ]}
            >
              <TouchableOpacity
                style={getOptionStyle(idx, option.correct)}
                onPress={() => handlePress(option.correct, idx)}
                onPressIn={() => handleOptionPressIn(idx)}
                onPressOut={() => handleOptionPressOut(idx)}
                activeOpacity={0.8}
                disabled={isAnswered}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <Text style={getOptionTextStyle(idx, option.correct)}>
                    {option.label}
                  </Text>
                </View>
                
                {isAnswered && selectedOption === idx && (
                  <View style={styles.resultIndicator}>
                    <Text style={styles.resultIcon}>
                      {option.correct ? '✓' : '✗'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e8f0fe',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '75%',
    backgroundColor: '#4285f4',
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  questionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  activityType: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#4285f4',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instruction: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 30,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 20,
  },
  optionWrapper: {
    width: (width - 56) / 2,
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285f4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e8f0fe',
  },
  optionButtonCorrect: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOpacity: 0.3,
  },
  optionButtonIncorrect: {
    backgroundColor: '#ffeaea',
    borderColor: '#f44336',
    shadowColor: '#f44336',
    shadowOpacity: 0.3,
  },
  optionButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.6,
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 16,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    lineHeight: 22,
  },
  optionLabelCorrect: {
    fontSize: 16,
    textAlign: 'center',
    color: '#2e7d32',
    fontWeight: '700',
    lineHeight: 22,
  },
  optionLabelIncorrect: {
    fontSize: 16,
    textAlign: 'center',
    color: '#c62828',
    fontWeight: '700',
    lineHeight: 22,
  },
  optionLabelDisabled: {
    fontSize: 16,
    textAlign: 'center',
    color: '#9e9e9e',
    fontWeight: '600',
    lineHeight: 22,
  },
  resultIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  backButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SelectOptionScreen;