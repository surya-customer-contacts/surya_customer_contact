import { useEffect, useState } from 'react'
import {
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Download,
  LoaderCircle,
  X,
  FolderOpen,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const BUCKET_NAME = 'customer-documents'
const SIGNED_URL_SECONDS = 300

function formatSize(bytes) {
  if (!Number.isFinite(Number(bytes))) return ''
  const size = Number(bytes)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function isImageFile(document) {
  return String(document.file_type || '').startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|bmp)$/i.test(document.file_name || '')
}

function isPdfFile(document) {
  return document.file_type === 'application/pdf' ||
    /\.pdf$/i.test(document.file_name || '')
}

function CustomerDocuments({ customerId }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [openingId, setOpeningId] = useState(null)

  useEffect(() => {
    if (!isOpen || !customerId) return undefined
    let active = true

    async function loadDocuments() {
      setLoading(true)
      setError('')
      const { data, error: queryError } = await supabase
        .from('customer_documents')
        .select('id, file_name, file_type, file_size, storage_path')
        .eq('customer_id', customerId)
        .order('file_name', { ascending: true })

      if (!active) return
      if (queryError) {
        console.error('Could not load customer documents:', queryError)
        setError(queryError.message || 'Could not load documents.')
        setDocuments([])
        setLoading(false)
        return
      }

      const rows = data || []
      setDocuments(rows)
      setLoading(false)

      // Create temporary signed URLs only while the admin viewer is open.
      const signedRows = await Promise.all(rows.map(async (document) => {
        if (!document.storage_path) {
          return { ...document, signedUrl: '', signedUrlError: 'No storage path saved.' }
        }
        const { data: signedData, error: signedError } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(document.storage_path, SIGNED_URL_SECONDS)

        if (signedError || !signedData?.signedUrl) {
          return {
            ...document,
            signedUrl: '',
            signedUrlError: signedError?.message || 'Could not create a secure file link.',
          }
        }
        return {
          ...document,
          signedUrl: signedData.signedUrl,
          signedUrlExpiresAt: Date.now() + SIGNED_URL_SECONDS * 1000,
        }
      }))
      if (active) setDocuments(signedRows)
    }

    loadDocuments()
    return () => { active = false }
  }, [isOpen, customerId])

  useEffect(() => {
    if (!isOpen) return undefined
    function handleEscape(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  async function refreshLink(document, download = false) {
    // Open a placeholder synchronously so the browser does not block the tab after await.
    const previewWindow = !download ? window.open('about:blank', '_blank') : null
    setOpeningId(document.id)
    setError('')
    try {
      if (!document.storage_path) throw new Error('This document has no storage path saved.')
      const { data, error: signedError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(
          document.storage_path,
          SIGNED_URL_SECONDS,
          download ? { download: document.file_name || true } : undefined,
        )
      if (signedError) throw signedError
      if (!data?.signedUrl) throw new Error('Supabase did not return a document URL.')

      setDocuments((previous) => previous.map((item) => item.id === document.id
        ? { ...item, signedUrl: data.signedUrl, signedUrlExpiresAt: Date.now() + SIGNED_URL_SECONDS * 1000, signedUrlError: '' }
        : item))

      if (download) {
        const anchor = window.document.createElement('a')
        anchor.href = data.signedUrl
        anchor.download = document.file_name || 'document'
        anchor.rel = 'noopener noreferrer'
        window.document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
      } else if (previewWindow) {
        previewWindow.opener = null
        previewWindow.location.href = data.signedUrl
      } else {
        throw new Error('Your browser blocked the preview tab. Allow pop-ups for this site and try again.')
      }
    } catch (linkError) {
      console.error('Could not open customer document:', linkError)
      setError(`${document.file_name || 'Document'}: ${linkError.message || 'Could not create a secure link.'}`)
    } finally {
      setOpeningId(null)
    }
  }

  function handleOpen() {
    setDocuments([])
    setError('')
    setIsOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
        aria-label="View customer documents"
      >
        <FolderOpen size={15} />
        Documents
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`documents-title-${customerId}`}
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 id={`documents-title-${customerId}`} className="text-lg font-bold text-slate-900">
                  Customer documents
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  View or download files attached to this customer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close documents"
              >
                <X size={20} />
              </button>
            </header>

            <div className="overflow-y-auto p-4 sm:p-6">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                  <LoaderCircle size={18} className="animate-spin" />
                  Loading documents…
                </div>
              )}

              {!loading && !error && documents.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center">
                  <FolderOpen size={30} className="mx-auto text-slate-400" />
                  <p className="mt-3 font-medium text-slate-700">No documents uploaded</p>
                  <p className="mt-1 text-sm text-slate-500">Files added for this customer will appear here.</p>
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!loading && documents.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {documents.map((document) => {
                    const imageFile = isImageFile(document)
                    const pdfFile = isPdfFile(document)
                    const expired = !document.signedUrl || !document.signedUrlExpiresAt ||
                      document.signedUrlExpiresAt < Date.now()

                    return (
                      <article key={document.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex h-40 items-center justify-center overflow-hidden bg-slate-50">
                          {imageFile && document.signedUrl ? (
                            <a href={document.signedUrl} target="_blank" rel="noopener noreferrer" className="flex h-full w-full items-center justify-center">
                              <img
                                src={document.signedUrl}
                                alt={document.file_name || 'Customer document'}
                                className="h-full w-full object-contain p-2"
                                loading="lazy"
                              />
                            </a>
                          ) : (
                            <div className="text-center text-slate-400">
                              <FileText size={42} strokeWidth={1.4} />
                              <p className="mt-2 text-xs font-semibold uppercase tracking-wide">
                                {pdfFile ? 'PDF document' : (document.file_type || 'File')}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col p-3">
                          <p className="break-words text-sm font-semibold text-slate-800" title={document.file_name}>
                            {document.file_name || 'Unnamed document'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {pdfFile ? 'PDF' : imageFile ? 'Image' : (document.file_type || 'File')}
                            {document.file_size ? ` · ${formatSize(document.file_size)}` : ''}
                          </p>

                          {document.signedUrlError && (
                            <p className="mt-2 break-words text-xs text-amber-700">
                              Preview unavailable: {document.signedUrlError}
                            </p>
                          )}

                          <div className="mt-auto flex flex-wrap gap-2 pt-3">
                            <button
                              type="button"
                              onClick={() => refreshLink(document, false)}
                              disabled={openingId === document.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                              title={expired ? 'Refresh the secure link and open the file' : 'Open file in a new tab'}
                            >
                              {openingId === document.id ? <LoaderCircle size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => refreshLink(document, true)}
                              disabled={openingId === document.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              <Download size={14} />
                              Download
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>

            <footer className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:px-6">
              Secure file links expire after five minutes. Close this window when finished.
            </footer>
          </section>
        </div>
      )}
    </>
  )
}

export default CustomerDocuments
