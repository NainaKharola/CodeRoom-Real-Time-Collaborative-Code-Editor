import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import { Terminal, Home, LogIn, AlertCircle, MessageSquare, Users, FolderTree, Code, Play, X, File } from 'lucide-react'
import JSZip from 'jszip'
import { useRoom } from '../context/RoomContext.jsx'
import RoomHeader from '../components/RoomHeader.jsx'
import FileExplorer from '../components/FileExplorer.jsx'
import CodeEditor from '../components/CodeEditor.jsx'
import TerminalPanel from '../components/TerminalPanel.jsx'
import Participants from '../components/Participants.jsx'
import ChatPanel from '../components/ChatPanel.jsx'

export function detectLanguageFromFilename(filename) {
  if (!filename) return 'plaintext';
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'c':
      return 'c';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'h':
      return 'cpp';
    case 'java':
      return 'java';
    case 'py':
      return 'python';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'cs':
      return 'csharp';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'sql':
      return 'sql';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
}

function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { session, saveSession } = useRoom()

  // App & Verification States
  const [roomData, setRoomData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roomClosed, setRoomClosed] = useState(false)

  // Collaborative File Workspace States
  const [files, setFiles] = useState([])
  const [openTabs, setOpenTabs] = useState(() => {
    try {
      const saved = localStorage.getItem(`coderoom_tabs_${roomId}`)
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })
  const [activeTabId, setActiveTabId] = useState(() => {
    const saved = localStorage.getItem(`coderoom_active_tab_${roomId}`)
    return saved ? Number(saved) : null
  })
  const [activeCode, setActiveCode] = useState('')
  const [activeLanguage, setActiveLanguage] = useState('cpp')
  const [tabLanguages, setTabLanguages] = useState({}) // { [fileId]: language }

  // Code Execution & Terminal States
  const [terminalOpen, setTerminalOpen] = useState(true)
  const [terminalOutput, setTerminalOutput] = useState('')
  const [compileError, setCompileError] = useState('')
  const [stdInput, setStdInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  // Presence & Chat
  const [participants, setParticipants] = useState([])
  const [messages, setMessages] = useState([])
  const [sidebarTab, setSidebarTab] = useState('participants') // 'participants', 'chat'
  const [unreadChat, setUnreadChat] = useState(false)

  // Unsaved close tab alert popup state
  const [unsavedCloseTargetId, setUnsavedCloseTargetId] = useState(null)
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false)

  // Ctrl+N Create File shortcut states
  const [ctrlNModalOpen, setCtrlNModalOpen] = useState(false)
  const [ctrlNInputValue, setCtrlNInputValue] = useState('')
  const [ctrlNError, setCtrlNError] = useState('')

  // Workspace toast notification state
  const [toast, setToast] = useState(null)

  // Full-screen and search/dialog states
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [quickOpenOpen, setQuickOpenOpen] = useState(false)
  const [quickOpenSearch, setQuickOpenSearch] = useState('')
  const [saveStatus, setSaveStatus] = useState('saved')
  const autoSaveTimeoutRef = useRef(null)
  const localTypingTimeoutRef = useRef(null)

  // Phase 5 States
  const [comments, setComments] = useState([])
  const [versions, setVersions] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [remoteCursors, setRemoteCursors] = useState({}) // { [participantId]: { fileId, position, selection, userName } }
  const [typingStates, setTypingStates] = useState({}) // { [participantId]: { fileId, userName, isTyping, timer } }
  const [editLocks, setEditLocks] = useState({}) // { [fileId]: { lockedBy, lockedByName } }
  const [preventSimultaneousEditing, setPreventSimultaneousEditing] = useState(false)
  const [pinnedFiles, setPinnedFiles] = useState(() => {
    try {
      const saved = localStorage.getItem(`pinned_files_${roomId}`)
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  // Save As Modal states
  const [saveAsModalOpen, setSaveAsModalOpen] = useState(false)
  const [saveAsFilename, setSaveAsFilename] = useState('')
  const [saveAsFolderId, setSaveAsFolderId] = useState('')
  const [saveAsError, setSaveAsError] = useState('')

  // Phase 5A Layout States
  const [explorerWidth, setExplorerWidth] = useState(() => {
    const val = localStorage.getItem(`coderoom_explorer_width_${roomId}`)
    return val ? parseInt(val) : 250
  })
  const [explorerCollapsed, setExplorerCollapsed] = useState(() => {
    return localStorage.getItem(`coderoom_explorer_collapsed_${roomId}`) === 'true'
  })
  const [rightPanelWidth, setRightPanelWidth] = useState(() => {
    const val = localStorage.getItem(`coderoom_right_panel_width_${roomId}`)
    return val ? parseInt(val) : 320
  })
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(() => {
    return localStorage.getItem(`coderoom_right_panel_collapsed_${roomId}`) === 'true'
  })
  const [terminalHeight, setTerminalHeight] = useState(() => {
    const val = localStorage.getItem(`coderoom_terminal_height_${roomId}`)
    return val ? parseInt(val) : 200
  })
  const [terminalCollapsed, setTerminalCollapsed] = useState(() => {
    return localStorage.getItem(`coderoom_terminal_collapsed_${roomId}`) === 'true'
  })
  const [isFocusMode, setIsFocusMode] = useState(() => {
    return localStorage.getItem(`coderoom_focus_mode_${roomId}`) === 'true'
  })

  // Persistence helpers
  const updateExplorerWidth = (w) => {
    setExplorerWidth(w)
    localStorage.setItem(`coderoom_explorer_width_${roomId}`, w)
  }
  const updateExplorerCollapsed = (c) => {
    setExplorerCollapsed(c)
    localStorage.setItem(`coderoom_explorer_collapsed_${roomId}`, c)
  }
  const updateRightPanelWidth = (w) => {
    setRightPanelWidth(w)
    localStorage.setItem(`coderoom_right_panel_width_${roomId}`, w)
  }
  const updateRightPanelCollapsed = (c) => {
    setRightPanelCollapsed(c)
    localStorage.setItem(`coderoom_right_panel_collapsed_${roomId}`, c)
  }
  const updateTerminalHeight = (h) => {
    setTerminalHeight(h)
    localStorage.setItem(`coderoom_terminal_height_${roomId}`, h)
  }
  const updateTerminalCollapsed = (c) => {
    setTerminalCollapsed(c)
    localStorage.setItem(`coderoom_terminal_collapsed_${roomId}`, c)
  }
  const updateFocusMode = (f) => {
    setIsFocusMode(f)
    localStorage.setItem(`coderoom_focus_mode_${roomId}`, f)
  }

  // Draggable handles handlers
  const handleExplorerMouseDown = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = explorerWidth
    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.min(Math.max(startWidth + (moveEvent.clientX - startX), 220), 450)
      updateExplorerWidth(newWidth)
    }
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleRightPanelMouseDown = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = rightPanelWidth
    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.min(Math.max(startWidth - (moveEvent.clientX - startX), 280), 500)
      updateRightPanelWidth(newWidth)
    }
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleTerminalMouseDown = (e) => {
    e.preventDefault()
    const startY = e.clientY
    const startHeight = terminalHeight
    const maxTerminalHeight = window.innerHeight * 0.5
    const handleMouseMove = (moveEvent) => {
      const newHeight = Math.min(Math.max(startHeight - (moveEvent.clientY - startY), 150), maxTerminalHeight)
      updateTerminalHeight(newHeight)
    }
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Cursor cache configurations
  const activeTabCursorRef = useRef({})
  const localEditorInstanceRef = useRef(null)

  const handleEditorMount = (editor) => {
    localEditorInstanceRef.current = editor
    if (activeTabId && activeTabCursorRef.current[activeTabId]) {
      editor.setPosition(activeTabCursorRef.current[activeTabId])
      editor.revealPosition(activeTabCursorRef.current[activeTabId])
    }
  }

  // Trigger Monaco layout update whenever container sizes update
  useEffect(() => {
    if (localEditorInstanceRef.current) {
      localEditorInstanceRef.current.layout()
    }
  }, [explorerWidth, explorerCollapsed, rightPanelWidth, rightPanelCollapsed, terminalHeight, terminalCollapsed, isFocusMode])

  const handleCursorChange = (position) => {
    if (activeTabId) {
      activeTabCursorRef.current[activeTabId] = position
    }
    if (socketRef.current && session && activeTabId) {
      socketRef.current.emit('cursor-position-update', {
        roomId,
        fileId: activeTabId,
        position,
        selection: localEditorInstanceRef.current ? localEditorInstanceRef.current.getSelection() : null,
        participantId: session.participantId,
        userName: session.participantName
      })
    }
  }

  const handleSelectionChange = (selection) => {
    if (socketRef.current && session && activeTabId) {
      socketRef.current.emit('cursor-position-update', {
        roomId,
        fileId: activeTabId,
        position: localEditorInstanceRef.current ? localEditorInstanceRef.current.getPosition() : null,
        selection,
        participantId: session.participantId,
        userName: session.participantName
      })
    }
  }

  useEffect(() => {
    if (localEditorInstanceRef.current && activeTabId) {
      const cachedPos = activeTabCursorRef.current[activeTabId]
      if (cachedPos) {
        setTimeout(() => {
          if (localEditorInstanceRef.current) {
            localEditorInstanceRef.current.setPosition(cachedPos)
            localEditorInstanceRef.current.revealPosition(cachedPos)
          }
        }, 50)
      }
    }
  }, [activeTabId])

  // Before unload unsaved warning listener
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasUnsaved = openTabs.some(t => t.isUnsaved)
      if (hasUnsaved) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes in your workspace. Leave anyway?'
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [openTabs])

  // Sync open tabs to localStorage
  useEffect(() => {
    if (roomId) {
      localStorage.setItem(`coderoom_tabs_${roomId}`, JSON.stringify(openTabs))
    }
  }, [openTabs, roomId])

  // Sync active tab to localStorage
  useEffect(() => {
    if (roomId && activeTabId !== null) {
      localStorage.setItem(`coderoom_active_tab_${roomId}`, activeTabId)
    } else if (roomId) {
      localStorage.removeItem(`coderoom_active_tab_${roomId}`)
    }
  }, [activeTabId, roomId])

  // Reconcile open tabs with workspace files that actually exist
  useEffect(() => {
    if (files.length > 0 && openTabs.length > 0) {
      const verifiedTabs = openTabs.filter(tab => files.some(f => f.id === tab.id && f.type === 'file'))
      if (verifiedTabs.length !== openTabs.length) {
        setOpenTabs(verifiedTabs)
      }
      if (activeTabId && !files.some(f => f.id === activeTabId && f.type === 'file')) {
        if (verifiedTabs.length > 0) {
          setActiveTabId(verifiedTabs[verifiedTabs.length - 1].id)
        } else {
          setActiveTabId(null)
        }
      }
    }
  }, [files])

  // Pre-fill Save As filename when modal opens
  useEffect(() => {
    if (saveAsModalOpen && activeTabId) {
      const activeFile = files.find(f => f.id === activeTabId)
      if (activeFile) {
        const parts = activeFile.name.split('.')
        if (parts.length > 1) {
          parts.pop() // remove extension
        }
        setSaveAsFilename(parts.join('.'))
      }
    }
  }, [saveAsModalOpen, activeTabId, files])

  // Clear and reset room workspace states when navigating to a new room ID
  useEffect(() => {
    setFiles([])
    try {
      const savedTabs = localStorage.getItem(`coderoom_tabs_${roomId}`)
      setOpenTabs(savedTabs ? JSON.parse(savedTabs) : [])
    } catch (e) {
      setOpenTabs([])
    }
    const savedActive = localStorage.getItem(`coderoom_active_tab_${roomId}`)
    setActiveTabId(savedActive ? Number(savedActive) : null)
    setActiveCode('')
    setActiveLanguage('cpp')
  }, [roomId])

  // Monaco settings state with local storage persistence
  const [editorSettings, setEditorSettings] = useState(() => {
    const saved = localStorage.getItem('coderoom_settings')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    return {
      theme: 'dark', // 'dark', 'light'
      fontSize: 14,
      minimap: true,
      wordWrap: true,
      lineNumbers: true,
      bracketPairColorization: true,
      stickyScroll: true,
      tabSize: 4,
      cursorStyle: 'line' // 'line', 'block', 'underline'
    }
  })

  // Persist settings changes
  const handleUpdateSettings = (newSettings) => {
    setEditorSettings(newSettings)
    localStorage.setItem('coderoom_settings', JSON.stringify(newSettings))
  }

  const toastTimeoutRef = useRef(null)
  const showToast = (message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current)
    }
    setToast(message)
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null)
      toastTimeoutRef.current = null
    }, 4000)
  }

  const socketRef = useRef(null)

  // 1. Fetch Room validation metadata on mount
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axios.get(`/api/rooms/${roomId}`)
        if (response.data.success) {
          const room = response.data.data
          if (!room.isActive) {
            setRoomClosed(true)
          } else {
            setRoomData(room)
          }
        }
      } catch (err) {
        console.error('Room fetch error:', err)
        if (err.response && err.response.status === 404) {
          setError('Room not found')
        } else {
          setError('Failed to load room workspace')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRoom()
  }, [roomId])

  const logActivity = (text) => {
    setActivityLog(prev => [{ text, time: new Date().toLocaleTimeString() }, ...prev])
  }

  // 2. Fetch File tree workspace details
  const fetchFiles = async () => {
    if (!session) return
    try {
      const response = await axios.get(`/api/rooms/${roomId}/files`, {
        headers: { 'x-participant-id': session.participantId }
      })
      if (response.data.success) {
        setFiles(response.data.data)
      }
    } catch (err) {
      console.error('Failed to load workspace files:', err.message)
    }
  }

  const fetchComments = async () => {
    if (!session) return
    try {
      const response = await axios.get(`/api/rooms/${roomId}/comments`, {
        headers: { 'x-participant-id': session.participantId }
      })
      if (response.data.success) {
        setComments(response.data.data)
      }
    } catch (err) {
      console.error('Failed to load comments:', err.message)
    }
  }

  const fetchVersions = async () => {
    if (!session || !activeTabId) return
    try {
      const response = await axios.get(`/api/rooms/${roomId}/files/${activeTabId}/versions`, {
        headers: { 'x-participant-id': session.participantId }
      })
      if (response.data.success) {
        setVersions(response.data.data)
      }
    } catch (err) {
      console.error('Failed to load file versions:', err.message)
    }
  }

  const fetchSnapshots = async () => {
    if (!session) return
    try {
      const response = await axios.get(`/api/rooms/${roomId}/snapshots`, {
        headers: { 'x-participant-id': session.participantId }
      })
      if (response.data.success) {
        setSnapshots(response.data.data)
      }
    } catch (err) {
      console.error('Failed to load snapshots:', err.message)
    }
  }

  useEffect(() => {
    if (roomData && session) {
      fetchFiles()
      fetchComments()
      fetchSnapshots()
    }
  }, [roomData, session, roomId])

  useEffect(() => {
    if (session && activeTabId) {
      fetchVersions()
    }
  }, [activeTabId, session])

  // 3. Fetch initial chat history
  useEffect(() => {
    if (!roomData) return
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`/api/rooms/${roomId}/messages`)
        if (response.data.success) {
          setMessages(response.data.data)
        }
      } catch (err) {
        console.error('Error loading chat history:', err)
      }
    }
    fetchMessages()
  }, [roomData, roomId])

  // 4. Connect Sockets & Listeners
  useEffect(() => {
    if (!roomData || !session || session.roomId !== roomId) return

    const socketUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000' : window.location.origin
    const socket = io(socketUrl)
    socketRef.current = socket

    socket.emit('join-room', {
      roomId,
      participantId: session.participantId,
      participantName: session.participantName,
      role: session.role
    })

    socket.on('room-participants', (usersList) => {
      setParticipants(usersList)
    })

    // Sockets sync listeners
    socket.on('file-update', ({ fileId, content }) => {
      // If updating our active file, change local code state
      if (fileId === activeTabId) {
        setActiveCode(content)
      }
      // Update the state array of files directly to reflect changes
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, content } : f))
    })

    socket.on('workspace-update', (payload) => {
      fetchFiles()
      if (payload) {
        const msg = `${payload.user} ${payload.action}ed ${payload.type} "${payload.name}"`
        if (payload.user !== session.participantName) {
          showToast(msg)
        }
        logActivity(msg)
      }
    })

    socket.on('room-ended', () => {
      alert('This room has been ended by the host.')
      saveSession(null)
      navigate('/')
    })

    socket.on('receive-message', (msgObj) => {
      setMessages(prev => [...prev, msgObj])
      if (sidebarTab !== 'chat') {
        setUnreadChat(true)
      }
    })

    socket.on('room-notification', (msg) => {
      showToast(msg)
      logActivity(msg)
    })

    socket.on('remote-cursor-update', ({ fileId, position, selection, participantId, userName }) => {
      setRemoteCursors(prev => ({
        ...prev,
        [participantId]: { fileId, position, selection, userName }
      }))
    })

    socket.on('remote-typing-update', ({ fileId, participantId, userName, isTyping }) => {
      setTypingStates(prev => {
        const old = prev[participantId]
        if (old && old.timer) clearTimeout(old.timer)

        if (!isTyping) {
          const next = { ...prev }
          delete next[participantId]
          return next
        }

        const timer = setTimeout(() => {
          setTypingStates(p => {
            const n = { ...p }
            delete n[participantId]
            return n
          })
        }, 3000)

        return {
          ...prev,
          [participantId]: { fileId, userName, isTyping, timer }
        }
      })
    })

    socket.on('comments-update', () => {
      fetchComments()
      logActivity('Comments updated')
    })

    socket.on('history-update', ({ fileId }) => {
      if (fileId === activeTabId) {
        fetchVersions()
        logActivity('File history updated')
      }
    })

    socket.on('snapshot-update', () => {
      fetchFiles()
      fetchSnapshots()
      logActivity('Workspace snapshot updated/restored')
    })

    socket.on('lock-update', ({ fileId, lockedBy, lockedByName }) => {
      setEditLocks(prev => ({
        ...prev,
        [fileId]: { lockedBy, lockedByName }
      }))
    })

    return () => {
      socket.emit('leave-room', { roomId })
      socket.disconnect()
    }
  }, [roomData, session, roomId, activeTabId, sidebarTab])

  // Automatically update Monaco editor code when tab changes
  useEffect(() => {
    const activeFile = files.find(f => f.id === activeTabId)
    if (activeFile) {
      let codeVal = activeFile.content
      if (activeFile.language === 'cpp' && (!codeVal || !codeVal.trim())) {
        codeVal = `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CodeRoom!" << endl;\n    return 0;\n}\n`;
      }
      setActiveCode(codeVal || '')
      
      const detected = detectLanguageFromFilename(activeFile.name)
      const currentOverride = tabLanguages[activeTabId]
      setActiveLanguage(currentOverride || activeFile.language || detected)
    }
  }, [activeTabId, files, tabLanguages])

  // Automatically open default main.cpp or first available file on initial workspace load
  useEffect(() => {
    if (files.length > 0 && activeTabId === null) {
      const queryParams = new URLSearchParams(window.location.search)
      const sharedFileId = queryParams.get('fileId')
      if (sharedFileId) {
        const parsedId = Number(sharedFileId)
        if (files.some(f => f.id === parsedId)) {
          handleFileOpen(parsedId)
          return
        }
      }
      const defaultFile = files.find(f => f.name === 'main.cpp' && f.type === 'file') || files.find(f => f.type === 'file')
      if (defaultFile) {
        handleFileOpen(defaultFile.id)
      }
    }
  }, [files, activeTabId])

  // Navigate to shared line number on editor mount
  useEffect(() => {
    if (localEditorInstanceRef.current && activeTabId) {
      const queryParams = new URLSearchParams(window.location.search)
      const sharedLine = queryParams.get('line')
      if (sharedLine) {
        const lineNum = parseInt(sharedLine)
        if (!isNaN(lineNum)) {
          setTimeout(() => {
            if (localEditorInstanceRef.current) {
              localEditorInstanceRef.current.setPosition({ lineNumber: lineNum, column: 1 })
              localEditorInstanceRef.current.revealLine(lineNum)
            }
          }, 400)
        }
      }
    }
  }, [activeTabId, localEditorInstanceRef.current])

  // Clear unread alerts on tab select
  useEffect(() => {
    if (sidebarTab === 'chat') {
      setUnreadChat(false)
    }
  }, [sidebarTab])

  useEffect(() => {
    if (socketRef.current && session && files.length > 0) {
      const activeFile = files.find(f => f.id === activeTabId)
      socketRef.current.emit('presence-active-file', {
        roomId,
        fileId: activeTabId,
        fileName: activeFile ? activeFile.name : 'None'
      })
    }
  }, [activeTabId, files, session])

  // File explorer interactions
  const handleFileOpen = (fileId, fileObj = null) => {
    const file = fileObj || files.find(f => f.id === fileId)
    if (!file || file.type !== 'file') return

    // Add tab if not already present
    setOpenTabs(prev => {
      if (prev.some(t => t.id === fileId)) return prev
      return [...prev, { id: fileId, name: file.name, isUnsaved: false }]
    })
    setActiveTabId(fileId)
    if (fileObj) {
      setActiveCode(fileObj.content || '')
      setActiveLanguage(fileObj.language || 'cpp')
    }

    if (socketRef.current) {
      socketRef.current.emit('presence-active-file', {
        roomId,
        fileId,
        fileName: file.name
      })
    }
  }

  const handleFileCreate = async (name, parentId, content = null) => {
    try {
      const response = await axios.post(`/api/rooms/${roomId}/files`, {
        name, type: 'file', parentId, content
      }, {
        headers: { 'x-participant-id': session.participantId }
      })

      if (response.data.success) {
        await fetchFiles()
        // Broadcast change
        if (socketRef.current) {
          socketRef.current.emit('workspace-change', {
            roomId,
            action: 'create',
            type: 'file',
            name,
            user: session.participantName
          })
        }
        // Auto open newly created file
        handleFileOpen(response.data.data.id, response.data.data)
        return response.data.data
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating file.')
    }
  }

  const handleFolderCreate = async (name, parentId) => {
    try {
      const response = await axios.post(`/api/rooms/${roomId}/files`, {
        name, type: 'folder', parentId
      }, {
        headers: { 'x-participant-id': session.participantId }
      })

      if (response.data.success) {
        await fetchFiles()
        if (socketRef.current) {
          socketRef.current.emit('workspace-change', {
            roomId,
            action: 'create',
            type: 'folder',
            name,
            user: session.participantName
          })
        }
        return response.data.data
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating folder.')
    }
  }

  const handleRename = async (id, name) => {
    try {
      const response = await axios.put(`/api/rooms/${roomId}/files/${id}`, {
        name
      }, {
        headers: { 'x-participant-id': session.participantId }
      })

      if (response.data.success) {
        const renamedItem = files.find(f => f.id === id)
        const renamedType = renamedItem ? renamedItem.type : 'item'
        await fetchFiles()
        // Update tab names
        setOpenTabs(prev => prev.map(t => t.id === id ? { ...t, name } : t))
        if (socketRef.current) {
          socketRef.current.emit('workspace-change', {
            roomId,
            action: 'rename',
            type: renamedType,
            name,
            user: session.participantName
          })
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error renaming item.')
    }
  }

  const handleDelete = async (id) => {
    try {
      const deletedItem = files.find(f => f.id === id)
      const deletedName = deletedItem ? deletedItem.name : 'item'
      const deletedType = deletedItem ? deletedItem.type : 'item'

      const response = await axios.delete(`/api/rooms/${roomId}/files/${id}`, {
        headers: { 'x-participant-id': session.participantId }
      })

      if (response.data.success) {
        await fetchFiles()
        // Close associated tabs
        setOpenTabs(prev => prev.filter(t => t.id !== id))
        if (activeTabId === id) {
          setActiveTabId(null)
        }
        if (socketRef.current) {
          socketRef.current.emit('workspace-change', {
            roomId,
            action: 'delete',
            type: deletedType,
            name: deletedName,
            user: session.participantName
          })
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting item.')
    }
  }

  const handleSaveAsSubmit = async (e) => {
    e.preventDefault()
    setSaveAsError('')
    let filename = saveAsFilename.trim()
    if (!filename) {
      setSaveAsError('Filename cannot be empty.')
      return
    }
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      setSaveAsError('Filename contains invalid characters.')
      return
    }

    // Preserve the original extension if not provided
    const activeFile = files.find(f => f.id === activeTabId)
    if (!activeFile) return

    const originalExt = activeFile.name.split('.').pop()
    if (activeFile.name.includes('.') && !filename.includes('.')) {
      filename = `${filename}.${originalExt}`
    }
    
    // Check duplication
    const targetParentId = saveAsFolderId ? Number(saveAsFolderId) : null
    const duplicate = files.find(f => f.name.toLowerCase() === filename.toLowerCase() && f.parentId === targetParentId && f.id !== activeTabId)
    if (duplicate) {
      setSaveAsError('A file or folder with this name already exists in this folder.')
      return
    }

    try {
      const response = await axios.put(`/api/rooms/${roomId}/files/${activeTabId}`, {
        name: filename,
        content: activeCode,
        parentId: targetParentId
      }, {
        headers: { 'x-participant-id': session.participantId }
      })

      if (response.data.success) {
        await fetchFiles()

        // Update tabs name
        setOpenTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, name: filename, isUnsaved: false } : t))

        // Broadcast change
        if (socketRef.current) {
          socketRef.current.emit('workspace-change', {
            roomId,
            action: 'rename',
            type: 'file',
            name: filename,
            user: session.participantName
          })
        }

        setSaveAsModalOpen(false)
        setSaveAsFilename('')
        showToast(`Saved as "${filename}" successfully.`)
      }
    } catch (err) {
      setSaveAsError(err.response?.data?.message || 'Error saving file under new name.')
    }
  }

  const handleTabCloseOthers = (tabId) => {
    const dirtyTabs = openTabs.filter(t => t.id !== tabId && t.isUnsaved)
    if (dirtyTabs.length > 0) {
      if (!window.confirm(`You have unsaved changes in ${dirtyTabs.length} tab(s). Close others anyway?`)) {
        return
      }
    }
    setOpenTabs(prev => prev.filter(t => t.id === tabId))
    if (activeTabId !== tabId) {
      setActiveTabId(tabId)
    }
  }

  const handleTabCloseAll = () => {
    const dirtyTabs = openTabs.filter(t => t.isUnsaved)
    if (dirtyTabs.length > 0) {
      if (!window.confirm(`You have unsaved changes in ${dirtyTabs.length} tab(s). Close all anyway?`)) {
        return
      }
    }
    setOpenTabs([])
    setActiveTabId(null)
  }

  const handleTabCloseSaved = () => {
    const dirtyTabs = openTabs.filter(t => t.isUnsaved)
    setOpenTabs(dirtyTabs)
    const activeIsDirty = dirtyTabs.some(t => t.id === activeTabId)
    if (!activeIsDirty) {
      if (dirtyTabs.length > 0) {
        setActiveTabId(dirtyTabs[dirtyTabs.length - 1].id)
      } else {
        setActiveTabId(null)
      }
    }
  }

  // Monaco content edit listener (auto syncs keystrokes via socket)
  const handleCodeChange = (newVal) => {
    setActiveCode(newVal)
    
    // Acquire lock if simultaneous editing is enabled
    if (preventSimultaneousEditing && socketRef.current && activeTabId) {
      socketRef.current.emit('lock-change', {
        roomId,
        fileId: activeTabId,
        lockedBy: session.participantId,
        lockedByName: session.participantName
      })
      setEditLocks(prev => ({
        ...prev,
        [activeTabId]: { lockedBy: session.participantId, lockedByName: session.participantName }
      }))
    }

    // Typing indicator
    if (socketRef.current && activeTabId) {
      socketRef.current.emit('typing-indicator-update', {
        roomId,
        fileId: activeTabId,
        participantId: session.participantId,
        userName: session.participantName,
        isTyping: true
      })

      if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current)
      localTypingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('typing-indicator-update', {
            roomId,
            fileId: activeTabId,
            participantId: session.participantId,
            userName: session.participantName,
            isTyping: false
          })
        }
      }, 2000)
    }

    // Mark active tab as unsaved
    setOpenTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isUnsaved: true } : t))
    setSaveStatus('unsaved')

    if (socketRef.current) {
      socketRef.current.emit('file-change', {
        roomId,
        fileId: activeTabId,
        content: newVal,
        participantId: session.participantId
      })
    }

    // Debounced Auto-Save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving')
        await axios.put(`/api/rooms/${roomId}/files/${activeTabId}`, {
          content: newVal
        }, {
          headers: { 'x-participant-id': session.participantId }
        })
        
        // Sync local state
        setOpenTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isUnsaved: false } : t))
        setFiles(prev => prev.map(f => f.id === activeTabId ? { ...f, content: newVal } : f))
        setSaveStatus('saved')
      } catch (err) {
        setSaveStatus('unsaved')
      }
    }, 1500)
  }

  // Save functionality
  const handleSave = async () => {
    if (!activeTabId) return
    try {
      setSaveStatus('saving')
      const response = await axios.put(`/api/rooms/${roomId}/files/${activeTabId}`, {
        content: activeCode
      }, {
        headers: { 'x-participant-id': session.participantId }
      })

      if (response.data.success) {
        // Mark tab as saved
        setOpenTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isUnsaved: false } : t))
        // Sync local files state
        setFiles(prev => prev.map(f => f.id === activeTabId ? { ...f, content: activeCode } : f))
        
        const fileObj = files.find(f => f.id === activeTabId)
        showToast(`Saved ${fileObj ? fileObj.name : 'file'}`)
        setSaveStatus('saved')

        // Auto create version snapshot on meaningful saves
        try {
          await axios.post(`/api/rooms/${roomId}/files/${activeTabId}/versions`, {
            author: session.participantName,
            content: activeCode,
            versionLabel: `Save snapshot by ${session.participantName}`
          }, {
            headers: { 'x-participant-id': session.participantId }
          })
          if (socketRef.current) {
            socketRef.current.emit('history-change', { roomId, fileId: activeTabId })
          }
          fetchVersions()
        } catch (e) {
          console.error('Failed to create file version history snapshot:', e.message)
        }
      }
    } catch (err) {
      alert('Save failed. Your changes are still preserved locally.')
      setSaveStatus('unsaved')
    }
  }

  // Listen to global Ctrl + S / Ctrl + N keybindings
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement
      const isInputFocused = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      )

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        setSaveAsModalOpen(true)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setIsFullScreen(prev => !prev)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setQuickOpenSearch('')
        setQuickOpenOpen(prev => !prev)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setCtrlNInputValue('')
        setCtrlNError('')
        setCtrlNModalOpen(true)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        if (activeTabId) {
          handleTabClose(activeTabId)
        }
        return
      }

      // Phase 5A Shortcuts (Bypassed if typing inside inputs/fields)
      if (isInputFocused) return

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        const next = !isFocusMode
        updateFocusMode(next)
        if (next) {
          updateExplorerCollapsed(true)
          updateRightPanelCollapsed(true)
          updateTerminalCollapsed(true)
        } else {
          updateExplorerCollapsed(false)
          updateRightPanelCollapsed(false)
          updateTerminalCollapsed(false)
        }
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        updateRightPanelCollapsed(!rightPanelCollapsed)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        updateExplorerCollapsed(!explorerCollapsed)
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        updateTerminalCollapsed(!terminalCollapsed)
        return
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTabId, activeCode, explorerCollapsed, rightPanelCollapsed, terminalCollapsed, isFocusMode])

  // Tab Close Handler with dialog configuration
  const handleTabClose = (id) => {
    const targetTab = openTabs.find(t => t.id === id)
    if (targetTab && targetTab.isUnsaved) {
      setUnsavedCloseTargetId(id)
      setUnsavedModalOpen(true)
    } else {
      closeTab(id)
    }
  }

  const closeTab = (id) => {
    const index = openTabs.findIndex(t => t.id === id)
    const remaining = openTabs.filter(t => t.id !== id)
    setOpenTabs(remaining)

    if (activeTabId === id) {
      if (remaining.length > 0) {
        const nextActive = remaining[Math.min(index, remaining.length - 1)]
        setActiveTabId(nextActive.id)
      } else {
        setActiveTabId(null)
      }
    }
  }

  const handleConfirmCloseSave = async () => {
    // 1. Trigger database save
    try {
      await axios.put(`/api/rooms/${roomId}/files/${unsavedCloseTargetId}`, {
        content: activeCode
      }, {
        headers: { 'x-participant-id': session.participantId }
      })
      // Sync local state
      setFiles(prev => prev.map(f => f.id === unsavedCloseTargetId ? { ...f, content: activeCode } : f))
    } catch (e) {
      console.error('Failed to save before closing tab.')
    }
    
    closeTab(unsavedCloseTargetId)
    setUnsavedModalOpen(false)
  }

  const handleConfirmCloseDiscard = () => {
    closeTab(unsavedCloseTargetId)
    setUnsavedModalOpen(false)
  }

  // Code compilation & execution trigger
  const handleRunCode = async () => {
    if (!activeTabId) return
    if (isRunning) {
      setIsRunning(false)
      setTerminalOutput(prev => prev + '\nProcess aborted by user.')
      return
    }

    // Automatically save unsaved changes before execution
    const activeTab = openTabs.find(t => t.id === activeTabId)
    if (activeTab && activeTab.isUnsaved) {
      setTerminalOutput('> Saving file content...\n')
      try {
        await axios.put(`/api/rooms/${roomId}/files/${activeTabId}`, {
          content: activeCode
        }, {
          headers: { 'x-participant-id': session.participantId }
        })
        // Mark tab as saved
        setOpenTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isUnsaved: false } : t))
        // Sync local files state
        setFiles(prev => prev.map(f => f.id === activeTabId ? { ...f, content: activeCode } : f))
      } catch (err) {
        console.error('Auto-save before execution failed:', err)
      }
    }

    setIsRunning(true)
    setTerminalOpen(true)
    setTerminalOutput('> Running code execution...\n')
    setCompileError('')

    console.log('=== FRONTEND RUN CODE ===')
    console.log('stdInput value:', JSON.stringify(stdInput))

    try {
      const response = await axios.post(`/api/rooms/${roomId}/run`, {
        fileId: activeTabId,
        input: stdInput,
        stdin: stdInput,
        language: activeLanguage
      }, {
        headers: { 'x-participant-id': session.participantId }
      })

      if (response.data.success) {
        const result = response.data.data
        const activeFile = files.find(f => f.id === activeTabId)
        const filename = activeFile ? activeFile.name : 'main.cpp'

        if (result.compileError) {
          setTerminalOutput(`> Compilation failed\n\n${result.compileError}`)
          setCompileError(result.compileError)
        } else {
          let displayOutput = `> Running ${filename}...\n\nOutput:\n`
          
          if (result.stdout !== undefined && result.stdout !== null) {
            displayOutput += result.stdout
          }

          if (result.stderr) {
            displayOutput += `\nError Output:\n${result.stderr}`
            setCompileError(result.stderr)
          } else {
            setCompileError('')
          }

          displayOutput += `\n\nProcess exited with code ${result.exitCode !== null ? result.exitCode : 'null'}`
          if (result.executionTime !== undefined) {
            displayOutput += `\n\nExecution time:\n${result.executionTime}ms`
          }

          setTerminalOutput(displayOutput)
        }
      }
    } catch (err) {
      if (err.response) {
        setTerminalOutput(`> Execution Failed (HTTP ${err.response.status})\n\n${err.response.data?.message || 'Server execution error.'}`)
      } else if (err.request) {
        setTerminalOutput('> Unable to connect to CodeRoom server. Please check if the server is running.')
      } else {
        setTerminalOutput(`> Request failed: ${err.message}`)
      }
    } finally {
      setIsRunning(false)
    }
  }

  // End Room logic (Host only)
  const handleEndRoom = async () => {
    if (window.confirm('WARNING: Ending the room will permanently close the collaborative workspace. Connected teammates will be disconnected. Proceed?')) {
      try {
        const response = await axios.post(`/api/rooms/${roomId}/end`, {}, {
          headers: { 'x-participant-id': session.participantId }
        })
        if (response.data.success) {
          if (socketRef.current) {
            socketRef.current.emit('end-room-session', { roomId })
          }
          saveSession(null)
          navigate('/')
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to end room.')
      }
    }
  }

  const handleLeaveRoom = () => {
    if (window.confirm('Are you sure you want to leave this room? Your coding changes will remain saved.')) {
      saveSession(null)
      navigate('/')
    }
  }

  const handleDownloadFile = (fileId) => {
    const fileObj = files.find(f => f.id === fileId)
    if (!fileObj) return
    const element = document.createElement("a")
    const blob = new Blob([fileObj.content || ''], { type: 'text/plain' })
    element.href = URL.createObjectURL(blob)
    element.download = fileObj.name
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    showToast(`Downloaded ${fileObj.name}`)
  }

  const handleTogglePin = (fileId) => {
    setPinnedFiles(prev => {
      let next
      if (prev.includes(fileId)) {
        next = prev.filter(id => id !== fileId)
      } else {
        next = [...prev, fileId]
      }
      localStorage.setItem(`pinned_files_${roomId}`, JSON.stringify(next))
      return next
    })
  }

  const handleDownloadWorkspace = async () => {
    try {
      const zip = new JSZip()
      files.forEach(item => {
        if (item.type === 'file') {
          zip.file(item.path, item.content || '')
        } else if (item.type === 'folder') {
          zip.folder(item.path)
        }
      })
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const element = document.createElement("a")
      element.href = URL.createObjectURL(zipBlob)
      element.download = `${roomData?.roomName || 'workspace'}_files.zip`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      showToast('Workspace ZIP downloaded.')
    } catch (err) {
      alert('Failed to generate workspace ZIP.')
    }
  }

  const handleSendMessage = (messageText) => {
    if (socketRef.current && session) {
      socketRef.current.emit('send-message', {
        roomId,
        senderName: session.participantName,
        message: messageText
      })
    }
  }

  // Loaders
  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-mono">Entering workspace...</p>
        </div>
      </div>
    )
  }

  // Error: Room not found
  if (error || !roomId) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center font-sans p-4">
        <div className="max-w-md w-full bg-card border border-border-primary rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="p-3 bg-red-500/10 rounded-full w-fit mx-auto border border-red-500/25">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Room Not Found</h2>
          <p className="text-slate-400 text-xs">
            The workspace code you requested does not exist or has expired.
          </p>
          <div className="flex justify-center space-x-3">
            <Link to="/" className="inline-flex items-center space-x-1.5 px-4 py-2 bg-card hover:bg-card-elevated border border-border-primary text-slate-300 font-semibold rounded-xl text-xs transition-all">
              <Home className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
            <Link to="/join-room" className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary hover:from-accent-bright hover:to-accent-primary text-white font-semibold rounded-xl text-xs transition-all shadow">
              <LogIn className="h-3.5 w-3.5" />
              <span>Join Room</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Error: Room Closed
  if (roomClosed) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center font-sans p-4">
        <div className="max-w-md w-full bg-card border border-border-primary rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="p-3 bg-yellow-500/10 rounded-full w-fit mx-auto border border-yellow-500/25">
            <AlertCircle className="h-6 w-6 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">This room has been closed.</h2>
          <p className="text-slate-400 text-xs">
            The host has ended this collaborative code editor session.
          </p>
          <div className="flex justify-center">
            <Link to="/" className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary hover:from-accent-bright hover:to-accent-primary text-white font-semibold rounded-xl text-xs transition-all shadow">
              <Home className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Error: Auth Required
  if (!session || session.roomId !== roomId) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center font-sans p-4">
        <div className="max-w-md w-full bg-card border border-border-primary rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="p-3 bg-accent-primary/10 rounded-full w-fit mx-auto border border-accent-primary/25">
            <Code className="h-6 w-6 text-accent-highlight" />
          </div>
          <h2 className="text-2xl font-bold text-white">Authentication Required</h2>
          <p className="text-slate-400 text-xs">
            You must join this room by entering the password to authorize your session.
          </p>
          <Link to={`/join-room?roomId=${roomId}`} className="inline-flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-accent-primary to-accent-secondary hover:from-accent-bright hover:to-accent-primary text-white font-semibold rounded-xl text-xs transition-all shadow">
            <LogIn className="h-4 w-4" />
            <span>Join Room</span>
          </Link>
        </div>
      </div>
    )
  }

  const isHost = session.role === 'host'

  return (
    <div className="min-h-screen bg-background-primary flex flex-col overflow-hidden select-none">
      {/* Header */}
      {!isFullScreen && (
        <RoomHeader 
          roomId={roomId}
          roomName={roomData.roomName}
          onLeave={isHost ? handleEndRoom : handleLeaveRoom}
          isHost={isHost}
        />
      )}

      {/* Main collaborative IDE workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* Left Side File Explorer Container */}
        {!explorerCollapsed && (
          <div style={{ width: `${explorerWidth}px` }} className="flex flex-col shrink-0 overflow-hidden h-full">
            <FileExplorer 
              files={files}
              activeFileId={activeTabId}
              onFileOpen={handleFileOpen}
              onFileCreate={handleFileCreate}
              onFolderCreate={handleFolderCreate}
              onRename={handleRename}
              onDelete={handleDelete}
              onRefresh={fetchFiles}
              onDownloadFile={handleDownloadFile}
              onDownloadWorkspace={handleDownloadWorkspace}
              pinnedFiles={pinnedFiles}
              onTogglePin={handleTogglePin}
            />
          </div>
        )}

        {/* Left Drag Resizer and Expand Handle overlay */}
        <div 
          onMouseDown={handleExplorerMouseDown}
          className="w-[3px] hover:w-1.5 active:w-1.5 bg-border-primary/40 hover:bg-accent-primary active:bg-accent-primary cursor-col-resize relative flex items-center justify-center transition-all z-30 shrink-0"
          style={{ alignSelf: 'stretch' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); updateExplorerCollapsed(!explorerCollapsed); }}
            className="absolute w-5 h-5 bg-[#060a14] hover:bg-card border border-border-primary rounded-full flex items-center justify-center text-[10px] text-slate-400 hover:text-white transition-all shadow-md z-40"
            style={{ left: '-8px' }}
            title={explorerCollapsed ? "Expand Explorer" : "Collapse Explorer"}
          >
            {explorerCollapsed ? '>' : '<'}
          </button>
        </div>

        {/* Center layout (Editor + output terminal) */}
        <div className="flex-grow flex flex-col min-h-0 min-w-0 overflow-hidden">
          <CodeEditor 
            code={activeCode}
            language={activeLanguage}
            onLanguageChange={(newLang) => {
              setTabLanguages(prev => ({
                ...prev,
                [activeTabId]: newLang
              }))
            }}
            onCodeChange={handleCodeChange}
            openTabs={openTabs}
            activeTabId={activeTabId}
            onTabSelect={handleFileOpen}
            onTabClose={handleTabClose}
            onSave={handleSave}
            onRunCode={handleRunCode}
            isRunning={isRunning}
            editorSettings={editorSettings}
            onUpdateSettings={handleUpdateSettings}
            onSaveAs={() => setSaveAsModalOpen(true)}
            onTabCloseOthers={handleTabCloseOthers}
            onTabCloseAll={handleTabCloseAll}
            onTabCloseSaved={handleTabCloseSaved}
            files={files}
            onEditorMount={handleEditorMount}
            onCursorChange={handleCursorChange}
            onSelectionChange={handleSelectionChange}
            isFullScreen={isFullScreen}
            onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
            saveStatus={saveStatus}
            remoteCursors={remoteCursors}
            preventSimultaneousEditing={preventSimultaneousEditing}
            lockedBy={editLocks[activeTabId]?.lockedBy}
            lockedByName={editLocks[activeTabId]?.lockedByName}
            sessionParticipantId={session.participantId}
            roomId={roomId}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => {
              const next = !isFocusMode
              updateFocusMode(next)
              if (next) {
                updateExplorerCollapsed(true)
                updateRightPanelCollapsed(true)
                updateTerminalCollapsed(true)
              } else {
                updateExplorerCollapsed(false)
                updateRightPanelCollapsed(false)
                updateTerminalCollapsed(false)
              }
            }}
          />

          {/* Terminal Resizer Drag Handle */}
          {!terminalCollapsed && (
            <div 
              onMouseDown={handleTerminalMouseDown}
              className="h-[3px] hover:h-1.5 active:h-1.5 bg-border-primary/40 hover:bg-accent-primary active:bg-accent-primary cursor-row-resize relative flex items-center justify-center transition-all z-30 shrink-0"
            >
              <button
                onClick={(e) => { e.stopPropagation(); updateTerminalCollapsed(!terminalCollapsed); }}
                className="absolute w-5 h-5 bg-[#060a14] hover:bg-card border border-border-primary rounded-full flex items-center justify-center text-[10px] text-slate-400 hover:text-white transition-all shadow-md z-40"
                style={{ top: '-8px' }}
                title="Collapse Terminal"
              >
                ▼
              </button>
            </div>
          )}

          {/* Collapsible output console */}
          {!terminalCollapsed && (
            <div style={{ height: `${terminalHeight}px` }} className="shrink-0 flex flex-col min-h-0 w-full">
              <TerminalPanel 
                output={terminalOutput}
                compileError={compileError}
                stdInput={stdInput}
                onInputChange={setStdInput}
                onClear={() => { setTerminalOutput(''); setCompileError('') }}
                onClose={() => updateTerminalCollapsed(true)}
              />
            </div>
          )}

          {/* Collapsed Terminal overlay handler bar */}
          {terminalCollapsed && (
            <div className="h-7 border-t border-border-primary/40 bg-[#060a14] flex items-center px-4 shrink-0 justify-between text-[10px] font-mono text-slate-400">
              <span>Terminal is collapsed</span>
              <button
                onClick={() => updateTerminalCollapsed(false)}
                className="text-accent-highlight hover:underline font-semibold"
              >
                Expand Terminal
              </button>
            </div>
          )}
        </div>

        {/* Right Drag Resizer and Expand Handle overlay */}
        <div 
          onMouseDown={handleRightPanelMouseDown}
          className="w-[3px] hover:w-1.5 active:w-1.5 bg-border-primary/40 hover:bg-accent-primary active:bg-accent-primary cursor-col-resize relative flex items-center justify-center transition-all z-30 shrink-0"
          style={{ alignSelf: 'stretch' }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); updateRightPanelCollapsed(!rightPanelCollapsed); }}
            className="absolute w-5 h-5 bg-[#060a14] hover:bg-card border border-border-primary rounded-full flex items-center justify-center text-[10px] text-slate-400 hover:text-white transition-all shadow-md z-40"
            style={{ right: '-8px' }}
            title={rightPanelCollapsed ? "Expand Panel" : "Collapse Panel"}
          >
            {rightPanelCollapsed ? '<' : '>'}
          </button>
        </div>

        {/* Right Sidebar */}
        {!rightPanelCollapsed && (
          <div style={{ width: `${rightPanelWidth}px` }} className="bg-[#070b16] border-l border-border-primary/60 flex flex-col shrink-0 overflow-hidden h-full">
            <div className="flex border-b border-border-primary/50 text-[10px] font-semibold text-slate-300 shrink-0 flex-wrap bg-[#060a14]">
              <button 
                onClick={() => setSidebarTab('participants')}
                className={`px-3 py-2.5 transition-colors ${
                  sidebarTab === 'participants' 
                    ? 'bg-editor-bg text-accent-highlight border-b border-b-accent-primary' 
                    : 'text-slate-400 hover:text-white hover:bg-card/30'
                }`}
              >
                Teammates ({participants.length})
              </button>
              <button 
                onClick={() => setSidebarTab('chat')}
                className={`px-3 py-2.5 transition-colors relative ${
                  sidebarTab === 'chat' 
                    ? 'bg-editor-bg text-accent-highlight border-b border-b-accent-primary' 
                    : 'text-slate-400 hover:text-white hover:bg-card/30'
                }`}
              >
                Chat
                {unreadChat && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent-primary animate-ping" />
                )}
              </button>
              <button 
                onClick={() => setSidebarTab('comments')}
                className={`px-3 py-2.5 transition-colors ${
                  sidebarTab === 'comments' 
                    ? 'bg-editor-bg text-accent-highlight border-b border-b-accent-primary' 
                    : 'text-slate-400 hover:text-white hover:bg-card/30'
                }`}
              >
                Comments ({comments.filter(c => c.file_id === activeTabId).length})
              </button>
              <button 
                onClick={() => setSidebarTab('versions')}
                className={`px-3 py-2.5 transition-colors ${
                  sidebarTab === 'versions' 
                    ? 'bg-editor-bg text-accent-highlight border-b border-b-accent-primary' 
                    : 'text-slate-400 hover:text-white hover:bg-card/30'
                }`}
              >
                History
              </button>
              <button 
                onClick={() => setSidebarTab('snapshots')}
                className={`px-3 py-2.5 transition-colors ${
                  sidebarTab === 'snapshots' 
                    ? 'bg-editor-bg text-accent-highlight border-b border-b-accent-primary' 
                    : 'text-slate-400 hover:text-white hover:bg-card/30'
                }`}
              >
                Snapshots
              </button>
              <button 
                onClick={() => setSidebarTab('activity')}
                className={`px-3 py-2.5 transition-colors ${
                  sidebarTab === 'activity' 
                    ? 'bg-editor-bg text-accent-highlight border-b border-b-accent-primary' 
                    : 'text-slate-400 hover:text-white hover:bg-card/30'
                }`}
              >
                Activity
              </button>
            </div>

            <div className="flex-grow flex flex-col min-h-0 overflow-y-auto bg-editor-bg">
              {sidebarTab === 'participants' && (
                <div className="p-4 space-y-4">
                  {/* Lock Mode toggle option */}
                  <div className="bg-[#060a14] border border-border-primary/50 rounded-xl p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">Prevent Simultaneous Editing</span>
                      <input 
                        type="checkbox"
                        checked={preventSimultaneousEditing}
                        onChange={(e) => {
                          setPreventSimultaneousEditing(e.target.checked)
                          if (socketRef.current) {
                            socketRef.current.emit('lock-change', {
                              roomId,
                              fileId: activeTabId,
                              lockedBy: e.target.checked ? session.participantId : null,
                              lockedByName: e.target.checked ? session.participantName : null
                            })
                          }
                          setEditLocks(prev => ({
                            ...prev,
                            [activeTabId]: e.target.checked 
                              ? { lockedBy: session.participantId, lockedByName: session.participantName } 
                              : { lockedBy: null, lockedByName: null }
                          }))
                        }}
                        className="rounded border-border-primary text-accent-primary bg-[#060a14] focus:ring-accent-primary"
                      />
                    </div>
                  </div>
                  <Participants participants={participants} />
                </div>
              )}

              {sidebarTab === 'chat' && (
                <ChatPanel 
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  currentUserName={session.participantName}
                />
              )}

              {sidebarTab === 'comments' && (
                <div className="p-3 space-y-4 text-xs">
                  {/* Create Comment Form */}
                  {activeTabId ? (
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault()
                        const msg = e.target.msg.value.trim()
                        const line = parseInt(e.target.line.value)
                        if (!msg || isNaN(line)) return
                        try {
                          await axios.post(`/api/rooms/${roomId}/comments`, {
                            fileId: activeTabId,
                            author: session.participantName,
                            message: msg,
                            line
                          }, {
                            headers: { 'x-participant-id': session.participantId }
                          })
                          e.target.reset()
                          if (socketRef.current) {
                            socketRef.current.emit('comments-change', { roomId })
                          }
                          logActivity(`You added a comment on line ${line}`)
                          fetchComments()
                        } catch (err) {
                          alert('Error posting comment: ' + (err.response?.data?.message || err.message))
                        }
                      }}
                      className="bg-[#060a14] border border-border-primary/50 rounded-xl p-3 space-y-2"
                    >
                      <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Add Comment to Active File</span>
                      <div className="flex space-x-2">
                        <input name="line" type="number" placeholder="Line" className="w-16 bg-card border border-border-primary rounded-lg px-2 py-1 text-[11px] text-white" required />
                        <input name="msg" type="text" placeholder="Comment details..." className="flex-1 bg-card border border-border-primary rounded-lg px-2.5 py-1 text-[11px] text-white" required />
                      </div>
                      <button type="submit" className="w-full bg-accent-primary hover:bg-accent-bright py-1 rounded text-[11px] font-semibold text-white">Post Comment</button>
                    </form>
                  ) : (
                    <div className="text-slate-500 italic text-center py-2">Open a file to comment</div>
                  )}

                  {/* Comments list */}
                  <div className="space-y-2">
                    {comments.filter(c => c.file_id === activeTabId).map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => {
                          handleFileOpen(c.file_id)
                          if (localEditorInstanceRef.current) {
                            setTimeout(() => {
                              localEditorInstanceRef.current.setPosition({ lineNumber: c.line, column: 1 })
                              localEditorInstanceRef.current.revealLine(c.line)
                            }, 100)
                          }
                        }}
                        className={`border rounded-xl p-3 cursor-pointer transition-colors ${
                          c.resolved 
                            ? 'bg-[#060a14]/30 border-border-primary/30 opacity-60' 
                            : 'bg-card border-border-primary hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-white text-[11px]">{c.author}</span>
                          <span className="text-[9px] text-slate-500">{new Date(c.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">{c.message}</p>
                        <div className="flex items-center justify-between text-[9px] text-slate-400">
                          <span>{c.file_name} : Line {c.line}</span>
                          {!c.resolved && (
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                  await axios.put(`/api/rooms/${roomId}/comments/${c.id}/resolve`, {
                                    resolvedBy: session.participantName
                                  }, {
                                    headers: { 'x-participant-id': session.participantId }
                                  })
                                  if (socketRef.current) {
                                    socketRef.current.emit('comments-change', { roomId })
                                  }
                                  logActivity(`Resolved comment by ${c.author}`)
                                  fetchComments()
                                } catch (err) {
                                  alert('Error resolving comment: ' + (err.response?.data?.message || err.message))
                                }
                              }}
                              className="bg-accent-primary/20 hover:bg-accent-primary text-accent-highlight px-2 py-0.5 rounded font-semibold text-[10px]"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sidebarTab === 'versions' && (
                <div className="p-3 space-y-3 text-xs">
                  {versions.length === 0 ? (
                    <div className="text-slate-500 italic text-center py-4">No version history for active file</div>
                  ) : (
                    versions.map(v => (
                      <div key={v.id} className="bg-card border border-border-primary rounded-xl p-3 space-y-1">
                        <div className="flex justify-between font-bold text-white text-[11px]">
                          <span>{v.version_label || 'Save Snapshot'}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 flex justify-between">
                          <span>By {v.author}</span>
                          <span>{new Date(v.created_at).toLocaleString()}</span>
                        </div>
                        <button
                          onClick={async () => {
                            if (window.confirm("Restore this version? Current unsaved changes may be affected.")) {
                              try {
                                const response = await axios.post(`/api/rooms/${roomId}/files/${v.file_id}/versions/${v.id}/restore`, {
                                  author: session.participantName
                                }, {
                                  headers: { 'x-participant-id': session.participantId }
                                })
                                if (response.data.success) {
                                  setActiveCode(response.data.content)
                                  showToast('File version restored.')
                                  if (socketRef.current) {
                                    socketRef.current.emit('file-change', {
                                      roomId,
                                      fileId: v.file_id,
                                      content: response.data.content,
                                      participantId: session.participantId
                                    })
                                  }
                                  logActivity(`You restored file version "${v.version_label || 'Save Snapshot'}"`)
                                }
                              } catch (err) {
                                alert('Error restoring version: ' + (err.response?.data?.message || err.message))
                              }
                            }
                          }}
                          className="w-full bg-[#060a14] hover:bg-card border border-border-primary text-slate-300 font-semibold py-1 rounded text-[10px] mt-2"
                        >
                          Restore Version
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {sidebarTab === 'snapshots' && (
                <div className="p-3 space-y-4 text-xs">
                  {/* Create Snapshot Form */}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      const name = e.target.name.value.trim()
                      if (!name) return
                      try {
                        await axios.post(`/api/rooms/${roomId}/snapshots`, {
                          creatorName: session.participantName,
                          snapshotName: name
                        }, {
                          headers: { 'x-participant-id': session.participantId }
                        })
                        e.target.reset()
                        if (socketRef.current) {
                          socketRef.current.emit('snapshot-change', { roomId })
                        }
                        logActivity(`You created snapshot "${name}"`)
                        fetchSnapshots()
                        showToast('Workspace Snapshot created.')
                      } catch (err) {
                        alert('Error creating snapshot: ' + (err.response?.data?.message || err.message))
                      }
                    }}
                    className="bg-[#060a14] border border-border-primary/50 rounded-xl p-3 space-y-2"
                  >
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Create Workspace Snapshot</span>
                    <input name="name" type="text" placeholder="Snapshot label (e.g. Milestone 1)" className="w-full bg-card border border-border-primary rounded-lg px-2.5 py-1 text-[11px] text-white" required />
                    <button type="submit" className="w-full bg-accent-primary hover:bg-accent-bright py-1 rounded text-[11px] font-semibold text-white">Capture Snapshot</button>
                  </form>

                  {/* Snapshots list */}
                  <div className="space-y-2">
                    {snapshots.map(s => (
                      <div key={s.id} className="bg-card border border-border-primary rounded-xl p-3 space-y-1">
                        <div className="flex justify-between font-bold text-white text-[11px]">
                          <span>{s.snapshot_name}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 flex justify-between">
                          <span>By {s.creator_name}</span>
                          <span>{new Date(s.created_at).toLocaleString()}</span>
                        </div>
                        <button
                          onClick={async () => {
                            if (window.confirm("Restore this workspace snapshot? All current files will be replaced recursively.")) {
                              try {
                                await axios.post(`/api/rooms/${roomId}/snapshots/${s.id}/restore`, {}, {
                                  headers: { 'x-participant-id': session.participantId }
                                })
                                showToast('Workspace snapshot restored.')
                                if (socketRef.current) {
                                  socketRef.current.emit('snapshot-change', { roomId })
                                }
                                logActivity(`You restored snapshot "${s.snapshot_name}"`)
                                fetchFiles()
                              } catch (err) {
                                alert('Error restoring snapshot: ' + (err.response?.data?.message || err.message))
                              }
                            }
                          }}
                          className="w-full bg-accent-primary/20 hover:bg-accent-primary text-accent-highlight py-1 rounded text-[10px] font-semibold mt-2"
                        >
                          Restore Snapshot
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sidebarTab === 'activity' && (
                <div className="p-3 space-y-2 text-xs">
                  {activityLog.length === 0 ? (
                    <div className="text-slate-500 italic text-center py-4">No recent activity logs</div>
                  ) : (
                    activityLog.map((act, i) => (
                      <div key={i} className="bg-card border border-border-primary/50 rounded-lg p-2 flex justify-between items-center text-[11px] font-mono">
                        <span className="text-slate-300">{act.text}</span>
                        <span className="text-[9px] text-slate-500 ml-2">{act.time}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Editor Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border-primary/50 bg-[#060a14] text-[10px] text-slate-400 select-none shrink-0 font-mono">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>● Live</span>
          </span>
          <span className="text-slate-500">|</span>
          <span>{isRunning ? 'Running compilation task...' : 'All changes saved'}</span>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setTerminalOpen(true)}
            className="hover:text-white transition-colors"
          >
            Toggle Terminal
          </button>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span className="text-accent-highlight uppercase font-bold">{activeLanguage}</span>
        </div>
      </div>

      {/* Unsaved changes close tab modal dialog */}
      {unsavedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-primary/75 backdrop-blur-xs">
          <div className="bg-card border border-border-primary rounded-xl p-5 max-w-sm w-full shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-2">Save changes before closing?</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              You have unsaved changes in this file. Closing it will discard unsaved updates.
            </p>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setUnsavedModalOpen(false)}
                className="px-3.5 py-1.5 bg-[#060a14] hover:bg-card border border-border-primary text-slate-300 font-semibold rounded-lg text-xs transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmCloseDiscard}
                className="px-3.5 py-1.5 bg-red-500/25 hover:bg-red-500/40 text-red-400 font-semibold rounded-lg text-xs transition-all"
              >
                Discard
              </button>
              <button 
                onClick={handleConfirmCloseSave}
                className="px-3.5 py-1.5 bg-accent-primary hover:bg-accent-bright text-white font-semibold rounded-lg text-xs transition-all shadow"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ctrl+N Quick File creation modal */}
      {ctrlNModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-primary/75 backdrop-blur-xs">
          <div className="bg-card border border-border-primary rounded-xl p-5 max-w-sm w-full shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-2">Create New File</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              setCtrlNError('');
              const val = ctrlNInputValue.trim();
              if (!val) return setCtrlNError('Name cannot be empty.');
              if (val.includes('/') || val.includes('\\') || val.includes('..')) {
                return setCtrlNError('Name contains invalid characters.');
              }
              handleFileCreate(val, null);
              setCtrlNModalOpen(false);
            }} className="space-y-4">
              <input 
                type="text" 
                autoFocus
                value={ctrlNInputValue}
                onChange={(e) => setCtrlNInputValue(e.target.value)}
                placeholder="e.g. index.js, script.py"
                className="w-full bg-[#060a14] border border-border-primary rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-primary"
              />
              {ctrlNError && <p className="text-[10px] text-red-400 mt-1 font-semibold">{ctrlNError}</p>}
              
              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setCtrlNModalOpen(false)}
                  className="px-3.5 py-1.5 bg-[#060a14] hover:bg-card border border-border-primary text-slate-300 font-semibold rounded-lg text-xs transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-3.5 py-1.5 bg-accent-primary hover:bg-accent-bright text-white font-semibold rounded-lg text-xs transition-all shadow"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save As Modal */}
      {saveAsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-primary/75 backdrop-blur-xs font-sans">
          <div className="bg-card border border-border-primary rounded-xl p-5 max-w-sm w-full shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-2">Save As...</h3>
            <form onSubmit={handleSaveAsSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">File Name</label>
                <input 
                  type="text" 
                  autoFocus
                  value={saveAsFilename}
                  onChange={(e) => setSaveAsFilename(e.target.value)}
                  placeholder="e.g. main.cpp, script.py"
                  className="w-full bg-[#060a14] border border-border-primary rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Target Location</label>
                <select
                  value={saveAsFolderId}
                  onChange={(e) => setSaveAsFolderId(e.target.value)}
                  className="w-full bg-[#060a14] border border-border-primary rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-primary"
                >
                  <option value="">Workspace Root</option>
                  {files.filter(f => f.type === 'folder').map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.path}</option>
                  ))}
                </select>
              </div>

              {saveAsError && <p className="text-[10px] text-red-400 font-semibold">{saveAsError}</p>}
              
              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button"
                  onClick={() => { setSaveAsModalOpen(false); setSaveAsFilename(''); }}
                  className="px-3.5 py-1.5 bg-[#060a14] hover:bg-card border border-border-primary text-slate-300 font-semibold rounded-lg text-xs transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-3.5 py-1.5 bg-accent-primary hover:bg-accent-bright text-white font-semibold rounded-lg text-xs transition-all shadow"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Open Modal (Ctrl+P) */}
      {quickOpenOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh] bg-background-primary/75 backdrop-blur-xs font-sans">
          <div className="bg-card border border-border-primary rounded-xl p-4 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center space-x-2 border-b border-border-primary pb-2.5 mb-3">
              <Code className="h-4 w-4 text-accent-highlight" />
              <input
                type="text"
                autoFocus
                value={quickOpenSearch}
                onChange={(e) => setQuickOpenSearch(e.target.value)}
                placeholder="Search files by name..."
                className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-500 font-mono"
              />
              <button 
                onClick={() => setQuickOpenOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[250px] overflow-y-auto space-y-1">
              {files
                .filter(f => f.type === 'file' && f.name.toLowerCase().includes(quickOpenSearch.toLowerCase()))
                .map(file => (
                  <div
                    key={file.id}
                    onClick={() => {
                      handleFileOpen(file.id)
                      setQuickOpenOpen(false)
                    }}
                    className="flex items-center justify-between p-2 hover:bg-accent-primary/10 rounded-lg cursor-pointer transition-colors text-xs text-slate-300 hover:text-white font-mono"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <File className="h-3.5 w-3.5 text-accent-highlight shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 truncate max-w-[200px]">
                      {file.path}
                    </span>
                  </div>
                ))}
              {files.filter(f => f.type === 'file' && f.name.toLowerCase().includes(quickOpenSearch.toLowerCase())).length === 0 && (
                <div className="text-center py-4 text-slate-500 text-xs italic">
                  No matching files found
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-12 right-6 z-50 bg-[#060a14] border border-border-primary text-slate-200 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2.5 select-none font-mono">
          <span className="w-2 h-2 rounded-full bg-accent-primary animate-ping" />
          <span>{toast}</span>
        </div>
      )}

    </div>
  )
}

export default Room
