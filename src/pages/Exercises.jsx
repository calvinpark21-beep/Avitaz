import { useState, useEffect } from 'react'
import { db } from '../db'

const CATEGORIES = ['전체', '가슴', '등', '어깨', '하체', '이두', '삼두', '복근', '맨손운동', '스트레칭', 'PT 운동']

export default function Exercises() {
  const [exercises, setExercises] = useState([])
  const [category, setCategory] = useState('전체')
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newCategory, setNewCategory] = useState('PT 운동')

  useEffect(() => { load() }, [])

  async function load() {
    setExercises(await db.exercises.toArray())
  }

  async function addExercise() {
    if (!newName.trim()) return
    const ex = { name: newName.trim(), category: newCategory }
    if (newNote.trim()) ex.note = newNote.trim()
    await db.exercises.add(ex)
    setNewName('')
    setNewNote('')
    setAdding(false)
    load()
  }

  async function deleteExercise(id) {
    await db.exercises.delete(id)
    load()
  }

  const filtered = exercises.filter(e => {
    const matchCat = category === '전체' || e.category === category
    const matchSearch = e.name.includes(search) || e.category?.includes(search)
    return matchCat && matchSearch
  })

  const grouped = {}
  filtered.forEach(e => {
    if (!grouped[e.category]) grouped[e.category] = []
    grouped[e.category].push(e)
  })
  Object.keys(grouped).forEach(cat => {
    if (cat === 'PT 운동') {
      grouped[cat].sort((a, b) => {
        if (!a.seeded && !b.seeded) return b.id - a.id  // 내가 추가한 것: 최신순
        if (!a.seeded) return -1                         // 내가 추가한 것 맨 위
        if (!b.seeded) return 1
        return a.id - b.id                               // 시드: 5/13(낮은 id) → 1일차
      })
    } else {
      grouped[cat].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    }
  })

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold">종목 목록</h1>
        <button
          onClick={() => setAdding(true)}
          className="bg-[#ff4757] hover:bg-[#ff6b6b] px-3 py-1.5 rounded-xl text-sm"
        >
          + 추가
        </button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="종목 검색..."
        className="w-full bg-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#ff4757]"
      />

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === c ? 'bg-[#ff4757] text-white' : 'bg-[#222] text-slate-400'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([cat, exs]) => (
          <div key={cat}>
            <p className="text-xs text-slate-500 font-medium mb-2 px-1">{cat}</p>
            <div className="space-y-1">
              {exs.map(ex => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3"
                >
                  <div>
                    <span className="text-sm">{ex.name}</span>
                    {ex.note && <p className="text-xs text-slate-500 mt-0.5">{ex.note}</p>}
                  </div>
                  <button
                    onClick={() => deleteExercise(ex.id)}
                    className="text-xs text-slate-600 hover:text-red-400 transition-colors ml-3 shrink-0"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end">
          <div className="w-full max-w-lg mx-auto bg-[#111] rounded-t-3xl animate-slideup flex flex-col" style={{ maxHeight: '80vh' }}>
            {/* 헤더 - 항상 보임 */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <button onClick={() => setAdding(false)} className="text-slate-400 text-sm">취소</button>
              <p className="font-semibold">새 종목 추가</p>
              <button
                onClick={addExercise}
                disabled={!newName.trim()}
                className="text-sm font-semibold text-[#ff4757] disabled:opacity-40"
              >
                추가
              </button>
            </div>
            {/* 스크롤 영역 */}
            <div className="overflow-y-auto px-4 pb-8 space-y-3">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addExercise()}
                placeholder="종목 이름"
                className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#ff4757]"
              />
              <input
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="가이드 / 메모 (선택 · 예: 15회 × 3세트)"
                className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#ff4757] text-slate-400"
              />
              <div>
                <p className="text-xs text-slate-500 mb-2">카테고리</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.slice(1).map(c => (
                    <button
                      key={c}
                      onClick={() => setNewCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        newCategory === c ? 'bg-[#ff4757] text-white' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
