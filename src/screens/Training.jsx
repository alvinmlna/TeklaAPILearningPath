import React, { useState, useEffect, useMemo } from 'react'
import VideoPlayer from '../components/VideoPlayer'
import UserAvatar from '../components/UserAvatar'
import { markComplete, isCompleted, completedAt, getUsersOnNode } from '../lib/storage'

const CATEGORIES = ['Dasar Pemograman', 'Foundational', 'Tekla API']

const CATEGORY_COLORS = {
  'Dasar Pemograman': {
    bg: 'bg-indigo-500',
    light: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700',
    activeBg: 'bg-indigo-500',
    activeText: 'text-white',
    dot: 'bg-indigo-400',
  },
  'Foundational': {
    bg: 'bg-amber-500',
    light: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
    activeBg: 'bg-amber-500',
    activeText: 'text-white',
    dot: 'bg-amber-400',
  },
  'Tekla API': {
    bg: 'bg-emerald-500',
    light: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    activeBg: 'bg-emerald-500',
    activeText: 'text-white',
    dot: 'bg-emerald-400',
  },
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function Training({ currentUser, data, initialItem, onBack, onRefresh }) {
  const { users = [], progress: initialProgress = [], trainingItems = [] } = data || {}

  const [progress, setProgress] = useState(initialProgress)
  const [selectedItem, setSelectedItem] = useState(initialItem || trainingItems[0] || null)
  const [marking, setMarking] = useState(false)
  const [justMarked, setJustMarked] = useState(false)

  // Keep progress fresh when parent data changes
  useEffect(() => {
    setProgress(initialProgress)
  }, [initialProgress])

  // If initialItem changed from parent, update
  useEffect(() => {
    if (initialItem) setSelectedItem(initialItem)
  }, [initialItem])

  const handleSelect = (item) => {
    setSelectedItem(item)
    setJustMarked(false)
  }

  const handleMarkComplete = async () => {
    if (!currentUser || !selectedItem) return
    setMarking(true)
    try {
      const result = await markComplete(currentUser.id, selectedItem.id)
      if (result.success) {
        setJustMarked(true)
        const fresh = await onRefresh()
        if (fresh) setProgress(fresh.progress || [])
      }
    } finally {
      setMarking(false)
    }
  }

  const done = selectedItem
    ? isCompleted(progress, currentUser?.id, selectedItem.id)
    : false

  const completionDate = selectedItem
    ? completedAt(progress, currentUser?.id, selectedItem.id)
    : null

  const usersOnNode = selectedItem
    ? getUsersOnNode(progress, users, selectedItem.id)
    : []

  const itemsByCategory = useMemo(
    () => Object.fromEntries(
      CATEGORIES.map((cat) => [cat, trainingItems.filter((i) => i.category === cat)])
    ),
    [trainingItems]
  )

  const totalDone = trainingItems.filter((i) =>
    isCompleted(progress, currentUser?.id, i.id)
  ).length

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-white border-b-2 border-slate-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium text-sm px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Map
        </button>

        <div className="h-5 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <span className="text-lg">📚</span>
          <h1 className="font-bold text-slate-800 text-sm">Training Library</h1>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-500">
            <span className="font-bold text-slate-700">{totalDone}</span>/{trainingItems.length} completed
          </span>
          <UserAvatar user={currentUser} size="sm" ring />
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <aside className="w-60 flex-shrink-0 bg-white border-r-2 border-slate-100 overflow-y-auto thin-scrollbar flex flex-col">
          <div className="p-3 space-y-1">
            {CATEGORIES.map((cat) => {
              const catItems = itemsByCategory[cat] || []
              const catDone = catItems.filter((i) =>
                isCompleted(progress, currentUser?.id, i.id)
              ).length
              const colors = CATEGORY_COLORS[cat]

              return (
                <div key={cat}>
                  {/* Category header */}
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${colors.light}`}>
                    <span className={`text-xs font-bold uppercase tracking-wide ${colors.text}`}>
                      {cat}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${colors.badge}`}>
                      {catDone}/{catItems.length}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="mt-0.5 space-y-0.5 mb-2">
                    {catItems.map((item) => {
                      const itemDone = isCompleted(progress, currentUser?.id, item.id)
                      const isActive = selectedItem?.id === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className={`
                            w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors
                            ${isActive
                              ? colors.activeBg + ' ' + colors.activeText
                              : 'hover:bg-slate-50 text-slate-700'}
                          `}
                        >
                          {/* Status dot */}
                          <span className={`
                            flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                            ${itemDone
                              ? (isActive ? 'bg-white bg-opacity-30' : colors.dot)
                              : (isActive ? 'bg-white bg-opacity-20' : 'bg-slate-200')}
                          `}>
                            {itemDone ? (
                              <svg className={`w-3 h-3 ${isActive ? 'text-white' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className={`text-[8px] ${isActive ? 'text-white' : 'text-slate-400'}`}>●</span>
                            )}
                          </span>
                          <span className="truncate font-medium text-xs">{item.title}</span>
                        </button>
                      )
                    })}
                    {catItems.length === 0 && (
                      <p className="px-3 py-2 text-xs text-slate-400 italic">No items yet</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        {/* ── Content area ───────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto thin-scrollbar p-6">
          {!selectedItem ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <span className="text-6xl">📖</span>
                <p className="mt-4 text-slate-500 font-medium">
                  Select a training item from the sidebar to begin.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {/* Item header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${CATEGORY_COLORS[selectedItem.category]?.badge || 'bg-slate-100 text-slate-600'}`}>
                    {selectedItem.category}
                  </span>
                  {done && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Completed {completionDate ? `· ${formatDate(completionDate)}` : ''}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedItem.title}</h2>
                {selectedItem.description && (
                  <p className="mt-2 text-slate-500 text-sm leading-relaxed">
                    {selectedItem.description}
                  </p>
                )}
              </div>

              {/* Video */}
              <VideoPlayer
                url={selectedItem.youtubeUrl}
                className="w-full aspect-video"
              />

              {/* Action row */}
              <div className="flex items-center gap-4">
                {done ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-200 rounded-2xl px-5 py-3">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-emerald-700 text-sm">
                      You completed this!
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleMarkComplete}
                    disabled={marking}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-2xl px-6 py-3 text-sm transition-colors disabled:opacity-50"
                  >
                    {marking ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Saving…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Mark as Complete
                      </>
                    )}
                  </button>
                )}

                {justMarked && !marking && (
                  <span className="text-emerald-600 text-sm font-medium animate-pulse">
                    🎉 Great job!
                  </span>
                )}
              </div>

              {/* Who else completed this */}
              {usersOnNode.length > 0 && (
                <div className="bg-white border-2 border-slate-100 rounded-2xl px-5 py-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                    Also completed by
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {usersOnNode.map((u) => (
                      <div key={u.id} className="flex items-center gap-2">
                        <UserAvatar user={u} size="sm" />
                        <span className="text-sm text-slate-700 font-medium">{u.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
