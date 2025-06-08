// RepeatSoundScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import Tts from 'react-native-tts';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const RepeatSoundScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'repeatSound'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { step, lessonTitle } = route.params;

  useEffect(() => {
    Tts.setDefaultLanguage('es-ES');
    Tts.setDefaultRate(0.5);
    Tts.speak(step.audio);
  }, []);

  const handleOptionPress = (correct: boolean) => {
    if (correct) {
      Alert.alert('¡Muy bien!', 'Seleccionaste la opción correcta.');
      navigation.goBack();
    } else {
      Alert.alert('Intenta de nuevo', 'Esa no es la opción correcta.');
    }
  };

  const replayAudio = () => {
    Tts.speak(step.audio);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{lessonTitle}</Text>
      <Text style={styles.subtitle}>Actividad: Repetir Sonido</Text>
      <Text style={styles.instruction}>Escucha y elige el pictograma correcto:</Text>

      <TouchableOpacity style={styles.speakerButton} onPress={replayAudio}>
        <Text style={styles.speakerText}>🔈 Escuchar de nuevo</Text>
      </TouchableOpacity>

      <View style={styles.optionsContainer}>
        {step.options?.map((option, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.optionButton}
            onPress={() => handleOptionPress(option.correct)}
          >
            <Text style={styles.icon}>{option.icon}</Text>
            <Text style={styles.label}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#eef6fc',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 15,
    color: '#666',
  },
  instruction: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
  },
  speakerButton: {
    backgroundColor: '#4a90e2',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  speakerText: {
    color: 'white',
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  optionButton: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: 120,
    elevation: 2,
  },
  icon: {
    fontSize: 36,
  },
  label: {
    marginTop: 5,
    fontSize: 16,
  },
});

export default RepeatSoundScreen;
