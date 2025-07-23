// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import MainScreen from '../screens/MainScreen';
import CategoryMenuScreen from '../screens/CategoryMenuScreen';
import RealCategoryMenuScreen from '../screens/RealCategoryMenuScreen';
import LessonScreen from '../screens/LessonScreen';
import RealLessonScreen from '../screens/RealLessonScreen';
import SubLessonListScreen from '../screens/SubLessonListScreen';
import RealLessonListScreen from '../screens/RealLessonListScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ActivityMenuScreen from '../screens/ActivityMenuScreen';
import RealActivityMenuScreen from '../screens/RealActivityMenuScreen';
import MemoryGameScreen from '../screens/MemoryGameScreen';
import DragDropScreen from '../screens/DragDropScreen';
import MatchScreen from '../screens/MatchScreen';
import SelectOptionScreen from '../screens/SelectOptionScreen';
import OrderStepsScreen from '../screens/OrderStepsScreen';
import PatternRecognitionScreen from '../screens/PatternRecognitionScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';

import type { Lesson, Step } from '../data/lessons';

export type RootStackParamList = {
  // Pantalla principal
  MainScreen: undefined;
  
  // Pantallas de autenticación y onboarding
  login: undefined;
  onboarding: undefined;
  
  // Pantallas de actividades
  activityMenu: undefined;
  realActivityMenu: undefined;
  categoryMenu: { activityType?: string };
  realCategoryMenu: { activityType?: string };
  lesson: { lesson: Lesson };
  realLesson: { lesson: Lesson };
  sublessonList: { category: string; activityType?: string };
  realLessonList: { category: string; activityType?: string };
  
  // Pantallas de juegos
  memoryGame: { step: Step; lessonTitle: string };
  dragDrop: { step: Step; lessonTitle: string };
  match: { step: Step; lessonTitle: string };
  selectOption: { step: Step; lessonTitle: string };
  orderSteps: { step: Step; lessonTitle: string };
  patternRecognition: { step: Step; lessonTitle: string };
  
  // Pantallas adicionales
  Achievements: undefined;
  Statistics: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator 
      screenOptions={{ headerShown: false }} 
      initialRouteName="login"
    >
      {/* Pantalla Principal */}
      <Stack.Screen name="MainScreen" component={MainScreen} />
      
      {/* Pantallas de Autenticación y Onboarding */}
      <Stack.Screen name="login" component={LoginScreen} />
      <Stack.Screen name="onboarding" component={OnboardingScreen} />
      
      {/* Pantallas de Actividades */}
      <Stack.Screen name="activityMenu" component={ActivityMenuScreen} />
      <Stack.Screen name="realActivityMenu" component={RealActivityMenuScreen} />
      <Stack.Screen name="categoryMenu" component={CategoryMenuScreen} />
      <Stack.Screen name="realCategoryMenu" component={RealCategoryMenuScreen} />
      <Stack.Screen name="sublessonList" component={SubLessonListScreen} />
      <Stack.Screen name="realLessonList" component={RealLessonListScreen} />
      <Stack.Screen name="lesson" component={LessonScreen} />
      <Stack.Screen name="realLesson" component={RealLessonScreen} />
      
      {/* Pantallas de Juegos */}
      <Stack.Screen name="memoryGame" component={MemoryGameScreen} />
      <Stack.Screen name="dragDrop" component={DragDropScreen} />
      <Stack.Screen name="match" component={MatchScreen} />
      <Stack.Screen name="selectOption" component={SelectOptionScreen} />
      <Stack.Screen name="orderSteps" component={OrderStepsScreen} />
      <Stack.Screen name="patternRecognition" component={PatternRecognitionScreen} />
      
      {/* Pantallas Adicionales */}
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;