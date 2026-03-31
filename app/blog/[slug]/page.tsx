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

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
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

const CATEGORY_COLORS: Record<string, string> = {
  SaaS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Laptops: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Keyboards: 'bg-green-500/10 text-green-400 border-green-500/20',
  Comparisons: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

export default function PostPage({ params }: PostPageProps) {
  const post = getPostBySlug(params.slug)
  if (!post) return notFound()

  const { frontmatter, content } = post
  const categoryClass =
    CATEGORY_COLORS[frontmatter.category] ||
    'bg-zinc-700/20 text-zinc-400 border-zinc-700/30'

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Back */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8"
      >
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Blog
      </Link>

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${categoryClass}`}
          >
            {frontmatter.category}
          </span>
          <time className="text-sm text-zinc-500" dateTime={frontmatter.date}>
            {new Date(frontmatter.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
          {frontmatter.title}
        </h1>
        <p className="text-lg text-zinc-400 leading-relaxed">
          {frontmatter.description}
        </p>
      </header>

      {/* Affiliate CTA — top */}
      {frontmatter.affiliate_link && (
        <div className="my-8 p-5 bg-orange-500/10 border border-orange-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">
              Ready to get started?
            </p>
            <p className="text-sm text-zinc-400 mt-0.5">
              Check out the best deal available right now.
            </p>
          </div>
          <a
            href={frontmatter.affiliate_link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors whitespace-nowrap text-sm shrink-0"
          >
            {frontmatter.affiliate_text || 'Check Best Price →'}
          </a>
        </div>
      )}

      {/* MDX Content */}
      <div className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-headings:font-bold prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-zinc-100 prose-code:text-orange-400 prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-hr:border-zinc-800 prose-th:text-zinc-300 prose-td:text-zinc-400 prose-li:text-zinc-300">
        <MDXRemote source={content} />
      </div>

      {/* Affiliate CTA — bottom */}
      {frontmatter.affiliate_link && (
        <div className="mt-16 p-8 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
          <p className="text-white font-bold text-xl mb-2">
            Convinced? Here&apos;s the best deal.
          </p>
          <p className="text-zinc-400 text-sm mb-6">
            Prices and availability updated regularly.
          </p>
          <a
            href={frontmatter.affiliate_link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors text-base"
          >
            {frontmatter.affiliate_text || 'Check Best Price →'}
          </a>
        </div>
      )}
    </article>
  )
}
