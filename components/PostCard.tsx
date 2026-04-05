import Link from 'next/link'
import { PostFrontmatter } from '@/lib/posts'

interface PostCardProps {
  frontmatter: PostFrontmatter
  slug: string
  readingTime?: number
}

const CATEGORY_CONFIG: Record<string, { pill: string; accent: string; dot: string }> = {
  SaaS:        { pill: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    accent: 'from-blue-500/60 to-blue-500/0',    dot: 'bg-blue-500' },
  Laptops:     { pill: 'bg-purple-500/10 text-purple-400 border-purple-500/20', accent: 'from-purple-500/60 to-purple-500/0', dot: 'bg-purple-500' },
  Keyboards:   { pill: 'bg-green-500/10 text-green-400 border-green-500/20', accent: 'from-green-500/60 to-green-500/0',  dot: 'bg-green-500' },
  Comparisons: { pill: 'bg-orange-500/10 text-orange-400 border-orange-500/20', accent: 'from-orange-500/60 to-orange-500/0', dot: 'bg-orange-500' },
  Smartphones: { pill: 'bg-pink-500/10 text-pink-400 border-pink-500/20',    accent: 'from-pink-500/60 to-pink-500/0',    dot: 'bg-pink-500' },
  Audio:       { pill: 'bg-violet-500/10 text-violet-400 border-violet-500/20', accent: 'from-violet-500/60 to-violet-500/0', dot: 'bg-violet-500' },
  Monitors:    { pill: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',    accent: 'from-cyan-500/60 to-cyan-500/0',    dot: 'bg-cyan-500' },
  Gaming:      { pill: 'bg-red-500/10 text-red-400 border-red-500/20',       accent: 'from-red-500/60 to-red-500/0',       dot: 'bg-red-500' },
  Wearables:   { pill: 'bg-teal-500/10 text-teal-400 border-teal-500/20',    accent: 'from-teal-500/60 to-teal-500/0',    dot: 'bg-teal-500' },
  Accessories: { pill: 'bg-amber-500/10 text-amber-400 border-amber-500/20', accent: 'from-amber-500/60 to-amber-500/0',  dot: 'bg-amber-500' },
}

const DEFAULT_CONFIG = { pill: 'bg-zinc-700/20 text-zinc-400 border-zinc-700/30', accent: 'from-orange-500/40 to-orange-500/0', dot: 'bg-zinc-500' }

export default function PostCard({ frontmatter, slug, readingTime }: PostCardProps) {
  const config = CATEGORY_CONFIG[frontmatter.category] || DEFAULT_CONFIG
  const isComparison = frontmatter.title.toLowerCase().includes(' vs ')

  return (
    <Link href={`/blog/${slug}`} className="group block h-full">
      <article className="relative h-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 flex flex-col">

        {/* Accent gradient top bar */}
        <div className={`h-0.5 w-full bg-gradient-to-r ${config.accent}`} />

        <div className="p-5 flex flex-col flex-1">
          {/* Meta row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${config.pill}`}>
                {frontmatter.category}
              </span>
              {isComparison && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                  vs
                </span>
              )}
            </div>
            <time className="text-xs text-zinc-600" dateTime={frontmatter.date}>
              {new Date(frontmatter.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </div>

          {/* Title */}
          <h2 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors mb-2 line-clamp-2 leading-snug flex-1">
            {frontmatter.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-zinc-500 line-clamp-2 mb-4 leading-relaxed">
            {frontmatter.description}
          </p>

          {/* Footer row */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
              {readingTime ?? 5} min read
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 group-hover:gap-2 transition-all">
              Read more
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
