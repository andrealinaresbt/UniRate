// apps/mobile/src/App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import NuevaResenaScreen from './screens/NuevaResenaScreen';
import ProfessorProfile from './screens/ProfessorProfile';
import CourseProfile from './screens/CourseProfile';

import AdminScreen from './screens/AdminScreen';
import CreateProfessorScreen from './screens/CreateProfessorScreen';

import { AuthProvider } from './services/AuthContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerTitleAlign: 'center',
            headerBackTitleVisible: false,
          }}
        >
          {/* Home */}
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'UniRate' }}
          />

          {/* Login (setup de develop) */}
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />

          {/* Registro (develop usa RegisterScreen). Dejamos alias "Register" por compatibilidad. */}
          <Stack.Screen
            name="RegisterScreen"
            component={RegisterScreen}
            options={{ title: 'Registro', headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Registro', headerShown: false }}
          />

          {/* Nueva Reseña (texto de develop) */}
          <Stack.Screen
            name="NuevaResena"
            component={NuevaResenaScreen}
            options={{ title: 'Publicar Reseña' }}
          />

          {/* Perfiles (develop) */}
          <Stack.Screen
            name="ProfessorProfile"
            component={ProfessorProfile}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CourseProfile"
            component={CourseProfile}
            options={{ headerShown: false }}
          />

          {/* Admin agregado en esta feature */}
          <Stack.Screen
            name="Admin"
            component={AdminScreen}
            options={{ title: 'Panel Admin' }}
          />
          <Stack.Screen
            name="CreateProfessor"
            component={CreateProfessorScreen}
            options={{ title: 'Crear Profesor' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
