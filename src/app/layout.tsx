import type { Metadata } from 'next'
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
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
