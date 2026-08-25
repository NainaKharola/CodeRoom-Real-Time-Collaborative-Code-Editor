import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Terminal, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useRoom } from '../context/RoomContext.jsx'

function CreateRoom() {
  const navigate = useNavigate()
  const { saveSession } = useRoom()
  const [formData, setFormData] = useState({
    roomName: '',
    roomId: '',
    password: '',
    creatorName: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Generate a random ID client-side matching the CR-XXXXXX pattern
  const handleGenerateId = (e) => {
    e.preventDefault()
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let randomId = ''
    for (let i = 0; i < 6; i++) {
      randomId += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({
      ...formData,
      roomId: `CR-${randomId}`
    })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Basic client-side validation
    if (!formData.roomName.trim()) {
      return setError('Room Name is required.')
    }
    if (!formData.roomId.trim()) {
      return setError('Room ID is required.')
    }
    if (!formData.password) {
      return setError('Password is required.')
    }
    if (formData.password.length < 4) {
      return setError('Password must be at least 4 characters long.')
    }
    if (!formData.creatorName.trim()) {
      return setError('Creator Name is required.')
    }

    setLoading(true)

    try {
      const response = await axios.post('/api/rooms/create', {
        roomName: formData.roomName.trim(),
        roomId: formData.roomId.trim(),
        password: formData.password,
        creatorName: formData.creatorName.trim()
      })

      if (response.data.success) {
        // Save to context session
        saveSession({
          roomId: response.data.data.roomId,
          participantId: response.data.data.participantId,
          participantName: response.data.data.creatorName,
          role: 'host'
        })
        
        // Redirect to /room/:roomId
        navigate(`/room/${response.data.data.roomId}`)
      } else {
        setError(response.data.message || 'Failed to create room.')
      }
    } catch (err) {
      console.error('Error creating room:', err)
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message)
      } else {
        setError('Server error occurred. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-primary flex flex-col font-sans">
      <Navbar />
      <div className="flex-grow flex items-center justify-center px-4 py-12 relative">
        {/* Glow effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-accent-primary/10 blur-[100px] pointer-events-none" />

        <div className="max-w-md w-full bg-card border border-border-primary rounded-2xl p-8 relative z-10 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="p-3 bg-accent-primary/10 rounded-full mb-3">
              <Terminal className="h-6 w-6 text-accent-highlight" />
            </div>
            <h2 className="text-2xl font-bold text-white">Create a New Room</h2>
            <p className="text-slate-400 text-xs text-center mt-1.5">
              Set up a secure real-time room to collaborate with your team
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs mb-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Room Name
              </label>
              <input 
                type="text" 
                name="roomName"
                value={formData.roomName}
                onChange={handleChange}
                placeholder="Enter room name" 
                className="w-full bg-[#060a14] border border-border-primary rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Room ID
              </label>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleChange}
                  placeholder="e.g. CR-12345" 
                  className="flex-grow bg-[#060a14] border border-border-primary rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-primary transition-all"
                />
                <button 
                  type="button"
                  onClick={handleGenerateId}
                  className="px-3.5 py-2.5 bg-accent-primary/15 border border-accent-primary/30 text-accent-highlight rounded-xl text-xs font-semibold hover:bg-accent-primary/25 transition-all whitespace-nowrap"
                >
                  Generate ID
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Creator Name
              </label>
              <input 
                type="text" 
                name="creatorName"
                value={formData.creatorName}
                onChange={handleChange}
                placeholder="Your display name" 
                className="w-full bg-[#060a14] border border-border-primary rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password" 
                className="w-full bg-[#060a14] border border-border-primary rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-primary transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-accent-primary to-accent-secondary hover:from-accent-bright hover:to-accent-primary text-white font-semibold rounded-xl text-sm transition-all duration-300 shadow-md shadow-accent-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Room...' : 'Create Room'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center">
            <Link to="/" className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors duration-200">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateRoom
