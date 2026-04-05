import React from 'react'
import UserAvatar from './UserAvatar'

const ZONE_STYLES = {
  'Dasar Pemograman': {
    headerBg: 'bg-indigo-500',
    headerText: 'text-white',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-200',
    nodeBg: 'bg-indigo-500',
    nodeRing: 'ring-indigo-200',
    connectorColor: '#a5b4fc',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    progressBg: 'bg-indigo-400',
    trackBg: 'bg-indigo-200',
    desc: 'Start your coding journey',
    label: 'Dasar Pemograman',
  },
  'Foundational': {
    headerBg: 'bg-amber-500',
    headerText: 'text-white',
    lightBg: 'bg-amber-50',
    border: 'border-amber-200',
    nodeBg: 'bg-amber-500',
    nodeRing: 'ring-amber-200',
    connectorColor: '#fcd34d',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    progressBg: 'bg-amber-400',
    trackBg: 'bg-amber-200',
    desc: 'Build your logic skills',
    label: 'Foundational',
  },
  'Tekla API': {
    headerBg: 'bg-emerald-500',
    headerText: 'text-white',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    nodeBg: 'bg-emerald-500',
    nodeRing: 'ring-emerald-200',
    connectorColor: '#6ee7b7',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    progressBg: 'bg-emerald-400',
    trackBg: 'bg-emerald-200',
    desc: 'Master the Tekla Open API',
    label: 'Tekla API',
  },
}

// ── Zone SVG Illustrations ────────────────────────────────────────────────────

function IllustrationDasar() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Monitor */}
      <rect x="8" y="10" width="48" height="32" rx="4" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="2"/>
      {/* Screen */}
      <rect x="12" y="14" width="40" height="24" rx="2" fill="white" fillOpacity="0.15"/>
      {/* Code lines */}
      <path d="M18 22 L22 26 L18 30" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26 30 L36 30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 25 L42 25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7"/>
      <path d="M26 22 L38 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7"/>
      {/* Stand */}
      <path d="M28 42 L36 42 L34 50 L30 50 Z" fill="white" fillOpacity="0.25"/>
      <rect x="24" y="50" width="16" height="3" rx="1.5" fill="white" fillOpacity="0.3"/>
    </svg>
  )
}

function IllustrationFoundational() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Three building blocks stacked in pyramid */}
      {/* Bottom row */}
      <rect x="8" y="40" width="20" height="16" rx="3" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.5"/>
      <rect x="36" y="40" width="20" height="16" rx="3" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.5"/>
      {/* Middle */}
      <rect x="18" y="22" width="28" height="16" rx="3" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.5"/>
      {/* Top */}
      <rect x="22" y="8" width="20" height="12" rx="3" fill="white" fillOpacity="0.35" stroke="white" strokeWidth="2"/>
      {/* Shine dots */}
      <circle cx="14" cy="48" r="2" fill="white" fillOpacity="0.5"/>
      <circle cx="50" cy="48" r="2" fill="white" fillOpacity="0.5"/>
      <circle cx="32" cy="28" r="2" fill="white" fillOpacity="0.5"/>
    </svg>
  )
}

function IllustrationTekla() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Large gear */}
      <circle cx="32" cy="32" r="10" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2"/>
      <circle cx="32" cy="32" r="5" fill="white" fillOpacity="0.3"/>
      {/* Gear teeth */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 32 + 10 * Math.cos(rad)
        const y1 = 32 + 10 * Math.sin(rad)
        const x2 = 32 + 15 * Math.cos(rad)
        const y2 = 32 + 15 * Math.sin(rad)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="4" strokeLinecap="round"/>
      })}
      {/* Connection dots */}
      <circle cx="14" cy="18" r="4" fill="white" fillOpacity="0.35" stroke="white" strokeWidth="1.5"/>
      <circle cx="50" cy="18" r="4" fill="white" fillOpacity="0.35" stroke="white" strokeWidth="1.5"/>
      <circle cx="14" cy="46" r="4" fill="white" fillOpacity="0.35" stroke="white" strokeWidth="1.5"/>
      <circle cx="50" cy="46" r="4" fill="white" fillOpacity="0.35" stroke="white" strokeWidth="1.5"/>
      {/* Lines from center to dots */}
      <line x1="22" y1="24" x2="17" y2="20" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
      <line x1="42" y1="24" x2="47" y2="20" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
      <line x1="22" y1="40" x2="17" y2="44" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
      <line x1="42" y1="40" x2="47" y2="44" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
    </svg>
  )
}

function ZoneIllustration({ category }) {
  if (category === 'Dasar Pemograman') return <IllustrationDasar />
  if (category === 'Foundational') return <IllustrationFoundational />
  if (category === 'Tekla API') return <IllustrationTekla />
  return null
}

// ── Node connector (horizontal, within zone) ─────────────────────────────────

