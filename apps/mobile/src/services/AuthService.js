import { supabase } from './supabaseClient';
import { isUnimetEmail } from '../utils/email';

export async function login(email, password) {
  if (!isUnimetEmail(email)) throw new Error('Dominio de email no permitido.');
  return supabase.auth.signInWithPassword({ email, password });
}

export async function register(email, password) {
  if (!isUnimetEmail(email)) throw new Error('Dominio de email no permitido.');
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
// Enviar correo de recuperación
export async function resetPassword(email) {
  if (!isUnimetEmail(email)) {
    throw new Error('Dominio de email no permitido.');
  }
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'myapp://reset-password' // cambia a tu esquema o URL configurada
  });
  if (error) throw error;
  return data;
}

// Actualizar la contraseña luego de abrir el link
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}