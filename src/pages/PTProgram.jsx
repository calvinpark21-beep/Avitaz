import { useState, useEffect } from 'react'
import { db } from '../db'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function PTProgram() {
  const [programs, setPrograms] = useState([])
  const [editing, setEditing] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setPrograms(await db.ptPrograms.toArray())
  }

  async function deleteProgram(id) {
    await db.ptPrograms.delete(id)
    load()
  }

  if (editing) {
    return (
      <ProgramEditor
        initial={editing}
        onSave={async p => {
          if (p.id) await db.ptPrograms.put(p)
          else await db.ptPrograms.add(p)
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
        <h1 className="text-xl font-bold">PT 프로그램</h1>
        <button
          onClick={() => setEditing({ name: '', schedule: [] })}
          className="btn-grad  px-3 py-1.5 rounded-xl text-sm"
        >
          + 새 프로그램
        </button>
      </div>

      {programs.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <p className="text-4xl mb-3">🏋️</p>
          <p>PT 프로그램이 없습니다</p>
          <p className="text-sm mt-1">트레이너에게 받은 프로그램을 등록하세요</p>
        </div>
      )}

      <div className="space-y-3">
        {programs.map(p => (
          <div key={p.id} className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{p.name}</p>
              <div className="flex gap-2">
                <button onClick={() => setEditing(p)} className="text-xs glass px-3 py-1.5 rounded-lg">편집</button>
                <button onClick={() => deleteProgram(p.id)} className="text-xs text-slate-500 px-2 py-1.5 rounded-lg">삭제</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d, i) => {
                const hasSchedule = (p.schedule || []).some(s => s.day === i)
                return (
                  <div key={i} className={`rounded-lg py-2 text-center text-xs font-medium ${hasSchedule ? 'btn-grad text-white' : 'glass text-slate-500'}`}>
                    {d}
                  </div>
                )
              })}
            </div>
            {(p.schedule || []).length > 0 && (
              <div className="space-y-1">
                {p.schedule.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{DAYS[s.day]}요일</span>
                    <span className="text-slate-300">{s.routineName || '루틴 미지정'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProgramEditor({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial.name)
  const [schedule, setSchedule] = useState(initial.schedule || [])
  const [routines, setRoutines] = useState([])
  const [editDay, setEditDay] = useState(null)

  useEffect(() => { db.routines.toArray().then(setRoutines) }, [])

  function toggleDay(day) {
    if (schedule.some(s => s.day === day)) {
      setSchedule(prev => prev.filter(s => s.day !== day))
    } else {
      setEditDay({ day, routineId: null, routineName: '' })
    }
  }

  function confirmDay(routineId, routineName) {
    setSchedule(prev => {
      const next = prev.filter(s => s.day !== editDay.day)
      return [...next, { day: editDay.day, routineId, routineName }].sort((a, b) => a.day - b.day)
    })
    setEditDay(null)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-4">
        <button onClick={onCancel} className="text-slate-400 text-sm">← 취소</button>
        <button
          onClick={() => onSave({ ...initial, name, schedule })}
          disabled={!name}
          className="btn-grad  disabled:opacity-50 px-4 py-1.5 rounded-xl text-sm"
        >
          저장
        </button>
      </div>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="프로그램 이름 (예: 3개월 PT 프로그램)"
        className="w-full glass rounded-xl px-4 py-3 text-lg font-semibold outline-none focus:ring-1 focus:ring-violet-500"
      />

      <div>
        <p className="text-sm text-slate-400 mb-2">운동일 설정 (탭하여 토글)</p>
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((d, i) => {
            const s = schedule.find(s => s.day === i)
            return (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`rounded-xl py-3 flex flex-col items-center gap-1 transition-colors ${
                  s ? 'btn-grad' : 'glass text-slate-400'
                }`}
              >
                <span className="text-xs font-medium">{d}</span>
                {s && <span className="text-[10px] opacity-80">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {schedule.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-400">요일별 루틴</p>
          {schedule.map((s, i) => (
            <button
              key={i}
              onClick={() => setEditDay(s)}
              className="w-full flex items-center justify-between glass rounded-xl px-4 py-3"
            >
              <span className="text-sm font-medium">{DAYS[s.day]}요일</span>
              <span className="text-sm text-slate-400">{s.routineName || '루틴 선택 →'}</span>
            </button>
          ))}
        </div>
      )}

      {editDay !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end">
          <div className="w-full max-w-lg mx-auto glass rounded-t-3xl animate-slideup p-4">
            <p className="font-semibold mb-3">{DAYS[editDay.day]}요일 루틴 선택</p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              <button
                onClick={() => confirmDay(null, '휴식일')}
                className="w-full text-left px-4 py-3 rounded-xl glass text-slate-400 text-sm"
              >
                🛌 휴식일
              </button>
              {routines.map(r => (
                <button
                  key={r.id}
                  onClick={() => confirmDay(r.id, r.name)}
                  className="w-full text-left px-4 py-3 rounded-xl hover:glass glass text-sm"
                >
                  {r.name}
                </button>
              ))}
            </div>
            <button onClick={() => setEditDay(null)} className="mt-3 w-full py-2 text-slate-400 text-sm">취소</button>
          </div>
        </div>
      )}
    </div>
  )
}
