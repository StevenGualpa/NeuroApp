// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Pantallas principales
import MainScreen from '../screens/MainScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

// Pantallas de navegación
import CategoryMenuScreen from '../screens/CategoryMenuScreen';
import CombinedLessonScreen from '../screens/CombinedLessonScreen';
import ActivityMenuScreen from '../screens/ActivityMenuScreen';

// Pantallas de juegos
import MemoryGameScreen from '../screens/MemoryGameScreen';
import DragDropScreen from '../screens/DragDropScreen';
import MatchScreen from '../screens/MatchScreen';
import SelectOptionScreen from '../screens/SelectOptionScreen';
import OrderStepsScreen from '../screens/OrderStepsScreen';
import PatternRecognitionScreen from '../screens/PatternRecognitionScreen';

// Pantallas adicionales
import AchievementsScreen from '../screens/AchievementsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';

import type { Lesson, Step } from '../services/ApiService';

export type RootStackParamList = {
  // Pantalla principal
  MainScreen: undefined;
  
  // Pantallas de autenticación y onboarding
  login: undefined;
  onboarding: undefined;
  
  // Pantallas de navegación
  categoryMenu: { activityType?: string };
  lessonList: { category: string; activityType?: string };
  lesson: { lesson: Lesson };
  activityMenu: undefined;
  
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
  Settings: undefined;
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
      
      {/* Pantallas de Navegación */}
      <Stack.Screen name="activityMenu" component={ActivityMenuScreen} />
      <Stack.Screen name="categoryMenu" component={CategoryMenuScreen} />
      <Stack.Screen name="lessonList" component={CombinedLessonScreen} />
      
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
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;