'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const CATEGORIES = [
  'All',
  'Comparisons',
  'Laptops',
  'Smartphones',
  'Audio',
  'Monitors',
  'Gaming',
  'Wearables',
  'Accessories',
  'Keyboards',
  'SaaS',
]

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
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
            current === cat
              ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
