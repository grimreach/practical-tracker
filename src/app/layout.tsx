import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Practical Tracker',
  description:
    'Open-source match tracker for practical shooting competitors — USPSA, SCSA, IPSC, 3-Gun, PRS and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const themeScript = `(() => {
    try {
      const key = 'practical-tracker-theme';
      const stored = window.localStorage.getItem(key);
      const theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.colorScheme = 'dark';
    }
  })();`

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
