"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, useCallback } from "react"

interface User {
  id: number | string
  name: string
  email: string
  phone?: string
  role: "customer" | "vendor" | "admin"
  status?: string
  avatar?: string
  vendorId?: number
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  signup: (email: string, password: string, name: string, phone?: string) => Promise<User>
  vendorSignup: (data: any) => Promise<User>
  clearError: () => void
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function setStoredUser(user: User | null): void {
  if (typeof window === 'undefined') return
  
  if (user) {
    localStorage.setItem('auth_user', JSON.stringify(user))
  } else {
    localStorage.removeItem('auth_user')
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = getStoredUser()
        if (storedUser) {
          setUser(storedUser)
        }
      } catch (err) {
        console.error('Failed to restore auth:', err)
      } finally {
        setIsInitialized(true)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      const userData = data.user
      setUser(userData)
      setStoredUser(userData)
      return userData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      setStoredUser(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const signup = useCallback(async (email: string, password: string, name: string, phone?: string): Promise<User> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone }),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      const userData = data.user
      setUser(userData)
      setStoredUser(userData)
      return userData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const vendorSignup = useCallback(async (data: any): Promise<User> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/vendor-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Vendor registration failed')
      }

      const userData = responseData.user
      setUser(userData)
      setStoredUser(userData)
      return userData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Vendor registration failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      const updatedUser = data.user
      setUser(updatedUser)
      setStoredUser(updatedUser)
      return updatedUser
    } catch (err) {
      console.error('Failed to refresh user:', err)
      return null
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, loading: loading || !isInitialized, error, login, logout, signup, vendorSignup, clearError, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
