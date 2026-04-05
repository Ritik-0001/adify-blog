import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'
import PostCard from '@/components/PostCard'

const QUICK_CATEGORIES = [
  { label: 'Laptops', href: '/blog?category=Laptops', icon: '💻' },
  { label: 'Smartphones', href: '/blog?category=Smartphones', icon: '📱' },
  { label: 'Audio', href: '/blog?category=Audio', icon: '🎧' },
  { label: 'Monitors', href: '/blog?category=Monitors', icon: '🖥️' },
  { label: 'Gaming', href: '/blog?category=Gaming', icon: '🎮' },
  { label: 'Comparisons', href: '/blog?category=Comparisons', icon: '⚖️' },
  { label: 'Wearables', href: '/blog?category=Wearables', icon: '⌚' },
  { label: 'Accessories', href: '/blog?category=Accessories', icon: '🔌' },
]

export default function HomePage() {
  const allPosts = getAllPosts()
  const latestPosts = allPosts.slice(0, 9)
  const totalPosts = allPosts.length

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800/60">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/3 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold mb-7 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              {totalPosts}+ honest reviews for Indian buyers
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white mb-5 leading-tight tracking-tight">
              India&apos;s Tech Reviews
              <span className="text-orange-500">.</span>
              <br />
              <span className="text-zinc-400">Buy smarter.</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 mb-9 max-w-xl leading-relaxed">
              In-depth comparisons and buying guides for laptops, phones, audio gear, and accessories —
              with real ₹ pricing for Indian buyers.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/blog"
                className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20 text-sm"
              >
                Browse All Reviews
              </Link>
              <Link
                href="/blog?category=Comparisons"
                className="inline-flex items-center px-6 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Head-to-Head Comparisons
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Category Links */}
      <section className="border-b border-zinc-800/60 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-wrap gap-2">
            {QUICK_CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-all"
              >
                <span>{cat.icon}</span>
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Latest Reviews</h2>
            <p className="text-zinc-500 text-sm mt-1">
              Sorted by newest — updated regularly.
            </p>
          </div>
          <Link
            href="/blog"
            className="text-sm text-orange-500 hover:text-orange-400 font-semibold flex items-center gap-1 shrink-0"
          >
            View all {totalPosts}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {latestPosts.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">No posts yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {latestPosts.map((post) => (
              <PostCard
                key={post.slug}
                frontmatter={post.frontmatter}
                slug={post.slug}
                readingTime={post.readingTime}
              />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
