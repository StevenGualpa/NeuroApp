import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { LESSONS_DATA } from '../data/lessons';
import type { RouteProp } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'home'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'home'>>();
  const activityType = route.params?.activityType;

  // Filtrar categorías según el tipo de actividad (si se recibió)
  const categories = Array.from(
    new Set(
      LESSONS_DATA
        .filter(lesson =>
          activityType
            ? lesson.steps.some(step => step.activityType === activityType)
            : true
        )
        .map(lesson => lesson.category)
    )
  );

  const goToCategory = (category: string) => {
    navigation.navigate('sublessonList', { category });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        {activityType ? `🌟 ${activityType} 🌟` : '🌟 Mis Normas Básicas 🌟'}
      </Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        {categories.length > 0 ? (
          categories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => goToCategory(category)}
            >
              <Text style={styles.cardIcon}>📘</Text>
              <Text style={styles.cardTitle}>{category}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noContent}>
            No hay categorías disponibles para esta actividad.
          </Text>
        )}
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
  noContent: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
  },
});
