import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

import NuevaResenaScreen from './screens/NuevaResenaScreen';
import ViewReviewScreen from './screens/ViewReviewScreen';
import ReviewDetailScreen from './screens/ReviewDetailScreen';
import ProfessorProfile from './screens/ProfessorProfile';
import CourseProfile from './screens/CourseProfile';

import AdminScreen from './screens/AdminScreen';
import CreateProfessorScreen from './screens/CreateProfessorScreen';
import CreateCourseScreen from './screens/CreateCourseScreen';
import ManageLinksScreen from './screens/ManageLinksScreen';
import MyReviewsScreen from './screens/myReviews';

import EditProfessorScreen from './screens/EditProfessorScreen';
import EditCourseScreen from './screens/EditCourseScreen';
import DeleteProfessorScreen from './screens/DeleteProfessorScreen';
import DeleteCourseScreen from './screens/DeleteCourseScreen';
import FavoritesScreen from './screens/FavoritesScreen'

import { AuthProvider } from './services/AuthContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#111827',
            contentStyle: { backgroundColor: '#ffffff' },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ 
              title: 'UniRate', 
              headerShown: false,
            }} 
          />

          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar sesión' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />

            <Stack.Screen name="ViewReview" component={ViewReviewScreen} options={{ title: 'Reseñas' }} />
            <Stack.Screen name="ReviewDetail" component={ReviewDetailScreen} options={{ title: 'Detalle de reseña' }} />

            <Stack.Screen name="ProfessorProfile" component={ProfessorProfile} options={{ title: 'Profesor' }} />
            <Stack.Screen name="CourseProfile" component={CourseProfile} options={{ title: 'Materia' }} />

            <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Panel Admin' }} />
            <Stack.Screen name="CreateProfessor" component={CreateProfessorScreen} options={{ title: 'Crear Profesor' }} />
            <Stack.Screen name="CreateCourse" component={CreateCourseScreen} options={{ title: 'Crear Materia' }} />
            <Stack.Screen name="ManageLinks" component={ManageLinksScreen} options={{ title: 'Vincular Materias ↔ Profesores' }} />
            <Stack.Screen name="myReviews" component={MyReviewsScreen} options={{ title: 'Mis reseñas' }} />

            <Stack.Screen name="EditProfessor" component={EditProfessorScreen} options={{ title: 'Modificar Profesor' }} />
            <Stack.Screen name="EditCourse" component={EditCourseScreen} options={{ title: 'Modificar Materia' }} />
            <Stack.Screen name="DeleteProfessor" component={DeleteProfessorScreen} options={{ title: 'Eliminar Profesor' }} />
            <Stack.Screen name="DeleteCourse" component={DeleteCourseScreen} options={{ title: 'Eliminar Materia' }} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favoritos' }} />
            <Stack.Screen name="NuevaResena" component={NuevaResenaScreen} options={{ title: 'Nueva reseña' }} />
          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}