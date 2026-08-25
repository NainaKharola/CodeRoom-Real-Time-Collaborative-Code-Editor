import React, { createContext, useContext, useState, useEffect } from 'react'

const RoomContext = createContext()

export function RoomProvider({ children }) {
  const [session, setSession] = useState(() => {
    // Attempt to recover session from sessionStorage
    const stored = sessionStorage.getItem('coderoom_session')
    return stored ? JSON.parse(stored) : null
  })

  const saveSession = (details) => {
    setSession(details)
    if (details) {
      sessionStorage.setItem('coderoom_session', JSON.stringify(details))
    } else {
      sessionStorage.removeItem('coderoom_session')
    }
  }

  return (
    <RoomContext.Provider value={{ session, saveSession }}>
      {children}
    </RoomContext.Provider>
  )
}

export function useRoom() {
  return useContext(RoomContext)
}
