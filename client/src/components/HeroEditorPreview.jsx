import React from 'react'
import { Menu, Copy, QrCode, Share2, Plus, X, Globe, Settings, Terminal } from 'lucide-react'

function HeroEditorPreview() {
  const codeLines = [
    { num: 1, text: "import React, { useState, useEffect } from 'react';", indent: 0 },
    { num: 2, text: "import io from 'socket.io-client';", indent: 0 },
    { num: 3, text: "", indent: 0 },
    { num: 4, text: "function CodeRoom({ roomId }) {", indent: 0 },
    { num: 5, text: "const [code, setCode] = useState('// Write code together');", indent: 1 },
    { num: 6, text: "const [socket, setSocket] = useState(null);", indent: 1 },
    { num: 7, text: "", indent: 0 },
    { num: 8, text: "useEffect(() => {", indent: 1 },
    { num: 9, text: "const newSocket = io('/api/rooms');", indent: 2 },
    { num: 10, text: "newSocket.emit('join-room', { roomId });", indent: 2 },
    { num: 11, text: "setSocket(newSocket);", indent: 2 },
    { num: 12, text: "return () => newSocket.close();", indent: 2 },
    { num: 13, text: "}, [roomId]);", indent: 1 },
    { num: 14, text: "", indent: 0 },
    { num: 15, text: "const handleChange = (newValue) => {", indent: 1 },
    { num: 16, text: "setCode(newValue);", indent: 2 },
    { num: 17, text: "socket.emit('code-change', newValue);", indent: 2 },
    { num: 18, text: "};", indent: 1 },
    { num: 19, text: "", indent: 0 },
    { num: 20, text: "return <Editor value={code} onChange={handleChange} />;", indent: 1 },
    { num: 21, text: "}", indent: 0 }
  ]

  // Cursors overlay metadata to show collaboration
  const cursors = [
    { line: 5, char: 46, name: 'Naina', color: 'bg-purple-500', text: 'text-purple-500' },
    { line: 9, char: 26, name: 'Rahul', color: 'bg-indigo-500', text: 'text-indigo-500' },
    { line: 17, char: 35, name: 'Aman', color: 'bg-emerald-500', text: 'text-emerald-500' }
  ]

  return (
    <div className="w-full bg-[#080C18] border border-border-primary/80 rounded-xl overflow-hidden shadow-2xl shadow-purple-500/5 hover:shadow-purple-500/10 transition-all duration-300 font-mono text-sm">
      {/* Editor Mock Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 border-b border-border-primary bg-card/60 gap-2">
        <div className="flex items-center space-x-3">
          <Menu className="h-4 w-4 text-slate-400 cursor-pointer hover:text-white" />
          <div className="flex items-center space-x-1.5 bg-background-primary border border-border-primary px-2.5 py-1 rounded text-xs">
            <span className="text-slate-400">Room ID:</span>
            <span className="text-accent-highlight font-semibold">XR7F-9K2L</span>
            <Copy className="h-3 w-3 text-slate-400 hover:text-white cursor-pointer ml-1" />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-1 bg-accent-primary/10 border border-accent-primary/20 hover:bg-accent-primary/20 text-accent-highlight px-2.5 py-1 rounded text-xs font-semibold transition-all">
            <Share2 className="h-3 w-3" />
            <span>Share Room</span>
          </button>
          <button className="p-1 text-slate-400 hover:text-white hover:bg-card rounded" aria-label="QR Code">
            <QrCode className="h-4.5 w-4.5" />
          </button>
          <div className="flex items-center space-x-2 pl-2 border-l border-border-primary">
            {/* User Avatars stack */}
            <div className="flex -space-x-1.5">
              <div className="w-5 h-5 rounded-full bg-purple-500 border border-editor-bg flex items-center justify-center text-[10px] font-bold text-white">N</div>
              <div className="w-5 h-5 rounded-full bg-indigo-500 border border-editor-bg flex items-center justify-center text-[10px] font-bold text-white">R</div>
              <div className="w-5 h-5 rounded-full bg-emerald-500 border border-editor-bg flex items-center justify-center text-[10px] font-bold text-white">A</div>
              <div className="w-5 h-5 rounded-full bg-pink-500 border border-editor-bg flex items-center justify-center text-[10px] font-bold text-white">P</div>
            </div>
            <span className="text-xs text-emerald-400 font-semibold">4 Online</span>
          </div>
        </div>
      </div>

      {/* Code tab and selectors area */}
      <div className="flex items-center justify-between border-b border-border-primary/50 bg-[#060A14]">
        {/* Tabs */}
        <div className="flex items-center">
          <div className="flex items-center space-x-1.5 px-3 py-2 border-r border-border-primary bg-editor-bg text-white border-t border-t-accent-primary">
            <span className="text-xs text-yellow-500 font-bold">JS</span>
            <span className="text-xs">App.js</span>
            <X className="h-3 w-3 text-slate-400 hover:text-white cursor-pointer" />
          </div>
          <button className="p-2 text-slate-400 hover:text-white">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Dropdown Lang and options */}
        <div className="flex items-center space-x-2 px-3">
          <div className="flex items-center space-x-1 bg-card/60 border border-border-primary px-2 py-0.5 rounded text-xs text-slate-300">
            <Globe className="h-3 w-3 text-slate-400" />
            <span>JavaScript</span>
            <span className="text-[10px] text-slate-400">▼</span>
          </div>
          <Settings className="h-3.5 w-3.5 text-slate-400 hover:text-white cursor-pointer" />
        </div>
      </div>

      {/* Editor Main Content & Sidebar */}
      <div className="flex divide-x divide-border-primary/50 min-h-[300px]">
        {/* Code workspace */}
        <div className="flex-grow p-4 relative overflow-hidden bg-editor-bg/85 font-mono select-none">
          {codeLines.map((line) => {
            const hasCursorsOnLine = cursors.filter(c => c.line === line.num);

            return (
              <div key={line.num} className="flex leading-6 group hover:bg-card/20 relative">
                {/* Line number */}
                <span className="w-8 text-slate-600 text-right select-none pr-3 text-xs">{line.num}</span>

                {/* Line text */}
                <span className="text-slate-300 whitespace-pre text-xs">
                  {/* Indentation */}
                  {"  ".repeat(line.indent)}

                  {/* Render code text with styling */}
                  <CodeSyntaxHighlighter text={line.text} />
                </span>

                {/* Teammate Cursor Indicator */}
                {hasCursorsOnLine.map((c, i) => (
                  <div 
                    key={i} 
                    className="absolute flex items-start pointer-events-none" 
                    style={{ left: `${(line.indent * 2 + c.char) * 7.5 + 40}px` }}
                  >
                    {/* Blink line */}
                    <div className={`w-0.5 h-4 ${c.color} animate-pulse`} />
                    {/* Teammate Label */}
                    <div className={`${c.color} text-white text-[8px] font-sans px-1 rounded-sm py-0.5 ml-0.5 translate-y-[-10px] shadow font-semibold`}>
                      {c.name}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Sidebar tab (Participants default active) */}
        <div className="w-48 bg-[#070b16] hidden sm:flex flex-col">
          {/* Sidebar header tabs */}
          <div className="flex border-b border-border-primary/50 text-[11px] font-semibold text-slate-300">
            <button className="flex-1 text-center py-2 bg-editor-bg text-accent-highlight border-b border-b-accent-primary">
              Participants
            </button>
            <button className="flex-1 text-center py-2 text-slate-400 hover:text-white hover:bg-card/30">
              Chat
            </button>
          </div>

          {/* Sidebar items */}
          <div className="flex-1 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-white">Naina</span>
              </div>
              <span className="text-[9px] bg-accent-primary/20 text-accent-highlight px-1.5 py-0.2 rounded font-sans border border-accent-primary/30">Host</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-300">Rahul</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-300">Aman</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-300">Priya</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border-primary/50 bg-[#060a14] text-[10px] text-slate-400">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>● Live</span>
          </span>
          <span className="text-slate-500">|</span>
          <span>All changes saved</span>
        </div>
        <div className="flex items-center space-x-3">
          <span>Ln 15, Col 22</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span className="text-accent-highlight">JavaScript</span>
        </div>
      </div>
    </div>
  )
}

// Quick JSX Helper to colorize common keywords for realism
function CodeSyntaxHighlighter({ text }) {
  if (!text) return <span> </span>;
  
  // Highlighting regexes
  const parts = text.split(/(\s+|,|\(|\)|\{|\}|\[|\]|=|;|'[^']*')/g);

  return (
    <>
      {parts.map((part, index) => {
        if (['import', 'from', 'function', 'const', 'return'].includes(part)) {
          return <span key={index} className="text-pink-400 font-semibold">{part}</span>;
        }
        if (['useState', 'useEffect', 'handleChange', 'setSocket', 'setCode'].includes(part)) {
          return <span key={index} className="text-blue-400">{part}</span>;
        }
        if (part.startsWith("'") && part.endsWith("'")) {
          return <span key={index} className="text-green-400">{part}</span>;
        }
        if (['null', 'true', 'false'].includes(part)) {
          return <span key={index} className="text-purple-400">{part}</span>;
        }
        if (['socket', 'newSocket'].includes(part)) {
          return <span key={index} className="text-orange-300">{part}</span>;
        }
        if (['{', '}', '(', ')', '[', ']', '='].includes(part)) {
          return <span key={index} className="text-yellow-500">{part}</span>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

export default HeroEditorPreview
