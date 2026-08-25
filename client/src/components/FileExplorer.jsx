import React, { useState, useRef, useEffect } from 'react'
import { Folder, FolderPlus, FilePlus, File, ChevronDown, ChevronRight, Edit2, Trash2, Plus, X, Upload, FolderUp, RefreshCw, Download, Pin } from 'lucide-react'

function FileExplorer({ files, activeFileId, onFileOpen, onFileCreate, onFolderCreate, onRename, onDelete, onRefresh, onDownloadFile, onDownloadWorkspace, pinnedFiles = [], onTogglePin }) {
  const [expandedFolders, setExpandedFolders] = useState({})
  
  // Refs for local filesystem imports
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)

  // Context Menu state
  const [contextMenu, setContextMenu] = useState(null) // { x, y, nodeId, nodeType }

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState(null)

  // Creation/Rename Modal States
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('file') // 'file', 'folder', 'rename', 'delete'
  const [modalTargetId, setModalTargetId] = useState(null)
  const [modalInputValue, setModalInputValue] = useState('')
  const [modalError, setModalError] = useState('')

  const getUploadParentId = () => {
    if (!selectedNodeId) {
      if (activeFileId) {
        const activeFile = files.find(f => f.id === activeFileId)
        return activeFile ? activeFile.parentId : null
      }
      return null
    }
    const selectedItem = files.find(f => f.id === selectedNodeId)
    if (!selectedItem) return null
    return selectedItem.type === 'folder' ? selectedItem.id : selectedItem.parentId
  }

  // Handle local file imports
  const handleFileImport = async (e) => {
    const selectedFiles = Array.from(e.target.files)
    const parentId = getUploadParentId()

    for (const file of selectedFiles) {
      let finalName = file.name
      const duplicate = files.find(f => f.name.toLowerCase() === finalName.toLowerCase() && f.parentId === parentId)
      if (duplicate) {
        const choice = window.confirm(`"${finalName}" already exists. Would you like to REPLACE it? (Cancel to RENAME, or click Close/Abort to cancel)`)
        if (choice) {
          await onDelete(duplicate.id)
        } else {
          const newName = window.prompt("Enter new filename:", `copy_of_${finalName}`)
          if (!newName || !newName.trim()) {
            continue
          }
          finalName = newName.trim()
        }
      }

      const reader = new FileReader()
      const contentPromise = new Promise((resolve) => {
        reader.onload = (event) => resolve(event.target.result)
      })
      reader.readAsText(file)
      const fileContent = await contentPromise
      await onFileCreate(finalName, parentId, fileContent)
    }
    e.target.value = ''
  };

  // Handle local folder imports
  const handleFolderImport = async (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length === 0) return

    const targetParentId = getUploadParentId()
    const relativePath = selectedFiles[0].webkitRelativePath
    const rootName = relativePath.split('/')[0]

    // Create the root directory
    let rootFolderId
    const dupFolder = files.find(f => f.name.toLowerCase() === rootName.toLowerCase() && f.parentId === targetParentId && f.type === 'folder')
    if (dupFolder) {
      rootFolderId = dupFolder.id
    } else {
      const createdFolder = await onFolderCreate(rootName, targetParentId)
      if (!createdFolder || !createdFolder.id) return
      rootFolderId = createdFolder.id
    }

    const folderCache = {
      [rootName]: rootFolderId
    }

    for (const file of selectedFiles) {
      const pathSegments = file.webkitRelativePath.split('/')
      let currentParentId = rootFolderId
      let accumulatedPath = rootName

      // Create directories along the path segments
      for (let i = 1; i < pathSegments.length - 1; i++) {
        const folderName = pathSegments[i]
        accumulatedPath += '/' + folderName

        if (folderCache[accumulatedPath]) {
          currentParentId = folderCache[accumulatedPath]
        } else {
          const dupSub = files.find(f => f.name.toLowerCase() === folderName.toLowerCase() && f.parentId === currentParentId && f.type === 'folder')
          if (dupSub) {
            folderCache[accumulatedPath] = dupSub.id
            currentParentId = dupSub.id
          } else {
            const newFolderObj = await onFolderCreate(folderName, currentParentId)
            if (newFolderObj && newFolderObj.id) {
              folderCache[accumulatedPath] = newFolderObj.id
              currentParentId = newFolderObj.id
            }
          }
        }
      }

      // Read file content
      const reader = new FileReader()
      const contentPromise = new Promise((resolve) => {
        reader.onload = (event) => resolve(event.target.result)
      })
      reader.readAsText(file)
      const fileContent = await contentPromise

      const fileName = pathSegments[pathSegments.length - 1]
      let finalName = fileName
      const dupFile = files.find(f => f.name.toLowerCase() === finalName.toLowerCase() && f.parentId === currentParentId)
      if (dupFile) {
        const choice = window.confirm(`"${finalName}" already exists. Would you like to REPLACE it? (Cancel to RENAME, or click Close/Abort to cancel)`)
        if (choice) {
          await onDelete(dupFile.id)
        } else {
          const newName = window.prompt("Enter new filename:", `copy_of_${finalName}`)
          if (!newName || !newName.trim()) {
            continue
          }
          finalName = newName.trim()
        }
      }
      await onFileCreate(finalName, currentParentId, fileContent)
    }

    e.target.value = ''
  };

  // Close context menu on window click or Escape
  useEffect(() => {
    const handleClose = () => setContextMenu(null)
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('click', handleClose)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('click', handleClose)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleNodeContextMenu = (e, nodeId, nodeType) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Boundary check so menu doesn't go outside viewport
    const menuWidth = 140
    const menuHeight = 160
    let x = e.clientX
    let y = e.clientY
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10
    }

    setContextMenu({ x, y, nodeId, nodeType })
  }

  // Build tree hierarchy from flat array
  const buildTree = (items) => {
    const map = {}
    const roots = []
    
    items.forEach(item => {
      map[item.id] = { ...item, children: [] }
    })
    
    items.forEach(item => {
      const mapped = map[item.id]
      if (item.parentId) {
        if (map[item.parentId]) {
          map[item.parentId].children.push(mapped)
        }
      } else {
        roots.push(mapped)
      }
    })
    
    // Sort: Folders first, then Files alphabetically
    const sortTree = (nodes) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortTree(node.children)
        }
      })
    }
    
    sortTree(roots)
    return roots
  }

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }))
  }

  const openModal = (type, targetId = null, initialVal = '') => {
    setModalType(type)
    setModalTargetId(targetId)
    setModalInputValue(initialVal)
    setModalError('')
    setModalOpen(true)
  }

  const handleModalSubmit = (e) => {
    e.preventDefault()
    setModalError('')

    const val = modalInputValue.trim()
    if (modalType !== 'delete' && !val) {
      return setModalError('Name cannot be empty.')
    }

    if (modalType !== 'delete' && (val.includes('/') || val.includes('\\') || val.includes('..'))) {
      return setModalError('Name contains invalid characters.')
    }

    if (modalType === 'file') {
      onFileCreate(val, modalTargetId)
    } else if (modalType === 'folder') {
      onFolderCreate(val, modalTargetId)
    } else if (modalType === 'rename') {
      onRename(modalTargetId, val)
    } else if (modalType === 'delete') {
      onDelete(modalTargetId)
    }

    setModalOpen(false)
  }

  const treeData = buildTree(files)

  const renderNode = (node, depth = 0) => {
    const isExpanded = expandedFolders[node.id]
    const isActive = node.id === activeFileId
    const isSelected = node.id === selectedNodeId
    const isFolder = node.type === 'folder'

    return (
      <div key={node.id} className="select-none font-mono">
        {/* Node Row */}
        <div 
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 text-xs rounded-lg cursor-pointer transition-colors ${
            isActive 
              ? 'bg-accent-primary/20 text-accent-highlight border-l-2 border-accent-primary' 
              : isSelected
                ? 'bg-card text-white border-l border-slate-500'
                : 'text-slate-300 hover:bg-card/45 hover:text-white'
          }`}
          onContextMenu={(e) => handleNodeContextMenu(e, node.id, node.type)}
          onClick={() => {
            setSelectedNodeId(node.id)
            if (isFolder) {
              toggleFolder(node.id)
            } else {
              onFileOpen(node.id)
            }
          }}
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            {isFolder ? (
              <>
                {isExpanded ? <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" /> : <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />}
                <Folder className="h-4 w-4 shrink-0 text-yellow-500 fill-yellow-500/20" />
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3 shrink-0 opacity-0" />
                <File className="h-4 w-4 shrink-0 text-accent-highlight" />
              </>
            )}
            <span className="truncate">{node.name}</span>
          </div>

          {/* Quick Actions Hover buttons */}
          <div className="hidden group-hover:flex items-center space-x-1 shrink-0">
            {isFolder && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); openModal('file', node.id) }} 
                  className="p-0.5 hover:text-accent-highlight hover:bg-background-primary rounded"
                  title="New File"
                >
                  <FilePlus className="h-3 w-3" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); openModal('folder', node.id) }} 
                  className="p-0.5 hover:text-accent-highlight hover:bg-background-primary rounded"
                  title="New Folder"
                >
                  <FolderPlus className="h-3 w-3" />
                </button>
              </>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); openModal('rename', node.id, node.name) }} 
              className="p-0.5 hover:text-yellow-400 hover:bg-background-primary rounded"
              title="Rename"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); openModal('delete', node.id, node.name) }} 
              className="p-0.5 hover:text-red-400 hover:bg-background-primary rounded"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Children Render */}
        {isFolder && isExpanded && node.children.length > 0 && (
          <div className="mt-0.5">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-64 border-r border-border-primary/60 bg-[#070b16] flex flex-col shrink-0 h-full overflow-hidden">
      {/* Hidden local filesystem file/folder inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        multiple 
        className="hidden" 
        onChange={handleFileImport} 
      />
      <input 
        type="file" 
        ref={folderInputRef} 
        webkitdirectory="" 
        directory="" 
        className="hidden" 
        onChange={handleFolderImport} 
      />

      {/* File actions */}
      <div className="p-3 border-b border-border-primary/50 flex items-center justify-between shrink-0 bg-[#060a14]">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Explorer</span>
        <div className="flex items-center space-x-1.5">
          <button 
            onClick={() => openModal('file', null)} 
            className="p-1 hover:text-white text-slate-400 rounded hover:bg-card transition-colors"
            title="New File at Root"
          >
            <FilePlus className="h-4 w-4" />
          </button>
          <button 
            onClick={() => openModal('folder', null)} 
            className="p-1 hover:text-white text-slate-400 rounded hover:bg-card transition-colors"
            title="New Folder at Root"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
          <button 
            onClick={() => fileInputRef.current.click()} 
            className="p-1 hover:text-white text-slate-400 rounded hover:bg-card transition-colors"
            title="Upload File"
          >
            <Upload className="h-4 w-4" />
          </button>
          <button 
            onClick={() => folderInputRef.current.click()} 
            className="p-1 hover:text-white text-slate-400 rounded hover:bg-card transition-colors"
            title="Upload Folder"
          >
            <FolderUp className="h-4 w-4" />
          </button>
          <button 
            onClick={onRefresh} 
            className="p-1 hover:text-white text-slate-400 rounded hover:bg-card transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button 
            onClick={onDownloadWorkspace} 
            className="p-1 hover:text-white text-slate-400 rounded hover:bg-card transition-colors"
            title="Download Workspace (ZIP)"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Folders tree list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {pinnedFiles.length > 0 && (
          <div className="mb-3">
            <span className="text-[9px] uppercase font-bold text-accent-highlight tracking-wider block mb-1.5 px-2">📌 Pinned Files</span>
            <div className="space-y-0.5">
              {files.filter(f => pinnedFiles.includes(f.id)).map(file => (
                <div
                  key={`pinned-${file.id}`}
                  onClick={() => onFileOpen(file.id)}
                  className={`flex items-center justify-between px-2 py-1 text-xs font-mono rounded hover:bg-card/45 hover:text-white cursor-pointer ${
                    activeFileId === file.id ? 'text-accent-highlight bg-accent-primary/10' : 'text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <File className="h-3.5 w-3.5 text-accent-highlight shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onTogglePin(file.id); }}
                    className="p-0.5 text-slate-400 hover:text-white transition-opacity"
                    title="Unpin file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-b border-border-primary/20 my-2.5" />
          </div>
        )}

        {files.length === 0 ? (
          <div className="text-[11px] text-slate-500 italic p-3">Workspace empty</div>
        ) : (
          treeData.map(node => renderNode(node, 0))
        )}
      </div>

      {/* Styled Modals Container */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-primary/75 backdrop-blur-xs">
          <div className="bg-card border border-border-primary rounded-xl p-5 max-w-sm w-full shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-2">
              {modalType === 'file' && 'Create New File'}
              {modalType === 'folder' && 'Create New Folder'}
              {modalType === 'rename' && 'Rename Workspace Item'}
              {modalType === 'delete' && 'Delete Confirmation'}
            </h3>
            
            {modalType === 'delete' ? (
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                {files.find(f => f.id === modalTargetId)?.type === 'folder'
                  ? `Are you sure you want to delete folder "${files.find(f => f.id === modalTargetId)?.name}" and all of its nested contents recursively? This action cannot be undone.`
                  : `Are you sure you want to permanently delete "${files.find(f => f.id === modalTargetId)?.name}"? Unsaved changes will be lost.`}
              </p>
            ) : (
              <form onSubmit={handleModalSubmit} className="space-y-4">
                <input 
                  type="text" 
                  autoFocus
                  value={modalInputValue}
                  onChange={(e) => setModalInputValue(e.target.value)}
                  placeholder={modalType === 'folder' ? 'Folder name' : 'file.cpp, index.js'}
                  className="w-full bg-[#060a14] border border-border-primary rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-primary"
                />
                {modalError && <p className="text-[10px] text-red-400 mt-1 font-semibold">{modalError}</p>}
              </form>
            )}

            <div className="flex justify-end space-x-2.5 mt-4">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-3.5 py-1.5 bg-[#060a14] hover:bg-card border border-border-primary text-slate-300 font-semibold rounded-lg text-xs transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleModalSubmit}
                className={`px-3.5 py-1.5 font-semibold rounded-lg text-xs transition-all text-white ${
                  modalType === 'delete' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-accent-primary hover:bg-accent-bright'
                }`}
              >
                {modalType === 'delete' ? 'Delete' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-[#060a14] border border-border-primary rounded-lg shadow-2xl py-1 z-50 min-w-[130px] text-[11px] text-slate-300 font-mono"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          {contextMenu.nodeType === 'file' ? (
            <>
              <button 
                onClick={() => { onFileOpen(contextMenu.nodeId); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-accent-primary/20 hover:text-white transition-colors"
              >
                Open File
              </button>
              <button 
                onClick={() => { onTogglePin(contextMenu.nodeId); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-accent-primary/20 hover:text-white transition-colors"
              >
                {pinnedFiles.includes(contextMenu.nodeId) ? 'Unpin File' : 'Pin File'}
              </button>
              <button 
                onClick={() => { onDownloadFile(contextMenu.nodeId); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-accent-primary/20 hover:text-white transition-colors"
              >
                Download File
              </button>
              <button 
                onClick={() => { openModal('rename', contextMenu.nodeId); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-accent-primary/20 hover:text-white transition-colors"
              >
                Rename File
              </button>
              <button 
                onClick={() => { openModal('delete', contextMenu.nodeId); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-500/25 hover:text-red-400 text-red-500 transition-colors"
              >
                Delete File
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => { openModal('file', contextMenu.nodeId); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-accent-primary/20 hover:text-white transition-colors"
              >
                New File
              </button>
              <button 
                onClick={() => { openModal('folder', contextMenu.nodeId); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-accent-primary/20 hover:text-white transition-colors"
              >
                New Folder
              </button>
              <button 
                onClick={() => { openModal('rename', contextMenu.nodeId); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-accent-primary/20 hover:text-white transition-colors"
              >
                Rename Folder
              </button>
              <button 
                onClick={() => { openModal('delete', contextMenu.nodeId); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 hover:bg-red-500/25 hover:text-red-400 text-red-500 transition-colors"
              >
                Delete Folder
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default FileExplorer
