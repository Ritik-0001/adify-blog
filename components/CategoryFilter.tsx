'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const CATEGORIES = ['All', 'SaaS', 'Laptops', 'Keyboards', 'Comparisons']

export default function CategoryFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('category') || 'All'

  const setCategory = useCallback(
    (category: string) => {
      const params = new URLSearchParams()
      if (category !== 'All') params.set('category', category)
      const query = params.toString()
      router.push(`/blog${query ? `?${query}` : ''}`)
    },
    [router]
  )

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => setCategory(cat)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
            current === cat
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-orange-500 hover:text-white'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
