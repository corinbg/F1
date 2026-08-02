import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ContentBoard from './pages/ContentBoard'
import Races from './pages/Races'
import RaceDetail from './pages/RaceDetail'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ContentBoard />} />
        <Route path="races" element={<Races />} />
        <Route path="races/:raceId" element={<RaceDetail />} />
      </Route>
    </Routes>
  )
}

export default App
