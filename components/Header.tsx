import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 group">
          <span className="text-xl font-black tracking-tight text-white group-hover:text-zinc-200 transition-colors">
            Ad<span className="text-orange-500">ify</span>
          </span>
          <span className="hidden sm:inline-block ml-2 text-xs text-zinc-600 font-medium border-l border-zinc-800 pl-2">
            India Tech Reviews
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-all"
          >
            Home
          </Link>
          <Link
            href="/blog"
            className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-all"
          >
            Reviews
          </Link>
          <Link
            href="/blog?category=Comparisons"
            className="px-3 py-1.5 text-sm font-semibold text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all"
          >
            vs.
          </Link>
        </nav>
      </div>
    </header>
  )
}
