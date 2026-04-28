import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Répondly',
  description: 'Automatisez vos messages',
  icons: { icon: '/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }

          :root {
            --font-ui:   'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            --font-display: 'DM Serif Display', Georgia, serif;

            /* spacing scale */
            --sec-pad-v: 80px;
            --sec-pad-h: 48px;
            --wrap: 1080px;
          }

          @media (max-width: 768px) {
            :root {
              --sec-pad-v: 56px;
              --sec-pad-h: 20px;
            }
          }

          @media (max-width: 480px) {
            :root {
              --sec-pad-v: 44px;
              --sec-pad-h: 16px;
            }
          }

          html { scroll-behavior: smooth; }

          body {
            margin: 0;
            font-family: var(--font-body);
            font-size: 14px;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            overflow-x: hidden;
          }

          input, select, textarea, button {
            font-family: var(--font-ui);
          }

          /* Scrollbar */
          ::-webkit-scrollbar { width: 5px; }
          ::-webkit-scrollbar-track { background: #f0f3f8; }
          ::-webkit-scrollbar-thumb { background: #c8d6e8; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: #1a6bff; }

          /* Mobile safe area */
          .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 12px); }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}