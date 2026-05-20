import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'
import ExercisePicker from '../components/ExercisePicker'

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
        <button onClick={startNew} className="bg-[#a855f7] hover:bg-[#c084fc] px-3 py-1.5 rounded-xl text-sm">
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
          <div key={r.id} className="bg-slate-800 rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.exercises?.length ?? 0}개 종목</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/workout', { state: { routineId: r.id } })}
                  className="text-xs bg-[#a855f7] px-3 py-1.5 rounded-lg"
                >
                  시작
                </button>
                <button
                  onClick={() => setEditing(r)}
                  className="text-xs bg-slate-700 px-3 py-1.5 rounded-lg"
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
                  <span key={i} className="text-xs bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">
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
  const [showPicker, setShowPicker] = useState(false)

  function addExercise(ex) {
    setExercises(prev => [...prev, { exerciseId: ex.id, name: ex.name, sets: 3, reps: 10, weight: 0 }])
    setShowPicker(false)
  }

  function updateExercise(idx, field, value) {
    setExercises(prev => prev.map((e, i) => i === idx ? { ...e, [field]: Number(value) } : e))
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
          className="bg-[#a855f7] hover:bg-[#c084fc] disabled:opacity-50 px-4 py-1.5 rounded-xl text-sm"
        >
          저장
        </button>
      </div>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="루틴 이름"
        className="w-full bg-[#16161e] rounded-xl px-4 py-3 text-lg font-semibold outline-none focus:ring-1 focus:ring-[#a855f7]"
      />

      <div className="space-y-2">
        {exercises.map((ex, idx) => (
          <div key={idx} className="bg-[#16161e] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{ex.name}</p>
              <button onClick={() => removeExercise(idx)} className="text-xs text-slate-500">삭제</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[['sets', '세트'], ['reps', '횟수'], ['weight', '무게(kg)']].map(([field, label]) => (
                <div key={field} className="text-center">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={ex[field]}
                    onChange={e => updateExercise(idx, field, e.target.value)}
                    className="w-full bg-[#1e1e2a] rounded-lg text-center text-sm py-1.5 outline-none focus:ring-1 focus:ring-[#a855f7]"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowPicker(true)}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-[#333] text-slate-400 hover:border-[#a855f7] hover:text-[#a855f7] transition-colors"
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
