import React, { useState, useEffect, useRef } from 'react'
import { getSystemInfo, readData, writeData } from '../lib/storage'
import UserAvatar from '../components/UserAvatar'

function generateId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export default function Register({ onRegistered }) {
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState(null) // base64 string
  const [sysInfo, setSysInfo] = useState({ username: '', hostname: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    getSystemInfo().then(setSysInfo).catch(console.error)
  }, [])

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target.result)
    reader.readAsDataURL(file)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const data = await readData()
      const newUser = {
        id: generateId(),
        name: name.trim(),
        photo: photo || null,
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

  return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-6">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-40" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-200 rounded-full translate-x-1/3 translate-y-1/3 opacity-30" />

      <div className="relative bg-white rounded-3xl p-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome!</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Register to start your training journey.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center cursor-pointer border-4 border-indigo-200 hover:border-indigo-400 transition-colors overflow-hidden"
              onClick={() => fileRef.current?.click()}
            >
              {photo ? (
                <img src={photo} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
            >
              {photo ? 'Change photo' : 'Upload photo'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Your Name
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

          {/* System info (read-only) */}
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

          {/* Error */}
          {error && (
            <p className="text-rose-500 text-sm font-medium bg-rose-50 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl py-3 transition-colors disabled:opacity-50"
          >
            {loading ? 'Registering…' : 'Start Training →'}
          </button>
        </form>
      </div>
    </div>
  )
}
