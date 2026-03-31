import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-xl font-black text-white tracking-tight">
            Ad<span className="text-orange-500">ify</span>
          </Link>
          <p className="text-sm text-zinc-500">
            AI, SaaS &amp; Tech — Reviewed and Ranked.
          </p>
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} Adify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
