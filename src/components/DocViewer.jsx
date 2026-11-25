import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Shows a session file (PDF or PowerPoint .pptx) inside the page — view only.
 * PDFs are drawn page by page with pdf.js and slides with pptx-preview, so there is no browser
 * viewer toolbar: no download, print or "open in new tab" buttons. Right-click, drag and
 * Ctrl+S / Ctrl+P are blocked too. A button switches the viewer to full screen.
 * (The file still travels to the browser to be shown, so this stops casual saving, not a
 * determined user with dev tools.)
 */
export const isSlides = (url = '') => /\.pptx(?:[?#]|$)/i.test(url)

const block = (e) => e.preventDefault()
const MAX_W = 1100

let pdfjsPromise = null
const loadPdfjs = () => {
  pdfjsPromise ||= import('pdfjs-dist/legacy/build/pdf.mjs').then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()
    return pdfjs
  })
  return pdfjsPromise
}

/** Width (and height) of the scroll area, updated on resize — page and slide sizes follow it. */
function useSize(ref) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    let t
    const ro = new ResizeObserver(([entry]) => {
      clearTimeout(t)
      t = setTimeout(() => setSize({ w: Math.floor(entry.contentRect.width), h: Math.floor(entry.contentRect.height) }), 120)
    })
    ro.observe(el)
    return () => { clearTimeout(t); ro.disconnect() }
  }, [ref])
  return size
}

function PdfPages({ data, width, onError }) {
  const host = useRef(null)
  const [doc, setDoc] = useState(null)

  useEffect(() => {
    let task = null
    let loaded = null
    let alive = true
    loadPdfjs()
      .then((pdfjs) => {
        if (!alive) return null // closed while pdf.js was still loading
        // pdf.js takes ownership of the buffer it gets, so hand it a copy
        task = pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) })
        return task.promise
      })
      .then((d) => {
        if (!d) return
        if (!alive) { d.destroy(); return }
        loaded = d
        setDoc(d)
      })
      .catch(() => alive && onError())
    return () => { alive = false; task?.destroy(); loaded?.destroy() }
  }, [data, onError])

  // Pages are laid out as empty frames of the right size and drawn only when they come near the
  // screen (long PDFs would otherwise run phones out of canvas memory). Far-away pages are freed.
  useEffect(() => {
    const el = host.current
    if (!doc || !el || !width) return undefined
    let cancelled = false
    const pageW = Math.min(width - 32, MAX_W)
    const ratio = Math.min(window.devicePixelRatio || 1, doc.numPages > 40 ? 1.5 : 2)
    const tasks = new Map() // page number → render task
    const drawn = new Set()
    el.replaceChildren()

    const draw = async (frame, n) => {
      if (drawn.has(n) || cancelled) return
      drawn.add(n)
      try {
        const page = await doc.getPage(n)
        if (cancelled || !drawn.has(n)) return
        const vp = page.getViewport({ scale: (pageW / page.getViewport({ scale: 1 }).width) * ratio })
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(vp.width)
        canvas.height = Math.floor(vp.height)
        canvas.className = 'w-full h-full block'
        frame.style.height = `${Math.floor(vp.height / ratio)}px`
        frame.replaceChildren(canvas)
        const t = page.render({ canvasContext: canvas.getContext('2d'), viewport: vp })
        tasks.set(n, t)
        await t.promise
      } catch { /* cancelled or failed page — it stays blank */ }
    }
    const free = (frame, n) => {
      if (!drawn.has(n)) return
      drawn.delete(n)
      tasks.get(n)?.cancel()
      tasks.delete(n)
      const c = frame.querySelector('canvas')
      if (c) { c.width = 0; c.height = 0 }
      frame.replaceChildren()
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const n = Number(e.target.dataset.page)
        if (e.isIntersecting) draw(e.target, n)
        else free(e.target, n)
      })
    }, { root: el.closest('.overflow-auto'), rootMargin: '1200px 0px' })

    ;(async () => {
      // frame size from page 1 (pages are re-sized once drawn if they differ)
      const first = await doc.getPage(1)
      if (cancelled) return
      const v1 = first.getViewport({ scale: 1 })
      const h = Math.floor((pageW / v1.width) * v1.height)
      for (let n = 1; n <= doc.numPages; n++) {
        const frame = document.createElement('div')
        frame.dataset.page = String(n)
        frame.className = 'bg-white shadow-lg max-w-full'
        frame.style.width = `${pageW}px`
        frame.style.height = `${h}px`
        frame.setAttribute('aria-label', `Page ${n} of ${doc.numPages}`)
        el.appendChild(frame)
        io.observe(frame)
      }
    })()

    return () => {
      cancelled = true
      io.disconnect()
      tasks.forEach((t) => t.cancel())
      el.querySelectorAll('canvas').forEach((c) => { c.width = 0; c.height = 0 })
    }
  }, [doc, width])

  if (!doc) return <Loading />
  return <div ref={host} className="flex flex-col items-center gap-4 py-4"></div>
}

