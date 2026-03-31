import Link from 'next/link'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-2xl font-black tracking-tight text-white">
            Ad<span className="text-orange-500">ify</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link
            href="/blog"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Blog
          </Link>
        </nav>
      </div>
    </header>
  )
}
