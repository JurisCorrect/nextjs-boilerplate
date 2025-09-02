// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Merriweather } from 'next/font/google'

const merri = Merriweather({ subsets: ['latin'], weight: ['300','400','700'] })

export const metadata: Metadata = {
  title: 'Jurisconnect',
  description: 'Correction automatisée spécialisée en méthodologie juridique',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={merri.className}>{children}</body>
    </html>
  )
}