function NodeConnector({ color, locked }) {
  return (
    <div className="flex items-center flex-shrink-0 w-8">
      <svg width="32" height="8" viewBox="0 0 32 8" fill="none">
        <line x1="0" y1="4" x2="32" y2="4"
          stroke={locked ? '#cbd5e1' : color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="5 4"
        >
          {!locked && (
            <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="0.8s" repeatCount="indefinite"/>
          )}
        </line>
      </svg>
    </div>
  )
}

// ── Individual checkpoint node ────────────────────────────────────────────────

function CheckpointNode({ item, style, done, usersOnNode, locked, onClick, index }) {
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      {/* Node button */}
      <button
        onClick={onClick}
        disabled={locked}
        title={locked ? 'Complete the previous category to unlock' : item.title}
        className={`
          relative w-14 h-14 rounded-full flex items-center justify-center
          transition-all duration-200
          ${locked
            ? 'bg-slate-200 ring-4 ring-slate-100 cursor-not-allowed'
            : done
              ? style.nodeBg + ' ring-4 ' + style.nodeRing + ' hover:scale-110 active:scale-95 cursor-pointer'
              : 'bg-white ring-4 ' + style.nodeRing + ' border-2 ' + style.border + ' hover:scale-110 active:scale-95 cursor-pointer'
          }
        `}
      >
        {locked ? (
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ) : done ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <>
            <span className="text-xl">⭐</span>
            <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-current" style={{ color: style.connectorColor }} />
          </>
        )}
      </button>

      {/* Label */}
      <button
        onClick={locked ? undefined : onClick}
        disabled={locked}
        className={`max-w-[88px] text-center cursor-pointer group ${locked ? 'cursor-not-allowed' : ''}`}
      >
        <p className={`text-[11px] font-semibold leading-tight line-clamp-2 group-hover:underline ${locked ? 'text-slate-400' : 'text-slate-700'}`}>
          {item.title}
        </p>
      </button>

      {/* User avatars */}
      {!locked && usersOnNode.length > 0 && (
        <div className="flex -space-x-1">
          {usersOnNode.slice(0, 3).map((u) => (
            <UserAvatar key={u.id} user={u} size="xs" ring tooltip />
          ))}
          {usersOnNode.length > 3 && (
            <span className="text-[9px] text-slate-400 ml-1 self-center">+{usersOnNode.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main MapZone ──────────────────────────────────────────────────────────────

export default function MapZone({
  category,
  items,
  progress,
  users,
  currentUser,
  onItemClick,
  locked = false,
  latestItemsMap = {},
}) {
  const style = ZONE_STYLES[category] || ZONE_STYLES['Foundational']

  const completedCount = items.filter((item) =>
    progress.some((p) => p.itemId === item.id && p.userId === currentUser?.id)
  ).length

  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  return (
    <div className={`w-full rounded-3xl overflow-hidden border-2 transition-opacity duration-300 ${locked ? 'border-slate-200 opacity-60' : style.border}`}>

      {/* ── Zone header ───────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-5 px-6 py-5 ${locked ? 'bg-slate-200' : style.headerBg}`}>

        {/* Illustration */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${locked ? 'bg-slate-300' : 'bg-white bg-opacity-20'}`}>
          {locked
            ? <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            : <ZoneIllustration category={category} />
          }
        </div>

        {/* Title & desc */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={`font-bold text-lg leading-none ${locked ? 'text-slate-500' : 'text-white'}`}>
              {style.label}
            </h3>
            {pct === 100 && !locked && <span className="text-lg">🏆</span>}
          </div>
          <p className={`text-sm ${locked ? 'text-slate-400' : 'text-white text-opacity-80'}`}>
            {locked ? 'Complete the previous level to unlock' : style.desc}
          </p>
          {/* Progress bar */}
          {!locked && (
            <div className="mt-3 flex items-center gap-2">
              <div className={`flex-1 h-2 rounded-full ${style.trackBg}`}>
                <div
                  className="h-2 rounded-full bg-white transition-all duration-700"
                  style={{ width: `${pct}%`, opacity: 0.9 }}
                />
              </div>
              <span className="text-white text-xs font-bold opacity-90 w-10 text-right">
                {completedCount}/{items.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Nodes row ─────────────────────────────────────────────────────── */}
      <div className={`px-6 py-6 ${locked ? 'bg-slate-50' : 'bg-white'}`}>
        {items.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-2 italic">No training items yet.</p>
        ) : (
          <div className="flex items-start justify-center gap-0 overflow-x-auto no-scrollbar py-2">
            {items.map((item, idx) => {
              const done = progress.some((p) => p.itemId === item.id && p.userId === currentUser?.id)

              // Sequential lock: item is locked if the category is locked OR
              // the previous item in this zone hasn't been completed yet.
              const prevDone = idx === 0 || progress.some(
                (p) => p.itemId === items[idx - 1].id && p.userId === currentUser?.id
              )
              const itemLocked = locked || (!done && !prevDone)

              // Dashboard: only show a user's avatar if this is their latest completed item
              const usersHere = users.filter(
                (u) => latestItemsMap[u.id]?.itemId === item.id
              )

              const isLast = idx === items.length - 1
              return (
                <React.Fragment key={item.id}>
                  <CheckpointNode
                    item={item}
                    style={style}
                    done={done}
                    usersOnNode={usersHere}
                    locked={itemLocked}
                    onClick={itemLocked ? undefined : () => onItemClick(item)}
                    index={idx}
                  />
                  {!isLast && <NodeConnector color={style.connectorColor} locked={itemLocked} />}
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
