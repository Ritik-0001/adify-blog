import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Adify — Honest Tech Reviews for India',
  description: 'Adify is an independent tech review and buying guide site for Indian consumers. We research products so you can buy with confidence.',
}

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-10 group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>

      <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">About Adify</h1>
      <p className="text-base text-zinc-400 mb-12 leading-relaxed">Honest tech reviews and buying guides for Indian consumers.</p>

      <div className="space-y-10">
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">What We Do</p>
          <p className="text-zinc-300 leading-relaxed">Adify researches tech products available in India and produces clear, honest buying guides. We cover laptops, smartphones, audio gear, monitors, gaming peripherals, wearables, and accessories — with a focus on what actually makes sense for Indian buyers given local pricing, warranty support, and use cases.</p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Our Approach</p>
          <ul className="space-y-3 text-zinc-300">
            <li className="flex items-start gap-3">
              <span className="text-orange-500 mt-0.5">→</span>
              <span><strong className="text-white">No paid placements.</strong> Brands cannot pay for positive reviews or higher rankings. Our recommendations are based on product quality alone.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-500 mt-0.5">→</span>
              <span><strong className="text-white">India-first perspective.</strong> We account for Amazon India pricing, Indian warranty policies, and the specific use cases most relevant to Indian buyers.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-500 mt-0.5">→</span>
              <span><strong className="text-white">Transparent affiliates.</strong> We earn commissions through the Amazon Associates Programme. This is disclosed on every post and does not influence our recommendations.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-orange-500 mt-0.5">→</span>
              <span><strong className="text-white">Regularly updated.</strong> Prices and products change. We update guides when significant new options enter the market.</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Affiliate Disclosure</p>
          <p className="text-zinc-400 text-sm leading-relaxed">As an Amazon Associate, Adify earns from qualifying purchases. When you buy through links on our site, we may earn a commission at no extra cost to you. This is how we keep the site running and research-funded.</p>
        </div>

        <div className="text-center pt-4">
          <p className="text-zinc-500 text-sm mb-4">Have a question or feedback?</p>
          <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-sm">
            Contact Us
          </Link>
        </div>
      </div>
    </main>
  )
}
