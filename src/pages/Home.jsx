import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Home() {
  const [programs, setPrograms] = useState([])
  const [todayLog, setTodayLog] = useState(null)
  const navigate = useNavigate()
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const userName = localStorage.getItem('userName') || 'Calvin'

  useEffect(() => {
    db.ptPrograms.toArray().then(setPrograms)
    db.workoutLogs.where('date').equals(todayStr).first().then(setTodayLog)
  }, [todayStr])

  const todayDay = today.getDay()

  const todaySchedules = programs.flatMap(p =>
    (p.schedule || [])
      .filter(s => s.day === todayDay)
      .map(s => ({ programName: p.name, routineId: s.routineId, routineName: s.routineName }))
  )

  return (
    <div className="p-4 space-y-5">
      {/* 앱 로고 헤더 */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#ff4757] flex items-center justify-center shadow-lg shadow-[#ff4757]/30">
            <span className="text-white font-black text-sm leading-none">A</span>
          </div>
          <span className="text-white font-bold text-lg tracking-wide">AvitaZ</span>
        </div>
        <span className="text-slate-500 text-xs">{today.getFullYear()}.{String(today.getMonth() + 1).padStart(2, '0')}.{String(today.getDate()).padStart(2, '0')}</span>
      </div>

      <div>
        <p className="text-slate-400 text-sm">{DAYS[today.getDay()]}요일</p>
        <h1 className="text-2xl font-bold mt-0.5">안녕하세요 {userName}님!! 👋</h1>
      </div>

      {todayLog && (
        <div className="bg-[#ff4757]/10 border border-[#ff4757]/40 rounded-2xl p-4">
          <p className="text-[#ff6b6b] text-sm font-medium">오늘 운동 완료 ✓</p>
          <p className="text-slate-400 text-xs mt-0.5">{todayLog.exercises?.length ?? 0}개 종목</p>
        </div>
      )}

      {todaySchedules.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-400 font-medium">오늘의 PT 프로그램</p>
          {todaySchedules.map((s, i) => (
            <button
              key={i}
              onClick={() => navigate('/workout', { state: { routineId: s.routineId } })}
              className="w-full bg-slate-800 rounded-2xl p-4 flex items-center justify-between text-left"
            >
              <div>
                <p className="text-xs text-slate-500">{s.programName}</p>
                <p className="font-semibold mt-0.5">{s.routineName || '루틴'}</p>
              </div>
              <span className="text-[#ff4757] text-sm">시작 →</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <QuickCard
          title="빠른 시작"
          sub="빈 운동 시작"
          color="bg-[#ff4757]"
          onClick={() => navigate('/workout')}
        />
        <QuickCard
          title="루틴으로 시작"
          sub="저장된 루틴"
          color="bg-slate-700"
          onClick={() => navigate('/routines')}
        />
      </div>

      <WeekStreak />
    </div>
  )
}

function QuickCard({ title, sub, color, onClick }) {
  return (
    <button onClick={onClick} className={`${color} rounded-2xl p-4 text-left space-y-1`}>
      <p className="font-bold">{title}</p>
      <p className="text-xs opacity-70">{sub}</p>
    </button>
  )
}

function WeekStreak() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const sunday = new Date()
    sunday.setDate(sunday.getDate() - sunday.getDay())
    const fromStr = sunday.toISOString().slice(0, 10)
    db.workoutLogs.where('date').aboveOrEqual(fromStr).toArray().then(setLogs)
  }, [])

  const todayStr = new Date().toISOString().slice(0, 10)
  const sunday = new Date()
  sunday.setDate(sunday.getDate() - sunday.getDay())

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return {
      label: DAYS[d.getDay()],
      date: d.toISOString().slice(0, 10),
      isToday: d.toISOString().slice(0, 10) === todayStr,
    }
  })

  const logDates = new Set(logs.map(l => l.date))

  return (
    <div className="bg-slate-800 rounded-2xl p-4">
      <p className="text-sm text-slate-400 mb-3">이번 주 운동</p>
      <div className="flex justify-between">
        {days.map(d => (
          <div key={d.date} className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
              ${logDates.has(d.date) ? 'bg-[#ff4757] text-white' : 'bg-slate-700 text-slate-500'}
              ${d.isToday ? 'ring-2 ring-[#ff4757] ring-offset-1 ring-offset-[#222]' : ''}`}>
              {logDates.has(d.date) ? '✓' : ''}
            </div>
            <span className={`text-xs ${d.isToday ? 'text-[#ff6b6b]' : 'text-slate-500'}`}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
