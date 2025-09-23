import React from 'react';
import { AuthProvider } from './src/hooks';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { AchievementProvider } from './src/contexts/AchievementContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AchievementProvider>
          <AppNavigator />
        </AchievementProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;