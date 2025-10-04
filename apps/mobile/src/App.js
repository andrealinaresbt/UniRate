import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import NuevaResenaScreen from './screens/NuevaResenaScreen';
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
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'UniRate' }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar sesión' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
          <Stack.Screen name="NuevaResena" component={NuevaResenaScreen} options={{ title: 'Nueva reseña' }} />

          {/* Panel admin */}
          <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Panel Admin' }} />
          <Stack.Screen name="CreateProfessor" component={CreateProfessorScreen} options={{ title: 'Crear Profesor' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
