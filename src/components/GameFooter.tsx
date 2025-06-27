import React from 'react';
import { View, Text } from 'react-native';
import { commonStyles } from '../styles/commonStyles';

interface GameFooterProps {
  motivationText: string;
  encouragementText: string;
}

export const GameFooter: React.FC<GameFooterProps> = ({
  motivationText,
  encouragementText,
}) => {
  return (
    <View style={commonStyles.footer}>
      <View style={commonStyles.motivationContainer}>
        <Text style={commonStyles.motivationIcon}>⭐</Text>
        <Text style={commonStyles.footerText}>
          {motivationText}
        </Text>
        <Text style={commonStyles.motivationIcon}>⭐</Text>
      </View>
      
      <View style={commonStyles.encouragementFooter}>
        <Text style={commonStyles.encouragementFooterText}>
          {encouragementText}
        </Text>
      </View>
    </View>
  );
};