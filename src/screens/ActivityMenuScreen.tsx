// src/screens/ActivityMenuScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const activityTypes = [
  'Selecciona la opción correcta',
  'Ordena los pasos',
  'Asocia elementos',
] as const;

const ActivityMenuScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const goToActivityCategory = (activityType: string) => {
    navigation.navigate('home', { activityType }); // se redirige a home con el tipo
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Selecciona el tipo de actividad</Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        {activityTypes.map((type, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => goToActivityCategory(type)}
          >
            <Text style={styles.cardTitle}>{type}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ActivityMenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4a90e2',
    marginVertical: 20,
  },
  scroll: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
