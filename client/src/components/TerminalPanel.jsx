import React, { useState } from 'react'
import { Terminal, Trash2, X, AlertOctagon, HelpCircle } from 'lucide-react'

function TerminalPanel({ 
  output, 
  compileError, 
  stdInput, 
  onInputChange, 
  onClear, 
  onClose 
}) {
  const [activeTab, setActiveTab] = useState('terminal') // 'terminal', 'input', 'problems'

  return (
    <div className="h-full bg-[#060a14] border-t border-border-primary/60 flex flex-col shrink-0 overflow-hidden relative z-20 font-mono text-xs">
      
      {/* 1. Terminal Headers & Tabs selection */}
      <div className="flex items-center justify-between border-b border-border-primary/50 bg-[#070b16] px-3 py-1 shrink-0 select-none">
        
        <div className="flex items-center space-x-2">
          {/* Terminal tab */}
          <button 
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'terminal' 
                ? 'bg-card text-accent-highlight' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Terminal</span>
          </button>

          {/* Stdin Input tab */}
          <button 
            onClick={() => setActiveTab('input')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'input' 
                ? 'bg-card text-accent-highlight' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Stdin Input</span>
          </button>

          {/* Compile Warnings/Problems tab */}
          <button 
            onClick={() => setActiveTab('problems')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-colors relative ${
              activeTab === 'problems' 
                ? 'bg-card text-accent-highlight' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>Problems</span>
            {compileError && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Clear & Close actions */}
        <div className="flex items-center space-x-2.5">
          <button 
            onClick={onClear}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-card rounded-lg transition-colors"
            title="Clear Console"
            aria-label="Clear Console"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-card rounded-lg transition-colors"
            title="Close Panel"
            aria-label="Close Panel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

      {/* 2. Tab Contents views */}
      <div className="flex-1 p-4 overflow-y-auto text-slate-300 min-h-0">
        
        {/* Case 1: Terminal stdout/stderr */}
        {activeTab === 'terminal' && (
          <pre className="whitespace-pre-wrap leading-relaxed select-text font-mono">
            {output || '> Click "Run Code" to compile and run active script.'}
          </pre>
        )}

        {/* Case 2: Standard Input editor text */}
        {activeTab === 'input' && (
          <div className="h-full flex flex-col space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 font-sans tracking-wide">
              Provide input parameters passed to process:
            </span>
            <textarea
              value={stdInput}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="e.g.&#10;5&#10;10&#10;"
              className="flex-1 w-full bg-[#060a14] border border-border-primary rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-accent-primary font-mono resize-none"
            />
          </div>
        )}

        {/* Case 3: Compilation Problems log */}
        {activeTab === 'problems' && (
          <pre className={`whitespace-pre-wrap leading-relaxed select-text font-mono ${compileError ? 'text-red-400' : 'text-slate-400'}`}>
            {compileError || 'No compilation errors or problems detected.'}
          </pre>
        )}

      </div>

    </div>
  )
}

export default TerminalPanel
