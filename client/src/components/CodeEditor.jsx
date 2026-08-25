import React, { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Square, Save, X, Settings, Maximize2, Minimize2, Share2 } from 'lucide-react'

function CodeEditor({
  code,
  language,
  onCodeChange,
  openTabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onSave,
  onRunCode,
  isRunning,
  editorSettings,
  onUpdateSettings,
  onSaveAs,
  onTabCloseOthers,
  onTabCloseAll,
  onTabCloseSaved,
  files,
  onEditorMount,
  onCursorChange,
  onSelectionChange,
  isFullScreen,
  onToggleFullScreen,
  saveStatus,
  remoteCursors = {},
  preventSimultaneousEditing = false,
  lockedBy = null,
  lockedByName = null,
  sessionParticipantId = null,
  roomId,
  isFocusMode = false,
  onToggleFocusMode,
  onLanguageChange
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tabContextMenu, setTabContextMenu] = useState(null) // { x, y, tabId }
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const remoteDecorationsRef = useRef([])

  const getColors = (id) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    const h = Math.abs(hash) % 360
    return {
      cursor: `hsl(${h}, 85%, 60%)`,
      selection: `hsla(${h}, 85%, 60%, 0.18)`
    }
  }

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !activeTabId) return

    const monaco = monacoRef.current
    const newDecorations = []
    const styleEl = document.getElementById('remote-cursors-styles') || document.createElement('style')
    styleEl.id = 'remote-cursors-styles'
    let cssText = ''

    Object.entries(remoteCursors).forEach(([participantId, remote]) => {
      if (remote.fileId !== activeTabId || participantId === sessionParticipantId) return

      const colors = getColors(participantId)
      const className = `remote-cursor-${participantId}`
      const selectName = `remote-selection-${participantId}`

      cssText += `
        .${className} {
          background-color: ${colors.cursor} !important;
          width: 2px !important;
        }
        .${className}-label {
          background-color: ${colors.cursor} !important;
          color: #000 !important;
          font-size: 8px !important;
          padding: 1px 4px !important;
          border-radius: 2px !important;
          position: absolute !important;
          top: -14px !important;
          left: 0 !important;
          white-space: nowrap !important;
          font-weight: bold !important;
          font-family: monospace !important;
          pointer-events: none !important;
          z-index: 10 !important;
        }
        .${selectName} {
          background-color: ${colors.selection} !important;
        }
      `

      if (remote.position) {
        newDecorations.push({
          range: new monaco.Range(
            remote.position.lineNumber,
            remote.position.column,
            remote.position.lineNumber,
            remote.position.column
          ),
          options: {
            className: className,
            hoverMessage: { value: remote.userName },
            after: {
              content: remote.userName,
              inlineClassName: `${className}-label`
            }
          }
        })
      }

      if (remote.selection) {
        newDecorations.push({
          range: new monaco.Range(
            remote.selection.startLineNumber,
            remote.selection.startColumn,
            remote.selection.endLineNumber,
            remote.selection.endColumn
          ),
          options: {
            className: selectName
          }
        })
      }
    })

    styleEl.innerHTML = cssText
    if (!styleEl.parentNode) document.head.appendChild(styleEl)

    remoteDecorationsRef.current = editorRef.current.deltaDecorations(
      remoteDecorationsRef.current,
      newDecorations
    )
  }, [remoteCursors, activeTabId, sessionParticipantId])

  useEffect(() => {
    const handleClose = () => setTabContextMenu(null)
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setTabContextMenu(null)
    }
    window.addEventListener('click', handleClose)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('click', handleClose)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleEditorChange = (value) => {
    onCodeChange(value || '')
  }

  // Get active file name to show in title
  const activeFile = openTabs.find(tab => tab.id === activeTabId)

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-editor-bg">
      {/* 1. Top Editor Action Buttons Toolbar Row */}
      <div className="flex items-center justify-between border-b border-border-primary/50 bg-[#060a14] px-4 py-1.5 shrink-0 select-none overflow-x-auto">
        <div className="flex items-center space-x-2 py-1 flex-wrap w-full">
          {activeFile && (
            <>
              {/* Save Button */}
              <button
                onClick={onSave}
                className="flex items-center space-x-1 px-3 py-1.5 bg-[#070b16] hover:bg-card border border-border-primary text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-all"
                title="Save changes (Ctrl + S)"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save</span>
              </button>

              {/* Save As Button */}
              <button
                onClick={onSaveAs}
                className="flex items-center space-x-1 px-3 py-1.5 bg-[#070b16] hover:bg-card border border-border-primary text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-all"
                title="Save As..."
              >
                <Save className="h-3.5 w-3.5 text-accent-highlight" />
                <span>Save As...</span>
              </button>

              {/* Run Code / Stop Button */}
              <button
                onClick={onRunCode}
                className={`flex items-center space-x-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all shadow ${isRunning
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/35 border border-red-500/30'
                    : 'bg-accent-primary/20 text-accent-highlight hover:bg-accent-primary/30 border border-accent-primary/30'
                  }`}
              >
                {isRunning ? (
                  <>
                    <Square className="h-3.5 w-3.5 text-red-400 fill-red-400" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 text-accent-highlight fill-accent-highlight" />
                    <span>Run Code</span>
                  </>
                )}
              </button>

              {/* Language Selector Dropdown */}
              <div className="flex items-center space-x-1">
                <select
                  value={language}
                  onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
                  className="bg-[#070b16] text-slate-300 hover:text-white border border-border-primary rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-accent-primary transition-all cursor-pointer"
                  title="Select Programming Language"
                >
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="csharp">C#</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="sql">SQL</option>
                  <option value="plaintext">Plain Text</option>
                </select>
              </div>

              {/* Settings Button */}
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-[#070b16] hover:bg-card border border-border-primary text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-all"
                title="Editor Settings"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Settings</span>
              </button>

              {/* Full Screen Toggle Button */}
              <button
                onClick={onToggleFullScreen}
                className="flex items-center space-x-1 px-3 py-1.5 bg-[#070b16] hover:bg-card border border-border-primary text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-all"
                title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5 text-accent-highlight" />
                    <span>Exit Full Screen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Full Screen</span>
                  </>
                )}
              </button>

              {/* Focus Mode Toggle Button */}
              <button
                onClick={onToggleFocusMode}
                className={`flex items-center space-x-1 px-3 py-1.5 border text-xs font-semibold rounded-lg transition-all ${isFocusMode
                    ? 'bg-accent-primary/25 border-accent-primary text-accent-highlight hover:bg-accent-primary/40'
                    : 'bg-[#070b16] hover:bg-card border-border-primary text-slate-300 hover:text-white'
                  }`}
                title={isFocusMode ? "Exit Focus Mode" : "Focus Mode"}
              >
                <span>{isFocusMode ? "Exit Focus Mode" : "Focus Mode"}</span>
              </button>

              {/* Share Location Button */}
              <button
                onClick={() => {
                  const line = editorRef.current ? editorRef.current.getPosition()?.lineNumber || 1 : 1
                  const shareUrl = `${window.location.origin}/room/${roomId}?fileId=${activeTabId}&line=${line}`
                  navigator.clipboard.writeText(shareUrl)
                  alert(`Location link copied to clipboard:\n${shareUrl}`)
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-[#070b16] hover:bg-card border border-border-primary text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-all"
                title="Copy current file and line share link"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share Line</span>
              </button>

              {/* Save Status Text */}
              {saveStatus === 'saving' && (
                <span className="text-[10px] text-slate-400 font-mono animate-pulse">Saving...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-[10px] text-accent-highlight font-mono">Saved</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* 2. Horizontal Editor Tabs list row directly BELOW the toolbar */}
      <div className="flex items-center border-b border-border-primary/50 bg-[#060a14] px-2.5 shrink-0 overflow-x-auto select-none min-h-[36px]">
        <div className="flex items-center space-x-1.5 overflow-x-auto min-w-0 pr-4 w-full">
          {openTabs.map((tab) => {
            const isTabActive = tab.id === activeTabId
            const hasDuplicateName = openTabs.filter(t => t.name === tab.name).length > 1
            let tabDisplayName = tab.name
            if (hasDuplicateName && files) {
              const fileItem = files.find(f => f.id === tab.id)
              if (fileItem && fileItem.parentId) {
                const parentDir = files.find(f => f.id === fileItem.parentId)
                if (parentDir) {
                  tabDisplayName = `${tab.name} (${parentDir.name})`
                }
              } else {
                tabDisplayName = `${tab.name} (root)`
              }
            }

            return (
              <div
                key={tab.id}
                onClick={() => onTabSelect(tab.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setTabContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id })
                }}
                className={`flex items-center space-x-1.5 px-3 py-2 border-r border-border-primary/50 cursor-pointer transition-colors max-w-[180px] truncate shrink-0 ${isTabActive
                    ? 'bg-editor-bg text-white border-t border-t-accent-primary'
                    : 'bg-card/25 text-slate-400 hover:text-slate-200 hover:bg-card/45'
                  }`}
              >
                {/* Unsaved indicator dot */}
                {tab.isUnsaved && (
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" title="Unsaved changes" />
                )}

                <span className="text-xs font-mono truncate">{tabDisplayName}</span>

                {/* Close Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); onTabClose(tab.id) }}
                  className="p-0.5 rounded text-slate-500 hover:text-white hover:bg-background-primary transition-all shrink-0"
                  aria-label="Close tab"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {preventSimultaneousEditing && lockedBy && lockedBy !== sessionParticipantId && (
        <div className="bg-red-500/10 border-b border-red-500/25 px-4 py-1.5 text-[11px] text-red-400 font-mono flex items-center space-x-1.5 shrink-0 select-none">
          <span>🔒 "{activeFile?.name}" is locked and being edited by {lockedByName}</span>
        </div>
      )}

      {/* 3. Actual Monaco Editor Container */}
      <div className="flex-grow relative min-h-0 bg-editor-bg flex flex-col">
        {activeFile ? (
          <Editor
            height="100%"
            language={language}
            theme={editorSettings.theme === 'light' ? 'light' : 'vs-dark'}
            value={code}
            onChange={handleEditorChange}
            onMount={(editor, monaco) => {
              editorRef.current = editor
              monacoRef.current = monaco
              if (onEditorMount) onEditorMount(editor)
              editor.onDidChangeCursorPosition((e) => {
                if (onCursorChange) {
                  onCursorChange(editor.getPosition())
                }
              })
              editor.onDidChangeCursorSelection((e) => {
                if (onSelectionChange) {
                  onSelectionChange(editor.getSelection())
                }
              })
            }}
            loading={
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-mono" >
                Loading code workspace...
              </div>
            }
            options={{
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: editorSettings.fontSize,
              lineHeight: editorSettings.fontSize * 1.45,
              minimap: { enabled: editorSettings.minimap },
              wordWrap: editorSettings.wordWrap ? 'on' : 'off',
              lineNumbers: editorSettings.lineNumbers ? 'on' : 'off',
              bracketPairColorization: { enabled: editorSettings.bracketPairColorization },
              stickyScroll: { enabled: editorSettings.stickyScroll },
              cursorStyle: editorSettings.cursorStyle,
              tabSize: editorSettings.tabSize || 4,
              insertSpaces: true,
              readOnly: !!(preventSimultaneousEditing && lockedBy && lockedBy !== sessionParticipantId),
              folding: true,
              matchBrackets: 'always',
              renderLineHighlight: 'all',
              smoothScrolling: true,
              automaticLayout: true,
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible'
              },
              padding: { top: 12 }
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs select-none p-4">
            <span className="font-mono mb-1">No active file open</span>
            <span>Select or create a file in the File Explorer to start coding.</span>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-primary/75 backdrop-blur-xs">
          <div className="bg-card border border-border-primary rounded-xl p-5 max-w-sm w-full shadow-2xl relative font-sans">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-1.5">
              <Settings className="h-4 w-4 text-accent-highlight" />
              <span>Editor Settings</span>
            </h3>

            <div className="space-y-4 text-xs text-slate-300">
              {/* Theme Selection */}
              <div className="flex items-center justify-between">
                <span>Theme</span>
                <select
                  value={editorSettings.theme}
                  onChange={(e) => onUpdateSettings({ ...editorSettings, theme: e.target.value })}
                  className="bg-[#060a14] border border-border-primary rounded px-2.5 py-1 text-white focus:outline-none focus:border-accent-primary"
                >
                  <option value="dark">CodeRoom Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="flex items-center justify-between">
                <span>Font Size</span>
                <select
                  value={editorSettings.fontSize}
                  onChange={(e) => onUpdateSettings({ ...editorSettings, fontSize: Number(e.target.value) })}
                  className="bg-[#060a14] border border-border-primary rounded px-2.5 py-1 text-white focus:outline-none focus:border-accent-primary"
                >
                  <option value="12">12px</option>
                  <option value="14">14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="20">20px</option>
                </select>
              </div>

              {/* Cursor Style */}
              <div className="flex items-center justify-between">
                <span>Cursor Style</span>
                <select
                  value={editorSettings.cursorStyle}
                  onChange={(e) => onUpdateSettings({ ...editorSettings, cursorStyle: e.target.value })}
                  className="bg-[#060a14] border border-border-primary rounded px-2.5 py-1 text-white focus:outline-none focus:border-accent-primary"
                >
                  <option value="line">Line</option>
                  <option value="block">Block</option>
                  <option value="underline">Underline</option>
                </select>
              </div>

              {/* Minimap toggle */}
              <div className="flex items-center justify-between">
                <span>Show Minimap</span>
                <input
                  type="checkbox"
                  checked={editorSettings.minimap}
                  onChange={(e) => onUpdateSettings({ ...editorSettings, minimap: e.target.checked })}
                  className="rounded border-border-primary text-accent-primary bg-[#060a14] focus:ring-accent-primary"
                />
              </div>

              {/* Word Wrap toggle */}
              <div className="flex items-center justify-between">
                <span>Word Wrap</span>
                <input
                  type="checkbox"
                  checked={editorSettings.wordWrap}
                  onChange={(e) => onUpdateSettings({ ...editorSettings, wordWrap: e.target.checked })}
                  className="rounded border-border-primary text-accent-primary bg-[#060a14] focus:ring-accent-primary"
                />
              </div>

              {/* Line Numbers toggle */}
              <div className="flex items-center justify-between">
                <span>Line Numbers</span>
                <input
                  type="checkbox"
                  checked={editorSettings.lineNumbers}
                  onChange={(e) => onUpdateSettings({ ...editorSettings, lineNumbers: e.target.checked })}
                  className="rounded border-border-primary text-accent-primary bg-[#060a14] focus:ring-accent-primary"
                />
              </div>

              {/* Bracket Pair Colorization toggle */}
              <div className="flex items-center justify-between">
                <span>Bracket Pair Colorization</span>
                <input
                  type="checkbox"
                  checked={editorSettings.bracketPairColorization}
                  onChange={(e) => onUpdateSettings({ ...editorSettings, bracketPairColorization: e.target.checked })}
                  className="rounded border-border-primary text-accent-primary bg-[#060a14] focus:ring-accent-primary"
                />
              </div>

              {/* Sticky Scroll toggle */}
              <div className="flex items-center justify-between">
                <span>Sticky Scroll</span>
                <input
                  type="checkbox"
                  checked={editorSettings.stickyScroll}
                  onChange={(e) => onUpdateSettings({ ...editorSettings, stickyScroll: e.target.checked })}
                  className="rounded border-border-primary text-accent-primary bg-[#060a14] focus:ring-accent-primary"
                />
              </div>

              {/* Tab Size selection */}
              <div className="flex items-center justify-between">
                <span>Tab Size</span>
                <select
                  value={editorSettings.tabSize || 4}
                  onChange={(e) => onUpdateSettings({ ...editorSettings, tabSize: Number(e.target.value) })}
                  className="bg-[#060a14] border border-border-primary rounded px-2.5 py-1 text-white focus:outline-none focus:border-accent-primary"
                >
                  <option value="2">2</option>
                  <option value="4">4</option>
                  <option value="8">8</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-1.5 bg-accent-primary hover:bg-accent-bright text-white font-semibold rounded-lg text-xs transition-all shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Tab Context Menu */}
      {tabContextMenu && (
        <div
          className="fixed bg-[#060a14] border border-border-primary rounded-lg shadow-2xl py-1 z-50 min-w-[130px] text-[11px] text-slate-300 font-mono"
          style={{ top: `${tabContextMenu.y}px`, left: `${tabContextMenu.x}px` }}
        >
          <button
            onClick={() => { onTabClose(tabContextMenu.tabId); setTabContextMenu(null); }}
            className="w-full text-left px-3 py-1.5 hover:bg-accent-primary/20 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => { onTabCloseOthers(tabContextMenu.tabId); setTabContextMenu(null); }}
            className="w-full text-left px-3 py-1.5 hover:bg-accent-primary/20 hover:text-white transition-colors"
          >
            Close Others
          </button>
          <button
            onClick={() => { onTabCloseAll(); setTabContextMenu(null); }}
            className="w-full text-left px-3 py-1.5 hover:bg-accent-primary/20 hover:text-white transition-colors"
          >
            Close All
          </button>
          <button
            onClick={() => { onTabCloseSaved(); setTabContextMenu(null); }}
            className="w-full text-left px-3 py-1.5 hover:bg-accent-primary/20 hover:text-white transition-colors"
          >
            Close Saved
          </button>
        </div>
      )}
    </div>
  )
}

export default CodeEditor
