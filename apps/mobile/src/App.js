// apps/mobile/src/App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import NuevaResenaScreen from './screens/NuevaResenaScreen';
import ViewReviewScreen from './screens/ViewReviewScreen';
import ProfessorProfile from './screens/ProfessorProfile';
import CourseProfile from './screens/CourseProfile';

import AdminScreen from './screens/AdminScreen';
import CreateProfessorScreen from './screens/CreateProfessorScreen';
import CreateCourseScreen from './screens/CreateCourseScreen';
import ManageLinksScreen from './screens/ManageLinksScreen';

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
            options={{
              title: 'UniRate',
              headerStyle: {
                backgroundColor: '#003087',
                shadowColor: 'transparent', // iOS shadow
                elevation: 0,               // Android shadow
                borderBottomWidth: 0,       
                paddingBottom:0
              },
              headerShown: false,
              headerShadowVisible: false,  
              headerTintColor: '#fff',
            }}
          />

          {/* Login / Registro (mantengo alias por compatibilidad) */}
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} options={{ title: 'Registro', headerShown: false }} />
          

          {/* Reseñas */}
          <Stack.Screen name="NuevaResena" component={NuevaResenaScreen} options={{ title: 'Publicar Reseña' }} />
          <Stack.Screen name="ViewReview" component={ViewReviewScreen} options={{ title: 'Reseñas' }} />
          
          {/* Perfiles */}
          <Stack.Screen name="ProfessorProfile" component={ProfessorProfile} options={{ headerShown: false }} />
          <Stack.Screen name="CourseProfile" component={CourseProfile} options={{ headerShown: false }} />

          {/* Admin + creación */}
          <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Panel Admin' }} />
          <Stack.Screen name="CreateProfessor" component={CreateProfessorScreen} options={{ title: 'Crear Profesor' }} />
          <Stack.Screen name="CreateCourse" component={CreateCourseScreen} options={{ title: 'Crear Materia' }} />

          {/* Vinculaciones */}
          <Stack.Screen name="ManageLinks" component={ManageLinksScreen} options={{ title: 'Vincular Materias ↔ Profesores' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
