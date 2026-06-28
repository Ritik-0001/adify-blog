import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact — Adify',
  description: 'Get in touch with Adify for feedback, corrections, or enquiries.',
}

export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-10 group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>

      <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Contact</h1>
      <p className="text-base text-zinc-400 mb-12 leading-relaxed">Got a question, spotted an error, or want to share feedback? We&apos;d love to hear from you.</p>

      <div className="space-y-6">
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Send Us an Email</p>
          <p className="text-zinc-400 text-sm mb-4">The fastest way to reach us is via email. We typically respond within 1–2 business days.</p>
          <a
            href="mailto:contact@adify.store"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-700 hover:border-orange-500/50 hover:text-orange-400 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            contact@adify.store
          </a>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">What to Include</p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">·</span>
              <span><strong className="text-zinc-300">Corrections:</strong> The article URL and the specific information that needs updating.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">·</span>
              <span><strong className="text-zinc-300">Product suggestions:</strong> What product and which category you&apos;d like to see covered.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">·</span>
              <span><strong className="text-zinc-300">Affiliate enquiries:</strong> Business name and nature of the collaboration you have in mind.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">·</span>
              <span><strong className="text-zinc-300">Privacy / data:</strong> Your specific request and any relevant details.</span>
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-xl border border-zinc-800/60 bg-zinc-900/50">
          <p className="text-xs text-zinc-600 leading-relaxed">We do not accept guest posts, paid link insertions, or sponsored content at this time.</p>
        </div>
      </div>
    </main>
  )
}
