import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts'
import { db } from '../db'
import ModalPortal from '../components/ModalPortal'

const TABS = ['리포트', '인바디']
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function History() {
  const [tab, setTab] = useState('리포트')

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

      {tab === '리포트' && <ReportTab />}
      {tab === '인바디' && <InbodyTab />}
    </div>
  )
}

/* ─── 리포트 탭 ─── */
function ReportTab() {
  const [mode, setMode] = useState('weekly')
  const [logs, setLogs] = useState([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)

  useEffect(() => {
    db.workoutLogs.toArray().then(setLogs)
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function getWeekStart(offset) {
    const d = new Date(today)
    d.setDate(today.getDate() - today.getDay() + offset * 7)
    return d
  }

  function weekData() {
    const start = getWeekStart(weekOffset)
    return WEEKDAYS.map((day, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      const mins = Math.round(
        logs.filter(l => l.date === dateStr).reduce((s, l) => s + (l.duration || 0), 0) / 60
      )
      const todayLocal = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
      const isToday = dateStr === todayLocal
      return { day, mins, isToday }
    })
  }

  function monthData() {
    const ref = new Date(today)
    ref.setDate(1)
    ref.setMonth(today.getMonth() + monthOffset)
    const y = ref.getFullYear()
    const m = ref.getMonth()
    const from = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const to = `${y}-${String(m + 1).padStart(2, '0')}-31`
    const byDay = Array(7).fill(0)
    logs.filter(l => l.date >= from && l.date <= to).forEach(l => {
      const wd = new Date(l.date + 'T00:00:00').getDay()
      byDay[wd] += l.duration || 0
    })
    return WEEKDAYS.map((day, i) => ({ day, mins: Math.round(byDay[i] / 60) }))
  }

  const data = mode === 'weekly' ? weekData() : monthData()
  const totalMins = data.reduce((s, d) => s + d.mins, 0)

  const weekStart = getWeekStart(weekOffset)
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
  const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()} — ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`

  const monthRef = new Date(today); monthRef.setMonth(today.getMonth() + monthOffset)
  const monthLabel = `${monthRef.getFullYear()}년 ${monthRef.getMonth() + 1}월`

  function prevPeriod() { mode === 'weekly' ? setWeekOffset(w => w - 1) : setMonthOffset(m => m - 1) }
  function nextPeriod() {
    if (mode === 'weekly') setWeekOffset(w => Math.min(0, w + 1))
    else setMonthOffset(m => Math.min(0, m + 1))
  }

  const CustomBar = (props) => {
    const { x, y, width, height, payload } = props
    const fill = payload?.isToday ? '#db2777' : 'url(#barGrad)'
    if (height <= 0) return null
    return <rect x={x} y={y} width={width} height={height} rx={5} ry={5} fill={fill} />
  }

  return (
    <div className="space-y-4">
      <div className="flex glass rounded-xl p-1 gap-1">
        {[['weekly', '주간'], ['monthly', '월간']].map(([val, label]) => (
          <button key={val} onClick={() => setMode(val)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              mode === val ? 'btn-grad text-white' : 'text-slate-400'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-1">
        <button onClick={prevPeriod} className="w-8 h-8 glass rounded-xl flex items-center justify-center text-slate-300 text-lg">‹</button>
        <p className="text-sm font-semibold">{mode === 'weekly' ? weekLabel : monthLabel}</p>
        <button onClick={nextPeriod} className="w-8 h-8 glass rounded-xl flex items-center justify-center text-slate-300 text-lg">›</button>
      </div>

      <div className="glass rounded-2xl p-4 text-center">
        <p className="text-xs text-slate-500 mb-1">총 운동 시간</p>
        <p className="text-2xl font-bold text-grad">
          {Math.floor(totalMins / 60) > 0 ? `${Math.floor(totalMins / 60)}시간 ` : ''}{totalMins % 60}분
        </p>
        {totalMins === 0 && <p className="text-xs text-slate-600 mt-1">기록 없음</p>}
      </div>

      <div className="glass rounded-2xl p-4">
        <p className="text-xs text-slate-500 mb-4">요일별 운동 시간 (분)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={30} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              contentStyle={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8', fontSize: 13 }}
              formatter={v => [`${v}분`, '운동']}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar dataKey="mins" shape={<CustomBar />} />
          </BarChart>
        </ResponsiveContainer>
        {mode === 'weekly' && (
          <p className="text-xs text-center text-pink-400 mt-2">■ 오늘</p>
        )}
      </div>
    </div>
  )
}

/* ─── 인바디 탭 ─── */
const INBODY_FIELDS = [
  { key: 'weight',  label: '체중',    unit: 'kg', color: "#a855f7" },
  { key: 'muscle',  label: '골격근량', unit: 'kg', color: '#10b981' },
  { key: 'fat',     label: '체지방량', unit: 'kg', color: '#f59e0b' },
  { key: 'fatPct',  label: '체지방률', unit: '%',  color: '#ef4444' },
  { key: 'bmi',     label: 'BMI',     unit: '',   color: '#3b82f6' },
]

function InbodyTab() {
  const [logs, setLogs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(), weight: '', muscle: '', fat: '', fatPct: '', bmi: '' })
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
    setForm({ date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(), weight: '', muscle: '', fat: '', fatPct: '', bmi: '' })
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
        <button onClick={() => setShowForm(true)} className="btn-grad px-3 py-1.5 rounded-xl text-sm">
          + 측정 추가
        </button>
      </div>

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

      {graphData.length > 1 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex gap-1.5 flex-wrap">
            {INBODY_FIELDS.map(f => (
              <button key={f.key} onClick={() => setGraphField(f.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  graphField === f.key ? 'btn-grad text-white' : 'glass text-slate-400'
                }`}>
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
              <Line type="monotone" dataKey="value" stroke={fieldInfo?.color} strokeWidth={2}
                dot={{ fill: fieldInfo?.color, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

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

      {showForm && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] bg-black/70 flex items-end">
            <div className="w-full max-w-lg mx-auto glass rounded-t-3xl animate-slideup flex flex-col" style={{ maxHeight: '85vh' }}>
              <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
                <button onClick={() => setShowForm(false)} className="text-slate-400 text-sm">취소</button>
                <p className="font-semibold">인바디 측정 입력</p>
                <button onClick={saveLog} disabled={!form.date}
                  className="text-sm font-semibold text-violet-400 disabled:opacity-40">저장</button>
              </div>
              <div className="overflow-y-auto flex-1 px-4 pb-8 space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">측정일</p>
                  <input type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {INBODY_FIELDS.map(f => (
                    <div key={f.key}>
                      <p className="text-xs text-slate-500 mb-1">{f.label} {f.unit && `(${f.unit})`}</p>
                      <input type="number" inputMode="decimal" step="0.1" placeholder="—"
                        value={form[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full glass rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-violet-500" />
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
