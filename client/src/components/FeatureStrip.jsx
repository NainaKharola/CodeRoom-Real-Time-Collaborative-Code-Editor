import React from 'react'
import { Code2, Users2, ShieldCheck, Cloud } from 'lucide-react'

function FeatureStrip() {
  const features = [
    {
      icon: <Code2 className="h-6 w-6 text-accent-highlight" />,
      title: "Multi-language Support",
      desc: "Code in 6+ popular languages"
    },
    {
      icon: <Users2 className="h-6 w-6 text-accent-highlight" />,
      title: "Collaborative Editing",
      desc: "Edit together in real-time"
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-accent-highlight" />,
      title: "Private & Secure",
      desc: "Your code stays in your room"
    },
    {
      icon: <Cloud className="h-6 w-6 text-accent-highlight" />,
      title: "Cloud Powered",
      desc: "Access from anywhere"
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="features">
      <div className="bg-card border border-border-primary/60 rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative overflow-hidden shadow-xl shadow-background-primary/50">
        {/* Subtle glow layer */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-accent-secondary/5 blur-3xl pointer-events-none" />

        {features.map((item, index) => (
          <div key={index} className="flex items-start space-x-4 relative z-10 hover:translate-y-[-2px] transition-transform duration-300">
            <div className="flex-shrink-0 p-3 bg-background-primary border border-border-primary/80 rounded-full shadow-inner">
              {item.icon}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white font-sans">{item.title}</h3>
              <p className="text-sm text-slate-400 mt-1">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeatureStrip
