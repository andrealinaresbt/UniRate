import { supabase } from './supabaseClient'
import { isUnimetEmail } from '../utils/email'

export async function registerUser({ email, password, nombre, carrera }) {
  if (!isUnimetEmail(email)) throw new Error('Dominio de email no permitido.')

  // Verificar si el email ya existe
  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existingError) throw new Error(existingError.message || 'Error verificando email.')
  if (existing) throw new Error('Este correo ya está registrado.')

  // Registro en Supabase Auth
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(error.message || 'No se pudo registrar.')
  const userId = data?.user?.id

  // Si hay datos extra, los guardamos en la tabla users
  if (userId && (nombre || carrera)) {
    const updateObj = {}
    if (nombre) updateObj.full_name = nombre
    if (carrera) updateObj.career = carrera

    const { error: dbError } = await supabase
      .from('users')
      .update(updateObj)
      .eq('id', userId)
    if (dbError) throw new Error(dbError.message || 'No se pudo guardar los datos adicionales.')
  }
  return data
}