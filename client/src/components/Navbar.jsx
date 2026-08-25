import React from 'react'
import { Link } from 'react-router-dom'
import { Terminal, Moon } from 'lucide-react'

function Navbar() {
  return (
    <nav className="border-b border-border-primary/50 bg-background-primary/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="p-2 bg-accent-primary/10 rounded-lg group-hover:bg-accent-primary/20 transition-all duration-300">
                <Terminal className="h-5 w-5 text-accent-highlight" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                Code<span className="text-accent-highlight">Room</span>
              </span>
            </Link>
          </div>

          {/* Center navigation links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">
              How It Works
            </a>
            <a href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">
              Pricing
            </a>
            <a href="#about" className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">
              About
            </a>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-4">
            <button aria-label="Toggle theme" className="p-2 text-slate-400 hover:text-white hover:bg-card/50 rounded-lg transition-all duration-200">
              <Moon className="h-5 w-5" />
            </button>
            <Link 
              to="/create-room" 
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-accent-primary to-accent-secondary hover:from-accent-bright hover:to-accent-primary rounded-lg transition-all duration-300 shadow-md shadow-accent-primary/20 hover:shadow-accent-primary/35"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
