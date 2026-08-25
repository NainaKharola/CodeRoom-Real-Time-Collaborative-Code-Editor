import React, { useState } from 'react'
import { Terminal, Copy, QrCode, LogOut, Share2 } from 'lucide-react'
import QRModal from './QRModal.jsx'

function RoomHeader({ roomId, roomName, onLeave, isHost }) {
  const [isQrOpen, setIsQrOpen] = useState(false)

  const handleCopyId = () => {
    navigator.clipboard.writeText(roomId)
    alert('Room ID copied to clipboard!')
  }

  const handleShare = () => {
    const joinUrl = `${window.location.origin}/join-room?roomId=${roomId}`
    navigator.clipboard.writeText(joinUrl)
    alert('Shareable link copied to clipboard!')
  }

  return (
    <header className="border-b border-border-primary/60 bg-background-primary px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 relative z-30 shadow-md">
      
      {/* Left Logo / Room Title */}
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <div className="flex items-center space-x-1.5 font-bold text-white text-base">
          <div className="p-1.5 bg-accent-primary/10 rounded-lg">
            <Terminal className="h-4 w-4 text-accent-highlight" />
          </div>
          <span>CodeRoom</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center space-x-1.5 bg-[#060a14] border border-border-primary px-2.5 py-1 rounded-lg text-xs font-mono">
          <span className="text-slate-400">Room:</span>
          <span className="text-accent-highlight font-semibold">{roomId}</span>
          <button 
            onClick={handleCopyId}
            className="p-0.5 text-slate-500 hover:text-white transition-colors"
            title="Copy Room ID"
            aria-label="Copy Room ID"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
        {isHost && (
          <>
            <button 
              onClick={handleShare}
              className="flex items-center space-x-1.5 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-highlight px-3 py-1.5 rounded-lg text-xs font-semibold border border-accent-primary/25 transition-all"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share Room</span>
            </button>

            <button 
              onClick={() => setIsQrOpen(true)}
              className="p-2 text-slate-400 hover:text-white bg-card border border-border-primary hover:border-accent-primary/40 rounded-lg transition-all"
              title="Show QR Code"
              aria-label="Show QR Code"
            >
              <QrCode className="h-4.5 w-4.5" />
            </button>
          </>
        )}

        <button 
          onClick={onLeave}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isHost 
              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/25' 
              : 'bg-[#070b16] hover:bg-card border-border-primary text-slate-300'
          }`}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{isHost ? 'End Room' : 'Leave Room'}</span>
        </button>
      </div>

      {/* QR Modal integration */}
      {isHost && (
        <QRModal 
          roomId={roomId}
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
        />
      )}
    </header>
  )
}

export default RoomHeader
