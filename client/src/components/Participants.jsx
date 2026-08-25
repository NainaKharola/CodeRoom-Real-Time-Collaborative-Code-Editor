import React from 'react'
import { User } from 'lucide-react'

function Participants({ participants }) {
  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-3 font-sans">
      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
        <span>Name</span>
        <span>Role</span>
      </div>

      <div className="space-y-2">
        {participants.map((user, idx) => (
          <div 
            key={idx} 
            className="flex items-center justify-between bg-background-primary/40 border border-border-primary/50 rounded-xl p-2.5 hover:border-accent-primary/20 transition-all"
          >
            <div className="flex items-center space-x-2.5">
              {/* Online indicator */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-accent-primary/10 border border-border-primary flex items-center justify-center text-xs font-semibold text-accent-highlight uppercase">
                  {user.participantName ? user.participantName.charAt(0) : 'U'}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-card" />
              </div>
              <div>
                <span className="text-sm font-medium text-white block">
                  {user.participantName}
                </span>
                <span className="text-[10px] text-emerald-400 block font-semibold">Online</span>
              </div>
            </div>

            {/* Badge role */}
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
              user.role === 'host' 
                ? 'bg-accent-primary/20 text-accent-highlight border border-accent-primary/30' 
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            }`}>
              {user.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Participants
