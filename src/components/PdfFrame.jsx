import { useEffect, useState } from 'react'

/**
 * Shows a PDF from the backend inside the page.
 * The backend sends X-Frame-Options: SAMEORIGIN, so the file can't be framed directly from another
 * domain. Instead it is downloaded (uploads allow CORS) and shown through a local blob: URL.
 */
export default function PdfFrame({ url, title = 'PDF' }) {
  const [state, setState] = useState({ src: null, loading: true, error: false })

  useEffect(() => {
    if (!url) return undefined
    const controller = new AbortController()
    let objectUrl = null
    setState({ src: null, loading: true, error: false })
    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.arrayBuffer()
      })
      .then((buffer) => {
        objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }))
        setState({ src: objectUrl, loading: false, error: false })
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ src: null, loading: false, error: true })
      })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  if (state.loading) {
    return <div className="flex-grow flex items-center justify-center gap-2 text-sm text-gray-500"><i className="fa-solid fa-circle-notch animate-spin text-math-red"></i> Loading PDF…</div>
  }
  if (state.error) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center gap-3 text-center p-8">
        <i className="fa-regular fa-file-pdf text-4xl text-gray-300"></i>
        <p className="text-sm text-gray-500">This PDF can&apos;t be shown here.</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-math-red text-white text-sm font-bold">Open in a new tab</a>
      </div>
    )
  }
  return <iframe src={state.src} title={title} className="flex-grow w-full bg-white"></iframe>
}
