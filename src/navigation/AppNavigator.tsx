import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import LessonScreen from '../screens/LessonScreen';
import SubLessonListScreen from '../screens/SubLessonListScreen'; // ✅ Agregado
import LoginScreen from '../screens/LoginScreen'; 
import ActivityMenuScreen from '../screens/ActivityMenuScreen'; // ✅


import type { Lesson } from '../data/lessons';

export type RootStackParamList = {
  login: undefined;
  activityMenu: undefined; // ✅
  home: { activityType?: string }; // home acepta un filtro opcional
  lesson: { lesson: Lesson };
  sublessonList: { category: string }; // ✅ Agregado
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
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
