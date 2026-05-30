import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'

export default function Routines() {
  const [routines, setRoutines] = useState([])
  const [editing, setEditing] = useState(null) // null | 'new' | routine object
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  async function load() {
    const data = await db.routines.toArray()
    setRoutines([...data].sort((a, b) => b.id - a.id))
  }

  function startNew() {
    setEditing({ name: '', exercises: [] })
  }

  async function deleteRoutine(id) {
    await db.routines.delete(id)
    load()
  }

  if (editing) {
    return (
      <RoutineEditor
        initial={editing}
        onSave={async r => {
          if (r.id) await db.routines.put(r)
          else await db.routines.add(r)
          setEditing(null)
          load()
        }}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold">루틴</h1>
        <button onClick={startNew} className="btn-grad  px-3 py-1.5 rounded-xl text-sm">
          + 새 루틴
        </button>
      </div>

      {routines.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-3">📋</p>
          <p>저장된 루틴이 없습니다</p>
          <p className="text-sm mt-1">새 루틴을 만들어 보세요</p>
        </div>
      )}

      <div className="space-y-3">
        {routines.map(r => (
          <div key={r.id} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.exercises?.length ?? 0}개 종목</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { localStorage.removeItem('wk_start'); localStorage.removeItem('wk_exercises'); navigate('/workout', { state: { routineId: r.id } }) }}
                  className="text-xs btn-grad px-3 py-1.5 rounded-lg"
                >
                  시작
                </button>
                <button
                  onClick={() => setEditing(r)}
                  className="text-xs glass px-3 py-1.5 rounded-lg"
                >
                  편집
                </button>
                <button
                  onClick={() => deleteRoutine(r.id)}
                  className="text-xs text-slate-500 px-2 py-1.5 rounded-lg"
                >
                  삭제
                </button>
              </div>
            </div>
            {r.exercises?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.exercises.map((e, i) => (
                  <span key={i} className="text-xs glass px-2 py-0.5 rounded-full text-slate-300">
                    {e.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function RoutineEditor({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial.name)
  const [exercises, setExercises] = useState(initial.exercises || [])
  const [allExercises, setAllExercises] = useState([])
  const [focusedIdx, setFocusedIdx] = useState(null)
  const inputRefs = useRef([])
  const lastAddedRef = useRef(null)

  useEffect(() => { db.exercises.toArray().then(setAllExercises) }, [])

  useEffect(() => {
    if (lastAddedRef.current !== null) {
      const idx = lastAddedRef.current
      lastAddedRef.current = null
      requestAnimationFrame(() => inputRefs.current[idx]?.focus())
    }
  }, [exercises])

  function addBlankExercise() {
    setExercises(prev => {
      lastAddedRef.current = prev.length
      return [...prev, { exerciseId: 0, name: '', sets: 3, reps: 10, weight: 0 }]
    })
  }

  function fillFromSuggestion(idx, ex) {
    const isCardio = ex.type === 'cardio'
    setExercises(prev => prev.map((e, i) => i === idx
      ? isCardio
        ? { exerciseId: ex.id, name: ex.name, type: 'cardio', sets: 1, duration: 30, distance: 0 }
        : { exerciseId: ex.id, name: ex.name, sets: 3, reps: 10, weight: 0 }
      : e
    ))
    setFocusedIdx(null)
  }

  function getSuggestions(idx) {
    if (focusedIdx !== idx) return []
    const q = (exercises[idx]?.name || '').trim()
    if (!q) return allExercises.slice(0, 6)
    return allExercises.filter(e => e.name.includes(q)).slice(0, 6)
  }

  function updateExercise(idx, field, value) {
    const isNum = ['sets', 'reps', 'weight', 'duration', 'distance'].includes(field)
    setExercises(prev => prev.map((e, i) => i === idx ? { ...e, [field]: isNum ? Number(value) : value } : e))
  }

  function removeExercise(idx) {
    setExercises(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-4">
        <button onClick={onCancel} className="text-slate-400 text-sm">← 취소</button>
        <button
          onClick={() => onSave({ ...initial, name, exercises })}
          disabled={!name}
          className="btn-grad  disabled:opacity-50 px-4 py-1.5 rounded-xl text-sm"
        >
          저장
        </button>
      </div>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="루틴 이름"
        className="w-full glass rounded-xl px-4 py-3 text-lg font-semibold outline-none focus:ring-1 focus:ring-violet-500"
      />

      <div className="space-y-2">
        {exercises.map((ex, idx) => (
          <div key={idx} className="glass rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <input
                  ref={el => inputRefs.current[idx] = el}
                  value={ex.name}
                  onChange={e => updateExercise(idx, 'name', e.target.value)}
                  onFocus={() => setFocusedIdx(idx)}
                  onBlur={() => setTimeout(() => setFocusedIdx(prev => prev === idx ? null : prev), 200)}
                  className="w-full bg-transparent text-sm font-semibold outline-none border-b border-white/10 focus:border-violet-500 pb-0.5 transition-colors"
                  placeholder="종목 이름 입력..."
                />
                {getSuggestions(idx).length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-[#222] rounded-xl overflow-hidden shadow-xl border border-white/10">
                    {getSuggestions(idx).map(s => (
                      <button
                        key={s.id}
                        onMouseDown={() => fillFromSuggestion(idx, s)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/5 active:bg-white/10 transition-colors"
                      >
                        <span className="text-sm">{s.name}</span>
                        <span className="text-xs text-slate-500 ml-2 shrink-0">{s.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => removeExercise(idx)} className="text-xs text-slate-600 hover:text-red-400 shrink-0">삭제</button>
            </div>
            <input
              value={ex.note || ''}
              onChange={e => updateExercise(idx, 'note', e.target.value)}
              placeholder="메모 (예: 좌우 각 10회, w/밸패)"
              className="w-full bg-transparent text-xs text-slate-500 outline-none border-b border-white/5 focus:border-violet-500/50 pb-0.5 transition-colors"
            />
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(ex.type === 'cardio'
                ? [['sets', '세트'], ['duration', '시간(분)'], ['distance', '거리(km)']]
                : [['sets', '세트'], ['reps', '횟수'], ['weight', '무게(kg)']]
              ).map(([field, label]) => (
                <div key={field} className="text-center">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={ex[field] ?? 0}
                    onFocus={e => e.target.select()}
                    onChange={e => updateExercise(idx, field, e.target.value)}
                    className="w-full glass-input rounded-lg text-center text-sm py-1.5 outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addBlankExercise}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-[#333] text-slate-400 hover:border-violet-500 hover:text-violet-400 transition-colors"
      >
        + 종목 추가
      </button>
    </div>
  )
}
