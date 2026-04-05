import React, { useMemo } from 'react'

/**
 * Embeds a YouTube video using youtube-nocookie.com.
 * Accepts a full YouTube URL or a bare video ID.
 */
export default function VideoPlayer({ url, className = '' }) {
  const videoId = useMemo(() => extractYouTubeId(url), [url])

  if (!videoId) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-2xl ${className}`}>
        <div className="text-center p-8">
          <span className="text-5xl">🎬</span>
          <p className="mt-3 text-slate-500 text-sm">No video URL provided</p>
        </div>
      </div>
    )
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-black ${className}`}>
      <iframe
        src={embedUrl}
        title="Training video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0"
      />
    </div>
  )
}

function extractYouTubeId(url) {
  if (!url) return null
  // Already a bare ID (11 chars, no slashes/dots)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url

  try {
    const u = new URL(url)
    // youtu.be/ID
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    // youtube.com/watch?v=ID
    const v = u.searchParams.get('v')
    if (v) return v
    // youtube.com/embed/ID
    const embedMatch = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
    if (embedMatch) return embedMatch[1]
  } catch {
    // Not a valid URL — try regex
    const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
    if (m) return m[1]
  }
  return null
}
