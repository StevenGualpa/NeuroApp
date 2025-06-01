import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import LessonScreen from '../screens/LessonScreen';
import type { Lesson } from '../data/lessons';

export type RootStackParamList = {
  home: undefined;
 lesson: { lesson: Lesson };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="home">
      <Stack.Screen name="home" component={HomeScreen} />
      <Stack.Screen name="lesson" component={LessonScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
