import Dexie from 'dexie'

export const db = new Dexie('avitaz')

db.version(1).stores({
  exercises: '++id, name, category',
  routines: '++id, name',
  ptPrograms: '++id, name',
  workoutLogs: '++id, date, routineId',
})

db.version(2).stores({
  exercises: '++id, name, category',
  routines: '++id, name',
  ptPrograms: '++id, name',
  workoutLogs: '++id, date, routineId',
  inbodyLogs: '++id, date',
})

const SEED_VERSION = 'v13'

const EXERCISES = [
  // 가슴
  { name: '벤치프레스', category: '가슴' },
  { name: '인클라인 벤치프레스', category: '가슴' },
  { name: '덤벨 플라이', category: '가슴' },
  { name: '체스트 딥', category: '가슴' },
  { name: '케이블 크로스오버', category: '가슴' },
  // 등
  { name: '데드리프트', category: '등' },
  { name: '랫풀다운', category: '등' },
  { name: '바벨 로우', category: '등' },
  { name: '시티드 케이블 로우', category: '등' },
  { name: '풀업', category: '등' },
  { name: '케이블 풀오버', category: '등' },
  // 어깨
  { name: '오버헤드 프레스', category: '어깨' },
  { name: '사이드 레터럴 레이즈', category: '어깨' },
  { name: '프론트 레이즈', category: '어깨' },
  { name: '페이스 풀', category: '어깨' },
  { name: '리어 델트 플라이', category: '어깨' },
  // 하체
  { name: '스쿼트', category: '하체' },
  { name: '레그 프레스', category: '하체' },
  { name: '런지', category: '하체' },
  { name: '레그 컬', category: '하체' },
  { name: '레그 익스텐션', category: '하체' },
  { name: '루마니안 데드리프트', category: '하체' },
  { name: '힙 어브덕션', category: '하체' },
  { name: '카프 레이즈', category: '하체' },
  { name: '워킹런지', category: '하체' },
  { name: '사이드런지', category: '하체' },
  // 이두
  { name: '바벨 컬', category: '이두' },
  { name: '덤벨 컬', category: '이두' },
  { name: '해머 컬', category: '이두' },
  { name: '인클라인 덤벨 컬', category: '이두' },
  // 삼두
  { name: '트라이셉스 푸시다운', category: '삼두' },
  { name: '오버헤드 트라이셉스 익스텐션', category: '삼두' },
  { name: '딥', category: '삼두' },
  { name: '클로즈그립 벤치프레스', category: '삼두' },
  // 복근
  { name: '크런치', category: '복근' },
  { name: '플랭크', category: '복근' },
  { name: '레그 레이즈', category: '복근' },
  { name: '바이시클 크런치', category: '복근' },
  { name: '케이블 크런치', category: '복근' },
  // 맨손운동
  { name: '푸시업', category: '맨손운동' },
  { name: '다이아몬드 푸시업', category: '맨손운동' },
  { name: '파이크 푸시업', category: '맨손운동' },
  { name: '친업', category: '맨손운동' },
  { name: '딥스', category: '맨손운동' },
  { name: '버피', category: '맨손운동' },
  { name: '마운틴 클라이머', category: '맨손운동' },
  { name: '점프 스쿼트', category: '맨손운동' },
  { name: '글루트 브릿지', category: '맨손운동' },
  { name: '슈퍼맨', category: '맨손운동' },
  { name: '브이업', category: '맨손운동' },
  // 스트레칭
  { name: '햄스트링 스트레칭', category: '스트레칭' },
  { name: '대퇴사두근 스트레칭', category: '스트레칭' },
  { name: '흉근 스트레칭', category: '스트레칭' },
  { name: '어깨 스트레칭', category: '스트레칭' },
  { name: '목 스트레칭', category: '스트레칭' },
  { name: '고관절 스트레칭', category: '스트레칭' },
  { name: '종아리 스트레칭', category: '스트레칭' },
  { name: '척추 트위스트', category: '스트레칭' },
  { name: '어깨 회전', category: '스트레칭' },
  { name: '전신 스트레칭', category: '스트레칭' },
  { name: '광배근 스트레칭', category: '스트레칭' },
  // 유산소
  { name: '걷기', category: '유산소', type: 'cardio' },
  { name: '슬로우러닝', category: '유산소', type: 'cardio' },
  // PT 운동 (등·요가)
  { name: '부장가아사나', category: 'PT 운동', note: '베이비코브라자세' },
  // PT 운동 (5/20 — 최신)
  { name: '옆구리 비틀기', category: 'PT 운동', note: '5/20 · 네발자세에서 비틀기' },
  { name: '비둘기 자세', category: 'PT 운동', note: '5/20 · 한쪽 다리 책상다리' },
  { name: '버드도그', category: 'PT 운동', note: '5/20 · 네발자세에서 팔다리 뻗기' },
  { name: '다운도그', category: 'PT 운동', note: '5/20' },
  { name: 'T밸런스 접었다폈다', category: 'PT 운동', note: '5/20' },
  { name: '원레그 카프레이즈', category: 'PT 운동', note: '5/20 · w/밸패' },
  { name: '원레그 서클', category: 'PT 운동', note: '5/20 · w/밸패&짐볼' },
  { name: 'Y레이즈 (서서)', category: 'PT 운동', note: '5/20 · 테라밴드' },
  { name: 'Y레이즈 (허리숙여서)', category: 'PT 운동', note: '5/20 · 맨손' },
  // PT 운동 (5/13)
  { name: 'T밸런스 허리숙였다 올라오기', category: 'PT 운동', note: '5/13' },
  { name: '스텝박스 런지 무릎올리기', category: 'PT 운동', note: '5/13' },
  { name: '코펜하겐 플랭크', category: 'PT 운동', note: '5/13' },
  // PT 운동 (5/6)
  { name: '팔꿈치 네발자세 다리 뻗기', category: 'PT 운동', note: '5/6 · 무릎 접었다 펴기' },
  { name: '짐볼 요추 분절 운동', category: 'PT 운동', note: '5/6' },
  { name: '힙 에어플레인', category: 'PT 운동', note: '5/6' },
  // PT 운동 (4/29)
  { name: '딥식스 운동', category: 'PT 운동', note: '4/29' },
  { name: '요추굴곡 코어운동', category: 'PT 운동', note: '4/29 · 플랭크와 함께' },
  // PT 운동 (4/22)
  { name: '미니볼 8자 밸런스', category: 'PT 운동', note: '4/22' },
  { name: '스포밴드 광배근 운동', category: 'PT 운동', note: '4/22' },
  // PT 운동 (4/15)
  { name: '네발자세 다리 뒤로 뻗어 버티기', category: 'PT 운동', note: '4/15' },
  { name: '한발 서서 팔 회전', category: 'PT 운동', note: '4/15 · 4kg 덤벨' },
  { name: '견갑골 안정화 운동', category: 'PT 운동', note: '4/15 · 스포밴드' },
  // PT 운동 (4/9)
  { name: '복근 다리뻗어 버티기', category: 'PT 운동', note: '4/9' },
  { name: '폼롤러 스완', category: 'PT 운동', note: '4/9' },
  { name: '흉추 가동성 운동', category: 'PT 운동', note: '4/9' },
  // PT 운동 (12일차)
  { name: '다운도그 & 하이런지', category: 'PT 운동', note: '12일차' },
  { name: '원레그 데드리프트', category: 'PT 운동', note: '12일차 · 2kg 덤벨' },
  { name: '짐볼 잭나이프', category: 'PT 운동', note: '12일차' },
  { name: '짐볼 싯티드 코어', category: 'PT 운동', note: '12일차' },
  { name: '사이드플랭크 덤벨', category: 'PT 운동', note: '12일차' },
  // PT 운동 (11일차)
  { name: '다리 옆으로 원 그리기', category: 'PT 운동', note: '11일차' },
  { name: '엘보-핸즈 플랭크 연결', category: 'PT 운동', note: '11일차' },
  // PT 운동 (9일차)
  { name: '짐볼 무릎 터치 밸런스', category: 'PT 운동', note: '9일차' },
  { name: '딥스쿼트', category: 'PT 운동', note: '9일차 · 스텝박스 8kg' },
  { name: '사이드 플랭크', category: 'PT 운동', note: '9일차' },
  { name: '핸즈-사이드 플랭크 연결', category: 'PT 운동', note: '9일차' },
  { name: '필라테스 코어', category: 'PT 운동', note: '9일차' },
  // PT 운동 (8일차)
  { name: '보수 스쿼트', category: 'PT 운동', note: '8일차' },
  { name: '포워드 런지', category: 'PT 운동', note: '8일차 · 8kg' },
  { name: '백워드 런지', category: 'PT 운동', note: '8일차 · 8kg' },
  { name: '짐볼 밸런스 코어', category: 'PT 운동', note: '8일차 · 한발들고 좌우회전' },
  // PT 운동 (7일차)
  { name: '핸즈 플랭크', category: 'PT 운동', note: '7일차 · 10~20초 2회' },
  // PT 운동 (6일차)
  { name: '매달리기', category: 'PT 운동', note: '6일차 · 광배&복부' },
  { name: '엘보우 플랭크', category: 'PT 운동', note: '6일차 · 10~20초' },
  // PT 운동 (5일차)
  { name: '런지 밸런스', category: 'PT 운동', note: '5일차 · 좌우 10회 2~3세트' },
  { name: '공잡고 팔돌리기', category: 'PT 운동', note: '5일차 · 좌우 10회 2세트' },
  { name: '누워서 두발 뻗기', category: 'PT 운동', note: '5일차' },
  // PT 운동 (4일차)
  { name: 'T밸런스', category: 'PT 운동', note: '4일차 · 좌우 10회 2세트' },
  { name: '힙 서클', category: 'PT 운동', note: '4일차 · 좌우 10회 2세트' },
  { name: '짐볼 원레그 코어', category: 'PT 운동', note: '4일차 · 수건당기기/몸통회전' },
  { name: '누워서 다리뻗기', category: 'PT 운동', note: '4일차' },
  { name: '몸통 회전', category: 'PT 운동', note: '4일차' },
  // PT 운동 (3일차)
  { name: '수건잡고 팔 들기', category: 'PT 운동', note: '3일차 · 과신전 금지' },
  { name: '누워서 다리 번갈아 뻗기', category: 'PT 운동', note: '3일차 · 허리밀착' },
  { name: '바닥 스트레칭', category: 'PT 운동', note: '3일차' },
  // PT 운동 (2일차)
  { name: '네발자세 다리 앞으로 뻗기', category: 'PT 운동', note: '2일차' },
  { name: '밴드 스쿼트', category: 'PT 운동', note: '2일차' },
  { name: '테라밴드 다리 뻗기', category: 'PT 운동', note: '2일차' },
  // PT 운동 (1일차)
  { name: '호흡 연습', category: 'PT 운동', note: '1일차' },
  { name: '팔 크게 돌리기', category: 'PT 운동', note: '1일차' },
  { name: '걷기', category: 'PT 운동', note: '1일차 · 빠르게/보폭 늘리기' },
  { name: '네발자세 다리 옆으로 들기', category: 'PT 운동', note: '1일차' },
  { name: '하프스쿼트', category: 'PT 운동', note: '1일차' },
]

