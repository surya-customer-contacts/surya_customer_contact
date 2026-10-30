import { useState } from 'react'

export default function ClientLinks() {
  const [copied, setCopied] = useState(false)
  const publicLink = `${window.location.origin}/?client-submit=1&public=1`

  async function copyPublicLink() {
    try {
      await navigator.clipboard.writeText(publicLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('Copy this public client form link:', publicLink)
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="p-5">
        <h2 className="text-lg font-semibold text-gray-900">Public client form link</h2>
        <p className="mt-1 text-sm text-gray-600">
          Share this same link with any company or person. Every person can fill in the Hindi/English form and submit their own details. Submissions appear in your Customer Directory.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input aria-label="Public client form link" readOnly value={publicLink} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-800" />
          <button type="button" onClick={copyPublicLink} className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800">
            {copied ? 'Copied!' : 'Copy public link'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">Anyone with this link can submit multiple times. Share the deployed website link with clients, not a localhost link.</p>
      </div>
    </section>
  )
}
