import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getSystemInfo, readData, writeData } from '../lib/storage'

function generateId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// Modes for the photo picker
const MODE_IDLE = 'idle'       // nothing chosen yet
const MODE_PREVIEW = 'preview' // file chosen, showing preview
const MODE_CAMERA = 'camera'   // live webcam stream active

export default function Register({ onRegistered }) {
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState(null)   // final base64 string
  const [photoMode, setPhotoMode] = useState(MODE_IDLE)
  const [sysInfo, setSysInfo] = useState({ username: '', hostname: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cameraError, setCameraError] = useState('')

  const fileRef = useRef()
  const videoRef = useRef()
  const canvasRef = useRef()
  const streamRef = useRef(null)

  useEffect(() => {
    getSystemInfo().then(setSysInfo).catch(console.error)
    return () => stopCamera()
  }, [])

  // ── Camera helpers ────────────────────────────────────────────────────────

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  const startCamera = async () => {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setPhotoMode(MODE_CAMERA)
    } catch (err) {
      setCameraError('Camera not available. Please upload a photo instead.')
    }
  }

  const captureSnapshot = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setPhoto(dataUrl)
    setPhotoMode(MODE_PREVIEW)
    stopCamera()
    setError('')
  }

  const cancelCamera = () => {
    stopCamera()
    setPhotoMode(photo ? MODE_PREVIEW : MODE_IDLE)
  }

  // ── File upload ───────────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhoto(ev.target.result)
      setPhotoMode(MODE_PREVIEW)
      setError('')
    }
    reader.readAsDataURL(file)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  const resetPhoto = () => {
    stopCamera()
    setPhoto(null)
    setPhotoMode(MODE_IDLE)
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!photo) {
      setError('A profile photo is required. Please upload or take a selfie.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const data = await readData()
      const newUser = {
        id: generateId(),
        name: name.trim(),
        photo,
        windowsAccount: sysInfo.username,
        computerName: sysInfo.hostname,
        registeredAt: new Date().toISOString(),
      }
      data.users.push(newUser)
      const result = await writeData(data)
      if (result.success) {
        onRegistered(newUser)
      } else {
        setError('Failed to save. Check that the data path is accessible.')
      }
    } catch (err) {
      setError('Unexpected error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen map-bg flex items-center justify-center p-6 overflow-auto">
      {/* Decorative blobs */}
      <div className="relative bg-white rounded-2xl border border-slate-200 p-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-none">Training Tracker</h1>
              <p className="text-xs text-slate-400 mt-0.5">Tekla API Learning Path</p>
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Create your profile</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Your profile will appear on the shared training map.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Photo section ─────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Profile Photo
              <span className="ml-1 text-rose-500">*</span>
              <span className="ml-2 text-xs font-normal text-slate-400">required</span>
            </label>

            {/* IDLE: no photo yet */}
            {photoMode === MODE_IDLE && (
              <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${error && !photo ? 'border-rose-300 bg-rose-50' : 'border-slate-200 hover:border-indigo-300'}`}>
                {/* Placeholder avatar */}
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-600 mb-1">Add your photo</p>
                <p className="text-xs text-slate-400 mb-4">Your photo appears on the training map for other trainees to see.</p>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    Take Selfie
                  </button>
                </div>
                {cameraError && (
                  <p className="mt-3 text-xs text-amber-600 font-medium">{cameraError}</p>
                )}
              </div>
            )}

            {/* CAMERA: live viewfinder */}
            {photoMode === MODE_CAMERA && (
              <div className="rounded-2xl overflow-hidden border-2 border-emerald-300">
                <div className="relative bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full"
                    style={{ maxHeight: '240px', objectFit: 'cover' }}
                  />
                  {/* Circular face guide */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-32 h-32 rounded-full border-4 border-white border-opacity-60" />
                  </div>
                </div>
                <div className="flex gap-3 p-3 bg-emerald-50">
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    Capture
                  </button>
                  <button
                    type="button"
                    onClick={cancelCamera}
                    className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 bg-white rounded-xl border border-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* PREVIEW: photo chosen */}
            {photoMode === MODE_PREVIEW && photo && (
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-200 flex-shrink-0">
                  <img src={photo} alt="Your photo" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold text-slate-700">Photo ready</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="text-xs text-indigo-600 font-medium hover:text-indigo-800 px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors"
                    >
                      Upload different
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="text-xs text-emerald-600 font-medium hover:text-emerald-800 px-3 py-1.5 bg-emerald-50 rounded-lg transition-colors"
                    >
                      Retake
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Hidden inputs */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {/* Hidden canvas for snapshot */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* ── Name ──────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Your Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alvin"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
              autoFocus
            />
          </div>

          {/* ── System info ───────────────────────────────────────────────── */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Auto-detected
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <span className="w-5 text-center">💻</span>
              <span className="font-medium">Windows account:</span>
              <span className="font-mono text-indigo-600">{sysInfo.username || '…'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <span className="w-5 text-center">🖥️</span>
              <span className="font-medium">Computer:</span>
              <span className="font-mono text-indigo-600">{sysInfo.hostname || '…'}</span>
            </div>
          </div>

          {/* ── Error ─────────────────────────────────────────────────────── */}
          {error && (
            <p className="text-rose-500 text-sm font-medium bg-rose-50 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          {/* ── Submit ────────────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold rounded-xl py-3 transition-colors
              ${!photo
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50'
              }`}
          >
            {loading ? 'Creating profile…' : 'Create Profile'}
          </button>

          {!photo && (
            <p className="text-center text-xs text-slate-400">
              Upload or take a selfie to continue
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
