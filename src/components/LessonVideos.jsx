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

/**
 * The pre-recorded lesson videos of a session (the same ones students get), so the teacher can prepare.
 * GET /api/teacher/sessions/:id → session.lessons[].ideas[].video = { type: "bunny", streamUrl } | { type: "external", url }
 * Loaded when opened, so the signed video links are always fresh (they expire after 2 hours).
 */
export default function LessonVideos({ sessionId }) {
  const [state, setState] = useState({ loading: true, error: '', lessons: [] })
  const [active, setActive] = useState(null)

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
  }, [sessionId])

  const all = state.lessons.flatMap((l) => l.videos.map((v) => ({ ...v, lessonName: l.name })))
  const video = all.find((v) => v.id === active) || null

  if (state.loading) return <div className="flex-grow flex items-center justify-center text-sm text-gray-500 p-8"><i className="fa-solid fa-circle-notch animate-spin mr-2"></i> Loading lesson videos…</div>
  if (state.error) return <div className="flex-grow flex items-center justify-center text-sm text-red-600 p-8 text-center">{state.error}</div>
  if (!all.length) return <div className="flex-grow flex items-center justify-center text-sm text-gray-500 p-8 text-center">This session’s lessons have no recorded videos yet.</div>

  const embed = video && video.video.type !== 'bunny' ? toEmbed(video.video.url) : null
  return (
    <div className="flex flex-col lg:flex-row flex-grow min-h-0">
      <div className="w-full lg:w-[340px] border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto p-3 max-h-56 lg:max-h-none shrink-0 bg-white space-y-3">
        {state.lessons.filter((l) => l.videos.length).map((l) => (
          <div key={l.id}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">{l.name}</p>
            <div className="space-y-1">
              {l.videos.map((v, i) => (
                <button key={v.id} type="button" onClick={() => setActive(v.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center gap-2 ${v.id === active ? 'bg-red-50 text-math-red font-bold' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <i className="fa-solid fa-circle-play shrink-0"></i>
                  <span className="truncate">{v.idea || `Video ${i + 1}`}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex-grow min-h-0 flex items-center justify-center bg-gray-900 p-2 sm:p-4">
        {video && (
          <div className="w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden">
            {video.video.type === 'bunny' ? (
              <HlsPlayer key={video.video.streamUrl} src={video.video.streamUrl} title={video.idea} />
            ) : embed ? (
              <iframe src={embed} title={video.idea} className="w-full h-full border-0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
            ) : (
              <video controls controlsList="nodownload" className="w-full h-full" src={video.video.url} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
