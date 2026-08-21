import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TraderMind — AI Trading Performance Coach',
  description: 'AI-powered behavioral intelligence for serious traders.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Syne', system-ui, sans-serif", background: 'hsl(222, 20%, 5%)', color: 'hsl(220, 15%, 92%)' }}>
        {children}
      </body>
    </html>
  )
}
