// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import MainScreen from '../screens/MainScreen';
import HomeScreen from '../screens/HomeScreen';
import LessonScreen from '../screens/LessonScreen';
import SubLessonListScreen from '../screens/SubLessonListScreen';
import LoginScreen from '../screens/LoginScreen';
import ActivityMenuScreen from '../screens/ActivityMenuScreen';
import MemoryGameScreen from '../screens/MemoryGameScreen';
import RepeatSoundScreen from '../screens/RepeatSoundScreen';
import DragDropScreen from '../screens/DragDropScreen';
import MatchScreen from '../screens/MatchScreen';
import SelectOptionScreen from '../screens/SelectOptionScreen';
import OrderStepsScreen from '../screens/OrderStepsScreen';
import AchievementsScreen from '../screens/AchievementsScreen';

import type { Lesson } from '../data/lessons';

export type Step = {
  id: number;
  text: string;
  icon: string;
  completed: boolean;
  activityType: string;
  options?: {
    icon: string;
    label: string;
    correct: boolean;
    correctZone?: string;
  }[];
  audio?: string;
};

export type RootStackParamList = {
  // Pantalla principal
  MainScreen: undefined;
  
  // Pantallas de autenticación
  login: undefined;
  
  // Pantallas de actividades
  activityMenu: undefined;
  home: { activityType?: string };
  lesson: { lesson: Lesson };
  sublessonList: { category: string };
  
  // Pantallas de juegos
  memoryGame: { step: Step; lessonTitle: string };
  repeatSound: { step: Step; lessonTitle: string };
  dragDrop: { step: Step; lessonTitle: string };
  match: { step: Step; lessonTitle: string };
  selectOption: { step: Step; lessonTitle: string };
  orderSteps: { step: Step; lessonTitle: string };
  
  // Pantallas adicionales
  Achievements: undefined;
  HomeScreen: undefined; // Para el tab Home del MainScreen
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator 
      screenOptions={{ headerShown: false }} 
      initialRouteName="MainScreen"
    >
      {/* Pantalla Principal */}
      <Stack.Screen name="MainScreen" component={MainScreen} />
      
      {/* Pantallas de Autenticación */}
      <Stack.Screen name="login" component={LoginScreen} />
      
      {/* Pantallas de Actividades */}
      <Stack.Screen name="activityMenu" component={ActivityMenuScreen} />
      <Stack.Screen name="home" component={HomeScreen} />
      <Stack.Screen name="sublessonList" component={SubLessonListScreen} />
      <Stack.Screen name="lesson" component={LessonScreen} />
      
      {/* Pantallas de Juegos */}
      <Stack.Screen name="memoryGame" component={MemoryGameScreen} />
      <Stack.Screen name="repeatSound" component={RepeatSoundScreen} />
      <Stack.Screen name="dragDrop" component={DragDropScreen} />
      <Stack.Screen name="match" component={MatchScreen} />
      <Stack.Screen name="selectOption" component={SelectOptionScreen} />
      <Stack.Screen name="orderSteps" component={OrderStepsScreen} />
      
      {/* Pantallas Adicionales */}
      <Stack.Screen name="Achievements" component={AchievementsScreen} />
      <Stack.Screen 
        name="HomeScreen" 
        component={HomeScreen} 
        options={{ title: 'Home' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;