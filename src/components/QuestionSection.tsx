import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

interface QuestionSectionProps {
  questionText: string;
  instructionText?: string;
  animation?: Animated.Value;
}

export const QuestionSection: React.FC<QuestionSectionProps> = ({
  questionText,
  instructionText = "Selecciona la opción correcta",
  animation,
}) => {
  const animatedStyle = animation ? {
    opacity: animation,
    transform: [{
      scale: animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1],
      })
    }]
  } : {};

  return (
    <Animated.View style={[styles.questionContainer, animatedStyle]}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionIcon}>❓</Text>
        <Text style={styles.questionTitle}>Pregunta</Text>
      </View>
      <Text style={styles.questionText}>{questionText}</Text>
      <Text style={styles.instructionText}>{instructionText}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  questionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#4285f4',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  questionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
    lineHeight: 24,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    fontWeight: '500',
  },
});