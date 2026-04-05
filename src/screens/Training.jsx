import React, { useState, useEffect, useMemo } from 'react'
import VideoPlayer from '../components/VideoPlayer'
import UserAvatar from '../components/UserAvatar'
import CodeChallenge from '../components/CodeChallenge'
import Quiz from '../components/Quiz'
import { markComplete, isCompleted, completedAt, getUsersOnNode } from '../lib/storage'

const CATEGORIES = ['Programming Fundamental', 'Visual Studio', 'Windows Form', 'Tekla Open API', 'Intermediate']

const CATEGORY_COLORS = {
  'Programming Fundamental': {
    light: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-700',
    activeBg: 'bg-indigo-600',
    activeText: 'text-white',
    dot: 'bg-indigo-500',
    accent: 'border-l-indigo-500',
  },
  'Visual Studio': {
    light: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700',
    activeBg: 'bg-violet-600',
    activeText: 'text-white',
    dot: 'bg-violet-500',
    accent: 'border-l-violet-500',
  },
  'Windows Form': {
    light: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-700',
    badge: 'bg-sky-100 text-sky-700',
    activeBg: 'bg-sky-600',
    activeText: 'text-white',
    dot: 'bg-sky-500',
    accent: 'border-l-sky-500',
  },
  'Tekla Open API': {
    light: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    activeBg: 'bg-emerald-600',
    activeText: 'text-white',
    dot: 'bg-emerald-500',
    accent: 'border-l-emerald-500',
  },
  'Intermediate': {
    light: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
    activeBg: 'bg-orange-500',
    activeText: 'text-white',
    dot: 'bg-orange-500',
    accent: 'border-l-orange-500',
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
  const [activeTab, setActiveTab] = useState('video') // 'video' | 'code'

  // Keep progress fresh when parent data changes
  useEffect(() => {
    setProgress(initialProgress)
  }, [initialProgress])

  // If initialItem changed from parent, update
  useEffect(() => {
    if (initialItem) setSelectedItem(initialItem)
  }, [initialItem])

  // Escape → back to dashboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onBack])

  const handleSelect = (item) => {
    setSelectedItem(item)
    setJustMarked(false)
    if (item.quizOnly || (!item.youtubeUrl && item.quiz)) {
      setActiveTab('quiz')
    } else if (!item.youtubeUrl && item.codeChallenge) {
      setActiveTab('code')
    } else {
      setActiveTab('video')
    }
  }

  const handleMarkComplete = async (submittedCode = null) => {
    if (!currentUser || !selectedItem) return
    setMarking(true)
    try {
      const result = await markComplete(currentUser.id, selectedItem.id, submittedCode)
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

  const submittedCode = selectedItem
    ? (progress.find((p) => p.itemId === selectedItem.id && p.userId === currentUser?.id)?.submittedCode ?? null)
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

  // Category-level lock: all items in previous category must be done
  const isCategoryLocked = (idx) => {
    if (idx === 0) return false
    const prevCat = CATEGORIES[idx - 1]
    const prevItems = trainingItems.filter((i) => i.category === prevCat)
    if (prevItems.length === 0) return false
    return !prevItems.every((item) =>
      progress.some((p) => p.itemId === item.id && p.userId === currentUser?.id)
    )
  }

  // Item-level lock: sequential within category — previous item must be done
  const isItemLocked = (catIdx, itemIdx, catItems) => {
    if (isCategoryLocked(catIdx)) return true
    if (itemIdx === 0) return false
    const prevItem = catItems[itemIdx - 1]
    return !progress.some((p) => p.itemId === prevItem.id && p.userId === currentUser?.id)
  }

  const totalDone = trainingItems.filter((i) =>
    isCompleted(progress, currentUser?.id, i.id)
  ).length

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Learning Path
        </button>

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <h1 className="font-semibold text-slate-800 text-sm">Training Library</h1>
        </div>

        <span className="text-[10px] text-slate-400 uppercase tracking-wide ml-1">
          — Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">Esc</kbd> to go back
        </span>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{totalDone}</span>/{trainingItems.length} completed
          </span>
          <UserAvatar user={currentUser} size="sm" ring />
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-200 overflow-y-auto thin-scrollbar flex flex-col">
          <div className="px-3 py-3 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Curriculum</p>
          </div>
          <div className="p-2 space-y-0.5">
            {CATEGORIES.map((cat, catIdx) => {
              const locked = isCategoryLocked(catIdx)
              const catItems = itemsByCategory[cat] || []
              const catDone = catItems.filter((i) =>
                isCompleted(progress, currentUser?.id, i.id)
              ).length
              const colors = CATEGORY_COLORS[cat]

              return (
                <div key={cat} className={locked ? 'opacity-50' : ''}>
                  {/* Category header */}
                  <div className={`flex items-center justify-between px-2.5 py-2 rounded-lg border-l-2 mb-0.5 ${locked ? 'bg-slate-50 border-l-slate-300' : colors.light + ' ' + colors.accent}`}>
                    <div className="flex items-center gap-1.5">
                      {locked && (
                        <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                        </svg>
                      )}
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${locked ? 'text-slate-400' : colors.text}`}>
                        {cat}
                      </span>
                    </div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${locked ? 'bg-slate-200 text-slate-400' : colors.badge}`}>
                      {locked ? 'Locked' : `${catDone}/${catItems.length}`}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="mt-0.5 space-y-0.5 mb-2">
                    {catItems.map((item, itemIdx) => {
                      const itemLocked = isItemLocked(catIdx, itemIdx, catItems)
                      const itemDone = isCompleted(progress, currentUser?.id, item.id)
                      const isActive = selectedItem?.id === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={itemLocked ? undefined : () => handleSelect(item)}
                          disabled={itemLocked}
                          className={`
                            w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors
                            ${itemLocked
                              ? 'cursor-not-allowed text-slate-400'
                              : isActive
                                ? colors.activeBg + ' ' + colors.activeText
                                : 'hover:bg-slate-50 text-slate-700'}
                          `}
                        >
                          {/* Status dot */}
                          <span className={`
                            flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                            ${itemLocked
                              ? 'bg-slate-200'
                              : itemDone
                                ? (isActive ? 'bg-white bg-opacity-30' : colors.dot)
                                : (isActive ? 'bg-white bg-opacity-20' : 'bg-slate-200')}
                          `}>
                            {itemLocked ? (
                              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                              </svg>
                            ) : itemDone ? (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
        <main className="flex-1 flex flex-col overflow-hidden">
          {!selectedItem ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <p className="text-slate-500 font-medium text-sm">
                  Select a training item from the sidebar to begin.
                </p>
              </div>
            </div>
          ) : (() => {
            const selCatIdx = CATEGORIES.indexOf(selectedItem.category)
            const selCatItems = itemsByCategory[selectedItem.category] || []
            const selItemIdx = selCatItems.findIndex((i) => i.id === selectedItem.id)
            const selectedItemLocked = isItemLocked(selCatIdx, selItemIdx, selCatItems)
            const prevItem = selItemIdx > 0 ? selCatItems[selItemIdx - 1] : null
            const hasChallenge = !!selectedItem.codeChallenge
            const hasQuiz = !!selectedItem.quiz
            const needsGate = hasChallenge || hasQuiz
            const showVideo = !selectedItem.quizOnly && !!selectedItem.youtubeUrl

            if (selectedItemLocked) return (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                    <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <h3 className="font-bold text-slate-700 text-lg mb-2">Content Locked</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Complete <span className="font-semibold text-slate-600">"{prevItem?.title}"</span> first to unlock this item.
                  </p>
                </div>
              </div>
            )

            return (
              <div className="flex flex-col h-full overflow-hidden">
                {/* ── Item header + tabs ──────────────────────────────────────── */}
                <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 pt-5 pb-0">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
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
                      <h2 className="text-xl font-bold text-slate-800">{selectedItem.title}</h2>
                      {selectedItem.description && (
                        <p className="mt-1 text-slate-500 text-xs leading-relaxed">{selectedItem.description}</p>
                      )}
                    </div>

                    {/* Mark complete button — hidden when item has a challenge or quiz (must pass those instead) */}
                    {!needsGate && !done && (
                      <button
                        onClick={() => handleMarkComplete()}
                        disabled={marking}
                        className="flex-shrink-0 flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg px-4 py-2 text-xs transition-colors disabled:opacity-50"
                      >
                        {marking ? (
                          <>
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Saving…
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Mark Complete
                          </>
                        )}
                      </button>
                    )}
                    {needsGate && !done && (
                      <div className="flex-shrink-0 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <span className="text-xs font-semibold text-amber-700">
                          {hasQuiz && hasChallenge ? 'Pass the quiz and code challenge to complete' : hasQuiz ? 'Pass the quiz to complete' : 'Pass the code challenge to complete'}
                        </span>
                      </div>
                    )}
                    {done && (
                      <div className="flex-shrink-0 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-semibold text-emerald-700">Done</span>
                      </div>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-0 border-b-0">
                    {showVideo && (
                    <button
                      onClick={() => setActiveTab('video')}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                        activeTab === 'video'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                      </svg>
                      Video
                    </button>
                    )}

                    {hasQuiz && (
                      <button
                        onClick={() => setActiveTab('quiz')}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                          activeTab === 'quiz'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                        Quiz
                        {!done && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                      </button>
                    )}

                    {hasChallenge && (
                      <button
                        onClick={() => setActiveTab('code')}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                          activeTab === 'code'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                        </svg>
                        Code Challenge
                        {!done && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Tab content ─────────────────────────────────────────────── */}
                <div className="flex-1 overflow-hidden">
                  {activeTab === 'video' && showVideo && (
                    <div className="h-full overflow-y-auto thin-scrollbar p-6">
                      <div className="max-w-3xl mx-auto space-y-5">
                        <VideoPlayer url={selectedItem.youtubeUrl} className="w-full aspect-video" />

                        {justMarked && !marking && (
                          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Progress saved!
                          </div>
                        )}

                        {/* Who else completed this */}
                        {usersOnNode.length > 0 && (
                          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
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
                    </div>
                  )}

                  {activeTab === 'quiz' && hasQuiz && (
                    <Quiz
                      quiz={selectedItem.quiz}
                      done={done}
                      onAllPassed={() => handleMarkComplete()}
                    />
                  )}

                  {activeTab === 'code' && hasChallenge && (
                    <CodeChallenge
                      challenge={selectedItem.codeChallenge}
                      done={done}
                      submittedCode={submittedCode}
                      onAllPassed={handleMarkComplete}
                    />
                  )}
                </div>
              </div>
            )
          })()}
        </main>
      </div>
    </div>
  )
}
