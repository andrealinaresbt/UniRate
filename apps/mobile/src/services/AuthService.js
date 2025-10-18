// services/AuthService.js
import { supabase } from './supabaseClient'
import { isUnimetCorreoEmail } from '../utils/email' // Cambia aquí
import { Linking } from 'react-native';

// ------ AUTH ------
// services/AuthService.js

export const ADMIN_EMAILS = new Set([
  'cristian.gouveia@correo.unimet.edu.ve',
  'gabriel.brito@correo.unimet.edu.ve',
  'linares.andrea@correo.unimet.edu.ve',
  'cfermoso@correo.unimet.edu.ve',
  'c.atencio@correo.unimet.edu.ve',
]);

export function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.has(String(email).toLowerCase());
}


export async function login(email, password) {
  if (!isUnimetCorreoEmail(email)) throw new Error('Dominio de email no permitido.') // Cambia aquí
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message || 'No se pudo iniciar sesión.')
  if (!data?.session) throw new Error('Supabase no devolvió sesión.')
  return data.session
}


export async function register(email, password) {
  if (!isUnimetCorreoEmail(email)) throw new Error('Dominio de email no permitido.') // Cambia aquí
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(error.message || 'No se pudo registrar.')
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

// ------ HELPERS DE SESIÓN ------
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(error.message)
  return data.session ?? null
}


export async function fetchIsAdmin(email) {
  return Promise.resolve(isAdminEmail(email));
}

// services/AuthService.js
export function onAuthStateChange(cb) {
  return supabase.auth.onAuthStateChange((event, session) => cb(event, session ?? null))
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw new Error(error.message || 'No se pudo enviar el correo de recuperación.')
  return true
}
const WEB_AUTH_URL = 'https://unirateweb.vercel.app/';

export async function sendResetEmail(email) {
  // Envía el correo con link que abre tu página web
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: WEB_AUTH_URL,
  });
}

export function signInWithGoogle() {
  // Abre la página que inicia el flujo OAuth de Google
  const url = `${WEB_AUTH_URL}?start=google`;
  return Linking.openURL(url);
}