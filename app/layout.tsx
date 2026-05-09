import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    siteName: 'Adify',
    description: 'AI, SaaS & Tech — Reviewed and Ranked.',
  },
  twitter: {
    card: 'summary_large_image',
  },
  verification: {
    google: 'v-nVL--Q0brXe6n0q1BN4H25IKz3_Cpumv5cmNd8szY',
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
        <Script
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","wom9g8cgro");`,
          }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
