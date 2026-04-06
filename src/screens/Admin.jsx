import React, { useState, useMemo } from 'react'
import { addTrainingItem, deleteTrainingItem, saveItemQuiz, saveTrainingItemMeta, resetTrainingItems, setUserProgress, getSettings, setDataPath, browseForFolder, browseForPdf, browseForVideo } from '../lib/storage'

const CATEGORIES = ['Programming Fundamental', 'Visual Studio', 'Windows Form', 'Tekla Open API', 'Intermediate']
const PIN = '1873'
const MAX_ATTEMPTS = 3
const LOCK_DURATION_MS = 1 * 60 * 60 * 1000 // 1 hour
const LOCK_KEY = 'admin_lock'

function getLockState() {
  try {
    const raw = localStorage.getItem(LOCK_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function setLockState(state) {
  localStorage.setItem(LOCK_KEY, JSON.stringify(state))
}

function clearLockState() {
  localStorage.removeItem(LOCK_KEY)
}

function isCurrentlyLocked() {
  const lock = getLockState()
  if (!lock) return false
  if (lock.attempts < MAX_ATTEMPTS) return false
  const elapsed = Date.now() - lock.lockedAt
  if (elapsed >= LOCK_DURATION_MS) {
    clearLockState()
    return false
  }
  return true
}

function getLockRemainingMs() {
  const lock = getLockState()
  if (!lock || !lock.lockedAt) return 0
  return Math.max(0, LOCK_DURATION_MS - (Date.now() - lock.lockedAt))
}

function recordFailedAttempt() {
  const lock = getLockState() || { attempts: 0, lockedAt: null }
  lock.attempts += 1
  if (lock.attempts >= MAX_ATTEMPTS) lock.lockedAt = Date.now()
  setLockState(lock)
}

function resetAttempts() {
  clearLockState()
}

const CATEGORY_COLORS = {
  'Programming Fundamental': {
    badge: 'bg-indigo-100 text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-400',
    light: 'bg-indigo-50',
  },
  'Visual Studio': {
    badge: 'bg-violet-100 text-violet-700',
    border: 'border-violet-200',
    dot: 'bg-violet-400',
    light: 'bg-violet-50',
  },
  'Windows Form': {
    badge: 'bg-sky-100 text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-400',
    light: 'bg-sky-50',
  },
  'Tekla Open API': {
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-400',
    light: 'bg-emerald-50',
  },
  'Intermediate': {
    badge: 'bg-orange-100 text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-400',
    light: 'bg-orange-50',
  },
}

// ─── Countdown display ────────────────────────────────────────────────────────
function useCountdown(targetMs) {
  const [remaining, setRemaining] = useState(targetMs)
  React.useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => {
      const r = getLockRemainingMs()
      setRemaining(r)
      if (r <= 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [])
  const h = Math.floor(remaining / 3600000)
  const m = Math.floor((remaining % 3600000) / 60000)
  const s = Math.floor((remaining % 60000) / 1000)
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

// ─── Locked screen ────────────────────────────────────────────────────────────
function LockedScreen({ onBack, onUnlocked }) {
  const countdown = useCountdown(getLockRemainingMs())

  React.useEffect(() => {
    if (getLockRemainingMs() <= 0) {
      resetAttempts()
      onUnlocked()
    }
  })

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-3xl p-10 w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Admin Locked</h2>
        <p className="text-slate-400 text-sm mb-2">Too many incorrect attempts.</p>
        <p className="text-rose-500 font-semibold text-sm mb-6">Try again in {countdown}</p>
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
          ← Back
        </button>
      </div>
    </div>
  )
}

// ─── PIN gate ─────────────────────────────────────────────────────────────────
function PinGate({ onUnlock, onBack }) {
  const [locked, setLocked] = useState(isCurrentlyLocked)
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const [attemptsLeft, setAttemptsLeft] = useState(() => {
    const s = getLockState()
    return MAX_ATTEMPTS - (s?.attempts || 0)
  })
  const refs = [React.createRef(), React.createRef(), React.createRef(), React.createRef()]

  if (locked) {
    return (
      <LockedScreen
        onBack={onBack}
        onUnlocked={() => { setLocked(false); setAttemptsLeft(MAX_ATTEMPTS) }}
      />
    )
  }

  const handleDigit = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[idx] = val
    setDigits(next)
    setError(false)

    if (val && idx < 3) refs[idx + 1].current?.focus()

    const pin = next.join('')
    if (pin.length === 4) {
      if (pin === PIN) {
        resetAttempts()
        onUnlock()
      } else {
        recordFailedAttempt()
        const nowLocked = isCurrentlyLocked()
        const s = getLockState()
        const left = MAX_ATTEMPTS - (s?.attempts || 0)
        setAttemptsLeft(Math.max(0, left))
        setError(true)
        setShake(true)
        setTimeout(() => {
          setDigits(['', '', '', ''])
          setShake(false)
          if (nowLocked) setLocked(true)
          else refs[0].current?.focus()
        }, 600)
      }
    }
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs[idx - 1].current?.focus()
  }

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-3xl p-10 w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Admin Access</h2>
        <p className="text-slate-400 text-sm mb-8">Enter the 4-digit PIN to continue.</p>
        <div className={`flex justify-center gap-3 mb-6 ${shake ? 'animate-bounce' : ''}`}>
          {digits.map((d, i) => (
            <input
              key={i} ref={refs[i]} type="password" inputMode="numeric" maxLength={1}
              value={d} onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)} autoFocus={i === 0}
              className={`w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-colors
                ${error ? 'border-rose-400 bg-rose-50 text-rose-600'
                  : d ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700'} focus:border-indigo-400`}
            />
          ))}
        </div>
        {error && (
          <p className="text-rose-500 text-sm font-medium mb-4">
            Incorrect PIN.{attemptsLeft > 0 ? ` ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining.` : ''}
          </p>
        )}
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
          ← Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Quiz Editor ──────────────────────────────────────────────────────────────
function emptyQuestion() {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  }
}

function QuestionEditor({ q, idx, onChange, onDelete }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Question {idx + 1}</span>
        <button onClick={onDelete} className="p-1 text-slate-300 hover:text-rose-400 rounded transition-colors" title="Delete question">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <textarea
        value={q.question}
        onChange={(e) => onChange({ ...q, question: e.target.value })}
        placeholder="Question text…"
        rows={2}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
      />

      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Options — select the correct answer</p>
        {q.options.map((opt, oi) => (
          <div key={oi} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${q.correctIndex === oi ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={() => onChange({ ...q, correctIndex: oi })}
              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${
                q.correctIndex === oi ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-emerald-400'
              }`}
            >
              {q.correctIndex === oi && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
            <span className="text-[11px] font-bold text-slate-400 w-4">{String.fromCharCode(65 + oi)}</span>
            <input
              type="text"
              value={opt}
              onChange={(e) => {
                const opts = [...q.options]
                opts[oi] = e.target.value
                onChange({ ...q, options: opts })
              }}
              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
              className="flex-1 text-sm bg-transparent outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function QuizEditor({ item, onBack, onRefresh }) {
  const [questions, setQuestions] = useState(item.quiz?.questions || [])
  const [passMark, setPassMark] = useState(item.quiz?.passMark ?? 80)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      const quiz = questions.length === 0 ? null : { passMark, questions }
      const result = await saveItemQuiz(item.id, quiz)
      if (result.success) {
        setMsg('Saved successfully.')
        await onRefresh()
      } else {
        setMsg('Save failed.')
      }
    } finally {
      setSaving(false)
    }
  }

  const updateQ = (idx, updated) => {
    setQuestions((qs) => qs.map((q, i) => (i === idx ? updated : q)))
  }

  const deleteQ = (idx) => {
    setQuestions((qs) => qs.filter((_, i) => i !== idx))
  }

  const addQ = () => {
    setQuestions((qs) => [...qs, emptyQuestion()])
    setMsg('')
  }

  const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Foundational']

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-white border border-slate-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Items
        </button>

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${colors.badge}`}>{item.category}</span>
          <span className="text-sm font-semibold text-slate-700 truncate">Quiz — {item.title}</span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {msg && (
            <span className={`text-xs font-medium ${msg.includes('fail') ? 'text-rose-500' : 'text-emerald-600'}`}>{msg}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Quiz'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden divide-x divide-slate-100">
        {/* Settings panel */}
        <div className="w-56 flex-shrink-0 p-4 space-y-4 bg-white overflow-y-auto thin-scrollbar">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Pass Mark</label>
            <div className="flex items-center gap-2">
              <input
                type="number" min="1" max="100"
                value={passMark}
                onChange={(e) => setPassMark(Number(e.target.value))}
                className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:border-indigo-400"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Users must score at least this % to pass.</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Questions</label>
            <span className="text-2xl font-bold text-slate-700">{questions.length}</span>
          </div>

          <button
            onClick={addQ}
            className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-indigo-300 hover:border-indigo-400 text-indigo-500 hover:text-indigo-600 rounded-lg py-2.5 text-xs font-semibold transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Question
          </button>

          {questions.length > 0 && (
            <button
              onClick={() => { if (window.confirm('Remove all questions from this quiz?')) setQuestions([]) }}
              className="w-full text-xs text-rose-400 hover:text-rose-600 font-medium transition-colors"
            >
              Clear all questions
            </button>
          )}
        </div>

        {/* Questions list */}
        <div className="flex-1 overflow-y-auto thin-scrollbar p-5">
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm text-slate-400">No questions yet.</p>
              <p className="text-xs text-slate-300 mt-1">Click "Add Question" on the left to start.</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              {questions.map((q, idx) => (
                <QuestionEditor
                  key={q.id}
                  q={q}
                  idx={idx}
                  onChange={(updated) => updateQ(idx, updated)}
                  onDelete={() => deleteQ(idx)}
                />
              ))}
              <button
                onClick={addQ}
                className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 hover:border-indigo-300 text-slate-400 hover:text-indigo-500 rounded-xl py-3 text-xs font-semibold transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Another Question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── User Progress Editor ─────────────────────────────────────────────────────
function UserProgressEditor({ data, onRefresh }) {
  const { users = [], trainingItems = [], progress = [] } = data || {}
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || null)
  const [toggling, setToggling] = useState(null) // itemId being toggled

  const selectedUser = users.find((u) => u.id === selectedUserId)

  const itemsByCategory = useMemo(
    () => CATEGORIES.map((cat) => ({
      cat,
      items: trainingItems.filter((i) => i.category === cat),
    })),
    [trainingItems]
  )

  const isDone = (itemId) =>
    progress.some((p) => p.userId === selectedUserId && p.itemId === itemId)

  const handleToggle = async (itemId, currentlyDone) => {
    setToggling(itemId)
    try {
      await setUserProgress(selectedUserId, itemId, !currentlyDone)
      await onRefresh()
    } finally {
      setToggling(null)
    }
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400 text-sm">No users registered yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* User list */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 overflow-y-auto thin-scrollbar p-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Users</p>
        <div className="space-y-1">
          {users.map((u) => {
            const done = trainingItems.filter((i) =>
              progress.some((p) => p.userId === u.id && p.itemId === i.id)
            ).length
            const pct = trainingItems.length > 0 ? Math.round((done / trainingItems.length) * 100) : 0
            const active = u.id === selectedUserId
            return (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  active ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                  {u.photo
                    ? <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                    : <span className="text-xs font-bold text-slate-500">{u.name?.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${active ? 'text-indigo-700' : 'text-slate-700'}`}>{u.name}</p>
                  <p className="text-[10px] text-slate-400">{done}/{trainingItems.length} · {pct}%</p>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* Progress grid */}
      <main className="flex-1 overflow-y-auto thin-scrollbar p-5">
        {!selectedUser ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">Select a user on the left.</p>
          </div>
        ) : (
          <div className="max-w-2xl space-y-5">
            {/* User info */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0">
                {selectedUser.photo
                  ? <img src={selectedUser.photo} alt={selectedUser.name} className="w-full h-full object-cover" />
                  : <span className="text-sm font-bold text-slate-500">{selectedUser.name?.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{selectedUser.name}</p>
                <p className="text-xs text-slate-400">{selectedUser.windowsAccount} · {selectedUser.computerName}</p>
              </div>
            </div>

            {/* Items by category */}
            {itemsByCategory.map(({ cat, items }) => {
              if (items.length === 0) return null
              const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Foundational']
              const catDone = items.filter((i) => isDone(i.id)).length
              return (
                <div key={cat}>
                  <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-2 ${colors.light}`}>
                    <span className={`text-xs font-bold ${colors.badge.split(' ')[1]}`}>{cat}</span>
                    <span className={`text-xs font-semibold ${colors.badge.split(' ')[1]}`}>{catDone}/{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, idx) => {
                      const done = isDone(item.id)
                      const busy = toggling === item.id
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors ${
                            done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white'
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-300 w-5 text-right flex-shrink-0">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${done ? 'text-emerald-800' : 'text-slate-700'}`}>{item.title}</p>
                            {item.description && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">{item.description}</p>
                            )}
                            {item.quiz && (
                              <span className="text-[10px] text-indigo-500 font-semibold">Has quiz</span>
                            )}
                            {item.codeChallenge && (
                              <span className="text-[10px] text-emerald-500 font-semibold ml-2">Has code challenge</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleToggle(item.id, done)}
                            disabled={busy}
                            title={done ? 'Click to mark as incomplete' : 'Click to mark as complete'}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${
                              done
                                ? 'border-emerald-300 bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                          >
                            {busy ? (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                            ) : done ? (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Done
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Mark Done
                              </>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Data Source Settings ─────────────────────────────────────────────────────
function DataSourceSettings({ onRefresh }) {
  const [settings, setSettings] = React.useState(null)
  const [inputPath, setInputPath] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [msg, setMsg] = React.useState(null) // { type: 'ok'|'err', text }
  const [resetting, setResetting] = React.useState(false)
  const [resetMsg, setResetMsg] = React.useState(null)

  React.useEffect(() => {
    getSettings().then((s) => { setSettings(s); setInputPath(s.dataPath) })
  }, [])

  const handleBrowse = async () => {
    const p = await browseForFolder()
    if (p) { setInputPath(p); setMsg(null) }
  }

  const handleSave = async () => {
    const p = inputPath.trim()
    if (!p) return
    setSaving(true)
    setMsg(null)
    const result = await setDataPath(p)
    if (result.success) {
      setMsg({ type: 'ok', text: 'Saved. App is restarting…' })
    } else {
      setMsg({ type: 'err', text: result.error || 'Save failed.' })
      setSaving(false)
    }
  }

  if (!settings) return <div className="flex items-center justify-center h-32"><p className="text-sm text-slate-400">Loading…</p></div>

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-sm font-bold text-slate-700 mb-1">Shared Data File</h2>
      <p className="text-xs text-slate-400 mb-5">
        All users must point to the same file on a shared network drive. Changing this setting will restart the app.
      </p>

      {settings.isLocalFallback && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Not configured.</span> Currently using a local file — only this machine sees its data.
            Set a network path below so all users share the same data.
          </p>
        </div>
      )}

      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Data file path</label>
      <div className="flex gap-2 mb-1.5">
        <input
          type="text"
          value={inputPath}
          onChange={(e) => { setInputPath(e.target.value); setMsg(null) }}
          placeholder={`\\\\SERVER\\share\\training-tracker\\data.json`}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-indigo-400 transition-colors"
        />
        <button onClick={handleBrowse} className="flex-shrink-0 px-3 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          Browse…
        </button>
      </div>
      <p className="text-[11px] text-slate-400 mb-5">
        The folder must exist and be accessible by all users. The file will be created automatically if it doesn't exist.
      </p>

      {msg && (
        <div className={`mb-4 px-3 py-2.5 rounded-lg border text-xs font-medium ${
          msg.type === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-600'
        }`}>
          {msg.text}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !inputPath.trim() || inputPath.trim() === settings.dataPath}
        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
      >
        {saving ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Saving & Restarting…
          </>
        ) : 'Save & Restart App'}
      </button>

      <div className="mt-6 pt-5 border-t border-slate-100">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Current active path</p>
        <p className="text-xs font-mono text-slate-500 break-all">{settings.dataPath}</p>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-100">
        <h2 className="text-sm font-bold text-slate-700 mb-1">Reset Training Content</h2>
        <p className="text-xs text-slate-400 mb-4">
          Replaces all training items with the latest built-in content. User accounts and progress records are preserved.
          Use this if the training material appears empty or has outdated categories.
        </p>
        {resetMsg && (
          <div className={`mb-4 px-3 py-2.5 rounded-lg border text-xs font-medium ${
            resetMsg.type === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}>
            {resetMsg.text}
          </div>
        )}
        <button
          onClick={async () => {
            if (!window.confirm('This will overwrite all training items with the default content. User progress will be kept. Continue?')) return
            setResetting(true)
            setResetMsg(null)
            try {
              const result = await resetTrainingItems()
              if (result.success) {
                setResetMsg({ type: 'ok', text: 'Training content reset successfully. Refreshing…' })
                await onRefresh()
              } else {
                setResetMsg({ type: 'err', text: result.error || 'Reset failed.' })
              }
            } finally {
              setResetting(false)
            }
          }}
          disabled={resetting}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
        >
          {resetting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Resetting…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Reset Training Content
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Main Admin panel ─────────────────────────────────────────────────────────
function AdminPanel({ data, onBack, onRefresh }) {
  const { trainingItems = [] } = data || {}

  const [view, setView] = useState('items') // 'items' | 'quiz' | 'progress'
  const [quizItem, setQuizItem] = useState(null)

  const [form, setForm] = useState({
    category: CATEGORIES[0],
    title: '',
    description: '',
    youtubeUrl: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filterCat, setFilterCat] = useState('All')

  // Inline item editor state
  const [editingItemId, setEditingItemId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', youtubeUrl: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editMsg, setEditMsg] = useState(null) // { type: 'ok'|'err', text }

  const openEdit = (item) => {
    setEditingItemId(item.id)
    setEditForm({ title: item.title, description: item.description || '', youtubeUrl: item.youtubeUrl || '', pdfPath: item.pdfPath || '' })
    setEditMsg(null)
    setDeleteConfirm(null)
  }

  const cancelEdit = () => {
    setEditingItemId(null)
    setEditMsg(null)
  }

  const handleEditSave = async (itemId) => {
    if (!editForm.title.trim()) { setEditMsg({ type: 'err', text: 'Title is required.' }); return }
    setEditSaving(true)
    setEditMsg(null)
    try {
      const result = await saveTrainingItemMeta(itemId, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        youtubeUrl: editForm.youtubeUrl.trim(),
        pdfPath: editForm.pdfPath.trim(),
      })
      if (result.success) {
        setEditMsg({ type: 'ok', text: 'Saved.' })
        await onRefresh()
        setTimeout(() => setEditingItemId(null), 800)
      } else {
        setEditMsg({ type: 'err', text: 'Save failed.' })
      }
    } finally {
      setEditSaving(false)
    }
  }

  const filteredItems = useMemo(
    () => filterCat === 'All' ? trainingItems : trainingItems.filter((i) => i.category === filterCat),
    [trainingItems, filterCat]
  )

  function generateId() {
    return `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    try {
      const newItem = {
        id: generateId(),
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        youtubeUrl: form.youtubeUrl.trim(),
      }
      const result = await addTrainingItem(newItem)
      if (result.success) {
        setSuccess(`"${newItem.title}" added successfully.`)
        setForm((f) => ({ ...f, title: '', description: '', youtubeUrl: '' }))
        await onRefresh()
      } else {
        setError('Failed to save. Check the data path.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (itemId) => {
    const result = await deleteTrainingItem(itemId)
    setDeleteConfirm(null)
    if (result.success) { setSuccess('Item deleted.'); await onRefresh() }
    else setError('Delete failed.')
  }

  const openQuizEditor = (item) => {
    setQuizItem(item)
    setView('quiz')
  }

  // If viewing quiz editor
  if (view === 'quiz' && quizItem) {
    // Get latest version of item from data (after refreshes)
    const latestItem = trainingItems.find((i) => i.id === quizItem.id) || quizItem
    return (
      <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-white border-b-2 border-slate-100">
          <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium text-sm px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-rose-100 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="font-bold text-slate-800 text-sm">Admin Panel</h1>
          </div>
          <span className="ml-2 text-xs bg-rose-100 text-rose-600 font-semibold px-2 py-0.5 rounded-lg">PIN protected</span>
        </header>
        <div className="flex-1 overflow-hidden">
          <QuizEditor item={latestItem} onBack={() => setView('items')} onRefresh={onRefresh} />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3 bg-white border-b-2 border-slate-100">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium text-sm px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>
        <div className="h-5 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-rose-100 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="font-bold text-slate-800 text-sm">Admin Panel</h1>
        </div>
        <span className="ml-2 text-xs bg-rose-100 text-rose-600 font-semibold px-2 py-0.5 rounded-lg">PIN protected</span>

        {/* Tabs */}
        <div className="ml-auto flex items-center gap-1">
          {[
            { key: 'items', label: 'Training Items', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
            { key: 'progress', label: 'User Progress', icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.75a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
            { key: 'datasource', label: 'Data Source', icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125' },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                view === key
                  ? 'bg-rose-100 text-rose-700'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* ── Data Source view ────────────────────────────────────────────── */}
        {view === 'datasource' && (
          <div className="flex-1 overflow-y-auto thin-scrollbar bg-white">
            <DataSourceSettings onRefresh={onRefresh} />
          </div>
        )}

        {/* ── User Progress view ──────────────────────────────────────────── */}
        {view === 'progress' && (
          <UserProgressEditor data={data} onRefresh={onRefresh} />
        )}

        {/* ── Training Items view ─────────────────────────────────────────── */}
        {view !== 'progress' && view !== 'datasource' && <>
        {/* ── Add form ────────────────────────────────────────────────────── */}
        <aside className="w-80 flex-shrink-0 bg-white border-r-2 border-slate-100 overflow-y-auto thin-scrollbar p-5">
          <h2 className="font-bold text-slate-700 text-sm mb-4 uppercase tracking-wide">Add Training Item</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
              <div className="space-y-1.5">
                {CATEGORIES.map((cat) => {
                  const colors = CATEGORY_COLORS[cat]
                  const active = form.category === cat
                  return (
                    <button key={cat} type="button" onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-colors
                        ${active ? colors.light + ' ' + colors.border : 'border-slate-100 hover:border-slate-200'}`}>
                      <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Variables and Data Types"
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Description <span className="font-normal text-slate-400">(optional)</span></label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description…" rows={3}
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors resize-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Video URL / Local Path</label>
              <input type="text" value={form.youtubeUrl} onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=... or C:\Videos\..."
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 transition-colors" />
            </div>

            {error && <p className="text-rose-500 text-xs font-medium bg-rose-50 rounded-xl px-3 py-2">{error}</p>}
            {success && <p className="text-emerald-600 text-xs font-medium bg-emerald-50 rounded-xl px-3 py-2">✓ {success}</p>}

            <button type="submit" disabled={saving}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50">
              {saving ? 'Adding…' : '+ Add Item'}
            </button>
          </form>
          <p className="mt-5 text-[11px] text-slate-400 leading-relaxed">
            Video URL is optional — leave empty to hide the video tab. Accepts YouTube links or local/network file paths (e.g. C:\Videos\demo.mp4 or \\server\share\video.mp4).
          </p>
        </aside>

        {/* ── Item list ──────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto thin-scrollbar p-5">
          {/* Filter bar */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {['All', ...CATEGORIES].map((cat) => {
              const colors = cat !== 'All' ? CATEGORY_COLORS[cat] : null
              const active = filterCat === cat
              return (
                <button key={cat} onClick={() => setFilterCat(cat)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border-2 transition-colors
                    ${active
                      ? (colors ? colors.light + ' ' + colors.border + ' ' + colors.badge.split(' ')[1] : 'bg-slate-800 border-slate-800 text-white')
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {cat}
                  <span className="ml-1.5 text-[10px] font-normal opacity-70">
                    ({cat === 'All' ? trainingItems.length : trainingItems.filter((i) => i.category === cat).length})
                  </span>
                </button>
              )
            })}
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-slate-400 font-medium">No items in this category yet.</p>
              <p className="text-slate-300 text-sm mt-1">Use the form on the left to add one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Foundational']
                const pendingDelete = deleteConfirm === item.id
                const hasQuiz = !!item.quiz
                const isEditing = editingItemId === item.id
                return (
                  <div key={item.id}
                    className={`bg-white border-2 rounded-2xl overflow-hidden transition-colors
                      ${pendingDelete ? 'border-rose-300 bg-rose-50' : isEditing ? 'border-indigo-300' : 'border-slate-100 hover:border-slate-200'}`}>

                    {/* ── Card header row ── */}
                    <div className="px-5 py-4 flex items-start gap-4">
                      <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1.5 ${colors.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${colors.badge}`}>{item.category}</span>
                          <h3 className="font-semibold text-slate-800 text-sm">{item.title}</h3>
                          {hasQuiz && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-600 flex items-center gap-1">
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                              </svg>
                              Quiz ({item.quiz.questions?.length ?? 0}q)
                            </span>
                          )}
                          {item.youtubeUrl ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-600">Has video</span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-600">No video</span>
                          )}
                        </div>
                        {item.description && !isEditing && (
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                        )}
                        {item.youtubeUrl && !isEditing && (
                          <p className="text-slate-300 text-[10px] mt-1 truncate font-mono" title={item.youtubeUrl}>{item.youtubeUrl}</p>
                        )}
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-2">
                        {!pendingDelete && !isEditing && (
                          <>
                            {/* Edit button */}
                            <button
                              onClick={() => openEdit(item)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                              Edit
                            </button>

                            {/* Manage Quiz button */}
                            <button
                              onClick={() => openQuizEditor(item)}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                                hasQuiz
                                  ? 'border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                                  : 'border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50'
                              }`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                              </svg>
                              {hasQuiz ? 'Edit Quiz' : 'Add Quiz'}
                            </button>
                          </>
                        )}

                        {/* Delete / Cancel-edit */}
                        {isEditing ? (
                          <button onClick={cancelEdit}
                            className="text-xs font-medium text-slate-400 hover:text-slate-600 px-2 py-1.5 transition-colors">
                            Cancel
                          </button>
                        ) : pendingDelete ? (
                          <>
                            <button onClick={() => handleDelete(item.id)}
                              className="text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-xl transition-colors">
                              Delete
                            </button>
                            <button onClick={() => setDeleteConfirm(null)}
                              className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1.5 transition-colors">
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button onClick={() => setDeleteConfirm(item.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-50" title="Delete item">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Inline edit form (expands below) ── */}
                    {isEditing && (
                      <div className="border-t border-indigo-100 bg-indigo-50 px-5 py-4 space-y-3">
                        <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wide">Edit Item</p>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Title *</label>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                            rows={2}
                            placeholder="Brief description…"
                            className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 transition-colors resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            Video URL / Local Path
                            <span className="ml-1 font-normal text-slate-400">(YouTube URL or local file path — leave empty to hide video tab)</span>
                          </label>
                          <div className="flex gap-2">
                          <input
                            type="text"
                            value={editForm.youtubeUrl}
                            onChange={(e) => setEditForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                            placeholder="https://www.youtube.com/watch?v=... or C:\Videos\..."
                            className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-400 transition-colors"
                          />
                            <button
                              type="button"
                              onClick={async () => {
                                const p = await browseForVideo()
                                if (p) setEditForm((f) => ({ ...f, youtubeUrl: p }))
                              }}
                              className="flex-shrink-0 px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              Browse…
                            </button>
                            {editForm.youtubeUrl && (
                              <button
                                type="button"
                                onClick={() => setEditForm((f) => ({ ...f, youtubeUrl: '' }))}
                                className="flex-shrink-0 px-2 py-2 rounded-xl text-slate-300 hover:text-rose-400 transition-colors"
                                title="Remove video"
                              >✕</button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">
                            PDF File
                            <span className="ml-1 font-normal text-slate-400">(shown before code challenge)</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editForm.pdfPath}
                              onChange={(e) => setEditForm((f) => ({ ...f, pdfPath: e.target.value }))}
                              placeholder="C:\path\to\document.pdf"
                              className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-400 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const p = await browseForPdf()
                                if (p) setEditForm((f) => ({ ...f, pdfPath: p }))
                              }}
                              className="flex-shrink-0 px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              Browse…
                            </button>
                            {editForm.pdfPath && (
                              <button
                                type="button"
                                onClick={() => setEditForm((f) => ({ ...f, pdfPath: '' }))}
                                className="flex-shrink-0 px-2 py-2 rounded-xl text-slate-300 hover:text-rose-400 transition-colors"
                                title="Remove PDF"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                          <button
                            onClick={() => handleEditSave(item.id)}
                            disabled={editSaving}
                            className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                          >
                            {editSaving ? (
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
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Save Changes
                              </>
                            )}
                          </button>
                          <button onClick={cancelEdit} className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
                            Cancel
                          </button>
                          {editMsg && (
                            <span className={`text-xs font-semibold ${editMsg.type === 'ok' ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {editMsg.text}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
        </>}
      </div>
    </div>
  )
}

// ─── Exported: wraps with PIN gate ───────────────────────────────────────────
export default function Admin({ data, onBack, onRefresh }) {
  const [unlocked, setUnlocked] = useState(false)
  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} onBack={onBack} />
  return <AdminPanel data={data} onBack={onBack} onRefresh={onRefresh} />
}