const ROUTINE_SEED_VERSION = 'v4'

const SEED_ROUTINES_V4 = [
  {
    name: '루틴8: 하체',
    exercises: [
      { name: '스쿼트', note: '바벨 30~40kg', sets: 3, reps: 10, weight: 35 },
      { name: '딥스쿼트', sets: 3, reps: 10, weight: 0 },
      { name: '워킹런지', note: 'w/8kg', sets: 3, reps: 10, weight: 8 },
      { name: '사이드런지', note: 'w/글라이더', sets: 3, reps: 10, weight: 0 },
    ],
  },
  {
    name: '루틴9: 등&요가',
    exercises: [
      { name: '폼롤러 스완', note: 'w/폼롤러', sets: 3, reps: 10, weight: 0 },
      { name: '부장가아사나', note: '베이비코브라자세', sets: 3, reps: 10, weight: 0 },
    ],
  },
]

const SEED_ROUTINES_V3 = [
  {
    name: '루틴5: 쉬었다가기',
    exercises: [
      { name: '스트레칭 루틴', note: '루틴3 참고', sets: 1, reps: 1, weight: 0 },
      { name: 'Y레이즈 (서서)', note: '테라밴드', sets: 3, reps: 20, weight: 0 },
      { name: 'Y레이즈 (허리숙여서)', note: '맨손', sets: 3, reps: 20, weight: 0 },
    ],
  },
  {
    name: '루틴6: 스트레칭+하체',
    exercises: [
      { name: '스트레칭 루틴', note: '루틴3 참고', sets: 1, reps: 1, weight: 0 },
      { name: '스쿼트', sets: 3, reps: 10, weight: 25 },
      { name: '스텝박스 런지 무릎올리기', note: 'w/스텝박스', sets: 2, reps: 10, weight: 0 },
      { name: 'T밸런스 접었다폈다', note: '좌우 각 10회 2세트', sets: 2, reps: 10, weight: 0 },
    ],
  },
  {
    name: '루틴7: 달리기',
    exercises: [
      { name: '스트레칭 루틴', note: '루틴3 참고', sets: 1, reps: 1, weight: 0 },
      { name: '코펜하겐 플랭크', sets: 3, reps: 30, weight: 0 },
      { name: '슬로우러닝', sets: 1, reps: 1, weight: 0 },
      { name: '원레그 데드리프트', note: '좌우 각 10회 2세트', sets: 2, reps: 10, weight: 0 },
    ],
  },
]

