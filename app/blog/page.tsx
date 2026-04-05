import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/posts'
import PostCard from '@/components/PostCard'
import CategoryFilter from '@/components/CategoryFilter'

export const metadata: Metadata = {
  title: 'All Reviews',
  description: 'Browse all tech reviews — laptops, phones, audio, monitors, and more for Indian buyers.',
}

interface BlogPageProps {
  searchParams: { category?: string }
}

function PostsGrid({ category }: { category: string | undefined }) {
  const allPosts = getAllPosts()
  const posts =
    category && category !== 'All'
      ? allPosts.filter((p) => p.frontmatter.category === category)
      : allPosts

  if (posts.length === 0) {
    return (
      <div className="col-span-full text-center py-20 text-zinc-500">
        No reviews found in this category yet.
      </div>
    )
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard
          key={post.slug}
          frontmatter={post.frontmatter}
          slug={post.slug}
          readingTime={post.readingTime}
        />
      ))}
    </>
  )
}

function PostCount({ category }: { category: string | undefined }) {
  const allPosts = getAllPosts()
  const count =
    category && category !== 'All'
      ? allPosts.filter((p) => p.frontmatter.category === category).length
      : allPosts.length
  return (
    <p className="text-zinc-500 text-sm mt-1">
      {count} review{count !== 1 ? 's' : ''}{category && category !== 'All' ? ` in ${category}` : ' and counting'}
    </p>
  )
}

export default function BlogPage({ searchParams }: BlogPageProps) {
  const { category } = searchParams

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {category && category !== 'All' ? `${category} Reviews` : 'All Reviews'}
        </h1>
        <PostCount category={category} />
      </div>

      {/* Filters */}
      <div className="mb-8">
        <Suspense fallback={null}>
          <CategoryFilter />
        </Suspense>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <PostsGrid category={category} />
      </div>
    </div>
  )
}
