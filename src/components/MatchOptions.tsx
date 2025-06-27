import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Option {
  icon: string;
  label: string;
  correct?: boolean;
}

interface MatchOptionsProps {
  options: Option[];
  selectedOption: number | null;
  isAnswered: boolean;
  onOptionPress: (correct: boolean, index: number) => void;
  optionAnimations: Animated.Value[];
}

export const MatchOptions: React.FC<MatchOptionsProps> = ({
  options,
  selectedOption,
  isAnswered,
  onOptionPress,
  optionAnimations,
}) => {
  const getOptionStyle = (index: number, correct: boolean) => {
    if (!isAnswered) return styles.optionButton;
    
    if (selectedOption === index) {
      return correct ? styles.optionButtonCorrect : styles.optionButtonIncorrect;
    }
    
    return styles.optionButtonDisabled;
  };

  return (
    <View style={styles.optionsContainer}>
      <Text style={styles.sectionTitle}>Opciones disponibles:</Text>
      <View style={styles.optionsGrid}>
        {options.map((option, idx) => (
          <Animated.View
            key={idx}
            style={[
              styles.optionWrapper,
              {
                opacity: optionAnimations[idx],
                transform: [{
                  translateY: optionAnimations[idx].interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  })
                }, {
                  scale: optionAnimations[idx]
                }]
              }
            ]}
          >
            <TouchableOpacity
              style={getOptionStyle(idx, option.correct || false)}
              onPress={() => onOptionPress(option.correct || false, idx)}
              activeOpacity={0.8}
              disabled={isAnswered}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.iconContainer,
                  isAnswered && selectedOption === idx && option.correct && styles.iconContainerCorrect,
                  isAnswered && selectedOption === idx && !option.correct && styles.iconContainerIncorrect,
                ]}>
                  <Text style={styles.icon}>{option.icon}</Text>
                </View>
                <Text style={[
                  styles.label,
                  isAnswered && selectedOption === idx && option.correct && styles.labelCorrect,
                  isAnswered && selectedOption === idx && !option.correct && styles.labelIncorrect,
                ]}>{option.label}</Text>
              </View>
              
              {isAnswered && selectedOption === idx && (
                <View style={[
                  styles.resultIndicator,
                  option.correct ? styles.resultIndicatorCorrect : styles.resultIndicatorIncorrect
                ]}>
                  <Text style={[
                    styles.resultIcon,
                    option.correct ? styles.resultIconCorrect : styles.resultIconIncorrect
                  ]}>
                    {option.correct ? '✓' : '✗'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  optionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionWrapper: {
    width: (width - 44) / 2,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#e8f0fe',
    position: 'relative',
  },
  optionButtonCorrect: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOpacity: 0.25,
  },
  optionButtonIncorrect: {
    backgroundColor: '#ffeaea',
    borderColor: '#f44336',
    shadowColor: '#f44336',
    shadowOpacity: 0.25,
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
  iconContainer: {
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainerCorrect: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  iconContainerIncorrect: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  icon: {
    fontSize: 28,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '600',
    lineHeight: 16,
  },
  labelCorrect: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  labelIncorrect: {
    color: '#c62828',
    fontWeight: '700',
  },
  resultIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  resultIndicatorCorrect: {
    backgroundColor: '#4caf50',
  },
  resultIndicatorIncorrect: {
    backgroundColor: '#f44336',
  },
  resultIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultIconCorrect: {
    color: '#ffffff',
  },
  resultIconIncorrect: {
    color: '#ffffff',
  },
});