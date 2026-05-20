import { useState, useEffect } from 'react'
import { db } from '../db'
import ModalPortal from './ModalPortal'

const CATEGORIES = ['전체', '가슴', '등', '어깨', '하체', '이두', '삼두', '복근', '맨손운동', '스트레칭', '유산소', 'PT 운동']

export default function ExercisePicker({ onSelect, onClose }) {
  const [allExercises, setAllExercises] = useState([])
  const [category, setCategory] = useState('전체')
  const [search, setSearch] = useState('')

  useEffect(() => { db.exercises.toArray().then(setAllExercises) }, [])

  // 사용자가 직접 추가한 운동 (seeded 플래그 없음) — 최근 추가 순
  const myExercises = allExercises.filter(e => !e.seeded).sort((a, b) => b.id - a.id)

  const filtered = allExercises.filter(e => {
    if (!e.seeded && !search && category === '전체') return false // 내 운동은 위 섹션에서 따로 표시
    const matchCat = category === '전체' || e.category === category
    const matchSearch = !search || e.name.includes(search) || e.category?.includes(search)
    return matchCat && matchSearch
  })

  const grouped = {}
  filtered.forEach(e => {
    if (!grouped[e.category]) grouped[e.category] = []
    grouped[e.category].push(e)
  })

  const ExerciseRow = ({ ex }) => (
    <button
      key={ex.id}
      onClick={() => onSelect(ex)}
      className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-[#1e1e1e] hover:glass-input active:scale-[0.98] transition-all text-left"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{ex.name}</p>
        {ex.note && <p className="text-xs text-slate-500 mt-0.5">{ex.note}</p>}
      </div>
      <span className="text-xs text-slate-500 glass-input px-2 py-0.5 rounded-full ml-2 shrink-0">
        {ex.category}
      </span>
    </button>
  )

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto glass rounded-t-3xl animate-slideup flex flex-col"
        style={{ maxHeight: '75vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full glass" />
        </div>

        <div className="px-4 pb-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold">종목 선택</p>
            <button onClick={onClose} className="text-slate-500 text-sm">닫기</button>
          </div>

          {/* 검색 */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="종목 검색..."
            className="w-full bg-[#1e1e1e] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-violet-500"
          />

          {/* 카테고리 탭 */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  category === c
                    ? 'btn-grad text-white'
                    : 'glass-input text-slate-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 종목 리스트 */}
        <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-4">

          {/* 내가 추가한 종목 - 항상 맨 위 */}
          {myExercises.length > 0 && !search && (
            <div>
              <p className="text-xs font-semibold mb-1.5 px-1 sticky top-0 glass py-1 text-violet-400">
                내가 추가한 종목
              </p>
              <div className="space-y-1">
                {myExercises
                  .filter(e => category === '전체' || e.category === category)
                  .map(ex => <ExerciseRow key={ex.id} ex={ex} />)}
              </div>
            </div>
          )}

          {Object.entries(grouped).map(([cat, exs]) => (
            <div key={cat}>
              {category === '전체' && (
                <p className="text-xs text-slate-500 font-semibold mb-1.5 px-1 sticky top-0 glass py-1">{cat}</p>
              )}
              <div className="space-y-1">
                {exs.map(ex => <ExerciseRow key={ex.id} ex={ex} />)}
              </div>
            </div>
          ))}

          {filtered.length === 0 && myExercises.filter(e => !search || e.name.includes(search)).length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  )
}
