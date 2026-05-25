import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'
import ModalPortal from '../components/ModalPortal'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Home() {
  const navigate = useNavigate()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [logs, setLogs] = useState([])
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [selectedLog, setSelectedLog] = useState(null)
  const [routines, setRoutines] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [editingEx, setEditingEx] = useState(null) // { ex, sets }


  useEffect(() => { loadMonth() }, [year, month])

  useEffect(() => {
    db.routines.toArray().then(r => setRoutines([...r].sort((a, b) => b.id - a.id)))
  }, [])

  useEffect(() => {
    const dayLogs = logs.filter(l => l.date === selectedDate)
    if (dayLogs.length === 0) { setSelectedLog(null); return }
    const merged = {
      ids: dayLogs.map(l => l.id),
      date: selectedDate,
      duration: dayLogs.reduce((sum, l) => sum + (l.duration || 0), 0),
      exercises: dayLogs.flatMap(l =>
        (l.exercises || []).map((ex, exIdx) => ({ ...ex, _logId: l.id, _exIdx: exIdx }))
      ),
    }
    setSelectedLog(merged)
  }, [selectedDate, logs])

  async function loadMonth() {
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const to = `${year}-${String(month + 1).padStart(2, '0')}-31`
    const data = await db.workoutLogs.where('date').between(from, to, true, true).toArray()
    setLogs(data)
  }

  async function deleteLog() {
    if (!selectedLog?.ids) return
    await db.workoutLogs.bulkDelete(selectedLog.ids)
    setSelectedLog(null)
    loadMonth()
  }

  async function deleteExercise(ex) {
    const log = await db.workoutLogs.get(ex._logId)
    if (!log) { loadMonth(); return }
    const remaining = (log.exercises || []).filter((_, i) => i !== ex._exIdx)
    if (remaining.length === 0) {
      await db.workoutLogs.delete(log.id)
    } else {
      await db.workoutLogs.put({ ...log, exercises: remaining })
    }
    loadMonth()
  }

  function openEdit(ex) {
    setEditingEx({ ex, sets: ex.sets.map(s => ({ ...s })) })
  }

  async function saveEdit() {
    const { ex, sets } = editingEx
    const validSets = sets.filter(s =>
      'duration' in s ? (s.duration !== '' && s.distance !== '') : (s.weight !== '' && s.reps !== '')
    )
    if (validSets.length === 0) { setEditingEx(null); return }
    const log = await db.workoutLogs.get(ex._logId)
    if (!log) { loadMonth(); setEditingEx(null); return }
    const newExercises = (log.exercises || []).map((e, i) =>
      i === ex._exIdx ? { ...e, sets: validSets } : e
    )
    await db.workoutLogs.put({ ...log, exercises: newExercises })
    setEditingEx(null)
    loadMonth()
  }

  function updateEditSet(idx, field, value) {
    setEditingEx(prev => {
      const sets = prev.sets.map((s, i) => i === idx ? { ...s, [field]: value } : s)
      return { ...prev, sets }
    })
  }

  function addEditSet() {
    setEditingEx(prev => {
      const isCardio = prev.sets.length > 0 && 'duration' in prev.sets[0]
      const newSet = isCardio ? { duration: '', distance: '' } : { weight: '', reps: '' }
      return { ...prev, sets: [...prev.sets, newSet] }
    })
  }

  function removeEditSet(idx) {
    setEditingEx(prev => ({
      ...prev,
      sets: prev.sets.filter((_, i) => i !== idx)
    }))
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
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl btn-grad flex items-center justify-center" style={{ boxShadow: '0 2px 12px rgba(124,58,237,0.5)' }}>
            <span className="text-white font-black text-sm">A</span>
          </div>
          <span className="font-bold text-lg tracking-wide text-grad">AvitaZ</span>
        </div>
        <span className="text-slate-500 text-xs">{today.getFullYear()}.{String(today.getMonth()+1).padStart(2,'0')}.{String(today.getDate()).padStart(2,'0')}</span>
      </div>

      {/* 캘린더 */}
      <div className="glass rounded-3xl p-5">
        {/* 월 네비 */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-8 h-8 rounded-xl glass flex items-center justify-center text-slate-300 text-lg font-light">‹</button>
          <div className="text-center">
            <p className="font-bold text-base">{year}년 {month + 1}월</p>
            {logs.length > 0 && <p className="text-xs text-violet-400 mt-0.5">{logs.length}회 운동</p>}
          </div>
          <button onClick={nextMonth} className="w-8 h-8 rounded-xl glass flex items-center justify-center text-slate-300 text-lg font-light">›</button>
        </div>

        {/* 요일 */}
        <div className="grid grid-cols-7 text-center mb-2">
          {DAYS.map((d, i) => (
            <span key={d} className={`text-xs py-1 font-medium ${i === 0 ? 'text-rose-400/70' : i === 6 ? 'text-blue-400/70' : 'text-slate-500'}`}>{d}</span>
          ))}
        </div>

        {/* 날짜 */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const hasLog = logDates.has(dateStr)
            const isTodayCell = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            return (
              <button key={i} onClick={() => setSelectedDate(dateStr)}
                className="relative flex flex-col items-center justify-center aspect-square">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
                  ${isSelected ? 'btn-grad text-white shadow-lg' : isTodayCell ? 'text-violet-300' : 'text-slate-300'}`}
                  style={isSelected ? { boxShadow: '0 2px 12px rgba(124,58,237,0.5)' } : {}}>
                  {day}
                </span>
                {isTodayCell && !isSelected && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-violet-400" />
                )}
                {hasLog && (
                  <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'btn-grad'}`} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 선택 날짜 */}
      {selectedDate && (
        <div className="space-y-3 animate-fadein">
          <div className="flex items-center justify-between px-1">
            <p className="font-semibold text-sm">{selLabel}</p>
            {selectedDate === todayStr && (
              <span className="text-xs px-2.5 py-0.5 rounded-full text-violet-300" style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)' }}>오늘</span>
            )}
          </div>

          {selectedLog ? (
            <>
              {selectedLog.duration && (
                <p className="text-xs text-slate-500 px-1">⏱ {fmtDuration(selectedLog.duration)} · {selectedLog.exercises?.length ?? 0}개 종목</p>
              )}
              {(selectedLog.exercises || []).map((ex, i) => (
                <div key={i} className="glass rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-grad">{ex.name}</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEdit(ex)} className="text-xs text-slate-500 hover:text-violet-400 transition-colors">수정</button>
                      <button onClick={() => deleteExercise(ex)} className="text-xs text-slate-600 hover:text-rose-400 transition-colors">삭제</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(ex.sets || []).map((s, j) => (
                      <span key={j} className="text-xs px-2.5 py-1 rounded-lg text-slate-300" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        {'duration' in s ? `${s.duration}분 · ${s.distance}km` : `${s.weight}kg × ${s.reps}회`}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {selectedDate === todayStr && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowPicker(true)}
                    className="w-full btn-grad rounded-2xl py-3 font-bold text-sm text-white">
                    + 루틴 추가
                  </button>
                  <button onClick={() => navigate('/workout')}
                    className="w-full glass rounded-2xl py-3 text-sm text-slate-300 font-medium">
                    + 운동 추가
                  </button>
                </div>
              )}
              <button onClick={deleteLog}
                className="w-full py-2.5 rounded-xl text-xs text-slate-500 transition-colors hover:text-rose-400"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                기록 삭제
              </button>
            </>
          ) : (
            <div className="space-y-2.5">
              <button onClick={() => setShowPicker(true)}
                className="w-full btn-grad rounded-2xl py-4 font-bold text-sm text-white"
                style={{ boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
                루틴으로 시작
              </button>
              <button onClick={() => navigate('/workout')}
                className="w-full glass rounded-2xl py-3.5 text-sm text-slate-300 font-medium">
                빈 운동 시작
              </button>
            </div>
          )}
        </div>
      )}

      {/* 운동 수정 모달 */}
      {editingEx && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setEditingEx(null)}>
            <div className="w-full max-w-lg mx-auto rounded-t-3xl animate-slideup flex flex-col"
              style={{ maxHeight: '80vh', background: '#0e0e1c', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
              </div>
              <div className="flex items-center justify-between px-4 py-3 shrink-0">
                <p className="font-bold text-base text-grad">{editingEx.ex.name}</p>
                <button onClick={() => setEditingEx(null)} className="text-slate-500 text-sm">취소</button>
              </div>
              <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-2">
                {editingEx.sets.map((s, idx) => {
                  const isCardio = 'duration' in s
                  return (
                    <div key={idx} className="flex items-center gap-2 glass rounded-2xl px-3 py-2.5">
                      <span className="text-xs text-slate-500 w-6 text-center shrink-0">{idx + 1}</span>
                      {isCardio ? (
                        <>
                          <input type="number" value={s.duration} onChange={e => updateEditSet(idx, 'duration', e.target.value)}
                            placeholder="분" className="flex-1 bg-transparent text-center text-sm text-white outline-none border-b border-slate-700 py-0.5" style={{ minWidth: 0 }} />
                          <span className="text-slate-600 text-xs">분</span>
                          <input type="number" value={s.distance} onChange={e => updateEditSet(idx, 'distance', e.target.value)}
                            placeholder="km" className="flex-1 bg-transparent text-center text-sm text-white outline-none border-b border-slate-700 py-0.5" style={{ minWidth: 0 }} />
                          <span className="text-slate-600 text-xs">km</span>
                        </>
                      ) : (
                        <>
                          <input type="number" value={s.weight} onChange={e => updateEditSet(idx, 'weight', e.target.value)}
                            placeholder="kg" className="flex-1 bg-transparent text-center text-sm text-white outline-none border-b border-slate-700 py-0.5" style={{ minWidth: 0 }} />
                          <span className="text-slate-600 text-xs">kg</span>
                          <span className="text-slate-700 text-xs">×</span>
                          <input type="number" value={s.reps} onChange={e => updateEditSet(idx, 'reps', e.target.value)}
                            placeholder="회" className="flex-1 bg-transparent text-center text-sm text-white outline-none border-b border-slate-700 py-0.5" style={{ minWidth: 0 }} />
                          <span className="text-slate-600 text-xs">회</span>
                        </>
                      )}
                      <button onClick={() => removeEditSet(idx)} className="text-slate-600 hover:text-rose-400 transition-colors text-base leading-none px-1">−</button>
                    </div>
                  )
                })}
                <button onClick={addEditSet}
                  className="w-full py-2.5 rounded-2xl text-sm text-slate-400 hover:text-violet-400 transition-colors"
                  style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                  + 세트 추가
                </button>
              </div>
              <div className="px-4 pb-8 pt-2 shrink-0">
                <button onClick={saveEdit}
                  className="w-full btn-grad rounded-2xl py-3.5 font-bold text-sm text-white"
                  style={{ boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
                  저장
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* 루틴 선택 모달 */}
      {showPicker && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setShowPicker(false)}>
            <div className="w-full max-w-lg mx-auto rounded-t-3xl animate-slideup flex flex-col"
              style={{ maxHeight: '80vh', background: '#0e0e1c', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
              </div>
              <div className="flex items-center justify-between px-4 py-3 shrink-0">
                <p className="font-bold">루틴 선택</p>
                <button onClick={() => setShowPicker(false)} className="text-slate-500 text-sm">닫기</button>
              </div>
              <div className="overflow-y-auto flex-1 px-4 pb-8 space-y-2">
                {routines.length === 0 ? (
                  <p className="text-center text-slate-500 py-8 text-sm">저장된 루틴이 없습니다</p>
                ) : (
                  routines.map(r => (
                    <button key={r.id}
                      onClick={() => { setShowPicker(false); navigate('/workout', { state: { routineId: r.id } }) }}
                      className="w-full glass rounded-2xl px-4 py-4 flex items-center justify-between text-left">
                      <div>
                        <p className="font-semibold text-sm">{r.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{r.exercises?.length ?? 0}개 종목</p>
                      </div>
                      <span className="text-violet-400 text-lg">→</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}
