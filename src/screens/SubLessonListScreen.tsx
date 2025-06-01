// src/screens/SubLessonListScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LESSONS_DATA } from '../data/lessons';
import type { Lesson } from '../data/lessons';

const SubLessonListScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'sublessonList'>>();
  const { category } = route.params;

  const filteredLessons: Lesson[] = LESSONS_DATA.filter(
    (lesson) => lesson.category === category
  );

  const goToLesson = (lesson: Lesson) => {
    navigation.navigate('lesson', { lesson });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>📘 {category}</Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        {filteredLessons.map((lesson) => (
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

export default SubLessonListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffaf0',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4a90e2',
    textAlign: 'center',
    marginBottom: 20,
  },
  scroll: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
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