const SEED_ROUTINES_V2 = [
  {
    name: '루틴3: 스트레칭&코어',
    exercises: [
      { name: '옆구리 비틀기', note: '네발자세에서 비틀기', sets: 2, reps: 10, weight: 0 },
      { name: '비둘기 자세', note: '한쪽 다리 책상다리', sets: 2, reps: 30, weight: 0 },
      { name: '버드도그', note: '네발자세에서 팔다리 뻗기', sets: 3, reps: 10, weight: 0 },
      { name: '다운도그', sets: 3, reps: 10, weight: 0 },
    ],
  },
  {
    name: '루틴4: T밸런스',
    exercises: [
      { name: 'T밸런스 접었다폈다', sets: 3, reps: 10, weight: 0 },
      { name: '원레그 카프레이즈', note: 'w/밸패', sets: 3, reps: 10, weight: 0 },
      { name: '원레그 데드리프트', note: 'w/밸패&스텝박스', sets: 3, reps: 10, weight: 0 },
      { name: '원레그 서클', note: 'w/밸패&짐볼', sets: 3, reps: 10, weight: 0 },
      { name: 'Y레이즈 (서서)', note: '테라밴드', sets: 3, reps: 10, weight: 0 },
      { name: 'Y레이즈 (허리숙여서)', note: '맨손', sets: 3, reps: 10, weight: 0 },
    ],
  },
]

