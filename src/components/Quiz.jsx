import React, { useState } from 'react'

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

// ── Read-only completed view ──────────────────────────────────────────────────

function CompletedView({ quiz }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto thin-scrollbar">
      <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border-b border-emerald-200 flex-shrink-0">
        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
          <IconCheck className="w-3 h-3" />
        </span>
        <span className="text-xs font-semibold text-emerald-700">Quiz passed — review the questions below</span>
      </div>
      <div className="p-6 space-y-4 max-w-2xl mx-auto w-full">
        {quiz.questions.map((q, qi) => (
          <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-800 mb-3">
              <span className="text-slate-400 mr-2">{qi + 1}.</span>{q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
                  oi === q.correctIndex
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold'
                    : 'bg-slate-50 border border-slate-100 text-slate-500'
                }`}>
                  {oi === q.correctIndex
                    ? <IconCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    : <span className="w-3.5 h-3.5 flex-shrink-0" />}
                  {opt}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Quiz component ───────────────────────────────────────────────────────

export default function Quiz({ quiz, done = false, onAllPassed }) {
  const questions = quiz.questions || []
  const passMark = quiz.passMark ?? 80 // percent

  const [answers, setAnswers] = useState({}) // { [qi]: selectedIndex }
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null) // { correct, total, pct }
  const [passed, setPassed] = useState(false)

  if (done) return <CompletedView quiz={quiz} />

  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined)

  function handleSubmit() {
    let correct = 0
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++
    })
    const pct = Math.round((correct / questions.length) * 100)
    const pass = pct >= passMark
    setScore({ correct, total: questions.length, pct })
    setSubmitted(true)
    setPassed(pass)
    if (pass) onAllPassed?.()
  }

  function handleRetry() {
    setAnswers({})
    setSubmitted(false)
    setScore(null)
    setPassed(false)
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <p className="text-slate-400 text-sm">No questions have been added to this quiz yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Score banner (after submit) */}
      {submitted && (
        <div className={`flex-shrink-0 flex items-center justify-between px-5 py-3 border-b ${
          passed ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              {passed ? <IconCheck className="w-3.5 h-3.5" /> : <IconX className="w-3.5 h-3.5" />}
            </span>
            <span className={`text-sm font-semibold ${passed ? 'text-emerald-700' : 'text-rose-700'}`}>
              {passed
                ? `Passed! ${score.correct}/${score.total} correct (${score.pct}%)`
                : `${score.correct}/${score.total} correct (${score.pct}%) — need ${passMark}% to pass`}
            </span>
          </div>
          {!passed && (
            <button
              onClick={handleRetry}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 border border-rose-300 hover:border-rose-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="flex-1 overflow-y-auto thin-scrollbar p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {questions.map((q, qi) => {
            const selected = answers[qi]
            const isCorrect = submitted && selected === q.correctIndex
            const isWrong   = submitted && selected !== undefined && selected !== q.correctIndex

            return (
              <div key={q.id} className={`bg-white rounded-xl border p-5 transition-colors ${
                submitted
                  ? isCorrect ? 'border-emerald-200' : isWrong ? 'border-rose-200' : 'border-slate-200'
                  : 'border-slate-200'
              }`}>
                <p className="text-sm font-semibold text-slate-800 mb-3.5">
                  <span className="text-slate-400 font-normal mr-2">{qi + 1}.</span>
                  {q.question}
                </p>

                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = selected === oi
                    const isCorrectOpt = q.correctIndex === oi

                    let optClass = 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    if (submitted) {
                      if (isCorrectOpt)
                        optClass = 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      else if (isSelected && !isCorrectOpt)
                        optClass = 'border-rose-300 bg-rose-50 text-rose-700'
                      else
                        optClass = 'border-slate-100 text-slate-400'
                    } else if (isSelected) {
                      optClass = 'border-indigo-400 bg-indigo-50 text-indigo-800'
                    }

                    return (
                      <button
                        key={oi}
                        disabled={submitted}
                        onClick={() => !submitted && setAnswers((a) => ({ ...a, [qi]: oi }))}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 text-left text-sm transition-colors ${optClass} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {/* Indicator */}
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-colors ${
                          submitted
                            ? isCorrectOpt
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : isSelected
                                ? 'border-rose-400 bg-rose-400 text-white'
                                : 'border-slate-300'
                            : isSelected
                              ? 'border-indigo-500 bg-indigo-500 text-white'
                              : 'border-slate-300'
                        }`}>
                          {submitted && isCorrectOpt
                            ? <IconCheck className="w-3 h-3" />
                            : submitted && isSelected && !isCorrectOpt
                              ? <IconX className="w-3 h-3" />
                              : String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Submit */}
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-colors bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {allAnswered ? 'Submit Quiz' : `Answer all ${questions.length - Object.keys(answers).length} remaining question${questions.length - Object.keys(answers).length !== 1 ? 's' : ''} to submit`}
            </button>
          )}

          {passed && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconCheck className="w-3.5 h-3.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-emerald-700">Quiz passed!</p>
                <p className="text-xs text-emerald-600 mt-0.5">Progress has been saved. Come back anytime to review the answers.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
