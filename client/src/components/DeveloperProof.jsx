import React from 'react'

function DeveloperProof() {
  return (
    <div className="flex items-center space-x-3 pt-2">
      <div className="flex -space-x-2">
        <div className="w-7 h-7 rounded-full bg-[#111827] border-2 border-background-primary flex items-center justify-center text-[10px] text-purple-400 font-bold">JD</div>
        <div className="w-7 h-7 rounded-full bg-[#111827] border-2 border-background-primary flex items-center justify-center text-[10px] text-indigo-400 font-bold">AS</div>
        <div className="w-7 h-7 rounded-full bg-[#111827] border-2 border-background-primary flex items-center justify-center text-[10px] text-emerald-400 font-bold">MK</div>
        <div className="w-7 h-7 rounded-full bg-accent-primary border-2 border-background-primary flex items-center justify-center text-[9px] text-white font-bold">+50</div>
      </div>
      <p className="text-xs text-slate-400 font-sans">
        Join <span className="text-white font-medium">50+ developers</span> collaborating in real-time
      </p>
    </div>
  )
}

export default DeveloperProof
