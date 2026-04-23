import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Repondly',
  description: 'Automate your business messages',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
