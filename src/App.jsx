import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { seedExercises, seedRoutines } from './db'
import Layout from './components/Layout'
import Home from './pages/Home'
import Workout from './pages/Workout'
import Routines from './pages/Routines'
import PTProgram from './pages/PTProgram'
import History from './pages/History'
import Exercises from './pages/Exercises'
import Settings from './pages/Settings'

export default function App() {
  useEffect(() => { seedExercises(); seedRoutines() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/routines" element={<Routines />} />
          <Route path="/pt-program" element={<PTProgram />} />
          <Route path="/history" element={<History />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
