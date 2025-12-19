'use client'

import type React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth-context'
import { CartProvider } from '@/lib/cart-context'
import { FavoritesProvider } from '@/lib/favorites-context'
import { LoadingProvider } from '@/lib/loading-context'
import { GlobalLoading } from '@/components/global-loading'
import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <LoadingProvider>
              {children}
              <GlobalLoading />
            </LoadingProvider>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
      <Toaster />
    </NextThemesProvider>
  )
}
