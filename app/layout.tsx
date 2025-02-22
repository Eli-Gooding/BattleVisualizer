import './styles/globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Battle Visualizer',
  description: 'Interactive historical battle visualization',
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
