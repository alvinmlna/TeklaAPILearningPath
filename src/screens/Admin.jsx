import React, { useState, useMemo } from 'react'
import { addTrainingItem, deleteTrainingItem } from '../lib/storage'

const CATEGORIES = ['Dasar Pemograman', 'Foundational', 'Tekla API']
const PIN = '1234'

const CATEGORY_COLORS = {
  'Dasar Pemograman': {
    badge: 'bg-indigo-100 text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-400',
    light: 'bg-indigo-50',
  },
  'Foundational': {
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    light: 'bg-amber-50',
  },
  'Tekla API': {
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-400',
    light: 'bg-emerald-50',
  },
}

// ─── PIN gate ─────────────────────────────────────────────────────────────────
function PinGate({ onUnlock, onBack }) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const refs = [React.createRef(), React.createRef(), React.createRef(), React.createRef()]

  const handleDigit = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[idx] = val
    setDigits(next)
    setError(false)

    if (val && idx < 3) {
      refs[idx + 1].current?.focus()
    }

    const pin = next.join('')
    if (pin.length === 4) {
      if (pin === PIN) {
        onUnlock()
      } else {
        setError(true)
        setShake(true)
        setTimeout(() => {
          setDigits(['', '', '', ''])
          setShake(false)
          refs[0].current?.focus()
        }, 600)
      }
    }
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus()
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-3xl p-10 w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Admin Access</h2>
        <p className="text-slate-400 text-sm mb-8">Enter the 4-digit PIN to continue.</p>

        {/* PIN inputs */}
        <div className={`flex justify-center gap-3 mb-6 ${shake ? 'animate-bounce' : ''}`}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
              className={`
                w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-colors
                ${error
                  ? 'border-rose-400 bg-rose-50 text-rose-600'
                  : d
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700'}
                focus:border-indigo-400
              `}
            />
          ))}
        </div>

        {error && (
          <p className="text-rose-500 text-sm font-medium mb-4">Incorrect PIN. Try again.</p>
        )}

        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
        >
          ← Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Main Admin panel ─────────────────────────────────────────────────────────
function AdminPanel({ data, onBack, onRefresh }) {
  const { trainingItems = [] } = data || {}

  const [form, setForm] = useState({
    category: CATEGORIES[0],
    title: '',
    description: '',
    youtubeUrl: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null) // item id pending delete
  const [filterCat, setFilterCat] = useState('All')

  const filteredItems = useMemo(
    () =>
      filterCat === 'All'
        ? trainingItems
        : trainingItems.filter((i) => i.category === filterCat),
    [trainingItems, filterCat]
  )

  function generateId() {
    return `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    if (!form.youtubeUrl.trim()) {
      setError('YouTube URL is required.')
      return
    }

    setSaving(true)
    try {
      const newItem = {
        id: generateId(),
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        youtubeUrl: form.youtubeUrl.trim(),
      }
      const result = await addTrainingItem(newItem)
      if (result.success) {
        setSuccess(`"${newItem.title}" added successfully.`)
        setForm((f) => ({ ...f, title: '', description: '', youtubeUrl: '' }))
        await onRefresh()
      } else {
        setError('Failed to save. Check the data path.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (itemId) => {
    const result = await deleteTrainingItem(itemId)
    setDeleteConfirm(null)
    if (result.success) {
      setSuccess('Item deleted.')
      await onRefresh()
    } else {
      setError('Delete failed.')
    }
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-white border-b-2 border-slate-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium text-sm px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-rose-100 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="font-bold text-slate-800 text-sm">Admin Panel</h1>
        </div>
        <span className="ml-2 text-xs bg-rose-100 text-rose-600 font-semibold px-2 py-0.5 rounded-lg">
          PIN protected
        </span>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* ── Add form ─────────────────────────────────────────────────────── */}
        <aside className="w-80 flex-shrink-0 bg-white border-r-2 border-slate-100 overflow-y-auto thin-scrollbar p-5">
          <h2 className="font-bold text-slate-700 text-sm mb-4 uppercase tracking-wide">
            Add Training Item
          </h2>

          <form onSubmit={handleAdd} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
              <div className="space-y-1.5">
                {CATEGORIES.map((cat) => {
                  const colors = CATEGORY_COLORS[cat]
                  const active = form.category === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      className={`
                        w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                        ${active ? colors.light + ' ' + colors.border : 'border-slate-100 hover:border-slate-200'}
                      `}
                    >
                      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Variables and Data Types"
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Description <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of what this training covers…"
                rows={3}
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors resize-none"
              />
            </div>

            {/* YouTube URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">YouTube URL *</label>
              <input
                type="url"
                value={form.youtubeUrl}
                onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
              />
            </div>

            {/* Feedback */}
            {error && (
              <p className="text-rose-500 text-xs font-medium bg-rose-50 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-emerald-600 text-xs font-medium bg-emerald-50 rounded-xl px-3 py-2">
                ✓ {success}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Adding…' : '+ Add Item'}
            </button>
          </form>

          {/* Note about categories */}
          <p className="mt-5 text-[11px] text-slate-400 leading-relaxed">
            Categories are fixed: Dasar Pemograman, Foundational, and Tekla API. You can only add or remove items within them.
          </p>
        </aside>

        {/* ── Item list ────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto thin-scrollbar p-5">
          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {['All', ...CATEGORIES].map((cat) => {
              const colors = cat !== 'All' ? CATEGORY_COLORS[cat] : null
              const active = filterCat === cat
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`
                    text-xs font-semibold px-3 py-1.5 rounded-xl border-2 transition-colors
                    ${active
                      ? (colors ? colors.light + ' ' + colors.border + ' ' + colors.badge.split(' ')[1] : 'bg-slate-800 border-slate-800 text-white')
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'}
                  `}
                >
                  {cat}
                  <span className="ml-1.5 text-[10px] font-normal opacity-70">
                    ({cat === 'All'
                      ? trainingItems.length
                      : trainingItems.filter((i) => i.category === cat).length})
                  </span>
                </button>
              )
            })}
          </div>

          {/* Items grid */}
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-5xl mb-4">📭</span>
              <p className="text-slate-400 font-medium">No items in this category yet.</p>
              <p className="text-slate-300 text-sm mt-1">Use the form on the left to add one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Foundational']
                const pendingDelete = deleteConfirm === item.id
                return (
                  <div
                    key={item.id}
                    className={`
                      bg-white border-2 rounded-2xl px-5 py-4 flex items-start gap-4 transition-colors
                      ${pendingDelete ? 'border-rose-300 bg-rose-50' : 'border-slate-100 hover:border-slate-200'}
                    `}
                  >
                    <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${colors.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${colors.badge}`}>
                          {item.category}
                        </span>
                        <h3 className="font-semibold text-slate-800 text-sm">{item.title}</h3>
                      </div>
                      {item.description && (
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      {item.youtubeUrl && (
                        <p className="text-slate-300 text-[10px] mt-1 truncate font-mono">
                          {item.youtubeUrl}
                        </p>
                      )}
                    </div>

                    {/* Delete controls */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {pendingDelete ? (
                        <>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-xl transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1.5 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-50"
                          title="Delete item"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ─── Exported: wraps with PIN gate ───────────────────────────────────────────
export default function Admin({ data, onBack, onRefresh }) {
  const [unlocked, setUnlocked] = useState(false)

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} onBack={onBack} />
  }

  return <AdminPanel data={data} onBack={onBack} onRefresh={onRefresh} />
}
