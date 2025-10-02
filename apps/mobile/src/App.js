import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import NuevaResenaScreen from './screens/NuevaResenaScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="NuevaResena"
          component={NuevaResenaScreen}
          options={{ title: 'Nueva Reseña' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
