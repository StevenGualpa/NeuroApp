// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import MainScreen from '../screens/MainScreen';
import CategoryMenuScreen from '../screens/CategoryMenuScreen';
import LessonScreen from '../screens/LessonScreen';
import SubLessonListScreen from '../screens/SubLessonListScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ActivityMenuScreen from '../screens/ActivityMenuScreen';
import MemoryGameScreen from '../screens/MemoryGameScreen';
import RepeatSoundScreen from '../screens/RepeatSoundScreen';
import DragDropScreen from '../screens/DragDropScreen';
import MatchScreen from '../screens/MatchScreen';
import SelectOptionScreen from '../screens/SelectOptionScreen';
import OrderStepsScreen from '../screens/OrderStepsScreen';
import PatternRecognitionScreen from '../screens/PatternRecognitionScreen';
import AchievementsScreen from '../screens/AchievementsScreen';

import type { Lesson, Step } from '../data/lessons';

export type RootStackParamList = {
  // Pantalla principal
  MainScreen: undefined;
  
  // Pantallas de autenticación y onboarding
  login: undefined;
  onboarding: undefined;
  
  // Pantallas de actividades
  activityMenu: undefined;
  categoryMenu: { activityType?: string };
  lesson: { lesson: Lesson };
  sublessonList: { category: string; activityType?: string };
  
  // Pantallas de juegos
  memoryGame: { step: Step; lessonTitle: string };
  repeatSound: { step: Step; lessonTitle: string };
  dragDrop: { step: Step; lessonTitle: string };
  match: { step: Step; lessonTitle: string };
  selectOption: { step: Step; lessonTitle: string };
  orderSteps: { step: Step; lessonTitle: string };
  patternRecognition: { step: Step; lessonTitle: string };
  
  // Pantallas adicionales
  Achievements: undefined;
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
      <Stack.Screen name="categoryMenu" component={CategoryMenuScreen} />
      <Stack.Screen name="sublessonList" component={SubLessonListScreen} />
      <Stack.Screen name="lesson" component={LessonScreen} />
      
      {/* Pantallas de Juegos */}
      <Stack.Screen name="memoryGame" component={MemoryGameScreen} />
      <Stack.Screen name="repeatSound" component={RepeatSoundScreen} />
      <Stack.Screen name="dragDrop" component={DragDropScreen} />
      <Stack.Screen name="match" component={MatchScreen} />
      <Stack.Screen name="selectOption" component={SelectOptionScreen} />
      <Stack.Screen name="orderSteps" component={OrderStepsScreen} />
      <Stack.Screen name="patternRecognition" component={PatternRecognitionScreen} />
      
      {/* Pantallas Adicionales */}
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;