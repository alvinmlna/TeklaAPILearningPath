import React from 'react'

const COLORS = [
  'bg-indigo-400',
  'bg-amber-400',
  'bg-emerald-400',
  'bg-rose-400',
  'bg-sky-400',
  'bg-violet-400',
  'bg-orange-400',
  'bg-teal-400',
]

function colorForUser(userId) {
  let hash = 0
  for (let i = 0; i < (userId || '').length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

/**
 * Circular user avatar.
 * Shows photo if available, otherwise initials on a colored background.
 *
 * Props:
 *  user        – user object { id, name, photo }
 *  size        – 'xs' | 'sm' | 'md' | 'lg' | 'xl'  (default 'md')
 *  className   – extra classes
 *  ring        – show white ring (default false)
 *  tooltip     – show name on hover (default false)
 */
export default function UserAvatar({
  user,
  size = 'md',
  className = '',
  ring = false,
  tooltip = false,
}) {
  const sizeClasses = {
    xs: 'w-5 h-5 text-[8px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }[size] || 'w-9 h-9 text-sm'

  const ringClass = ring ? 'ring-2 ring-white ring-offset-1' : ''
  const bg = colorForUser(user?.id)
  const initials = (user?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className={`relative inline-flex flex-shrink-0 items-center justify-center rounded-full overflow-hidden ${sizeClasses} ${bg} ${ringClass} ${className}`}
      title={tooltip ? user?.name : undefined}
    >
      {user?.photo ? (
        <img
          src={user.photo}
          alt={user.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <span className="font-bold text-white select-none">{initials}</span>
      )}
    </div>
  )
}
