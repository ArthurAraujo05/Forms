import type React from "react"
import type { Metadata } from "next"
import { Analytics } from '@vercel/analytics/next';
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Votação de Jogos - Live TCKUU",
  description: "Vote nos jogos que o streamer deve jogar na próxima live",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}
        <Analytics />
      </body>
    </html>
  )
}
