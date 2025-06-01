import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { LESSONS_DATA } from '../data/lessons';

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'home'>>();

  // Extraer categorías únicas de las lecciones
  const categories = Array.from(
    new Set(LESSONS_DATA.map((lesson) => lesson.category))
  );

  const goToCategory = (category: string) => {
    navigation.navigate('sublessonList', { category });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🌟 Mis Normas Básicas 🌟</Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => goToCategory(category)}
          >
            <Text style={styles.cardIcon}>📘</Text>
            <Text style={styles.cardTitle}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

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
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  cardIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
