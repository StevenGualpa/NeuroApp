import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import LessonScreen from '../screens/LessonScreen';
import SubLessonListScreen from '../screens/SubLessonListScreen';
import LoginScreen from '../screens/LoginScreen';
import ActivityMenuScreen from '../screens/ActivityMenuScreen';
import MemoryGameScreen from '../screens/MemoryGameScreen';
import RepeatSoundScreen from '../screens/RepeatSoundScreen';
import DragDropScreen from '../screens/DragDropScreen'; // Asegúrate de que la ruta sea correcta

import type { Lesson, Step } from '../data/lessons';

export type RootStackParamList = {
  login: undefined;
  activityMenu: undefined;
  home: { activityType?: string };
  lesson: { lesson: Lesson };
  sublessonList: { category: string };
  memoryGame: { step: Step; lessonTitle: string };
  repeatSound: { step: Step; lessonTitle: string };
  dragDrop: { step: Step; lessonTitle: string }; // ✅ añadido correctamente
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="activityMenu">
      <Stack.Screen name="home" component={HomeScreen} />
      <Stack.Screen name="activityMenu" component={ActivityMenuScreen} />
      <Stack.Screen name="lesson" component={LessonScreen} />
      <Stack.Screen name="sublessonList" component={SubLessonListScreen} />
      <Stack.Screen name="login" component={LoginScreen} />
      <Stack.Screen name="memoryGame" component={MemoryGameScreen} />
      <Stack.Screen name="repeatSound" component={RepeatSoundScreen} />
      <Stack.Screen name="dragDrop" component={DragDropScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
