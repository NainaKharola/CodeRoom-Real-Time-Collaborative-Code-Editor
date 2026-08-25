import React from 'react'
import { Link } from 'react-router-dom'
import { Terminal } from 'lucide-react'

function Footer() {
  return (
    <footer className="border-t border-border-primary/50 bg-[#040610] py-12" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-accent-highlight" />
            <span className="text-sm font-semibold text-white tracking-wide">
              Code<span className="text-accent-highlight">Room</span>
            </span>
          </div>
          
          <div className="flex space-x-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors duration-200">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing</a>
            <a href="#about" className="hover:text-white transition-colors duration-200">About</a>
          </div>

          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} CodeRoom. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
