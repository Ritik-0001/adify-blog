'use client'

import { useState } from 'react'

const PASSWORD = 'adify2026'

type ApiResponse = {
  result?: string
  replaced?: number
  total?: number
  log?: string[]
  error?: string
}

export default function LinkReplacerClient() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState(false)

  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [log, setLog] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<{ replaced: number; total: number } | null>(null)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (pw === PASSWORD) {
      setAuthed(true)
      setPwError(false)
    } else {
      setPwError(true)
    }
  }

  async function handleReplace() {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setOutput('')
    setLog([])
    setStats(null)
    setCopied(false)

    try {
      const res = await fetch('/api/admin/replace-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: input }),
      })
      const data: ApiResponse = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || `Server error ${res.status}`)
        return
      }

      setOutput(data.result ?? '')
      setLog(data.log ?? [])
      setStats({ replaced: data.replaced ?? 0, total: data.total ?? 0 })
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Password gate ───────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-5"
        >
          <div>
            <h1 className="text-white font-bold text-xl mb-1">Admin Access</h1>
            <p className="text-zinc-500 text-sm">Link Replacer Tool</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-zinc-400 text-sm font-medium">Password</label>
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setPwError(false) }}
              autoFocus
              placeholder="Enter password"
              className={`w-full bg-zinc-800 border rounded-lg px-4 py-3 text-white placeholder-zinc-600 outline-none focus:ring-2 focus:ring-orange-500/50 transition ${
                pwError ? 'border-red-500' : 'border-zinc-700'
              }`}
            />
            {pwError && <p className="text-red-400 text-xs">Incorrect password.</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition"
          >
            Unlock
          </button>
        </form>
      </div>
    )
  }

  // ── Main tool ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="text-white font-bold text-2xl mb-1">Link Replacer</h1>
          <p className="text-zinc-500 text-sm">
            Paste a YouTube description. Amazon &amp; Flipkart links will be replaced with direct ASIN affiliate URLs.
          </p>
        </div>

        {/* Input */}
        <div className="flex flex-col gap-2">
          <label className="text-zinc-400 text-sm font-medium">YouTube Description</label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={10}
            placeholder="Paste your YouTube description here..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-orange-500/50 resize-y font-mono text-sm transition"
          />
        </div>

        {/* Replace button */}
        <button
          onClick={handleReplace}
          disabled={loading || !input.trim()}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Searching PA API… this may take a moment
            </>
          ) : (
            'Replace Links'
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats + log */}
        {stats && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 flex flex-col gap-3">
            <p className="text-zinc-300 text-sm font-medium">
              {stats.replaced} of {stats.total} link{stats.total !== 1 ? 's' : ''} replaced
            </p>
            <ul className="flex flex-col gap-1">
              {log.map((line, i) => (
                <li
                  key={i}
                  className={`text-xs font-mono ${line.startsWith('✓') ? 'text-green-400' : 'text-zinc-500'}`}
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-zinc-400 text-sm font-medium">Updated Description</label>
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg transition"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              rows={10}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-200 font-mono text-sm resize-y outline-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}
