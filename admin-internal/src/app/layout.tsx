import type { Metadata } from 'next'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Répondly Admin',
  description: 'Interface d\'administration Répondly',
  icons: { icon: '/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          input, select, textarea, button {
            font-family: inherit;
          }
        `}</style>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
