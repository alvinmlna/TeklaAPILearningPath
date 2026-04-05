import React, { useState } from 'react'
import { setDataPath, browseForFolder } from '../lib/storage'

export default function Setup({ currentDataPath, onSkip }) {
  const [inputPath, setInputPath] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleBrowse = async () => {
    const selected = await browseForFolder()
    if (selected) setInputPath(selected)
  }

  const handleSave = async () => {
    const p = inputPath.trim()
    if (!p) { setError('Please enter or browse for a path.'); return }
    if (!p.endsWith('.json')) { setError('Path must end with a filename, e.g. …\\data.json'); return }
    setSaving(true)
    setError('')
    const result = await setDataPath(p)
    if (!result.success) {
      setError(result.error || 'Failed to save. Make sure the folder exists and is accessible.')
      setSaving(false)
    }
    // On success, main.js relaunches the app automatically — no further action needed here
  }

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 w-full max-w-lg">

        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base">Configure Shared Data Path</h1>
            <p className="text-xs text-slate-400 mt-0.5">One-time setup — required for multi-user access</p>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Currently using a local file</span> — only this machine can see its own data.
            Point the app to a shared network folder so all users share the same progress and roster.
          </p>
          <p className="text-[11px] text-amber-600 mt-1.5 font-mono break-all">{currentDataPath}</p>
        </div>

        {/* Input */}
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          Network data file path
        </label>
        <div className="flex gap-2 mb-1.5">
          <input
            type="text"
            value={inputPath}
            onChange={(e) => { setInputPath(e.target.value); setError('') }}
            placeholder={`\\\\SERVER\\share\\training-tracker\\data.json`}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-indigo-400 transition-colors"
          />
          <button
            onClick={handleBrowse}
            className="flex-shrink-0 px-3 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Browse…
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mb-5">
          The folder must already exist and be readable/writable by all users.
          The app will create <span className="font-mono">data.json</span> inside it on first launch.
        </p>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200">
            <p className="text-xs text-rose-600 font-medium">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !inputPath.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Saving & Restarting…
              </>
            ) : 'Save & Restart App'}
          </button>
          <button
            onClick={onSkip}
            className="px-4 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Skip for now
          </button>
        </div>

        <p className="text-[11px] text-slate-300 text-center mt-4">
          You can change this later in Admin → Data Source.
        </p>
      </div>
    </div>
  )
}
