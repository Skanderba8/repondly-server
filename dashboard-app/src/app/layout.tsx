import type { Metadata, Viewport } from 'next'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Répondly',
  description: 'Automate your business messages',
  icons: {
    icon: '/logo.png',
    apple: '/mobile-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Répondly',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#000000' }, { media: '(prefers-color-scheme: light)', color: '#F2F2F7' }],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/mobile-icon.png" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }

          html[data-theme="dark"] {
            --bg: #000000; --surface: #1C1C1E; --surface2: #2C2C2E;
            --border: #38383A; --border2: #48484A;
            --text: #FFFFFF; --text2: #EBEBF5; --text3: #8E8E93;
            --accent: #0A84FF; --success: #30D158; --danger: #FF453A; --warning: #FF9F0A;
            color-scheme: dark;
          }
          html[data-theme="light"] {
            --bg: #F2F2F7; --surface: #FFFFFF; --surface2: #F9F9F9;
            --border: #C6C6C8; --border2: #D1D1D6;
            --text: #000000; --text2: #3A3A3C; --text3: #8E8E93;
            --accent: #007AFF; --success: #34C759; --danger: #FF3B30; --warning: #FF9500;
            color-scheme: light;
          }

          html, body {
            margin: 0; padding: 0;
            background: var(--bg);
            -webkit-tap-highlight-color: transparent;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px; line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          input, select, textarea, button { font-family: inherit; }
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;

          /* ── Responsive shell layout ──────────────────────────── */
          .rp-shell {
            display: flex;
            height: 100dvh;
            overflow: hidden;
            background: var(--bg);
          }

          /* Desktop ≥ 768px */
          @media (min-width: 768px) {
            .rp-mobile-header { display: none !important; }
            .rp-mobile-nav    { display: none !important; }
            .rp-sidebar       { display: flex; flex-direction: column; width: 220px; flex-shrink: 0; }
            .rp-content       { flex: 1; overflow: auto; min-height: 0; height: 100%; }
          }

          /* Mobile < 768px */
          @media (max-width: 767px) {
            .rp-sidebar       { display: none !important; }
            .rp-shell         { background: var(--bg); }
            .rp-mobile-header {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              z-index: 100;
              height: 44px;
            }
            .rp-content {
              position: fixed;
              top: 44px;
              bottom: 64px;
              left: 0;
              right: 0;
              overflow-y: auto;
              -webkit-overflow-scrolling: touch;
            }
            .rp-content.rp-msg {
              overflow: hidden;
            }
            .rp-content.rp-fullscreen {
              bottom: 0;
              overflow: hidden;
            }
            .rp-mobile-nav    {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              z-index: 100;
            }
            .rp-mobile-nav.rp-hidden {
              display: none;
            }
          }
        `}</style>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var stored=localStorage.getItem('rp_theme');var t=stored||(window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();` }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              let refreshing = false;
              
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
              });
              
              navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                  console.log('Service Worker registered');
                  
                  registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                      newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          // New version available
                          if (confirm('Une nouvelle version est disponible. Voulez-vous mettre à jour ?')) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                          }
                        }
                      });
                    }
                  });
                })
                .catch((error) => console.log('Service Worker registration failed', error))
            }
          `
        }} />
      </body>
    </html>
  )
}
