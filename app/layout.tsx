import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Providers } from "@/components/providers"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sàn TMĐT - Mua sắm online giá rẻ",
  description:
    "Sàn thương mại điện tử hàng đầu Việt Nam. Mua bán online hàng triệu sản phẩm từ các shop và thương nhân uy tín.",
  keywords: "mua sắm online, thương mại điện tử, shop online, bán hàng online, giá rẻ",
  generator: "v0.app",
  openGraph: {
    title: "Sàn TMĐT - Mua sắm online giá rẻ",
    description:
      "Sàn thương mại điện tử hàng đầu Việt Nam. Mua bán online hàng triệu sản phẩm từ các shop và thương nhân uy tín.",
    type: "website",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF6B35",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${geist.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
