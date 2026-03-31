import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/posts'
import PostCard from '@/components/PostCard'
import CategoryFilter from '@/components/CategoryFilter'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Browse all reviews across AI, SaaS, Laptops, and more.',
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
        No posts found in this category yet.
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
        />
      ))}
    </>
  )
}

export default function BlogPage({ searchParams }: BlogPageProps) {
  const { category } = searchParams

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">All Reviews</h1>
        <p className="text-zinc-400">
          In-depth takes across AI, SaaS, hardware, and more.
        </p>
      </div>

      <div className="mb-8">
        <Suspense fallback={null}>
          <CategoryFilter />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <PostsGrid category={category} />
      </div>
    </div>
  )
}
