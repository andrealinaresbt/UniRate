// apps/mobile/src/services/AuthService.js
import { supabase } from './supabaseClient'
import { isUnimetCorreoEmail } from '../utils/email'
import { Linking } from 'react-native';

// =====================
// ADMIN (lista blanca)
// =====================
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

// =====================
// AUTH BÁSICO
// =====================
export async function login(email, password) {
 if (!isUnimetCorreoEmail(email)) throw new Error('Dominio de email no permitido.')
 const { data, error } = await supabase.auth.signInWithPassword({ email, password })
 if (error) throw new Error(error.message || 'No se pudo iniciar sesión.')
if (!data?.session) throw new Error('Supabase no devolvió sesión.')
 return data.session
}

export async function register(email, password) {
 if (!isUnimetCorreoEmail(email)) throw new Error('Dominio de email no permitido.')
 const { data, error } = await supabase.auth.signUp({ email, password })
 if (error) throw new Error(error.message || 'No se pudo registrar.')
 return data
}

export async function signOut() {
 const { error } = await supabase.auth.signOut()
 if (error) throw new Error(error.message)
}

// =====================
// SESIÓN / HELPERS
// =====================
export async function getSession() {
 const { data, error } = await supabase.auth.getSession()
 if (error) throw new Error(error.message)
 return data.session ?? null
}

/**
 * ✅ NUEVO: exige que exista una sesión antes de mutar.
 * Lanza error claro si no hay sesión (evita 0 filas por RLS silencioso).
 */
export async function requireSessionOrThrow() {
 const { data, error } = await supabase.auth.getSession()
 if (error) throw new Error(error.message || 'No se pudo obtener la sesión.')
 const session = data?.session
 if (!session) throw new Error('Inicia sesión para continuar.')
 return session
}

export async function fetchIsAdmin(email) {
 return Promise.resolve(isAdminEmail(email));
}

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
 return supabase.auth.resetPasswordForEmail(email, {
  redirectTo: WEB_AUTH_URL,
 });
}

export function signInWithGoogle() {
 const url = `${WEB_AUTH_URL}?start=google`;
 return Linking.openURL(url);
}

// =====================
// 💣 ELIMINACIÓN DE CUENTA
// =====================

/**
 * 💣 Elimina la cuenta del usuario autenticado, sus reseñas y otros datos asociados
 * llamando a la función RPC de Supabase.
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteUserAccountAndData() {
 const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
 
 if (sessionError || !sessionData?.session) {
  throw new Error('Inicia sesión para poder eliminar tu cuenta.');
 }
 
 try {
  // Llama al RPC (Remote Procedure Call) que debe estar definido en SQL de Supabase.
  // Este RPC es el que maneja la eliminación de datos (reseñas, favoritos) y la cuenta de auth.
  const { error: rpcError } = await supabase.rpc('delete_user_and_data');

  if (rpcError) {
  console.error('Error al llamar al RPC de eliminación de cuenta:', rpcError);
   throw new Error(`Error del servidor: ${rpcError.message}`);
  }

  // Si la eliminación es exitosa en el backend, cerramos la sesión localmente.
  await signOut(); 

  return { success: true };
 } catch (error) {
  console.error('Error durante la eliminación de cuenta:', error);
// Relanzar un error más amigable para la UI
 throw new Error(error.message || 'Ocurrió un error desconocido al eliminar la cuenta.');
 }
}