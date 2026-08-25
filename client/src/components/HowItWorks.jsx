import React from 'react'
import { UserPlus, QrCode, Users, Code, ArrowRight } from 'lucide-react'

function HowItWorks() {
  const steps = [
    {
      icon: <UserPlus className="h-6 w-6 text-accent-highlight" />,
      title: "Create Room",
      desc: "Set up a private room ID & password."
    },
    {
      icon: <QrCode className="h-6 w-6 text-accent-highlight" />,
      title: "Share QR / Room ID",
      desc: "Send details or let team scan link."
    },
    {
      icon: <Users className="h-6 w-6 text-accent-highlight" />,
      title: "Teammates Join",
      desc: "Team enters the session securely."
    },
    {
      icon: <Code className="h-6 w-6 text-accent-highlight" />,
      title: "Code Together",
      desc: "Collaborate and build in real-time."
    }
  ]

  return (
    <div className="py-20 border-t border-border-primary/40 bg-background-secondary/30" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-sans">
          How Code<span className="text-accent-highlight">Room</span> Works
        </h2>
        <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Get your pair programming session running in seconds with a simple process.
        </p>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="relative group bg-card border border-border-primary/50 rounded-2xl p-6 flex flex-col items-center hover:border-accent-primary/40 transition-colors duration-300 shadow-lg">
              <div className="p-4 bg-background-primary rounded-full border border-border-primary shadow-inner mb-4">
                {step.icon}
              </div>
              <h3 className="text-base font-semibold text-white font-sans">{step.title}</h3>
              <p className="mt-2 text-xs text-slate-400 text-center leading-relaxed">{step.desc}</p>

              {/* Arrow spacer between cards (desktop design helper) */}
              {idx < 3 && (
                <div className="hidden lg:block absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none text-border-primary group-hover:text-accent-primary transition-colors">
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HowItWorks
