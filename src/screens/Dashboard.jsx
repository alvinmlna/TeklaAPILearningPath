import React, { useState, useEffect, useCallback } from 'react'
import MapZone from '../components/MapZone'
import UserAvatar from '../components/UserAvatar'

const CATEGORIES = ['Dasar Pemograman', 'Foundational', 'Tekla API']

const CATEGORY_META = {
  'Dasar Pemograman': { color: 'indigo', emoji: '💻', desc: 'Programming basics' },
  'Foundational': { color: 'amber', emoji: '🧱', desc: 'Core logic' },
  'Tekla API': { color: 'emerald', emoji: '🔧', desc: 'API mastery' },
}

// Decorative SVG map elements
function MapDecoration({ type, className = '' }) {
  if (type === 'tree')
    return <span className={`text-2xl select-none pointer-events-none ${className}`}>🌳</span>
  if (type === 'tree-small')
    return <span className={`text-lg select-none pointer-events-none ${className}`}>🌲</span>
  if (type === 'star')
    return <span className={`text-xl select-none pointer-events-none ${className}`}>⭐</span>
  if (type === 'cloud')
    return <span className={`text-3xl select-none pointer-events-none ${className}`}>☁️</span>
  if (type === 'flag')
    return <span className={`text-xl select-none pointer-events-none ${className}`}>🚩</span>
  if (type === 'mountain')
    return <span className={`text-2xl select-none pointer-events-none ${className}`}>⛰️</span>
  return null
}

// Horizontal SVG connector between zones
function ZoneConnector({ color }) {
  return (
    <div className="flex items-center self-start mt-20 px-2 flex-shrink-0">
      <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
        <path
          d="M0 12 Q30 4 60 12"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="6 5"
          fill="none"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-22"
            dur="1.2s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
    </div>
  )
}

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

  const itemsByCategory = useCallback(
    (cat) => trainingItems.filter((i) => i.category === cat),
    [trainingItems]
  )

  // A category is locked if the user hasn't completed every item in the previous category.
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
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b-2 border-slate-100">
        {/* Logo / title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
            <span className="text-lg">🎓</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm leading-none">Training Tracker</h1>
            <p className="text-slate-400 text-xs mt-0.5">Tekla API Learning Path</p>
          </div>
        </div>

        {/* My progress pill */}
        <div className="hidden md:flex items-center gap-3 bg-indigo-50 rounded-2xl px-4 py-2">
          <div className="w-20 bg-slate-200 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${myPct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-indigo-600">
            {myCompleted}/{totalItems} done
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLegend((v) => !v)}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            title="Toggle user legend"
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

      {/* ── Main map area ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map canvas */}
        <div className="flex-1 map-bg overflow-auto thin-scrollbar relative">
          {/* Floating decorations */}
          <MapDecoration type="cloud" className="absolute top-4 left-16 animate-float opacity-70" />
          <MapDecoration type="cloud" className="absolute top-8 right-32 animate-float opacity-60" style={{ animationDelay: '1.2s' }} />
          <MapDecoration type="tree" className="absolute bottom-8 left-8" />
          <MapDecoration type="tree-small" className="absolute bottom-12 left-20" />
          <MapDecoration type="tree" className="absolute bottom-8 right-10" />
          <MapDecoration type="tree-small" className="absolute bottom-16 right-24" />
          <MapDecoration type="mountain" className="absolute top-16 left-1/2 -translate-x-1/2 opacity-20 text-6xl" />

          {/* Title banner */}
          <div className="text-center pt-8 pb-4 relative z-10">
            <div className="inline-flex items-center gap-2 bg-white bg-opacity-80 rounded-2xl px-6 py-3 border-2 border-indigo-100">
              <span className="text-2xl">🗺️</span>
              <div className="text-left">
                <p className="font-bold text-slate-800 text-base leading-none">Learning Map</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Hello, <span className="font-semibold text-indigo-600">{currentUser?.name}</span>! Keep exploring.
                </p>
              </div>
              {myPct === 100 && (
                <span className="text-2xl ml-2 animate-bounce-slow">🏆</span>
              )}
            </div>
          </div>

          {/* Zones row */}
          <div className="flex items-start justify-center gap-0 px-8 pb-16 pt-4 min-w-max mx-auto relative z-10">
            {CATEGORIES.map((cat, idx) => {
              const locked = isCategoryLocked(idx)
              return (
                <React.Fragment key={cat}>
                  <div className="flex flex-col items-center">
                    <MapZone
                      category={cat}
                      items={itemsByCategory(cat)}
                      progress={progress}
                      users={users}
                      currentUser={currentUser}
                      onItemClick={onOpenTraining}
                      locked={locked}
                    />
                  </div>
                  {idx < CATEGORIES.length - 1 && (
                    <ZoneConnector color={idx === 0 ? '#a5b4fc' : '#fcd34d'} />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* ── Right sidebar: legend ──────────────────────────────────────────── */}
        {showLegend && (
          <aside className="w-52 flex-shrink-0 bg-white border-l-2 border-slate-100 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                All Trainees
              </p>
            </div>
            <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-2">
              {users.length === 0 ? (
                <p className="text-xs text-slate-400 text-center pt-4">No users yet</p>
              ) : (
                users.map((u) => {
                  const done = progress.filter((p) => p.userId === u.id).length
                  const pct = totalItems > 0 ? Math.round((done / totalItems) * 100) : 0
                  const isMe = u.id === currentUser?.id
                  return (
                    <div
                      key={u.id}
                      className={`flex items-center gap-2 rounded-xl p-2 ${isMe ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'}`}
                    >
                      <UserAvatar user={u} size="sm" ring={isMe} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {u.name}
                          {isMe && <span className="text-indigo-400 ml-1">(you)</span>}
                        </p>
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
                  📂 {dataPath.length > 40 ? '…' + dataPath.slice(-38) : dataPath}
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
