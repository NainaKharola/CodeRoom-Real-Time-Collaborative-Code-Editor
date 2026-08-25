import React from 'react'
import { Zap, Shield, MessageSquare } from 'lucide-react'

function HeroFeatureHighlights() {
  const highlights = [
    {
      icon: <Zap className="h-4 w-4 text-accent-highlight" />,
      title: "Real-time Sync",
      desc: "Instant code updates"
    },
    {
      icon: <Shield className="h-4 w-4 text-accent-highlight" />,
      title: "Secure Rooms",
      desc: "Encrypted & private"
    },
    {
      icon: <MessageSquare className="h-4 w-4 text-accent-highlight" />,
      title: "Built-in Chat",
      desc: "Talk while you code"
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border-primary/50 w-full">
      {highlights.map((item, idx) => (
        <div key={idx} className="flex items-start space-x-2.5">
          <div className="p-1.5 bg-accent-primary/10 rounded-lg mt-0.5">
            {item.icon}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">{item.title}</h4>
            <p className="text-[11px] text-slate-400">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default HeroFeatureHighlights
