import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Soutra Transport - SaaS de Gestion pour Compagnies Interurbaines',
  description: 'Solution cloud complète pour la gestion des billets, du suivi GPS et du personnel pour les transports ivoiriens.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Soutra SaaS',
    statusBarStyle: 'default',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </body>
    </html>
  )
}
