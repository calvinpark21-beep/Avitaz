import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { db } from '../db'
import ModalPortal from '../components/ModalPortal'

const TABS = ['운동그래프', '인바디']


export default function History() {
  const [tab, setTab] = useState('운동그래프')

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold pt-4">통계 · 기록</h1>

      <div className="flex glass rounded-xl p-1 gap-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t ? 'btn-grad text-white' : 'text-slate-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === '운동그래프' && <WorkoutGraphTab />}
      {tab === '인바디' && <InbodyTab />}
    </div>
  )
}

/* ─── 운동 그래프 탭 ─── */
function WorkoutGraphTab() {
  const [logs, setLogs] = useState([])
  const [exercises, setExercises] = useState([])
  const [graphExercise, setGraphExercise] = useState(null)
  const [graphData, setGraphData] = useState([])

  useEffect(() => {
    db.workoutLogs.orderBy('date').reverse().limit(90).toArray().then(setLogs)
    db.exercises.toArray().then(ex => {
      setExercises(ex)
      if (ex.length > 0) setGraphExercise(ex[0].id)
    })
  }, [])

  useEffect(() => {
    if (!graphExercise) return
    const exName = exercises.find(e => e.id === graphExercise)?.name
    if (!exName) return
    const data = []
    logs.forEach(log => {
      const ex = (log.exercises || []).find(e => e.name === exName)
      if (!ex || !ex.sets?.length) return
      const maxWeight = Math.max(...ex.sets.map(s => s.weight || 0))
      if (maxWeight > 0) data.push({ date: log.date.slice(5), weight: maxWeight })
    })
    setGraphData(data.reverse())
  }, [graphExercise, logs, exercises])

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-400 mb-2">종목 선택</p>
        <select
          value={graphExercise ?? ''}
          onChange={e => setGraphExercise(Number(e.target.value))}
          className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none"
        >
          {exercises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {graphData.length > 1 ? (
        <div className="glass rounded-2xl p-4">
          <p className="text-sm font-medium mb-4">{exercises.find(e => e.id === graphExercise)?.name} 최고 무게 추이</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit="kg" />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={v => [`${v}kg`, '무게']}
              />
              <Line type="monotone" dataKey="weight" stroke="#a855f7" strokeWidth={2} dot={{ fill: "#a855f7", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <p>해당 종목의 기록이 부족합니다</p>
          <p className="text-sm mt-1">2회 이상 운동하면 그래프가 표시됩니다</p>
        </div>
      )}
    </div>
  )
}

/* ─── 인바디 탭 ─── */
const INBODY_FIELDS = [
  { key: 'weight',     label: '체중',    unit: 'kg',  color: "#a855f7" },
  { key: 'muscle',     label: '골격근량', unit: 'kg',  color: '#10b981' },
  { key: 'fat',        label: '체지방량', unit: 'kg',  color: '#f59e0b' },
  { key: 'fatPct',     label: '체지방률', unit: '%',   color: '#ef4444' },
  { key: 'bmi',        label: 'BMI',     unit: '',    color: '#3b82f6' },
]

function InbodyTab() {
  const [logs, setLogs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), weight: '', muscle: '', fat: '', fatPct: '', bmi: '' })
  const [graphField, setGraphField] = useState('weight')

  useEffect(() => { loadLogs() }, [])

  async function loadLogs() {
    const data = await db.inbodyLogs.orderBy('date').reverse().limit(60).toArray()
    setLogs(data)
  }

  async function saveLog() {
    const entry = { date: form.date }
    INBODY_FIELDS.forEach(f => {
      const v = parseFloat(form[f.key])
      if (!isNaN(v)) entry[f.key] = v
    })
    await db.inbodyLogs.add(entry)
    setShowForm(false)
    setForm({ date: new Date().toISOString().slice(0, 10), weight: '', muscle: '', fat: '', fatPct: '', bmi: '' })
    loadLogs()
  }

  async function deleteLog(id) {
    await db.inbodyLogs.delete(id)
    loadLogs()
  }

  const graphData = [...logs].reverse().filter(l => l[graphField] != null)
    .map(l => ({ date: l.date.slice(5), value: l[graphField] }))

  const latest = logs[0]
  const prev = logs[1]

  function diff(key) {
    if (!latest?.[key] || !prev?.[key]) return null
    const d = (latest[key] - prev[key]).toFixed(1)
    return Number(d) > 0 ? `+${d}` : `${d}`
  }

  const fieldInfo = INBODY_FIELDS.find(f => f.key === graphField)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">인바디 기록</p>
        <button
          onClick={() => setShowForm(true)}
          className="btn-grad  px-3 py-1.5 rounded-xl text-sm"
        >
          + 측정 추가
        </button>
      </div>

      {/* 최신 수치 카드 */}
      {latest && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-xs text-slate-500">최근 측정 — {latest.date}</p>
          <div className="grid grid-cols-3 gap-2">
            {INBODY_FIELDS.filter(f => latest[f.key] != null).map(f => (
              <div key={f.key} className="glass rounded-xl p-2.5 text-center">
                <p className="text-xs text-slate-400 mb-0.5">{f.label}</p>
                <p className="font-bold text-sm" style={{ color: f.color }}>
                  {latest[f.key]}{f.unit}
                </p>
                {diff(f.key) && (
                  <p className={`text-xs mt-0.5 ${diff(f.key)?.startsWith('+') ? 'text-red-400' : 'text-emerald-400'}`}>
                    {diff(f.key)}{f.unit}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 그래프 */}
      {graphData.length > 1 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex gap-1.5 flex-wrap">
            {INBODY_FIELDS.map(f => (
              <button
                key={f.key}
                onClick={() => setGraphField(f.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  graphField === f.key ? 'btn-grad text-white' : 'glass text-slate-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit={fieldInfo?.unit} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={v => [`${v}${fieldInfo?.unit}`, fieldInfo?.label]}
              />
              <Line
                type="monotone" dataKey="value"
                stroke={fieldInfo?.color} strokeWidth={2}
                dot={{ fill: fieldInfo?.color, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 기록 목록 */}
      {logs.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">📊</p>
          <p>인바디 기록이 없습니다</p>
          <p className="text-sm mt-1">측정 결과를 직접 입력해 보세요</p>
        </div>
      )}

      <div className="space-y-2">
        {logs.map(log => (
          <div key={log.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{log.date}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {INBODY_FIELDS.filter(f => log[f.key] != null).map(f => (
                  <span key={f.key} className="text-xs text-slate-400">
                    {f.label} <span className="text-slate-200">{log[f.key]}{f.unit}</span>
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => deleteLog(log.id)} className="text-xs text-slate-600 hover:text-red-400 ml-2 shrink-0">삭제</button>
          </div>
        ))}
      </div>

      {/* 입력 모달 */}
      {showForm && (
        <ModalPortal>
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-end">
          <div className="w-full max-w-lg mx-auto glass rounded-t-3xl animate-slideup flex flex-col" style={{ maxHeight: '85vh' }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <button onClick={() => setShowForm(false)} className="text-slate-400 text-sm">취소</button>
              <p className="font-semibold">인바디 측정 입력</p>
              <button
                onClick={saveLog}
                disabled={!form.date}
                className="text-sm font-semibold text-violet-400 disabled:opacity-40"
              >
                저장
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 pb-8 space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">측정일</p>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {INBODY_FIELDS.map(f => (
                  <div key={f.key}>
                    <p className="text-xs text-slate-500 mb-1">{f.label} {f.unit && `(${f.unit})`}</p>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      placeholder="—"
                      value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  )
}
