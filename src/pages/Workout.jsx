import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db } from '../db'
import Timer from '../components/Timer'
import ExercisePicker from '../components/ExercisePicker'
import ModalPortal from '../components/ModalPortal'

export default function Workout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [exercises, setExercises] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [showRoutinePicker, setShowRoutinePicker] = useState(false)
  const [routines, setRoutines] = useState([])
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const routineId = location.state?.routineId
    if (routineId) {
      db.routines.get(routineId).then(r => {
        if (!r) return
        setExercises(
          (r.exercises || []).map(e => ({
            exerciseId: e.exerciseId,
            name: e.name,
            type: e.type,
            sets: e.type === 'cardio'
              ? Array.from({ length: e.sets || 1 }, () => ({ duration: e.duration || 30, distance: e.distance || 0, done: false }))
              : Array.from({ length: e.sets || 3 }, () => ({ reps: e.reps || 10, weight: e.weight || 0, done: false })),
          }))
        )
      })
    }
  }, [location.state])

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startTime])

  useEffect(() => {
    db.routines.toArray().then(r => setRoutines([...r].sort((a, b) => b.id - a.id)))
  }, [])

  function addRoutine(routine) {
    const toAdd = (routine.exercises || []).map(e => ({
      exerciseId: e.exerciseId,
      name: e.name,
      type: e.type,
      sets: e.type === 'cardio'
        ? Array.from({ length: e.sets || 1 }, () => ({ duration: e.duration || 30, distance: e.distance || 0, done: false }))
        : Array.from({ length: e.sets || 3 }, () => ({ reps: e.reps || 10, weight: e.weight || 0, done: false })),
    }))
    setExercises(prev => [...prev, ...toAdd])
    setShowRoutinePicker(false)
  }

  function addExercise(ex) {
    const isCardio = ex.type === 'cardio'
    setExercises(prev => [
      ...prev,
      {
        exerciseId: ex.id,
        name: ex.name,
        type: ex.type,
        sets: isCardio ? [{ duration: 30, distance: 0, done: false }] : [{ reps: 10, weight: 0, done: false }],
      },
    ])
    setShowPicker(false)
  }

  function updateSet(exIdx, setIdx, field, value) {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex
      return { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) }
    }))
  }

  function toggleDone(exIdx, setIdx) {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex
      return { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, done: !s.done } : s) }
    }))
  }

  function addSet(exIdx) {
    setExercises(prev => prev.map((ex, i) => {
      if (i !== exIdx) return ex
      const last = ex.sets[ex.sets.length - 1] || { reps: 10, weight: 0 }
      const isCardio = 'duration' in last
      const newSet = isCardio
        ? { duration: last.duration, distance: last.distance, done: false }
        : { reps: last.reps, weight: last.weight, done: false }
      return { ...ex, sets: [...ex.sets, newSet] }
    }))
  }

  function removeExercise(exIdx) {
    setExercises(prev => prev.filter((_, i) => i !== exIdx))
  }

  async function finish() {
    if (exercises.length === 0) { navigate('/'); return }
    setSaving(true)
    const todayStr = new Date().toISOString().slice(0, 10)
    const newExercises = exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      name: ex.name,
      sets: ex.sets.filter(s => s.done),
    }))
    const allLogs = await db.workoutLogs.toArray()
    const existing = allLogs.find(l => l.date === todayStr)
    if (existing) {
      await db.workoutLogs.put({
        ...existing,
        duration: (existing.duration || 0) + elapsed,
        exercises: [...(existing.exercises || []), ...newExercises],
      })
    } else {
      await db.workoutLogs.add({ date: todayStr, duration: elapsed, exercises: newExercises })
    }
    navigate('/')
  }

  const fmtElapsed = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-xl font-bold">운동 중</h1>
          <p className="text-slate-400 text-sm">{fmtElapsed}</p>
        </div>
        <button
          onClick={finish}
          disabled={saving}
          className="btn-grad  disabled:opacity-50 px-4 py-2 rounded-xl text-sm font-medium"
        >
          완료
        </button>
      </div>

      <Timer elapsed={elapsed} />

      <div className="space-y-3">
        {exercises.map((ex, exIdx) => (
          <div key={exIdx} className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{ex.name}</p>
              <button onClick={() => removeExercise(exIdx)} className="text-slate-500 text-xs">삭제</button>
            </div>

            {(() => {
              const isCardio = ex.sets[0] && 'duration' in ex.sets[0]
              return (
                <>
                  <div className="grid grid-cols-12 gap-1 text-xs text-slate-500 px-1">
                    <span className="col-span-1">세트</span>
                    <span className="col-span-5 text-center">{isCardio ? '시간 (분)' : '무게 (kg)'}</span>
                    <span className="col-span-4 text-center">{isCardio ? '거리 (km)' : '횟수'}</span>
                    <span className="col-span-2 text-center">✓</span>
                  </div>
                  {ex.sets.map((s, setIdx) => (
                    <div key={setIdx} className={`grid grid-cols-12 gap-1 items-center rounded-xl px-1 py-1 transition-opacity ${s.done ? 'opacity-40' : ''}`}>
                      <span className="col-span-1 text-xs text-slate-500">{setIdx + 1}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={isCardio ? s.duration : s.weight}
                        onFocus={e => e.target.select()}
                        onChange={e => updateSet(exIdx, setIdx, isCardio ? 'duration' : 'weight', Number(e.target.value) || 0)}
                        className="col-span-5 glass-input rounded-lg text-center text-sm py-1.5 w-full outline-none focus:ring-1 focus:ring-violet-500"
                      />
                      <input
                        type="text"
                        inputMode={isCardio ? 'decimal' : 'numeric'}
                        value={isCardio ? s.distance : s.reps}
                        onFocus={e => e.target.select()}
                        onChange={e => updateSet(exIdx, setIdx, isCardio ? 'distance' : 'reps', Number(e.target.value) || 0)}
                        className="col-span-4 glass-input rounded-lg text-center text-sm py-1.5 w-full outline-none focus:ring-1 focus:ring-violet-500"
                      />
                      <button
                        onClick={() => toggleDone(exIdx, setIdx)}
                        className={`col-span-2 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${s.done ? 'btn-grad' : 'glass-input'}`}
                      >
                        {s.done ? '✓' : ''}
                      </button>
                    </div>
                  ))}
                </>
              )
            })()}

            <button
              onClick={() => addSet(exIdx)}
              className="w-full py-1.5 rounded-xl glass-input hover:bg-[#252530] text-sm text-slate-400 transition-colors"
            >
              + 세트 추가
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowPicker(true)}
          className="py-3 rounded-2xl text-sm text-slate-400 hover:text-violet-400 transition-colors"
          style={{ border: '2px dashed rgba(255,255,255,0.12)' }}
        >
          + 종목 추가
        </button>
        <button
          onClick={() => setShowRoutinePicker(true)}
          className="py-3 rounded-2xl text-sm text-slate-400 hover:text-violet-400 transition-colors"
          style={{ border: '2px dashed rgba(255,255,255,0.12)' }}
        >
          + 루틴 추가
        </button>
      </div>

      {showPicker && (
        <ExercisePicker
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showRoutinePicker && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setShowRoutinePicker(false)}>
            <div className="w-full max-w-lg mx-auto rounded-t-3xl animate-slideup flex flex-col"
              style={{ maxHeight: '80vh', background: '#0e0e1c', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none' }}
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
              </div>
              <div className="flex items-center justify-between px-4 py-3 shrink-0">
                <p className="font-bold">루틴 추가</p>
                <button onClick={() => setShowRoutinePicker(false)} className="text-slate-500 text-sm">닫기</button>
              </div>
              <p className="text-xs text-slate-500 px-4 pb-2 shrink-0">선택한 루틴의 종목이 현재 운동에 추가됩니다</p>
              <div className="overflow-y-auto flex-1 px-4 pb-8 space-y-2">
                {routines.length === 0 ? (
                  <p className="text-center text-slate-500 py-8 text-sm">저장된 루틴이 없습니다</p>
                ) : (
                  routines.map(r => (
                    <button key={r.id}
                      onClick={() => addRoutine(r)}
                      className="w-full glass rounded-2xl px-4 py-4 flex items-center justify-between text-left">
                      <div>
                        <p className="font-semibold text-sm">{r.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {(r.exercises || []).map(e => e.name).join(', ').slice(0, 40)}...
                        </p>
                      </div>
                      <span className="text-violet-400 text-lg ml-2 shrink-0">+</span>
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
