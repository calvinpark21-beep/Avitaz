import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Home() {
  const navigate = useNavigate()
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [logs, setLogs] = useState([])
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedLog, setSelectedLog] = useState(null)
  const [routines, setRoutines] = useState([])
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => { loadMonth() }, [year, month])

  useEffect(() => {
    db.routines.toArray().then(r => setRoutines([...r].sort((a, b) => b.id - a.id)))
  }, [])

  useEffect(() => {
    const log = logs.find(l => l.date === selectedDate) ?? null
    setSelectedLog(log)
  }, [selectedDate, logs])

  async function loadMonth() {
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const to = `${year}-${String(month + 1).padStart(2, '0')}-31`
    const data = await db.workoutLogs.where('date').between(from, to, true, true).toArray()
    setLogs(data)
  }

  async function deleteLog(id) {
    await db.workoutLogs.delete(id)
    setSelectedLog(null)
    loadMonth()
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const logDates = new Set(logs.map(l => l.date))

  function fmtDuration(s) {
    if (!s) return ''
    return `${Math.floor(s / 60)}분 ${s % 60}초`
  }

  const selDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : null
  const selLabel = selDate
    ? `${selDate.getMonth() + 1}월 ${selDate.getDate()}일 (${DAYS[selDate.getDay()]})`
    : ''

  return (
    <div className="p-4 space-y-3">
      {/* 캘린더 */}
      <div className="bg-[#222] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="w-8 h-8 rounded-xl bg-slate-700 text-slate-200 text-xl leading-none flex items-center justify-center">‹</button>
          <div className="text-center">
            <p className="font-bold text-base">{year}년 {month + 1}월</p>
            <p className="text-xs text-slate-500 mt-0.5">{logs.length}회 운동</p>
          </div>
          <button onClick={nextMonth} className="w-8 h-8 rounded-xl bg-slate-700 text-slate-200 text-xl leading-none flex items-center justify-center">›</button>
        </div>

        <div className="grid grid-cols-7 text-center mb-1">
          {DAYS.map(d => <span key={d} className="text-xs text-slate-500 py-1">{d}</span>)}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const hasLog = logDates.has(dateStr)
            const isTodayCell = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dateStr)}
                className="relative flex flex-col items-center justify-center aspect-square"
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
                  ${isSelected
                    ? 'bg-[#ff4757] text-white'
                    : isTodayCell
                    ? 'border border-[#ff4757] text-[#ff4757]'
                    : 'text-slate-300'}
                `}>
                  {day}
                </span>
                {hasLog && (
                  <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#ff4757]'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 선택 날짜 상세 */}
      {selectedDate && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-semibold">{selLabel}</p>
            {selectedDate === todayStr && (
              <span className="text-xs bg-[#ff4757]/20 text-[#ff6b6b] px-2 py-0.5 rounded-full">오늘</span>
            )}
          </div>

          {selectedLog ? (
            <>
              {selectedLog.duration && (
                <p className="text-xs text-slate-500 px-1">⏱ {fmtDuration(selectedLog.duration)} · {selectedLog.exercises?.length ?? 0}개 종목</p>
              )}
              {(selectedLog.exercises || []).map((ex, i) => (
                <div key={i} className="bg-[#222] rounded-xl px-4 py-3">
                  <p className="text-sm font-semibold text-[#ff6b6b] mb-1.5">{ex.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(ex.sets || []).map((s, j) => (
                      <span key={j} className="text-xs bg-slate-700 px-2.5 py-1 rounded-lg text-slate-300">
                        {s.weight}kg × {s.reps}회
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={() => deleteLog(selectedLog.id)}
                className="w-full py-2.5 rounded-xl border border-slate-700 text-xs text-slate-500 hover:text-red-400 hover:border-red-400/50 transition-colors mt-1"
              >
                이 기록 삭제
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setShowPicker(true)}
                className="w-full bg-[#ff4757] hover:bg-[#ff6b6b] rounded-2xl py-4 font-semibold text-sm transition-colors"
              >
                루틴으로 시작
              </button>
              <button
                onClick={() => navigate('/workout')}
                className="w-full bg-[#222] hover:bg-[#2a2a2a] rounded-2xl py-3.5 text-sm text-slate-300 transition-colors"
              >
                빈 운동 시작
              </button>
            </div>
          )}
        </div>
      )}

      {/* 루틴 선택 모달 */}
      {showPicker && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-end" onClick={() => setShowPicker(false)}>
          <div
            className="w-full max-w-lg mx-auto bg-[#111] rounded-t-3xl animate-slideup flex flex-col"
            style={{ maxHeight: '80vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
              <p className="font-semibold">루틴 선택</p>
              <button onClick={() => setShowPicker(false)} className="text-slate-500 text-sm">닫기</button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 pb-8 space-y-2">
              {routines.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">저장된 루틴이 없습니다</p>
              ) : (
                routines.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setShowPicker(false); navigate('/workout', { state: { routineId: r.id } }) }}
                    className="w-full bg-[#222] rounded-2xl px-4 py-3.5 flex items-center justify-between text-left"
                  >
                    <div>
                      <p className="font-medium text-sm">{r.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.exercises?.length ?? 0}개 종목</p>
                    </div>
                    <span className="text-[#ff4757] text-sm">→</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
