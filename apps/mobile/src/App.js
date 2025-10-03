import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import NuevaResenaScreen from './screens/NuevaResenaScreen';
import RegisterScreen from './screens/RegisterScreen'; 
import { AuthProvider } from './services/AuthContext';
import ProfessorProfile from './screens/ProfessorProfile';
import CourseProfile from './screens/CourseProfile';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {/* Home */}
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />

          {/* Login */}
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />

          {/* Register */}
          <Stack.Screen
            name="RegisterScreen"
            component={RegisterScreen}
            options={{ title: 'Registro', headerShown: false }}
          />

          {/* Nueva Reseña */}
          <Stack.Screen
            name="NuevaResena"
            component={NuevaResenaScreen}
            options={{ title: 'Publicar Reseña' }}
          />
          {/* Professor Profile */}
          <Stack.Screen
            name="ProfessorProfile"
            component={ProfessorProfile}
            options={{ headerShown: false }}
          />

          {/* Course Profile */}
          <Stack.Screen
            name="CourseProfile"
            component={CourseProfile}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

