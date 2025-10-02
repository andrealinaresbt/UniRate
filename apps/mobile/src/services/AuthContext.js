// services/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getSession, onAuthStateChange } from './AuthService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const lastTokenRef = useRef(null)

  useEffect(() => {
    let alive = true

    ;(async () => {
      const s = await getSession().catch(() => null)
      if (!alive) return
      setSession(s)
      lastTokenRef.current = s?.access_token ?? null
    })()

    const sub = onAuthStateChange((event, next) => {
      if (!alive) return

      // Solo reaccionar a cambios de sesión reales
      if (event === 'SIGNED_IN') {
        const token = next?.access_token ?? null
        if (token && token !== lastTokenRef.current) {
          lastTokenRef.current = token
          setSession(next)
        }
        return
      }

      if (event === 'SIGNED_OUT') {
        lastTokenRef.current = null
        setSession(null)
        return
      }

      // Ignorar TOKEN_REFRESHED / USER_UPDATED para no perder foco
      return
    })

    return () => {
      alive = false
      sub?.data?.subscription?.unsubscribe?.()
    }
  }, [])

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
  }), [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const v = useContext(AuthContext)
  if (!v) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return v
}
