import Link from 'next/link'
import { getAllPosts } from '@/lib/posts'
import PostCard from '@/components/PostCard'

export default function HomePage() {
  const posts = getAllPosts().slice(0, 6)

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Reviews you can trust
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
              AI, SaaS &amp; Tech
              <span className="text-orange-500">.</span>
              <br />
              <span className="text-zinc-400">Reviewed and Ranked.</span>
            </h1>

            <p className="text-lg text-zinc-400 mb-10 max-w-xl leading-relaxed">
              In-depth reviews and comparisons of the best software, hardware,
              and AI tools — so you can buy smarter.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/blog"
                className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
              >
                Browse Reviews
              </Link>
              <Link
                href="/blog?category=SaaS"
                className="inline-flex items-center px-6 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-semibold rounded-lg transition-colors"
              >
                Explore SaaS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Latest Reviews</h2>
            <p className="text-zinc-500 text-sm mt-1">
              Fresh takes on the tools that matter.
            </p>
          </div>
          <Link
            href="/blog"
            className="text-sm text-orange-500 hover:text-orange-400 font-medium flex items-center gap-1"
          >
            View all
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            No posts yet. Start creating content!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.slug}
                frontmatter={post.frontmatter}
                slug={post.slug}
              />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
