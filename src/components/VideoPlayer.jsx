import React, { useMemo } from 'react'

/**
 * Renders a YouTube embed or a local/network video file.
 * For local paths (e.g. C:\... or \\server\share\...) a <video> tag is used
 * via the localvideo:// Electron protocol which supports range requests (seeking).
 */
export default function VideoPlayer({ url, className = '' }) {
  const isLocal = useMemo(() => isLocalPath(url), [url])
  const videoId = useMemo(() => (!isLocal ? extractYouTubeId(url) : null), [url, isLocal])

  if (!url || (!isLocal && !videoId)) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-2xl ${className}`}>
        <div className="text-center p-8">
          <span className="text-5xl">🎬</span>
          <p className="mt-3 text-slate-500 text-sm">No video URL provided</p>
        </div>
      </div>
    )
  }

  if (isLocal) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-black ${className}`}>
        <video
          src={toLocalVideoUrl(url)}
          controls
          className="w-full h-full"
          style={{ display: 'block' }}
        />
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

/** Returns true for Windows absolute paths (C:\...) and UNC paths (\\server\...) */
function isLocalPath(url) {
  if (!url) return false
  return /^[a-zA-Z]:[/\\]/.test(url) || url.startsWith('\\\\')
}

/** Convert a local file path to a localvideo:// URL for the Electron protocol handler */
function toLocalVideoUrl(filePath) {
  const normalized = filePath.replace(/\\/g, '/')
  // UNC paths: \\server\share → //server/share → localvideo:////server/share/...
  if (normalized.startsWith('//')) {
    return 'localvideo:' + normalized
  }
  // Absolute paths: C:/... → localvideo:///C:/...
  return 'localvideo:///' + normalized
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
