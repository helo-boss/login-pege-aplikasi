import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Tracking',
  description: 'Formulir live tracking pengiriman.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
