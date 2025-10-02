// services/AuthService.js
import { supabase } from './supabaseClient'
import { isUnimetEmail } from '../utils/email'

// ------ AUTH ------
// services/AuthService.js
export async function login(email, password) {
  if (!isUnimetEmail(email)) throw new Error('Dominio de email no permitido.')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message || 'No se pudo iniciar sesión.')
  if (!data?.session) throw new Error('Supabase no devolvió sesión.')
  return data.session
}


export async function register(email, password) {
  if (!isUnimetEmail(email)) throw new Error('Dominio de email no permitido.')
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


export async function fetchIsAdmin(userId) {
  if (!userId) return false
  const { data, error } = await supabase
    .from('users') // tu tabla
    .select('has_unlimited_access')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return Boolean(data?.has_unlimited_access)
}
// services/AuthService.js
export function onAuthStateChange(cb) {
  return supabase.auth.onAuthStateChange((event, session) => cb(event, session ?? null))
}
