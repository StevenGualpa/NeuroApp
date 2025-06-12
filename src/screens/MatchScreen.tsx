import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

const MatchScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'match'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle } = route.params;
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleOptionPress = (correct: boolean, index: number) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);

    setTimeout(() => {
      if (correct) {
        Alert.alert(
          '🎉 ¡Correcto!', 
          'Has seleccionado la opción correcta.',
          [
            { 
              text: 'Siguiente', 
              onPress: () => {
                setIsAnswered(false);
                setSelectedOption(null);
                navigation.goBack();
              }
            },
          ]
        );
      } else {
        Alert.alert(
          '❌ Incorrecto', 
          'Inténtalo nuevamente.',
          [
            {
              text: 'Intentar de nuevo',
              onPress: () => {
                setIsAnswered(false);
                setSelectedOption(null);
              }
            }
          ]
        );
      }
    }, 500);
  };

  const getOptionStyle = (index: number, correct: boolean) => {
    if (!isAnswered) return styles.optionButton;
    
    if (selectedOption === index) {
      return correct ? styles.optionButtonCorrect : styles.optionButtonIncorrect;
    }
    
    return styles.optionButtonDisabled;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{lessonTitle}</Text>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{step.text}</Text>
          <Text style={styles.instructionText}>Selecciona la opción correcta</Text>
        </View>

        <View style={styles.optionsContainer}>
          {step.options?.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={getOptionStyle(idx, option.correct)}
              onPress={() => handleOptionPress(option.correct, idx)}
              activeOpacity={0.8}
              disabled={isAnswered}
            >
              <View style={styles.optionContent}>
                <Text style={styles.icon}>{option.icon}</Text>
                <Text style={[
                  styles.label,
                  isAnswered && selectedOption === idx && option.correct && styles.labelCorrect,
                  isAnswered && selectedOption === idx && !option.correct && styles.labelIncorrect,
                ]}>{option.label}</Text>
              </View>
              
              {isAnswered && selectedOption === idx && (
                <View style={styles.resultIndicator}>
                  <Text style={styles.resultIcon}>
                    {option.correct ? '✓' : '✗'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
    width: '60%',
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
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 30,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '500',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: (width - 56) / 2,
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
    transform: [{ scale: 1 }],
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
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    lineHeight: 22,
  },
  labelCorrect: {
    color: '#2e7d32',
  },
  labelIncorrect: {
    color: '#c62828',
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

export default MatchScreen;