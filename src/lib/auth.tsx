import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { PublicClientApplication, AccountInfo, AuthenticationResult } from '@azure/msal-browser'
import { MsalProvider, useMsal } from '@azure/msal-react'
import { msalConfig, loginRequest } from './msalConfig'
import { AuthUser, Perfil } from '../types'
import { db } from './data'

export const msalInstance = new PublicClientApplication(msalConfig)
// Inicializar MSAL antes de cualquier uso (requerido en v3+)
msalInstance.initialize()

interface AuthContextType {
  user:    AuthUser | null
  loading: boolean
  login:   () => Promise<void>
  logout:  () => void
  can:     (action: 'delete' | 'manageUsers') => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function perfilDesdeLabel(label: string): Perfil {
  const map: Record<string, Perfil> = {
    'administrador': 'admin',
    'admin':         'admin',
    'director':      'director',
    'profesional':   'profesional',
  }
  return map[label.toLowerCase()] ?? 'profesional'
}

function AuthInner({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal()
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Maneja el redirect de vuelta desde Microsoft
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result: AuthenticationResult | null = await instance.handleRedirectPromise()
        if (result?.account) {
          instance.setActiveAccount(result.account)
          await resolveUser(result.account)
        } else if (accounts.length > 0) {
          await resolveUser(accounts[0])
        }
      } catch (e) {
        console.error('Error redirect:', e)
      } finally {
        setLoading(false)
      }
    }
    handleRedirect()
  }, [])

  const resolveUser = async (account: AccountInfo) => {
    const email = account.username.toLowerCase()
    const usuarios = db.getUsuarios()
    const found    = usuarios.find(u => u.email.toLowerCase() === email && u.activo)

    if (found) {
      setUser({
        id:     found.id,
        email:  found.email,
        nombre: found.nombre,
        perfil: perfilDesdeLabel(found.perfil),
      })
    } else {
      setUser(null)
      await instance.logoutRedirect()
      alert(`Tu cuenta (${email}) no tiene acceso al sistema DOM.\nContacta al administrador.`)
    }
  }

  const login = async () => {
    try {
      await instance.loginRedirect(loginRequest)
    } catch (e) {
      console.error('Error de autenticación:', e)
    }
  }

  const logout = () => {
    setUser(null)
    instance.logoutRedirect()
  }

  const can = (action: 'delete' | 'manageUsers') => {
    if (!user) return false
    if (action === 'delete')      return user.perfil === 'director' || user.perfil === 'admin'
    if (action === 'manageUsers') return user.perfil === 'admin'
    return false
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthInner>{children}</AuthInner>
    </MsalProvider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
