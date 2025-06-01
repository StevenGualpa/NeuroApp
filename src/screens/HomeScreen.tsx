import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LESSONS_DATA, Lesson } from '../data/lessons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'home'>>();

  const goToLesson = (lesson: Lesson) => {
navigation.navigate('lesson', { lesson });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🌟 Mi Día a Día 🌟</Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        {LESSONS_DATA.map(lesson => (
          <TouchableOpacity
            key={lesson.id}
            style={styles.card}
            onPress={() => goToLesson(lesson)}
          >
            <Text style={styles.cardIcon}>{lesson.icon}</Text>
            <Text style={styles.cardTitle}>{lesson.title}</Text>
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
