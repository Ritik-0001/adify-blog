import type { Metadata } from 'next'
import LinkReplacerClient from './LinkReplacerClient'

export const metadata: Metadata = {
  title: 'Link Replacer',
  robots: { index: false, follow: false },
}

export default function LinkReplacerPage() {
  return <LinkReplacerClient />
}
