import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How We Test and Review Products — Adify Review Methodology',
  description: 'Learn how Adify tests and reviews products for Indian consumers — our research process, evaluation criteria, India-first approach, and update policy.',
}

const HANDS_ON_ITEMS = [
  'We document real-world usage over 2–4 weeks',
  'We photograph products in Indian home conditions',
  'We note India-specific issues (voltage compatibility, humidity resistance, service availability)',
]

const RESEARCH_ITEMS = [
  'We clearly disclose this at the start of each review',
  'We analyze 100+ verified Amazon India and Flipkart reviews, filtering out fake reviews',
  'We cross-reference 5+ established tech publications',
  'We consult Indian tech communities (r/india, r/IndianGaming, Indian Facebook groups)',
  'We verify specifications against manufacturer Indian datasheets',
  'We track 90-day price history before recommending',
]

const DIFFERENTIATORS = [
  'Every recommendation is evaluated for Indian conditions specifically — monsoon humidity, voltage fluctuations, local service networks',
  'We update prices weekly using Amazon India price tracking',
  'We disclose clearly when we haven\'t personally tested a product',
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
          <p className="text-zinc-300 leading-relaxed mb-6">
            At Adify, we combine direct product research with community data to form our recommendations.
            Here&rsquo;s exactly how:
          </p>

          <div className="space-y-7">
            <div>
              <p className="text-sm font-bold text-white mb-3">For products we own or have tested:</p>
              <ul className="space-y-2.5">
                {HANDS_ON_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="text-green-500 mt-0.5 shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-bold text-white mb-3">For products we research without hands-on access:</p>
              <ul className="space-y-2.5">
                {RESEARCH_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="text-orange-500 mt-0.5 shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-bold text-white mb-3">What makes us different:</p>
              <ul className="space-y-2.5">
                {DIFFERENTIATORS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="text-orange-500 mt-0.5 shrink-0">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
