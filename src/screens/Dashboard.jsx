import React, { useState, useEffect, useCallback, useMemo } from 'react'
import MapZone from '../components/MapZone'
import UserAvatar from '../components/UserAvatar'
import { getLatestItemPerUser } from '../lib/storage'

const CATEGORIES = ['Programming Fundamental', 'Visual Studio', 'Windows Form', 'Tekla Open API', 'Intermediate']

// ── Vertical connector between levels ─────────────────────────────────────────

function LevelConnector({ locked }) {
  return (
    <div className="flex flex-col items-center py-1 select-none">
      <svg width="2" height="40" viewBox="0 0 2 40">
        <line x1="1" y1="0" x2="1" y2="40"
          stroke={locked ? '#e2e8f0' : '#94a3b8'}
          strokeWidth="2"
          strokeDasharray="4 3"
        >
          {!locked && (
            <animate attributeName="stroke-dashoffset" from="0" to="14" dur="1s" repeatCount="indefinite" />
          )}
        </line>
      </svg>
      {/* Arrow */}
      <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
        <path d="M1 1l5 5 5-5"
          stroke={locked ? '#cbd5e1' : '#94a3b8'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({
  currentUser,
  data,
  onOpenTraining,
  onOpenAdmin,
  onRefresh,
}) {
  const [dataPath, setDataPath] = useState('')
  const [showPanel, setShowPanel] = useState(true)

  useEffect(() => {
    if (window.electronAPI?.getDataPath) {
      window.electronAPI.getDataPath().then(setDataPath).catch(() => {})
    }
  }, [])

  const { users = [], progress = [], trainingItems = [] } = data || {}

  const totalItems = trainingItems.length
  const myCompleted = progress.filter((p) => p.userId === currentUser?.id).length
  const myPct = totalItems > 0 ? Math.round((myCompleted / totalItems) * 100) : 0
  const allDone = myPct === 100 && totalItems > 0

  const itemsByCategory = useCallback(
    (cat) => trainingItems.filter((i) => i.category === cat),
    [trainingItems]
  )

  const isCategoryLocked = useCallback(
    (idx) => {
      if (idx === 0) return false
      const prevCat = CATEGORIES[idx - 1]
      const prevItems = trainingItems.filter((i) => i.category === prevCat)
      if (prevItems.length === 0) return false
      return !prevItems.every((item) =>
        progress.some((p) => p.itemId === item.id && p.userId === currentUser?.id)
      )
    },
    [trainingItems, progress, currentUser]
  )

  const latestItemsMap = useMemo(() => getLatestItemPerUser(progress), [progress])

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 z-10">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-slate-800 text-sm leading-none">Training Tracker</h1>
            <p className="text-slate-400 text-xs mt-0.5">Tekla API Learning Path</p>
          </div>
        </div>

        {/* Overall progress */}
        <div className="hidden md:flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Overall Progress</p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">{myCompleted} of {totalItems} completed</p>
          </div>
          <div className="w-24 bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${myPct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-indigo-600 w-8">{myPct}%</span>
          {allDone && (
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
            </svg>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPanel((v) => !v)}
            className={`p-2 rounded-lg transition-colors ${showPanel ? 'bg-slate-100 text-slate-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
            title="Toggle team panel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </button>
          <button
            onClick={onOpenAdmin}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Admin panel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <UserAvatar user={currentUser} size="sm" ring />
          <div className="ml-1">
            <p className="text-xs font-semibold text-slate-700 leading-none">{currentUser?.name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{currentUser?.windowsAccount}</p>
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Map (vertical scroll) ────────────────────────────────────────── */}
        <div className="flex-1 map-bg overflow-y-auto thin-scrollbar">
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-0">

            {/* Page header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                <h2 className="text-base font-bold text-slate-800">Learning Path</h2>
              </div>
              <p className="text-sm text-slate-500 pl-3">
                Complete each level in order to unlock the next.
              </p>
            </div>

            {CATEGORIES.map((cat, idx) => {
              const locked = isCategoryLocked(idx)
              const nextLocked = isCategoryLocked(idx + 1)
              return (
                <React.Fragment key={cat}>
                  {/* Level label */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                      locked ? 'bg-slate-200 text-slate-400' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      Level {idx + 1}
                    </span>
                    {locked && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                        </svg>
                        Locked
                      </span>
                    )}
                  </div>

                  <MapZone
                    category={cat}
                    items={itemsByCategory(cat)}
                    progress={progress}
                    users={users}
                    currentUser={currentUser}
                    onItemClick={onOpenTraining}
                    locked={locked}
                    latestItemsMap={latestItemsMap}
                  />

                  {idx < CATEGORIES.length - 1 && (
                    <div className="my-1">
                      <LevelConnector locked={nextLocked} />
                    </div>
                  )}
                </React.Fragment>
              )
            })}

            {/* Finish milestone */}
            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-300" />
              <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                allDone
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                {allDone ? (
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"/>
                  </svg>
                )}
                {allDone ? 'All levels complete' : 'Finish line'}
              </div>
              <div className="flex-1 h-px bg-slate-300" />
            </div>

          </div>
        </div>

        {/* ── Team panel ───────────────────────────────────────────────────── */}
        {showPanel && (
          <aside className="w-56 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Progress</p>
            </div>

            <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-1">
              {users.length === 0 ? (
                <p className="text-xs text-slate-400 text-center pt-4">No trainees yet</p>
              ) : (
                users.map((u) => {
                  const done = progress.filter((p) => p.userId === u.id).length
                  const pct = totalItems > 0 ? Math.round((done / totalItems) * 100) : 0
                  const isMe = u.id === currentUser?.id

                  // Current level label
                  let currentLevel = 1
                  for (let i = CATEGORIES.length - 1; i >= 0; i--) {
                    const catItems = trainingItems.filter((t) => t.category === CATEGORIES[i])
                    const catDone = catItems.filter((t) =>
                      progress.some((p) => p.itemId === t.id && p.userId === u.id)
                    ).length
                    if (catDone > 0) { currentLevel = i + 1; break }
                  }

                  return (
                    <div
                      key={u.id}
                      className={`flex items-center gap-2.5 rounded-lg p-2 ${isMe ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50'}`}
                    >
                      <UserAvatar user={u} size="sm" ring={isMe} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {u.name}
                          </p>
                          <span className="text-[9px] text-slate-400 font-medium ml-1 flex-shrink-0">
                            L{currentLevel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 bg-slate-100 rounded-full h-1">
                            <div
                              className="bg-indigo-400 h-1 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-400 w-6 text-right">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {dataPath && (
              <div className="px-3 py-2.5 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium mb-0.5">Data file</p>
                <p className="text-[10px] text-slate-300 leading-tight break-all" title={dataPath}>
                  {dataPath.length > 36 ? '…' + dataPath.slice(-34) : dataPath}
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
