import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, seedExercises } from '../db'

export default function Settings() {
  const navigate = useNavigate()
  const [name, setName] = useState(localStorage.getItem('userName') || '')
  const [goal, setGoal] = useState(localStorage.getItem('userGoal') || 'strength')
  const [stats, setStats] = useState({ workouts: 0, routines: 0, inbody: 0 })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      db.workoutLogs.count(),
      db.routines.count(),
      db.inbodyLogs.count(),
    ]).then(([w, r, i]) => setStats({ workouts: w, routines: r, inbody: i }))
  }, [])

  function save() {
    localStorage.setItem('userName', name)
    localStorage.setItem('userGoal', goal)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function exportData() {
    const [workoutLogs, inbodyLogs, routines] = await Promise.all([
      db.workoutLogs.toArray(),
      db.inbodyLogs.toArray(),
      db.routines.toArray(),
    ])
    const payload = { version: 1, exportedAt: new Date().toISOString(), workoutLogs, inbodyLogs, routines }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `avitaz-backup-${new Date().toLocaleDateString('ko-KR').replace(/\. /g,'-').replace('.','')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importData(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.workoutLogs || !data.inbodyLogs) throw new Error('잘못된 파일')
      if (!window.confirm(`백업 파일을 불러옵니다.\n운동기록 ${data.workoutLogs.length}개, 인바디 ${data.inbodyLogs.length}개, 루틴 ${(data.routines||[]).length}개\n\n기존 데이터는 유지되고 백업 데이터가 추가됩니다.`)) return
      const wLogs = data.workoutLogs.map(({ id: _, ...r }) => r)
      const iLogs = data.inbodyLogs.map(({ id: _, ...r }) => r)
      const rLogs = (data.routines || []).map(({ id: _, ...r }) => r)
      await db.workoutLogs.bulkAdd(wLogs)
      await db.inbodyLogs.bulkAdd(iLogs)
      if (rLogs.length) await db.routines.bulkAdd(rLogs)
      window.location.reload()
    } catch {
      alert('파일을 읽을 수 없습니다. 올바른 백업 파일인지 확인해주세요.')
    }
    e.target.value = ''
  }

  async function clearAllData() {
    if (!window.confirm('모든 데이터를 삭제합니다. 되돌릴 수 없습니다.')) return
    await Promise.all([
      db.workoutLogs.clear(),
      db.inbodyLogs.clear(),
    ])
    window.location.reload()
  }

  const GOALS = [
    { value: 'strength', label: '근력 향상' },
    { value: 'bulk', label: '벌크업' },
    { value: 'cut', label: '체중 감량' },
    { value: 'maintain', label: '체형 유지' },
  ]

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-xl font-bold pt-4">설정</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '운동 기록', value: stats.workouts, unit: '회' },
          { label: '루틴', value: stats.routines, unit: '개' },
          { label: '인바디', value: stats.inbody, unit: '회' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center animate-fadein">
            <p className="text-2xl font-bold text-violet-400">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 프로필 */}
      <div className="glass rounded-2xl p-4 space-y-3 animate-fadein">
        <p className="text-sm font-semibold text-slate-300">프로필</p>
        <div>
          <p className="text-xs text-slate-500 mb-1.5">이름 (선택)</p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="내 이름"
            className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-violet-500 transition-all"
          />
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1.5">운동 목표</p>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map(g => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  goal === g.value
                    ? 'btn-grad text-white scale-[1.02]'
                    : 'glass-input text-slate-400'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={save}
          className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            saved ? 'bg-emerald-600' : 'btn-grad '
          }`}
        >
          {saved ? '저장됨 ✓' : '저장'}
        </button>
      </div>

      {/* 앱 정보 */}
      <div className="glass rounded-2xl p-4 space-y-3 animate-fadein">
        <p className="text-sm font-semibold text-slate-300">앱 정보</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">앱 이름</span>
            <span className="text-slate-200">아비타즈 (AvitaZ)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">버전</span>
            <span className="text-slate-200">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">데이터 저장</span>
            <span className="text-slate-200">기기 내부 (오프라인)</span>
          </div>
        </div>
      </div>

      {/* 종목 관리 */}
      <div className="glass rounded-2xl overflow-hidden animate-fadein">
        <button
          onClick={() => navigate('/exercises')}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors"
        >
          <div className="text-left">
            <p className="text-sm font-medium text-slate-200">종목 관리</p>
            <p className="text-xs text-slate-500 mt-0.5">PT 운동 추가 · 삭제 · 가이드 편집</p>
          </div>
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 백업 / 복원 */}
      <div className="glass rounded-2xl p-4 space-y-2 animate-fadein">
        <p className="text-sm font-semibold text-slate-300">백업 · 복원</p>
        <p className="text-xs text-slate-500">운동기록, 인바디, 루틴을 JSON 파일로 내보내거나 불러옵니다.</p>
        <button
          onClick={exportData}
          className="w-full py-2.5 rounded-xl text-sm font-medium btn-grad text-white"
        >
          백업 내보내기
        </button>
        <label className="w-full py-2.5 rounded-xl text-sm font-medium glass text-slate-300 flex items-center justify-center cursor-pointer" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          백업 불러오기
          <input type="file" accept=".json" className="hidden" onChange={importData} />
        </label>
      </div>

      {/* 데이터 관리 */}
      <div className="glass rounded-2xl p-4 space-y-2 animate-fadein">
        <p className="text-sm font-semibold text-slate-300">데이터 관리</p>
        <p className="text-xs text-slate-500">운동 기록과 인바디 데이터를 초기화합니다. 루틴과 PT 프로그램은 유지됩니다.</p>
        <button
          onClick={clearAllData}
          className="w-full py-2.5 rounded-xl text-sm font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
        >
          기록 데이터 초기화
        </button>
        <button
          onClick={async () => {
            localStorage.removeItem('exerciseSeedVersion')
            await seedExercises()
            window.location.reload()
          }}
          className="w-full py-2.5 rounded-xl text-sm font-medium glass/50 text-slate-400 hover:glass transition-colors"
        >
          종목 목록 초기화 (중복 제거)
        </button>
      </div>
    </div>
  )
}
