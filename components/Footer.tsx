import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/60 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href="/" className="text-xl font-black text-white tracking-tight mb-2 block">
              Ad<span className="text-orange-500">ify</span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Honest tech reviews and buying guides for Indian consumers.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Categories</p>
            <div className="flex flex-col gap-1.5">
              {['Laptops', 'Smartphones', 'Audio', 'Monitors', 'Gaming'].map((cat) => (
                <Link key={cat} href={`/blog?category=${cat}`} className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
                  {cat}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">More</p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'All Reviews', href: '/blog' },
                { label: 'Comparisons', href: '/blog?category=Comparisons' },
                { label: 'Wearables', href: '/blog?category=Wearables' },
                { label: 'Accessories', href: '/blog?category=Accessories' },
              ].map((link) => (
                <Link key={link.label} href={link.href} className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} Adify. All rights reserved.
          </p>
          <p className="text-xs text-zinc-700">
            This site contains affiliate links. We may earn a commission from purchases made through links on this site.
          </p>
        </div>
      </div>
    </footer>
  )
}
