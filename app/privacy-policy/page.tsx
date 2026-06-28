import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Adify',
  description: 'Privacy policy for Adify.store — how we collect, use, and protect your data.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-10 group">
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>

      <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Privacy Policy</h1>
      <p className="text-sm text-zinc-500 mb-10">Last updated: June 2026</p>

      <div className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-headings:font-bold prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline prose-li:text-zinc-300 prose-li:marker:text-orange-500 prose-p:text-zinc-400 prose-strong:text-zinc-200">

        <p>Adify (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates adify.store. This Privacy Policy explains how we collect, use, and protect information when you visit our website.</p>

        <h2>Information We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul>
          <li><strong>Usage data:</strong> Pages visited, time spent, referral sources — collected automatically via analytics tools.</li>
          <li><strong>Cookies:</strong> Small files stored in your browser to remember preferences and enable advertising.</li>
          <li><strong>Device information:</strong> Browser type, operating system, and IP address (anonymised where possible).</li>
        </ul>
        <p>We do not collect personally identifiable information (name, email, phone) unless you voluntarily contact us.</p>

        <h2>Cookies</h2>
        <p>We use cookies for the following purposes:</p>
        <ul>
          <li><strong>Analytics:</strong> We use Google Analytics to understand how visitors use our site. Google Analytics sets cookies to track sessions and measure traffic patterns. Data is anonymised and aggregated.</li>
          <li><strong>Advertising:</strong> We use Google AdSense to display ads. Google may use cookies to show ads based on your prior visits to our site or other websites. You can opt out of personalised advertising at <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ad Settings</a>.</li>
          <li><strong>Affiliate tracking:</strong> When you click Amazon affiliate links, Amazon sets cookies to attribute purchases. This enables us to earn commissions under the Amazon Associates programme.</li>
        </ul>

        <h2>Google AdSense</h2>
        <p>We participate in Google AdSense, which serves advertisements on our site. Google uses cookies to personalise ads based on your browsing behaviour. Third-party vendors, including Google, use cookies to serve ads based on prior visits to this website or other websites. You can opt out of personalised advertising by visiting <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">aboutads.info</a>.</p>

        <h2>Amazon Associates</h2>
        <p>We are a participant in the Amazon Associates Programme, an affiliate advertising programme designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.in. When you click an Amazon link on our site, Amazon may set a cookie to track any resulting purchases. We receive a small commission on qualifying purchases at no extra cost to you.</p>

        <h2>Data Sharing</h2>
        <p>We do not sell, trade, or rent your personal information to third parties. We may share anonymised, aggregated data with analytics providers. Third-party services (Google Analytics, Google AdSense, Amazon) operate under their own privacy policies.</p>

        <h2>Third-Party Links</h2>
        <p>Our site contains links to external websites including Amazon.in. We are not responsible for the privacy practices of those sites. We encourage you to review their privacy policies before making purchases.</p>

        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Opt out of cookies via your browser settings</li>
          <li>Opt out of Google personalised ads at <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ad Settings</a></li>
          <li>Contact us with questions about your data</li>
        </ul>

        <h2>Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date. Continued use of the site after changes constitutes acceptance of the updated policy.</p>

        <h2>Contact</h2>
        <p>For privacy-related queries, please use our <Link href="/contact">Contact page</Link>.</p>
      </div>
    </main>
  )
}
