import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

/** Plays a lesson video: Bunny (signed .m3u8 stream) through hls.js, Safari natively. Download is blocked. */
export default function HlsPlayer({ src, title }) {
  const ref = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video || !src) return undefined
    setFailed(false)
    let hls
    if (Hls.isSupported()) {
      hls = new Hls()
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) setFailed(true) })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
    } else {
      setFailed(true)
    }
    return () => { if (hls) hls.destroy() }
  }, [src])

  if (failed) {
    const local = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm text-white/80 p-6 bg-black">
        <i className="fa-solid fa-triangle-exclamation text-2xl text-white/40"></i>
        <p>Couldn’t load this video.</p>
        <p className="text-xs text-white/50">{local ? 'On localhost the video host may block it — it plays on the live site.' : 'Check your connection, then reopen the video.'}</p>
      </div>
    )
  }
  return (
    <video ref={ref} controls playsInline controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} title={title}
      className="absolute inset-0 w-full h-full bg-black" />
  )
}