const SEED_ROUTINES = [
  {
    name: '루틴1',
    exercises: [
      { name: '바닥 스트레칭', sets: 1, reps: 10, weight: 0 },
      { name: '네발자세 다리 뒤로 뻗어 버티기', sets: 3, reps: 10, weight: 0 },
      { name: '팔꿈치 네발자세 다리 뒤로 뻗어 무릎 접었다 펴기', sets: 3, reps: 10, weight: 0 },
      { name: '힙 서클', sets: 2, reps: 10, weight: 0 },
      { name: '짐볼 요추 분절 운동', sets: 3, reps: 10, weight: 0 },
      { name: '스쿼트', sets: 3, reps: 10, weight: 30 },
      { name: '원레그 데드리프트', sets: 3, reps: 10, weight: 0 },
      { name: '힙 에어플레인', sets: 3, reps: 10, weight: 0 },
      { name: 'T밸런스', sets: 2, reps: 10, weight: 0 },
      { name: '플랭크', sets: 3, reps: 30, weight: 0 },
    ],
  },
  {
    name: '루틴2',
    exercises: [
      { name: '스쿼트', sets: 4, reps: 10, weight: 25 },
      { name: '스텝박스 런지 무릎올리기', sets: 2, reps: 10, weight: 6 },
      { name: '원레그 데드리프트', sets: 3, reps: 10, weight: 0 },
      { name: '네발자세 다리 뒤로 뻗어 버티기', sets: 3, reps: 30, weight: 0 },
      { name: '네발자세 다리 옆으로 들기', sets: 3, reps: 20, weight: 0 },
    ],
  },
]

export async function seedRoutines() {
  const savedVersion = localStorage.getItem('routineSeedVersion')
  if (savedVersion === ROUTINE_SEED_VERSION) return

  const existing = await db.routines.toArray()

  // 최초 설치: 루틴 없을 때만 루틴1, 2 추가
  if (existing.length === 0) {
    for (const r of SEED_ROUTINES) {
      await db.routines.add({
        ...r,
        exercises: r.exercises.map(e => ({ ...e, exerciseId: 0 })),
      })
    }
  }

  // v2: 루틴3, 4
  if (!savedVersion || savedVersion < 'v2') {
    for (const r of SEED_ROUTINES_V2) {
      await db.routines.add({ ...r, exercises: r.exercises.map(e => ({ ...e, exerciseId: 0 })) })
    }
  }

  // v3: 루틴5, 6, 7
  if (!savedVersion || savedVersion < 'v3') {
    for (const r of SEED_ROUTINES_V3) {
      await db.routines.add({ ...r, exercises: r.exercises.map(e => ({ ...e, exerciseId: 0 })) })
    }
  }

  // v4: 루틴8, 9
  if (!savedVersion || savedVersion < 'v4') {
    for (const r of SEED_ROUTINES_V4) {
      await db.routines.add({ ...r, exercises: r.exercises.map(e => ({ ...e, exerciseId: 0 })) })
    }
  }

  localStorage.setItem('routineSeedVersion', ROUTINE_SEED_VERSION)
}

export async function seedExercises() {
  const savedVersion = localStorage.getItem('exerciseSeedVersion')
  if (savedVersion === SEED_VERSION) return

  localStorage.setItem('exerciseSeedVersion', SEED_VERSION)

  const all = await db.exercises.toArray()
  const hasSeededFlag = all.some(e => e.seeded)

  if (hasSeededFlag) {
    // v8 이후: seeded 표시된 기본 운동만 삭제 → 사용자 추가 운동 보존
    const seedIds = all.filter(e => e.seeded).map(e => e.id)
    if (seedIds.length) await db.exercises.bulkDelete(seedIds)
  } else {
    // v7 이하에서 최초 업그레이드: 한 번만 전체 초기화
    await db.exercises.clear()
  }

  await db.exercises.bulkAdd(EXERCISES.map(e => ({ ...e, seeded: true })))
}
