import React from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, LogIn } from 'lucide-react'
import HeroEditorPreview from './HeroEditorPreview.jsx'
import HeroFeatureHighlights from './HeroFeatureHighlights.jsx'
import DeveloperProof from './DeveloperProof.jsx'

function Hero() {
  return (
    <div className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Background glow layers */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] rounded-full bg-accent-secondary/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column Content */}
          <div className="lg:col-span-5 flex flex-col items-start space-y-6 text-left">
            
            {/* Rounded Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-accent-primary/30 bg-accent-primary/5 text-xs text-accent-highlight font-sans font-medium uppercase tracking-wider">
              <span>Real-time</span>
              <span className="text-accent-primary">•</span>
              <span>Collaborative</span>
              <span className="text-accent-primary">•</span>
              <span>Secure</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Code <span className="bg-gradient-to-r from-accent-primary to-accent-highlight bg-clip-text text-transparent">Together.</span>
              <br />
              Build <span className="bg-gradient-to-r from-accent-primary to-accent-highlight bg-clip-text text-transparent">Together.</span>
            </h1>

            {/* Description */}
            <p className="text-slate-300 text-base sm:text-lg max-w-lg leading-relaxed font-sans">
              A real-time collaborative code editor where developers can write, share and build code together seamlessly. Create a room or join with your team in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <Link 
                to="/create-room" 
                className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-accent-primary to-accent-secondary hover:from-accent-bright hover:to-accent-primary rounded-xl transition-all duration-300 shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/35"
              >
                <UserPlus className="h-4.5 w-4.5" />
                <span>Create Room</span>
              </Link>
              <Link 
                to="/join-room" 
                className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-semibold text-white bg-card border border-border-primary hover:border-accent-primary/50 hover:bg-card-elevated rounded-xl transition-all duration-300"
              >
                <LogIn className="h-4.5 w-4.5" />
                <span>Join Room</span>
              </Link>
            </div>

            {/* Feature Highlights Component */}
            <HeroFeatureHighlights />

            {/* Social Proof Indicator Component */}
            <DeveloperProof />

          </div>

          {/* Right Column Collaborative Editor Mockup */}
          <div className="lg:col-span-7 w-full">
            <HeroEditorPreview />
          </div>

        </div>
      </div>
    </div>
  )
}

export default Hero

