import React from 'react';
import { View, Text } from 'react-native';
import { commonStyles } from '../styles/commonStyles';

interface GameInstructionsProps {
  icon: string;
  title?: string;
  instructions: string[];
  tip: string;
}

export const GameInstructions: React.FC<GameInstructionsProps> = ({
  icon,
  title = '¿Cómo jugar?',
  instructions,
  tip,
}) => {
  return (
    <View style={commonStyles.instructionCard}>
      <View style={commonStyles.instructionHeader}>
        <Text style={commonStyles.instructionIcon}>{icon}</Text>
        <Text style={commonStyles.instructionTitle}>{title}</Text>
      </View>
      
      {instructions.map((instruction, index) => (
        <Text key={index} style={commonStyles.instructionText}>
          {instruction}
        </Text>
      ))}
      
      <View style={commonStyles.instructionTip}>
        <Text style={commonStyles.instructionTipText}>
          💡 {tip}
        </Text>
      </View>
    </View>
  );
};