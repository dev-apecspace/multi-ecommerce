import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

interface CartContextType {
  cartCount: number
  setCartCount: (count: number) => void
  addToCart: (quantity?: number) => void
  removeFromCart: (quantity?: number) => void
  refetchCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    if (user) {
      refetchCart()
    } else {
      setCartCount(0)
    }
  }, [user])

  const refetchCart = async () => {
    try {
      const response = await fetch(`/api/cart?userId=${user!.id}`)
      const result = await response.json()
      const items = result.data || []
      setCartCount(items.length)
    } catch (error) {
      console.error('Cart count fetch error:', error)
    }
  }

  const addToCart = (quantity: number = 1) => {
    setCartCount(prev => prev + quantity)
  }

  const removeFromCart = (quantity: number = 1) => {
    setCartCount(prev => Math.max(0, prev - quantity))
  }

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, addToCart, removeFromCart, refetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
