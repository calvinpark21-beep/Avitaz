import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db } from '../db'
import Timer from '../components/Timer'
import ExercisePicker from '../components/ExercisePicker'

export default function Workout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [exercises, setExercises] = useState([])
  const [showPicker, setShowPicker] = useState(false)
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
            sets: Array.from({ length: e.sets || 3 }, () => ({ reps: e.reps || 10, weight: e.weight || 0, done: false })),
          }))
        )
      })
    }
  }, [location.state])

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startTime])

  function addExercise(ex) {
    setExercises(prev => [
      ...prev,
      { exerciseId: ex.id, name: ex.name, sets: [{ reps: 10, weight: 0, done: false }] },
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
      return { ...ex, sets: [...ex.sets, { reps: last.reps, weight: last.weight, done: false }] }
    }))
  }

  function removeExercise(exIdx) {
    setExercises(prev => prev.filter((_, i) => i !== exIdx))
  }

  async function finish() {
    if (exercises.length === 0) { navigate('/'); return }
    setSaving(true)
    const todayStr = new Date().toISOString().slice(0, 10)
    await db.workoutLogs.add({
      date: todayStr,
      duration: elapsed,
      exercises: exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        sets: ex.sets.filter(s => s.done),
      })),
    })
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

      <Timer />

      <div className="space-y-3">
        {exercises.map((ex, exIdx) => (
          <div key={exIdx} className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{ex.name}</p>
              <button onClick={() => removeExercise(exIdx)} className="text-slate-500 text-xs">삭제</button>
            </div>

            <div className="grid grid-cols-12 gap-1 text-xs text-slate-500 px-1">
              <span className="col-span-1">세트</span>
              <span className="col-span-5 text-center">무게 (kg)</span>
              <span className="col-span-4 text-center">횟수</span>
              <span className="col-span-2 text-center">✓</span>
            </div>

            {ex.sets.map((s, setIdx) => (
              <div key={setIdx} className={`grid grid-cols-12 gap-1 items-center rounded-xl px-1 py-1 transition-opacity ${s.done ? 'opacity-40' : ''}`}>
                <span className="col-span-1 text-xs text-slate-500">{setIdx + 1}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={s.weight}
                  onChange={e => updateSet(exIdx, setIdx, 'weight', Number(e.target.value))}
                  className="col-span-5 glass-input rounded-lg text-center text-sm py-1.5 w-full outline-none focus:ring-1 focus:ring-violet-500"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={s.reps}
                  onChange={e => updateSet(exIdx, setIdx, 'reps', Number(e.target.value))}
                  className="col-span-4 glass-input rounded-lg text-center text-sm py-1.5 w-full outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button
                  onClick={() => toggleDone(exIdx, setIdx)}
                  className={`col-span-2 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
                    s.done ? 'btn-grad' : 'glass-input'
                  }`}
                >
                  {s.done ? '✓' : ''}
                </button>
              </div>
            ))}

            <button
              onClick={() => addSet(exIdx)}
              className="w-full py-1.5 rounded-xl glass-input hover:bg-[#252530] text-sm text-slate-400 transition-colors"
            >
              + 세트 추가
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowPicker(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-[#333] text-slate-400 hover:border-violet-500 hover:text-violet-400 transition-colors"
      >
        + 종목 추가
      </button>

      {showPicker && (
        <ExercisePicker
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
