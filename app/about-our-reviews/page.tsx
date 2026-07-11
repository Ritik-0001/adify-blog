import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How We Test and Review Products — Adify Review Methodology',
  description: 'Learn how Adify tests and reviews products for Indian consumers — our research process, evaluation criteria, India-first approach, and update policy.',
}

const PROCESS_ITEMS = [
  'Analysis of 50+ user reviews from Amazon India and Flipkart',
  'Cross-referencing specifications with manufacturer datasheets',
  'Comparing prices across 5+ Indian retailers',
  'Monitoring price history using price tracking tools',
  'Consulting community feedback from r/india, r/IndianGaming, and Indian tech forums',
  'Regular updates every 3 months to reflect new releases and price changes',
]

const CRITERIA = [
  {
    category: 'Laptops',
    items: ['Performance benchmarks', 'Battery life reports', 'Display quality', 'Build quality', 'Value for money', 'India warranty and service network'],
  },
  {
    category: 'Appliances',
    items: ['Energy efficiency ratings', 'Brand reliability data', 'After-sales service in India', 'User satisfaction scores'],
  },
  {
    category: 'Audio',
    items: ['Frequency response data', 'User comfort reports', 'Microphone quality', 'Connectivity reliability'],
  },
  {
    category: 'Health Devices',
    items: ['Accuracy comparisons with clinical studies', 'Ease of use', 'App quality', 'Long-term reliability data'],
  },
]

const INDIA_FIRST_ITEMS = [
  'Availability on Amazon India and Flipkart',
  'Indian warranty terms (1–2 year local warranty)',
  'After-sales service network in India',
  'Value against Indian pricing (not US/UK prices)',
  'Suitability for Indian conditions (climate, voltage, etc.)',
]

export default function AboutOurReviewsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link
        href="/about"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-10 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to About
      </Link>

      <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
        How We Test and Review Products at Adify
      </h1>
      <p className="text-base text-zinc-400 mb-12 leading-relaxed">
        Our methodology for researching, evaluating, and recommending products to Indian consumers.
      </p>

      <div className="space-y-8">

        {/* 1. Our Review Process */}
        <section className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Our Review Process</p>
          <p className="text-zinc-300 leading-relaxed mb-5">
            We research each product category extensively before publishing recommendations. Our process includes:
          </p>
          <ul className="space-y-3">
            {PROCESS_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                <span className="text-orange-500 mt-0.5 shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 2. Our Evaluation Criteria */}
        <section className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Our Evaluation Criteria</p>
          <p className="text-zinc-300 leading-relaxed mb-6">
            For each product category, we evaluate:
          </p>
          <div className="space-y-6">
            {CRITERIA.map(({ category, items }) => (
              <div key={category}>
                <p className="text-sm font-bold text-white mb-2">{category}</p>
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                      <span className="text-orange-500/60 mt-0.5 shrink-0">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Our India-First Approach */}
        <section className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Our India-First Approach</p>
          <p className="text-zinc-300 leading-relaxed mb-5">
            All recommendations are specifically evaluated for:
          </p>
          <ul className="space-y-3">
            {INDIA_FIRST_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                <span className="text-orange-500 mt-0.5 shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 4. Affiliate Disclosure */}
        <section className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Affiliate Disclosure</p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            We earn commission from Amazon Associates when you purchase through our links. This never
            influences our recommendations — products are selected based on merit and value, not
            commission rates. Our editorial process is completely independent of which products carry
            affiliate links.
          </p>
        </section>

        {/* 5. Update Policy */}
        <section className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Update Policy</p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            All buying guides are reviewed and updated every 90 days to ensure recommendations reflect
            current availability and pricing. Major product releases or significant price changes may
            trigger earlier updates. Each post displays a &ldquo;Last verified&rdquo; date so you always know
            how recently the content was checked.
          </p>
        </section>

        <div className="text-center pt-2">
          <Link
            href="/blog"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-sm"
          >
            Read Our Reviews
          </Link>
        </div>
      </div>
    </main>
  )
}
