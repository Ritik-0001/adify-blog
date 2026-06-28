import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Disclaimer — Adify',
  description: 'Affiliate disclosure and disclaimer for Adify.store — honest buying guides for Indian consumers.',
}

export default function DisclaimerPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-10 group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>

      <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Disclaimer</h1>
      <p className="text-sm text-zinc-500 mb-10">Last updated: June 2026</p>

      <div className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-headings:font-bold prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline prose-li:text-zinc-300 prose-li:marker:text-orange-500 prose-p:text-zinc-400 prose-strong:text-zinc-200">

        <div className="not-prose p-5 rounded-xl border border-orange-500/30 bg-orange-500/5 mb-8">
          <p className="text-sm text-orange-300 font-semibold mb-1">Amazon Associates Disclosure</p>
          <p className="text-sm text-zinc-400">As an Amazon Associate I earn from qualifying purchases. This means we may earn a commission when you click links to Amazon.in and make a purchase — at no additional cost to you.</p>
        </div>

        <h2>Affiliate Disclosure</h2>
        <p>Adify.store participates in the <strong>Amazon Associates Programme</strong>, an affiliate advertising programme operated by Amazon. When you click product links on our site that lead to Amazon.in, we may earn a small commission if you make a purchase.</p>
        <p>This commission is how we fund the research and writing that goes into our reviews. It does not affect the price you pay — Amazon pays us from their margin, not from your pocket.</p>

        <h2>Editorial Independence</h2>
        <p>Our product recommendations are based on independent research, publicly available specifications, expert reviews, and user feedback. We are <strong>not paid by manufacturers or brands</strong> to recommend specific products. No brand can buy a positive review or a higher ranking on Adify.</p>
        <p>We may earn more commission from some products than others, but our rankings are determined by product quality, value, and suitability for Indian buyers — not by commission rates.</p>

        <h2>Accuracy of Information</h2>
        <p>We make every effort to keep prices, specifications, and availability accurate. However:</p>
        <ul>
          <li>Prices on Amazon fluctuate daily — always verify the current price before purchasing.</li>
          <li>Product specifications may change as manufacturers release updated variants.</li>
          <li>Availability varies by region and seller — check Amazon.in for current stock.</li>
        </ul>
        <p>Adify is not responsible for discrepancies between the prices shown on our site and the actual prices on Amazon at the time of purchase.</p>

        <h2>No Professional Advice</h2>
        <p>Content on Adify is for informational and entertainment purposes only. It does not constitute professional advice. Make purchasing decisions based on your own research and requirements.</p>

        <h2>External Links</h2>
        <p>Our site links to Amazon.in and other third-party websites. We are not responsible for the content, accuracy, or practices of those sites. The presence of a link does not constitute endorsement beyond our product recommendation.</p>

        <h2>Contact</h2>
        <p>If you have questions about our affiliate relationships or editorial policies, please <Link href="/contact">contact us</Link>.</p>
      </div>
    </main>
  )
}
