import { useState, useEffect, useRef } from 'react'

const PRESETS = [60, 90, 120, 180]

export default function Timer() {
  const [seconds, setSeconds] = useState(0)
  const [target, setTarget] = useState(90)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setRunning(false)
            clearInterval(intervalRef.current)
            vibrate()
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  function start(sec) {
    clearInterval(intervalRef.current)
    setSeconds(sec ?? target)
    setRunning(true)
  }

  function stop() {
    clearInterval(intervalRef.current)
    setRunning(false)
    setSeconds(0)
  }

  const pct = target > 0 ? ((target - seconds) / target) * 100 : 0
  const circumference = 2 * Math.PI * 38

  return (
    <div className="bg-slate-800 rounded-2xl p-4">
      <p className="text-xs text-slate-400 mb-3">휴식 타이머</p>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="38" fill="none" stroke="#1e293b" strokeWidth="6" />
            <circle
              cx="44" cy="44" r="38" fill="none"
              stroke={seconds <= 10 && running ? '#f87171' : '#8b5cf6'}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums">
            {fmt(seconds)}
          </span>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map(s => (
              <button
                key={s}
                onClick={() => { setTarget(s); start(s) }}
                className="text-xs px-2 py-1 rounded-lg bg-slate-700 hover:bg-[#a855f7] transition-colors"
              >
                {s}s
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {!running ? (
              <button
                onClick={() => start()}
                className="flex-1 py-1.5 rounded-xl bg-[#a855f7] hover:bg-[#c084fc] text-sm font-medium transition-colors"
              >
                시작
              </button>
            ) : (
              <button
                onClick={stop}
                className="flex-1 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-colors"
              >
                정지
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function fmt(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function vibrate() {
  if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
}
