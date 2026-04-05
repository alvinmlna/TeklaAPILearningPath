import React from 'react'
import UserAvatar from './UserAvatar'

// ── Zone config ───────────────────────────────────────────────────────────────

const ZONE = {
  'Dasar Pemograman': {
    accent:      'border-indigo-500',
    headerBg:    'bg-indigo-50',
    headerText:  'text-indigo-700',
    badgeBg:     'bg-indigo-100',
    badgeText:   'text-indigo-700',
    nodeFill:    'bg-indigo-600',
    nodeRing:    'ring-indigo-200',
    nodeOutline: 'border-indigo-500',
    nodeText:    'text-indigo-600',
    trackFill:   'bg-indigo-500',
    trackBg:     'bg-indigo-100',
    lineDone:    '#6366f1',
    lineTodo:    '#c7d2fe',
    desc:        'Programming fundamentals',
    label:       'Dasar Pemograman',
  },
  'Foundational': {
    accent:      'border-amber-500',
    headerBg:    'bg-amber-50',
    headerText:  'text-amber-700',
    badgeBg:     'bg-amber-100',
    badgeText:   'text-amber-700',
    nodeFill:    'bg-amber-500',
    nodeRing:    'ring-amber-200',
    nodeOutline: 'border-amber-500',
    nodeText:    'text-amber-600',
    trackFill:   'bg-amber-500',
    trackBg:     'bg-amber-100',
    lineDone:    '#f59e0b',
    lineTodo:    '#fde68a',
    desc:        'Core logic & control flow',
    label:       'Foundational',
  },
  'Tekla API': {
    accent:      'border-emerald-500',
    headerBg:    'bg-emerald-50',
    headerText:  'text-emerald-700',
    badgeBg:     'bg-emerald-100',
    badgeText:   'text-emerald-700',
    nodeFill:    'bg-emerald-600',
    nodeRing:    'ring-emerald-200',
    nodeOutline: 'border-emerald-500',
    nodeText:    'text-emerald-600',
    trackFill:   'bg-emerald-500',
    trackBg:     'bg-emerald-100',
    lineDone:    '#10b981',
    lineTodo:    '#a7f3d0',
    desc:        'Tekla Open API mastery',
    label:       'Tekla API',
  },
}

// ── Zone icons (clean SVG, no emoji) ─────────────────────────────────────────

function IconCode({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  )
}

function IconLayers({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
    </svg>
  )
}

function IconCpu({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
    </svg>
  )
}

function ZoneIcon({ category, className }) {
  if (category === 'Dasar Pemograman') return <IconCode className={className} />
  if (category === 'Foundational')     return <IconLayers className={className} />
  return <IconCpu className={className} />
}

// ── Node connector (horizontal line between nodes) ────────────────────────────

function NodeConnector({ done, locked }) {
  const color = locked ? '#e2e8f0' : done ? '#64748b' : '#cbd5e1'
  return (
    <div className="flex items-center flex-shrink-0" style={{ width: 40, marginTop: -24 }}>
      <svg width="40" height="2" viewBox="0 0 40 2">
        <line x1="0" y1="1" x2="40" y2="1"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={done ? 'none' : '4 3'}
        >
          {(!locked && !done) && (
            <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite"/>
          )}
        </line>
      </svg>
    </div>
  )
}

// ── Checkpoint node ───────────────────────────────────────────────────────────

function CheckpointNode({ item, zone, done, locked, usersOnNode, onClick, stepNumber }) {
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0 w-24">
      {/* Circle */}
      <button
        onClick={onClick}
        disabled={locked}
        title={locked ? 'Complete the previous step first' : item.title}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
          transition-all duration-150 border-2
          ${locked
            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
            : done
              ? `${zone.nodeFill} border-transparent text-white hover:opacity-90 active:scale-95 cursor-pointer`
              : `bg-white ${zone.nodeOutline} ${zone.nodeText} hover:bg-slate-50 active:scale-95 cursor-pointer ring-4 ${zone.nodeRing}`
          }
        `}
      >
        {locked ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        ) : done ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <span>{stepNumber}</span>
        )}
      </button>

      {/* Label */}
      <button
        onClick={locked ? undefined : onClick}
        disabled={locked}
        className={`text-center w-full ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <p className={`text-[11px] leading-snug line-clamp-2 font-medium ${locked ? 'text-slate-400' : 'text-slate-600 hover:text-slate-800'}`}>
          {item.title}
        </p>
      </button>

      {/* Avatars (latest position only) */}
      {!locked && usersOnNode.length > 0 && (
        <div className="flex -space-x-1 mt-0.5">
          {usersOnNode.slice(0, 3).map((u) => (
            <UserAvatar key={u.id} user={u} size="xs" ring tooltip />
          ))}
          {usersOnNode.length > 3 && (
            <div
              className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center flex-shrink-0"
              title={`+${usersOnNode.length - 3} more`}
            >
              <span className="text-[8px] font-bold text-slate-500 leading-none">
                {usersOnNode.length - 3 > 99 ? '99+' : `+${usersOnNode.length - 3}`}
              </span>
            </div>
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
  const zone = ZONE[category] || ZONE['Foundational']

  const completedCount = items.filter((item) =>
    progress.some((p) => p.itemId === item.id && p.userId === currentUser?.id)
  ).length
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0
  const allDone = pct === 100 && items.length > 0

  return (
    <div className={`w-full rounded-xl border-l-4 border border-slate-200 bg-white overflow-hidden ${locked ? 'border-l-slate-300 opacity-60' : zone.accent}`}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-4 px-5 py-4 ${locked ? 'bg-slate-50' : zone.headerBg}`}>
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
          locked ? 'bg-slate-200 border-slate-300 text-slate-400' : `bg-white border-slate-200 ${zone.headerText}`
        }`}>
          {locked
            ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
            : <ZoneIcon category={category} className="w-4 h-4" />
          }
        </div>

        {/* Title + desc */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-sm ${locked ? 'text-slate-400' : 'text-slate-800'}`}>
              {zone.label}
            </h3>
            {allDone && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${zone.badgeBg} ${zone.badgeText}`}>
                COMPLETE
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${locked ? 'text-slate-400' : 'text-slate-500'}`}>
            {locked ? 'Complete the previous level to unlock' : zone.desc}
          </p>
        </div>

        {/* Progress */}
        {!locked && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={`w-20 h-1.5 rounded-full ${zone.trackBg}`}>
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${zone.trackFill}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 w-8 text-right">
              {completedCount}/{items.length}
            </span>
          </div>
        )}
      </div>

      {/* ── Nodes row ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-5 bg-white">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-2">No training items yet.</p>
        ) : (
          <div className="flex items-start justify-start gap-0 overflow-x-auto no-scrollbar px-1 py-2">
            {items.map((item, idx) => {
              const done = progress.some(
                (p) => p.itemId === item.id && p.userId === currentUser?.id
              )
              const prevDone = idx === 0 || progress.some(
                (p) => p.itemId === items[idx - 1].id && p.userId === currentUser?.id
              )
              const itemLocked = locked || (!done && !prevDone)
              const usersHere = users.filter((u) => latestItemsMap[u.id]?.itemId === item.id)
              const isLast = idx === items.length - 1

              return (
                <React.Fragment key={item.id}>
                  <CheckpointNode
                    item={item}
                    zone={zone}
                    done={done}
                    locked={itemLocked}
                    usersOnNode={usersHere}
                    onClick={itemLocked ? undefined : () => onItemClick(item)}
                    stepNumber={idx + 1}
                  />
                  {!isLast && <NodeConnector done={done} locked={itemLocked} />}
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
