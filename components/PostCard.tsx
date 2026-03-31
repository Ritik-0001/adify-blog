import Link from 'next/link'
import { PostFrontmatter } from '@/lib/posts'

interface PostCardProps {
  frontmatter: PostFrontmatter
  slug: string
}

const CATEGORY_COLORS: Record<string, string> = {
  SaaS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Laptops: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Keyboards: 'bg-green-500/10 text-green-400 border-green-500/20',
  Comparisons: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

export default function PostCard({ frontmatter, slug }: PostCardProps) {
  const categoryClass =
    CATEGORY_COLORS[frontmatter.category] ||
    'bg-zinc-700/20 text-zinc-400 border-zinc-700/30'

  return (
    <Link href={`/blog/${slug}`} className="group block h-full">
      <article className="h-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-orange-500/50 hover:bg-zinc-900/80 transition-all duration-200 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${categoryClass}`}
          >
            {frontmatter.category}
          </span>
          <time className="text-xs text-zinc-500" dateTime={frontmatter.date}>
            {new Date(frontmatter.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
        </div>

        <h2 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors mb-2 line-clamp-2 flex-1">
          {frontmatter.title}
        </h2>
        <p className="text-sm text-zinc-400 line-clamp-3 mb-4">
          {frontmatter.description}
        </p>

        <div className="flex items-center text-orange-500 text-sm font-medium mt-auto">
          Read more
          <svg
            className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform"
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
        </div>
      </article>
    </Link>
  )
}
