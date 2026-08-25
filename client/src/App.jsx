import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import CreateRoom from './pages/CreateRoom.jsx'
import JoinRoom from './pages/JoinRoom.jsx'
import Room from './pages/Room.jsx'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/join-room" element={<JoinRoom />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </Router>
  )
}

export default App
