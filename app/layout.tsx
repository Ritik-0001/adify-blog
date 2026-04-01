import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Adify — AI, SaaS & Tech, Reviewed and Ranked.',
    template: '%s | Adify',
  },
  description: 'AI, SaaS & Tech — Reviewed and Ranked.',
  openGraph: {
    type: 'website',
    siteName: 'Adify',
    description: 'AI, SaaS & Tech — Reviewed and Ranked.',
  },
  twitter: {
    card: 'summary_large_image',
  },
  other: {
    'impact-site-verification': '49669290-6e18-4235-9ff5-5cc86963d896',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
