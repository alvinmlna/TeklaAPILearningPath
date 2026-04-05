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
    emoji: '🔧',
    label: 'Tekla API',
  },
}

/**
 * Props:
 *  category      – category name string
 *  items         – training items for this category
 *  progress      – all progress records
 *  users         – all users
 *  currentUser   – currently logged-in user
 *  onItemClick   – (item) => void
 *  locked        – boolean — true if previous category is not fully completed
 */
export default function MapZone({
  category,
  items,
  progress,
  users,
  currentUser,
  onItemClick,
  locked = false,
}) {
  const style = ZONE_STYLES[category] || ZONE_STYLES['Foundational']

  const completedCount = items.filter((item) =>
    progress.some((p) => p.itemId === item.id && p.userId === currentUser?.id)
  ).length

  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  return (
    <div className={`flex flex-col items-center gap-0 select-none min-w-[220px] transition-opacity duration-300 ${locked ? 'opacity-50' : 'opacity-100'}`}>
      {/* Zone header card */}
      <div className={`${locked ? 'bg-slate-100 border-slate-200' : style.lightBg + ' ' + style.border} border-2 rounded-2xl px-5 py-3 text-center w-full mb-4`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          {locked ? (
            <span className="text-xl">🔒</span>
          ) : (
            <span className="text-xl">{style.emoji}</span>
          )}
          <span className={`font-bold text-sm ${locked ? 'text-slate-400' : style.text}`}>
            {style.label}
          </span>
        </div>

        {locked ? (
          <p className="text-xs text-slate-400 mt-1">
            Complete the previous category first
          </p>
        ) : (
          <>
            <div className="w-full bg-white rounded-full h-2 mt-2">
              <div
                className={`${style.bg} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {completedCount}/{items.length} completed
            </p>
          </>
        )}
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
                locked={locked}
                onClick={locked ? undefined : () => onItemClick(item)}
                index={idx}
              />
              {!isLast && (
                <div className="flex flex-col items-center w-8 -my-1 z-0">
                  <svg width="16" height="32" viewBox="0 0 16 32" fill="none">
                    <line
                      x1="8" y1="0" x2="8" y2="32"
                      stroke={locked ? '#cbd5e1' : style.connectorColor}
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
          <div className={`w-0.5 h-4 ${locked ? 'bg-slate-300' : style.bg} opacity-50`} />
          <span className="text-lg">
            {locked ? '🔒' : pct === 100 ? '🏆' : '🏁'}
          </span>
        </div>
      )}
    </div>
  )
}

function CheckpointNode({ item, style, done, usersOnNode, locked, onClick, index }) {
  const offset = index % 2 === 0 ? '' : 'translate-x-8'

  return (
    <div className={`relative flex items-center gap-3 z-10 ${offset} transition-transform duration-200`}>
      {/* Node button */}
      <button
        onClick={onClick}
        disabled={locked}
        className={`
          relative w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-xs
          transition-all duration-200
          ${locked
            ? 'bg-slate-200 ring-4 ring-slate-100 cursor-not-allowed'
            : done
              ? style.nodeBg + ' ring-4 ' + style.nodeRing + ' hover:scale-110 active:scale-95 cursor-pointer'
              : 'bg-slate-300 ring-4 ring-slate-100 hover:scale-110 active:scale-95 cursor-pointer'
          }
        `}
        title={locked ? 'Complete the previous category to unlock' : item.title}
      >
        {locked ? (
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ) : done ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <>
            <span className="text-lg">⭐</span>
            <span className="absolute inset-0 rounded-full animate-ping bg-slate-200 opacity-50" />
          </>
        )}
      </button>

      {/* Label card */}
      <div
        onClick={locked ? undefined : onClick}
        className={`
          ${locked ? 'bg-slate-100 border-slate-200' : style.lightBg + ' ' + style.border}
          border rounded-xl px-3 py-2 max-w-[130px]
          ${locked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105 transition-transform duration-150'}
        `}
      >
        <p className={`text-xs font-semibold leading-tight line-clamp-2 ${locked ? 'text-slate-400' : 'text-slate-700'}`}>
          {item.title}
        </p>
        {!locked && usersOnNode.length > 0 && (
          <div className="flex -space-x-1 mt-1.5">
            {usersOnNode.slice(0, 4).map((u) => (
              <UserAvatar key={u.id} user={u} size="xs" ring tooltip />
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
