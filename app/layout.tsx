import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SSSFarm',
  description: '스마트 농장 관리 시스템',
  generator: 'SSSFarm v1.0',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
