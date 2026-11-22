import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import HlsPlayer from './HlsPlayer'

/** YouTube / Vimeo / Drive page links → their embeddable player (null for anything else). */
const toEmbed = (url) => {
  if (typeof url !== 'string') return null
  let m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)
  if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (m) return `https://player.vimeo.com/video/${m[1]}`
  m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/)
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`
  return null
}

function Centered({ icon, children, tone = 'text-gray-500' }) {
  return (
    <div className={`flex-grow flex flex-col items-center justify-center text-center gap-2 p-8 text-sm ${tone}`}>
      <i className={`${icon} text-3xl text-gray-300`}></i>
      <div>{children}</div>
    </div>
  )
}

/**
 * The pre-recorded lesson videos of a session (the same ones students get), so the teacher can prepare.
 * GET /api/teacher/sessions/:id → session.lessons[].ideas[].video = { type: "bunny", streamUrl } | { type: "external", url }
 * Loaded when opened, so the signed video links are always fresh (they expire after 2 hours).
 *
 * Layout: a 16:9 player that always fits its width, the title with Previous / Next under it, and the playlist —
 * beside the player on wide screens, below it on phones. `stacked` keeps the playlist below (narrow panes).
 */
export default function LessonVideos({ sessionId, stacked = false }) {
  const [state, setState] = useState({ loading: true, error: '', lessons: [] })
  const [active, setActive] = useState(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let live = true
    setState({ loading: true, error: '', lessons: [] })
    axiosClient.get(`/api/teacher/sessions/${sessionId}`)
      .then((res) => {
        if (!live) return
        const lessons = (res?.data?.session?.lessons || []).map((l) => ({ ...l, videos: (l.ideas || []).filter((i) => i.video) }))
        setState({ loading: false, error: '', lessons })
        const first = lessons.flatMap((l) => l.videos)[0]
        setActive(first ? first.id : null)
      })
      .catch((err) => live && setState({ loading: false, error: err?.message || 'Could not load the videos.', lessons: [] }))
    return () => { live = false }
  }, [sessionId, reload])

  const withVideos = state.lessons.filter((l) => l.videos.length)
  const all = withVideos.flatMap((l) => l.videos.map((v) => ({ ...v, lessonName: l.name })))
  const idx = Math.max(0, all.findIndex((v) => v.id === active))
  const video = all[idx] || null

  if (state.loading) return <Centered icon="fa-solid fa-circle-notch animate-spin">Loading lesson videos…</Centered>
  if (state.error) {
    return (
      <Centered icon="fa-solid fa-triangle-exclamation" tone="text-red-600">
        {state.error}
        <button type="button" onClick={() => setReload((n) => n + 1)} className="block mx-auto mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-math-red text-white">Try again</button>
      </Centered>
    )
  }
  if (!video) return <Centered icon="fa-solid fa-film">This session’s lessons have no recorded videos yet.</Centered>

  const embed = video.video.type !== 'bunny' ? toEmbed(video.video.url) : null
  const go = (d) => { const next = all[idx + d]; if (next) setActive(next.id) }
  const side = !stacked

  return (
    <div className={`flex-grow min-h-0 overflow-y-auto bg-gray-50 ${side ? 'lg:flex lg:overflow-hidden' : ''}`}>
      {/* player + title */}
      <div className={`p-3 sm:p-5 ${side ? 'lg:flex-grow lg:min-w-0 lg:overflow-y-auto' : ''}`}>
        <div className="w-full max-w-4xl mx-auto">
          <div className="relative w-full aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
            {video.video.type === 'bunny' ? (
              <HlsPlayer key={video.video.streamUrl} src={video.video.streamUrl} title={video.idea} />
            ) : embed ? (
              <iframe key={embed} src={embed} title={video.idea || 'Lesson video'} className="absolute inset-0 w-full h-full border-0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
            ) : (
              <video key={video.video.url} controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} className="absolute inset-0 w-full h-full bg-black" src={video.video.url} />
            )}
          </div>

          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-math-red uppercase tracking-wider truncate">{video.lessonName}</p>
              <h4 className="text-base sm:text-lg font-bold text-gray-900 leading-snug break-words">{video.idea || `Video ${idx + 1}`}</h4>
              <p className="text-xs text-gray-500 mt-0.5">Video {idx + 1} of {all.length}</p>
            </div>
            {all.length > 1 && (
              <div className="grid grid-cols-2 sm:flex gap-2 shrink-0">
                <button type="button" onClick={() => go(-1)} disabled={idx === 0}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-gray-200 text-gray-700 hover:border-math-red hover:text-math-red disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5">
                  <i className="fa-solid fa-chevron-left text-[10px]"></i> Previous
                </button>
                <button type="button" onClick={() => go(1)} disabled={idx === all.length - 1}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-math-red text-white hover:bg-math-red-hover disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-1.5">
                  Next <i className="fa-solid fa-chevron-right text-[10px]"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* playlist */}
      <aside className={`bg-white border-t border-gray-200 ${side ? 'lg:w-[340px] lg:shrink-0 lg:border-t-0 lg:border-l lg:overflow-y-auto' : ''}`}>
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <p className="text-sm font-bold text-gray-900"><i className="fa-solid fa-list-ul mr-1.5 text-gray-400"></i>Lesson videos</p>
          <span className="text-[11px] font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{all.length}</span>
        </div>
        <div className="p-2">
          {withVideos.map((l) => (
            <div key={l.id} className="mb-1">
              {withVideos.length > 1 && <p className="px-2 pt-2 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">{l.name}</p>}
              {l.videos.map((v) => {
                const n = all.findIndex((x) => x.id === v.id)
                const on = v.id === video.id
                return (
                  <button key={v.id} type="button" onClick={() => setActive(v.id)} aria-current={on ? 'true' : undefined}
                    className={`w-full text-left px-2 py-2 rounded-xl flex items-center gap-3 transition-colors ${on ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <span className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${on ? 'bg-math-red text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {on ? <i className="fa-solid fa-play text-[10px]"></i> : n + 1}
                    </span>
                    <span className={`text-sm leading-snug line-clamp-2 ${on ? 'font-bold text-math-red' : 'text-gray-700'}`}>{v.idea || `Video ${n + 1}`}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