function Slides({ data, width, height, onError }) {
  const host = useRef(null)
  useEffect(() => {
    const el = host.current
    if (!el || !width) return undefined
    let alive = true
    let viewer = null
    el.replaceChildren()
    const w = Math.min(width - 32, MAX_W)
    import('pptx-preview')
      .then(({ init }) => {
        if (!alive) return null
        // the slide list scrolls inside its own box: make that box fill the viewer (16:9 at least)
        viewer = init(el, { width: w, height: Math.max(Math.round((w * 9) / 16), (height || 0) - 32), mode: 'list' })
        return viewer.preview(data.slice(0))
      })
      .catch(() => alive && onError())
    return () => { alive = false; try { viewer?.destroy() } catch { /* already gone */ } el.replaceChildren() }
  }, [data, width, height, onError])
  return <div ref={host} className="pptx-host flex justify-center py-4"></div>
}

const Loading = ({ label = 'Loading file…' }) => (
  <div className="flex-grow flex items-center justify-center gap-2 text-sm text-gray-500 py-16"><i className="fa-solid fa-circle-notch animate-spin text-math-red"></i> {label}</div>
)

export default function DocViewer({ url, title = 'Session file' }) {
  const frame = useRef(null)
  const scroller = useRef(null)
  const { w: width, h: height } = useSize(scroller)
  const slides = isSlides(url)
  const [state, setState] = useState({ data: null, loading: true, error: false })
  const [full, setFull] = useState(false) // real full screen or the CSS fallback (iPhone)
  const [cssFull, setCssFull] = useState(false)
  const onError = useCallback(() => setState((s) => ({ ...s, error: true })), [])

  useEffect(() => {
    if (!url) return undefined
    const controller = new AbortController()
    setState({ data: null, loading: true, error: false })
    fetch(url, { signal: controller.signal })
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.arrayBuffer() })
      .then((data) => setState({ data, loading: false, error: false }))
      .catch((err) => { if (err.name !== 'AbortError') setState({ data: null, loading: false, error: true }) })
    return () => controller.abort()
  }, [url])

  // keep the state in step when the browser leaves full screen (Esc, F11, …)
  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === frame.current)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  // no Ctrl+S / Ctrl+P while the viewer is open; Esc closes the CSS full screen only
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key?.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'p')) { e.preventDefault(); return }
      if (k === 'escape' && cssFull) { e.stopPropagation(); setCssFull(false) }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [cssFull])

  const toggleFull = async () => {
    const el = frame.current
    if (full) { await document.exitFullscreen?.().catch(() => {}); return }
    if (cssFull) { setCssFull(false); return }
    if (el?.requestFullscreen) {
      try {
        // some browsers (embedded views, in-app browsers) accept the request but never enter, or never answer
        await Promise.race([el.requestFullscreen(), new Promise((_, reject) => setTimeout(() => reject(new Error('no answer')), 800))])
        if (document.fullscreenElement === el) return
      } catch { /* fall back below */ }
    }
    setCssFull(true)
  }
  const isFull = full || cssFull

  return (
    <div
      ref={frame}
      className={`doc-viewer flex flex-col min-h-0 select-none ${isFull ? 'bg-gray-900' : 'bg-gray-100'} ${cssFull ? 'fixed inset-0 z-[300]' : 'relative flex-grow'}`}
      onContextMenu={block} onDragStart={block} onCopy={block}
    >
      <button
        type="button" onClick={toggleFull}
        className="absolute top-3 right-3 z-10 h-9 px-3 rounded-lg bg-gray-900/75 hover:bg-gray-900 text-white text-xs font-bold flex items-center gap-1.5 shadow backdrop-blur-sm"
        title={isFull ? 'Exit full screen (Esc)' : 'Full screen'} aria-label={isFull ? 'Exit full screen' : 'Full screen'}
      >
        <i className={`fa-solid ${isFull ? 'fa-compress' : 'fa-expand'}`}></i>
        <span className="hidden sm:inline">{isFull ? 'Exit full screen' : 'Full screen'}</span>
      </button>
      <div ref={scroller} className="flex-grow min-h-0 overflow-auto" aria-label={title}>
        {state.loading ? <Loading label={slides ? 'Loading slides…' : 'Loading PDF…'} />
          : state.error ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center p-8 h-full">
              <i className={`fa-regular ${slides ? 'fa-file-powerpoint' : 'fa-file-pdf'} text-4xl text-gray-300`}></i>
              <p className={`text-sm ${isFull ? 'text-gray-300' : 'text-gray-500'}`}>This file can&apos;t be shown here. Ask the admin to upload it again{slides ? ' as .pptx or PDF' : ''}.</p>
            </div>
          )
          : slides ? <Slides data={state.data} width={width} height={height} onError={onError} />
          : <PdfPages data={state.data} width={width} onError={onError} />}
      </div>
    </div>
  )
}
