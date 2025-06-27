import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { commonStyles } from '../styles/commonStyles';

interface GameHeaderProps {
  onBackPress: () => void;
  title?: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ onBackPress, title }) => {
  return (
    <View style={commonStyles.header}>
      <TouchableOpacity 
        style={commonStyles.backButton}
        onPress={onBackPress}
      >
        <Text style={commonStyles.backButtonText}>← Volver</Text>
      </TouchableOpacity>
      {title && (
        <Text style={[commonStyles.sectionTitle, { flex: 1, marginBottom: 0 }]}>
          {title}
        </Text>
      )}
    </View>
  );
};