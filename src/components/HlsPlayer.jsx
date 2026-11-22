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
    return (
      <div className="w-full h-full flex items-center justify-center text-center text-sm text-white/80 p-6 bg-black">
        Couldn’t load this video. It plays on the live site (mathshouse.net) — on localhost Bunny may block it.
      </div>
    )
  }
  return (
    <video ref={ref} controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} title={title}
      className="w-full h-full bg-black" />
  )
}
