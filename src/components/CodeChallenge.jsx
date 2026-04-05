import React, { useState, useRef } from 'react'
import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { runCSharp } from '../lib/storage'

// Use locally installed monaco-editor instead of CDN
loader.config({ monaco })

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconPlay({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
    </svg>
  )
}

function IconCheck({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function IconX({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function IconLoader({ className = 'w-4 h-4 animate-spin' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ── Test Result Row ───────────────────────────────────────────────────────────

function TestResultRow({ result, index }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={`rounded-lg border text-xs font-mono ${result.passed ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${result.passed ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {result.passed ? <IconCheck className="w-3 h-3" /> : <IconX className="w-3 h-3" />}
        </span>
        <span className={`font-semibold ${result.passed ? 'text-emerald-700' : 'text-red-700'}`}>
          Test {index + 1}
        </span>
        <span className="text-slate-500 flex-1 truncate">
          Input: <span className="text-slate-700">{result.input || '(empty)'}</span>
        </span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-slate-200 pt-2">
          <Row label="Input"    value={result.input    || '(empty)'} />
          <Row label="Expected" value={result.expected || '(empty)'} color="text-emerald-700" />
          <Row label="Got"      value={result.actual   || '(empty)'} color={result.passed ? 'text-emerald-700' : 'text-red-700'} />
          {result.stderr && (
            <Row label="Error" value={result.stderr} color="text-red-600" />
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, color = 'text-slate-700' }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-400 w-16 flex-shrink-0">{label}:</span>
      <span className={`${color} whitespace-pre-wrap break-all`}>{value}</span>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CodeChallenge({ challenge, done = false, submittedCode = null, onAllPassed }) {
  const [code, setCode] = useState(challenge.starterCode || '')
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState(null) // { success, buildError, results }
  const editorRef = useRef(null)

  const passedCount = runResult?.results?.filter((r) => r.passed).length ?? 0
  const totalCount  = challenge.testCases?.length ?? 0
  const allPassed   = runResult?.success && passedCount === totalCount && totalCount > 0

  // Read-only mode: show submitted code when already completed
  if (done) {
    return (
      <div className="flex flex-col h-full">
        {/* Prompt */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">{challenge.title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{challenge.prompt}</p>
        </div>

        {/* Completed banner */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border-b border-emerald-200">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <IconCheck className="w-3 h-3" />
          </span>
          <span className="text-xs font-semibold text-emerald-700">Challenge completed — your submitted solution (read-only)</span>
        </div>

        {/* Read-only editor */}
        <div className="flex-1 min-h-0">
          <div className="flex items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
            <span className="text-xs text-slate-400 font-mono">Program.cs</span>
            <span className="ml-3 text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-400 font-semibold uppercase tracking-wide">Read-only</span>
          </div>
          <div style={{ height: 'calc(100% - 37px)' }}>
            <Editor
              height="100%"
              language="csharp"
              theme="vs-dark"
              value={submittedCode || challenge.starterCode || ''}
              options={{
                fontSize: 13,
                lineHeight: 20,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 4,
                readOnly: true,
                padding: { top: 12, bottom: 12 },
                domReadOnly: true,
                cursorStyle: 'line',
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  async function handleRun() {
    setRunning(true)
    setRunResult(null)
    try {
      const result = await runCSharp(code, challenge.testCases || [])
      setRunResult(result)
      if (result.success && result.results.every((r) => r.passed)) {
        onAllPassed?.(code)
      }
    } catch (err) {
      setRunResult({ success: false, buildError: err.message, results: [] })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex flex-col h-full gap-0">

      {/* ── Prompt ──────────────────────────────────────────────────────────── */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">{challenge.title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{challenge.prompt}</p>

        {/* Test case summary pills */}
        {totalCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {challenge.testCases.map((tc, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-white border border-slate-200 font-mono text-slate-600">
                <span className="text-slate-400">in:</span> {tc.input || '∅'}
                <span className="text-slate-300 mx-0.5">→</span>
                <span className="text-slate-400">out:</span> {tc.expected}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Editor + Results ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 divide-x divide-slate-200">

        {/* Editor pane */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
            <span className="text-xs text-slate-400 font-mono">Program.cs</span>
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors"
            >
              {running
                ? <><IconLoader className="w-3.5 h-3.5 animate-spin" /> Building…</>
                : <><IconPlay className="w-3.5 h-3.5" /> Run Tests</>
              }
            </button>
          </div>

          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language="csharp"
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val ?? '')}
              onMount={(editor) => { editorRef.current = editor }}
              options={{
                fontSize: 13,
                lineHeight: 20,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 4,
                renderLineHighlight: 'line',
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>
        </div>

        {/* Results pane */}
        <div className="w-72 flex-shrink-0 flex flex-col bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Test Results</span>
            {runResult && (
              <span className={`text-xs font-bold ${allPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                {passedCount}/{totalCount}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-2">
            {/* Idle state */}
            {!runResult && !running && (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                  <IconPlay className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400">Click "Run Tests" to check your solution</p>
              </div>
            )}

            {/* Running */}
            {running && (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <IconLoader className="w-6 h-6 text-slate-400 animate-spin mb-2" />
                <p className="text-xs text-slate-400">Compiling and running…</p>
              </div>
            )}

            {/* Build error */}
            {runResult && !runResult.success && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">Build Failed</p>
                <pre className="text-[11px] text-red-600 whitespace-pre-wrap break-all leading-relaxed">
                  {runResult.buildError || 'Unknown build error'}
                </pre>
              </div>
            )}

            {/* Test results */}
            {runResult?.success && runResult.results.map((r, i) => (
              <TestResultRow key={i} result={r} index={i} />
            ))}

            {/* All passed banner */}
            {allPassed && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconCheck className="w-3 h-3" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-emerald-700">All tests passed!</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Challenge complete. Progress has been saved.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
