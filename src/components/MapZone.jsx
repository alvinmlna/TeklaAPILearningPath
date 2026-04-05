import React from 'react'
import UserAvatar from './UserAvatar'
import { getUsersOnNode } from '../lib/storage'

const ZONE_STYLES = {
  'Dasar Pemograman': {
    bg: 'bg-indigo-500',
    lightBg: 'bg-indigo-100',
    border: 'border-indigo-300',
    text: 'text-indigo-600',
    nodeBg: 'bg-indigo-500',
    nodeRing: 'ring-indigo-200',
    connectorColor: '#a5b4fc',
    island: 'bg-indigo-200',
    emoji: '💻',
    label: 'Dasar Pemograman',
  },
  'Foundational': {
    bg: 'bg-amber-500',
    lightBg: 'bg-amber-100',
    border: 'border-amber-300',
    text: 'text-amber-600',
    nodeBg: 'bg-amber-500',
    nodeRing: 'ring-amber-200',
    connectorColor: '#fcd34d',
    island: 'bg-amber-200',
    emoji: '🧱',
    label: 'Foundational',
  },
  'Tekla API': {
    bg: 'bg-emerald-500',
    lightBg: 'bg-emerald-100',
    border: 'border-emerald-300',
    text: 'text-emerald-600',
    nodeBg: 'bg-emerald-500',
    nodeRing: 'ring-emerald-200',
    connectorColor: '#6ee7b7',
    island: 'bg-emerald-200',
    emoji: '🔧',
    label: 'Tekla API',
  },
}

/**
 * A single zone (island) on the dashboard map.
 *
 * Props:
 *  category      – category name string
 *  items         – training items for this category
 *  progress      – all progress records
 *  users         – all users
 *  currentUser   – currently logged-in user
 *  onItemClick   – (item) => void
 */
export default function MapZone({
  category,
  items,
  progress,
  users,
  currentUser,
  onItemClick,
}) {
  const style = ZONE_STYLES[category] || ZONE_STYLES['Foundational']

  const completedCount = items.filter((item) =>
    progress.some((p) => p.itemId === item.id && p.userId === currentUser?.id)
  ).length

  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  return (
    <div className="flex flex-col items-center gap-0 select-none min-w-[220px]">
      {/* Zone header card */}
      <div className={`${style.lightBg} ${style.border} border-2 rounded-2xl px-5 py-3 text-center w-full mb-4`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-xl">{style.emoji}</span>
          <span className={`font-bold text-sm ${style.text}`}>{style.label}</span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-white rounded-full h-2 mt-2">
          <div
            className={`${style.bg} h-2 rounded-full transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {completedCount}/{items.length} completed
        </p>
      </div>

      {/* Checkpoint nodes */}
      <div className="flex flex-col items-center gap-0 w-full">
        {items.map((item, idx) => {
          const usersOnNode = getUsersOnNode(progress, users, item.id)
          const currentUserDone = progress.some(
            (p) => p.itemId === item.id && p.userId === currentUser?.id
          )
          const isLast = idx === items.length - 1

          return (
            <React.Fragment key={item.id}>
              <CheckpointNode
                item={item}
                style={style}
                done={currentUserDone}
                usersOnNode={usersOnNode}
                currentUser={currentUser}
                onClick={() => onItemClick(item)}
                index={idx}
              />
              {/* Connector path */}
              {!isLast && (
                <div className="flex flex-col items-center w-8 -my-1 z-0">
                  <svg width="16" height="32" viewBox="0 0 16 32" fill="none">
                    <line
                      x1="8" y1="0" x2="8" y2="32"
                      stroke={style.connectorColor}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="4 4"
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Finish flag */}
      {items.length > 0 && (
        <div className="mt-3 flex flex-col items-center gap-1">
          <div className={`w-0.5 h-4 ${style.bg} opacity-50`} />
          <span className="text-lg">{pct === 100 ? '🏆' : '🏁'}</span>
        </div>
      )}
    </div>
  )
}

function CheckpointNode({ item, style, done, usersOnNode, currentUser, onClick, index }) {
  // Alternate left/right for a path-like feel
  const offset = index % 2 === 0 ? '' : 'translate-x-8'

  return (
    <div className={`relative flex items-center gap-3 z-10 ${offset} transition-transform duration-200`}>
      {/* Node button */}
      <button
        onClick={onClick}
        className={`
          relative w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-xs
          transition-all duration-200 active:scale-95
          ${done ? style.nodeBg + ' ring-4 ' + style.nodeRing : 'bg-slate-300 ring-4 ring-slate-100'}
          hover:scale-110 cursor-pointer
        `}
        title={item.title}
      >
        {done ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="text-lg">⭐</span>
        )}

        {/* Pulse ring for active/incomplete */}
        {!done && (
          <span className="absolute inset-0 rounded-full animate-ping bg-slate-200 opacity-50" />
        )}
      </button>

      {/* Label card */}
      <div
        className={`
          ${style.lightBg} ${style.border} border rounded-xl px-3 py-2 cursor-pointer
          hover:scale-105 transition-transform duration-150 max-w-[130px]
        `}
        onClick={onClick}
      >
        <p className="text-xs font-semibold text-slate-700 leading-tight line-clamp-2">
          {item.title}
        </p>
        {/* User avatars on this node */}
        {usersOnNode.length > 0 && (
          <div className="flex -space-x-1 mt-1.5">
            {usersOnNode.slice(0, 4).map((u) => (
              <UserAvatar
                key={u.id}
                user={u}
                size="xs"
                ring
                tooltip
              />
            ))}
            {usersOnNode.length > 4 && (
              <span className="text-[9px] text-slate-500 ml-1 self-center">
                +{usersOnNode.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
