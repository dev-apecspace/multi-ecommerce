'use client'

import type React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth-context'
import { CartProvider } from '@/lib/cart-context'
import { FavoritesProvider } from '@/lib/favorites-context'
import { LoadingProvider } from '@/lib/loading-context'
import { GlobalLoading } from '@/components/global-loading'
import { GlobalErrorToasts } from '@/components/global-error-toasts'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <LoadingProvider>
              {children}
              <GlobalLoading />
              <GlobalErrorToasts />
            </LoadingProvider>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
      <Toaster position="top-right" richColors closeButton />
    </NextThemesProvider>
  )
}
