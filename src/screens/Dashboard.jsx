import React, { useState, useEffect, useCallback, useMemo } from 'react'
import MapZone from '../components/MapZone'
import UserAvatar from '../components/UserAvatar'
import { getLatestItemPerUser } from '../lib/storage'

const CATEGORIES = ['Dasar Pemograman', 'Foundational', 'Tekla API']

// ── Vertical connector between zones ─────────────────────────────────────────

function VerticalConnector({ locked }) {
  return (
    <div className="flex flex-col items-center py-1 select-none">
      <svg width="24" height="56" viewBox="0 0 24 56" fill="none">
        <line x1="12" y1="0" x2="12" y2="56"
          stroke={locked ? '#cbd5e1' : '#6366f1'}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="5 5"
        >
          {!locked && (
            <animate
              attributeName="stroke-dashoffset"
              from="0" to="20"
              dur="0.9s"
              repeatCount="indefinite"
            />
          )}
        </line>
      </svg>
      {/* Arrow chevron */}
      <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
        <path
          d="M4 2 L10 10 L16 2"
          stroke={locked ? '#cbd5e1' : '#6366f1'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// ── Side decorations ──────────────────────────────────────────────────────────

function SideDecor({ side }) {
  return (
    <div className={`hidden xl:flex flex-col gap-8 pt-12 px-4 select-none pointer-events-none ${side === 'right' ? 'items-start' : 'items-end'}`}>
      <span className="text-3xl animate-float opacity-70">☁️</span>
      <span className="text-2xl opacity-50">🌳</span>
      <span className="text-xl opacity-60 animate-float" style={{ animationDelay: '1s' }}>⭐</span>
      <span className="text-2xl opacity-40">🌲</span>
      <span className="text-3xl animate-float opacity-50" style={{ animationDelay: '0.5s' }}>☁️</span>
      <span className="text-xl opacity-60">🌳</span>
      <span className="text-2xl opacity-40">⛰️</span>
    </div>
  )
}

// ── Start banner ──────────────────────────────────────────────────────────────

function StartBanner({ name }) {
  return (
    <div className="flex flex-col items-center gap-3 mb-2">
      {/* Flag post */}
      <div className="flex items-end gap-3">
        <span className="text-3xl">🚩</span>
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white bg-opacity-90 rounded-2xl px-5 py-2.5 border-2 border-indigo-100">
            <span className="text-xl">🗺️</span>
            <div className="text-left">
              <p className="font-bold text-slate-800 text-sm leading-none">Learning Map</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Hey <span className="font-semibold text-indigo-600">{name}</span>, let's go! 🚀
              </p>
            </div>
          </div>
        </div>
        <span className="text-3xl">🚩</span>
      </div>
      {/* Down arrow hint */}
      <div className="flex flex-col items-center gap-0.5 opacity-40">
        <span className="text-xs text-slate-500 font-medium">scroll to advance</span>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M3 2 L8 8 L13 2" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}

// ── Finish banner ─────────────────────────────────────────────────────────────

function FinishBanner({ complete }) {
  return (
    <div className="flex flex-col items-center gap-2 mt-2 pb-2">
      <div className={`inline-flex items-center gap-3 rounded-2xl px-6 py-3 border-2 ${
        complete ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
      }`}>
        <span className="text-2xl">{complete ? '🏆' : '🏁'}</span>
        <div>
          <p className={`font-bold text-sm ${complete ? 'text-amber-700' : 'text-slate-500'}`}>
            {complete ? 'All levels complete!' : 'Finish Line'}
          </p>
          <p className={`text-xs ${complete ? 'text-amber-500' : 'text-slate-400'}`}>
            {complete ? 'Congratulations! You are a Tekla API expert. 🎉' : 'Complete all levels to reach here.'}
          </p>
        </div>
        {complete && <span className="text-2xl animate-bounce-slow">🎊</span>}
      </div>
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
  const [showLegend, setShowLegend] = useState(true)

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

  // Each user's most recently completed item → shown as their map position
  const latestItemsMap = useMemo(() => getLatestItemPerUser(progress), [progress])

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

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b-2 border-slate-100 z-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
            <span className="text-lg">🎓</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm leading-none">Training Tracker</h1>
            <p className="text-slate-400 text-xs mt-0.5">Tekla API Learning Path</p>
          </div>
        </div>

        {/* Progress pill */}
        <div className="hidden md:flex items-center gap-3 bg-indigo-50 rounded-2xl px-4 py-2">
          <div className="w-24 bg-slate-200 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${myPct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-indigo-600">
            {myCompleted}/{totalItems}
          </span>
          {allDone && <span className="text-base">🏆</span>}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLegend((v) => !v)}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            title="Toggle trainees panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={onOpenAdmin}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            title="Admin panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <UserAvatar user={currentUser} size="md" ring />
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Map canvas (vertical scroll) ──────────────────────────────────── */}
        <div className="flex-1 map-bg overflow-y-auto thin-scrollbar">
          <div className="flex min-h-full">

            {/* Left decor */}
            <SideDecor side="left" />

            {/* Map content column */}
            <div className="flex-1 flex flex-col items-center px-4 py-8 max-w-2xl mx-auto w-full">

              <StartBanner name={currentUser?.name} />

              {CATEGORIES.map((cat, idx) => {
                const locked = isCategoryLocked(idx)
                const nextLocked = isCategoryLocked(idx + 1)
                return (
                  <React.Fragment key={cat}>
                    {/* Level badge */}
                    <div className="flex items-center gap-2 mb-3 mt-1">
                      <div className="h-px w-8 bg-slate-300" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Level {idx + 1}
                      </span>
                      <div className="h-px w-8 bg-slate-300" />
                    </div>

                    <div className="w-full">
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
                    </div>

                    {idx < CATEGORIES.length - 1 && (
                      <VerticalConnector locked={nextLocked} />
                    )}
                  </React.Fragment>
                )
              })}

              <FinishBanner complete={allDone} />
            </div>

            {/* Right decor */}
            <SideDecor side="right" />
          </div>
        </div>

        {/* ── Right sidebar: trainees ───────────────────────────────────────── */}
        {showLegend && (
          <aside className="w-52 flex-shrink-0 bg-white border-l-2 border-slate-100 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <span className="text-base">👥</span>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trainees</p>
            </div>
            <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-2">
              {users.length === 0 ? (
                <p className="text-xs text-slate-400 text-center pt-4">No users yet</p>
              ) : (
                users.map((u) => {
                  const done = progress.filter((p) => p.userId === u.id).length
                  const pct = totalItems > 0 ? Math.round((done / totalItems) * 100) : 0
                  const isMe = u.id === currentUser?.id

                  // Which level is this user on?
                  let levelLabel = ''
                  for (let i = CATEGORIES.length - 1; i >= 0; i--) {
                    const catItems = trainingItems.filter((t) => t.category === CATEGORIES[i])
                    const catDone = catItems.filter((t) =>
                      progress.some((p) => p.itemId === t.id && p.userId === u.id)
                    ).length
                    if (catDone > 0) { levelLabel = `Lvl ${i + 1}`; break }
                  }
                  if (!levelLabel && done === 0) levelLabel = 'Lvl 1'

                  return (
                    <div
                      key={u.id}
                      className={`flex items-center gap-2 rounded-xl p-2 ${isMe ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'}`}
                    >
                      <UserAvatar user={u} size="sm" ring={isMe} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {u.name}
                            {isMe && <span className="text-indigo-400 ml-1 font-normal">(you)</span>}
                          </p>
                          <span className="text-[9px] text-slate-400 font-medium flex-shrink-0">{levelLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                            <div
                              className="bg-indigo-400 h-1.5 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Data path footer */}
            {dataPath && (
              <div className="px-3 py-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 leading-tight break-all" title={dataPath}>
                  📂 {dataPath.length > 38 ? '…' + dataPath.slice(-36) : dataPath}
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
