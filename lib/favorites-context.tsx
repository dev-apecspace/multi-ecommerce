"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

interface FavoritesContextType {
  favoritesCount: number
  updateFavoritesCount: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [favoritesCount, setFavoritesCount] = useState(0)

  const updateFavoritesCount = async () => {
    if (!user) {
      setFavoritesCount(0)
      return
    }

    try {
      const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id
      const response = await fetch(`/api/favorites?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setFavoritesCount(Array.isArray(data) ? data.length : 0)
      }
    } catch (error) {
      console.error('Error fetching favorites count:', error)
    }
  }

  useEffect(() => {
    updateFavoritesCount()
  }, [user])

  return (
    <FavoritesContext.Provider value={{ favoritesCount, updateFavoritesCount }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavoritesContext must be used within FavoritesProvider')
  }
  return context
}
