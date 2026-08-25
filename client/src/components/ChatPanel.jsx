import React, { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'

function ChatPanel({ messages, onSendMessage, currentUserName }) {
  const [text, setText] = useState('')
  const chatEndRef = useRef(null)

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return

    onSendMessage(text.trim())
    setText('')
  }

  const formatTime = (timeString) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden font-sans">
      
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            <span>No messages yet.</span>
            <span>Start the conversation!</span>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderName === currentUserName

            return (
              <div 
                key={index} 
                className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                {/* Meta details */}
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-semibold mb-1 px-1">
                  {!isMe && <span>{msg.senderName}</span>}
                  <span>•</span>
                  <span>{formatTime(msg.createdAt)}</span>
                </div>

                {/* Message bubble */}
                <div className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                  isMe 
                    ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-tr-none' 
                    : 'bg-[#060a14] border border-border-primary text-slate-200 rounded-tl-none'
                }`}>
                  {msg.message}
                </div>
              </div>
            )
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input controls */}
      <form 
        onSubmit={handleSubmit}
        className="p-3 border-t border-border-primary/50 bg-background-primary flex items-center space-x-2"
      >
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message..." 
          className="flex-grow bg-[#060a14] border border-border-primary rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent-primary transition-all"
        />
        <button 
          type="submit"
          className="p-2.5 bg-accent-primary hover:bg-accent-bright text-white rounded-xl transition-all shadow shadow-accent-primary/20"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

    </div>
  )
}

export default ChatPanel
