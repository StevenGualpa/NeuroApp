import React from 'react';
import { AuthProvider } from './src/hooks';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;
