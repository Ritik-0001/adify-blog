import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, getPostBySlug } from '@/lib/posts'

interface PostPageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return {}
  const { frontmatter } = post
  return {
    title: frontmatter.seo_title || frontmatter.title,
    description: frontmatter.seo_description || frontmatter.description,
    openGraph: {
      title: frontmatter.seo_title || frontmatter.title,
      description: frontmatter.seo_description || frontmatter.description,
      type: 'article',
      publishedTime: frontmatter.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: frontmatter.seo_title || frontmatter.title,
      description: frontmatter.seo_description || frontmatter.description,
    },
  }
}

const CATEGORY_CONFIG: Record<string, { pill: string }> = {
  SaaS:        { pill: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  Laptops:     { pill: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  Keyboards:   { pill: 'bg-green-500/10 text-green-400 border-green-500/20' },
  Comparisons: { pill: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  Smartphones: { pill: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  Audio:       { pill: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  Monitors:    { pill: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  Gaming:      { pill: 'bg-red-500/10 text-red-400 border-red-500/20' },
  Wearables:   { pill: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  Accessories: { pill: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
}

export default function PostPage({ params }: PostPageProps) {
  const post = getPostBySlug(params.slug)
  if (!post) return notFound()

  const { frontmatter, content, readingTime } = post
  const categoryClass =
    (CATEGORY_CONFIG[frontmatter.category] || { pill: 'bg-zinc-700/20 text-zinc-400 border-zinc-700/30' }).pill

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Back */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Reviews
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${categoryClass}`}>
            {frontmatter.category}
          </span>
          <time className="text-sm text-zinc-500" dateTime={frontmatter.date}>
            {new Date(frontmatter.date).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <span className="text-xs text-zinc-600 flex items-center gap-1">
            · {readingTime} min read
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white mb-4 leading-tight">
          {frontmatter.title}
        </h1>
        <p className="text-base text-zinc-400 leading-relaxed">
          {frontmatter.description}
        </p>
      </header>

      {/* Affiliate CTA — top */}
      {frontmatter.affiliate_link && (
        <a
          href={frontmatter.affiliate_link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="group flex items-center justify-between gap-4 my-8 p-5 bg-gradient-to-r from-orange-500/15 to-orange-600/5 border border-orange-500/30 rounded-2xl hover:border-orange-500/60 hover:from-orange-500/20 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Check today&apos;s price on Amazon</p>
              <p className="text-xs text-zinc-400 mt-0.5">Updated pricing · Free delivery eligible</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 group-hover:bg-orange-600 text-white font-bold rounded-xl transition-colors whitespace-nowrap text-sm shrink-0">
            {frontmatter.affiliate_text || 'View on Amazon'}
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </a>
      )}

      {/* MDX Content */}
      <div className="prose prose-invert prose-zinc max-w-none
        prose-headings:text-white prose-headings:font-bold
        prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
        prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3
        prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-zinc-100
        prose-code:text-orange-400 prose-code:bg-zinc-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
        prose-hr:border-zinc-800 prose-hr:my-8
        prose-th:text-zinc-300 prose-th:font-semibold prose-th:bg-zinc-800/50
        prose-td:text-zinc-400 prose-td:border-zinc-800
        prose-tr:border-zinc-800
        prose-table:border-zinc-800 prose-table:rounded-lg
        prose-li:text-zinc-300 prose-li:marker:text-orange-500
        prose-blockquote:border-orange-500/50 prose-blockquote:text-zinc-400">
        <MDXRemote source={content} />
      </div>

      {/* Affiliate disclosure */}
      {frontmatter.affiliate_link && (
        <p className="mt-10 text-xs text-zinc-600 leading-relaxed border-t border-zinc-800 pt-6">
          <strong className="text-zinc-500">Disclosure:</strong> This post contains affiliate links. If you purchase through our links,
          we earn a small commission at no extra cost to you. We only recommend products we genuinely believe in.
        </p>
      )}

      {/* Affiliate CTA — bottom */}
      {frontmatter.affiliate_link && (
        <div className="mt-8 p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-white font-bold text-lg mb-1">Ready to buy?</p>
          <p className="text-zinc-500 text-sm mb-6">Check the latest price and availability on Amazon India.</p>
          <a
            href={frontmatter.affiliate_link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-orange-500/20"
          >
            {frontmatter.affiliate_text || 'Check Best Price on Amazon →'}
          </a>
        </div>
      )}
    </article>
  )
}
