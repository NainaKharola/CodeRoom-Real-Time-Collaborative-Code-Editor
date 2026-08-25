import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, Download } from 'lucide-react'

function QRModal({ roomId, isOpen, onClose }) {
  if (!isOpen) return null

  // Create absolute client join url
  const joinUrl = `${window.location.origin}/join-room?roomId=${roomId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl)
    alert('Room link copied to clipboard!')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-primary/80 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-sm w-full bg-card border border-border-primary rounded-2xl p-6 shadow-2xl flex flex-col items-center">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-background-primary transition-all"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-white font-sans text-center mb-1">Room QR Code</h3>
        <p className="text-slate-400 text-xs text-center mb-6">Scan to join the collaborative session</p>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-xl shadow-inner mb-6 flex items-center justify-center">
          <QRCodeSVG 
            value={joinUrl} 
            size={180} 
            bgColor="#FFFFFF"
            fgColor="#050816"
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Info panel */}
        <div className="w-full bg-[#060a14] border border-border-primary rounded-xl px-4 py-2.5 mb-4 text-xs font-mono text-center">
          <span className="text-slate-400">Join Link:</span>{' '}
          <span className="text-accent-highlight truncate block mt-1">{joinUrl}</span>
        </div>

        {/* Action button */}
        <button 
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-r from-accent-primary to-accent-secondary hover:from-accent-bright hover:to-accent-primary text-white font-semibold rounded-xl text-xs transition-all shadow"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Copy Join Link</span>
        </button>
      </div>
    </div>
  )
}

export default QRModal
