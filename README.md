# CodeRoom — Real-Time Collaborative Code Editor

CodeRoom is a full-stack **real-time collaborative code editor** that allows multiple developers to work together inside secure coding rooms.

Users can create or join rooms, share rooms using QR codes, edit code simultaneously, manage files and folders, communicate through real-time chat, run programs, create workspace snapshots, view file history, and collaborate through comments and activity tracking.

The project is designed to provide a browser-based collaborative development experience similar to a lightweight online IDE.

---

## 🚀 Features

### 🔐 Secure Coding Rooms

- Create a private coding room.
- Join an existing room using:
  - Room ID
  - Password
  - User name
- Secure password hashing.
- Host and member roles.
- Room-specific workspace.
- Strict room isolation.

---

### 🔗 Share Room

Room members can easily share a coding room using:

- Share Room link
- Copy Room ID
- QR Code

The QR code directs teammates to the appropriate room joining flow without exposing the room password.

---

### 👥 Real-Time Collaboration

Multiple users can work inside the same room simultaneously.

- Real-time code synchronization.
- Real-time file/folder updates.
- Participant presence.
- Join/leave notifications.
- Real-time chat.
- Collaboration activity.
- Room-scoped Socket.IO communication.

Changes made in one room never affect another room.

---

### 💻 Professional Code Editor

CodeRoom uses a modern browser-based code editor with features such as:

- Syntax highlighting
- Line numbers
- Multiple editor tabs
- Find & Replace
- Quick Open
- Auto-save
- Unsaved-change indicators
- Full-screen/focus mode
- Editor settings
- Word wrap
- Minimap
- Font-size configuration
- Tab-size configuration
- Multiple language support

---

### 🌐 Multi-Language Support

The editor supports multiple programming languages including:

- C
- C++
- Java
- Python
- JavaScript
- TypeScript
- C#
- Go
- Rust
- HTML
- CSS
- JSON
- SQL

The language is automatically detected from the file extension where appropriate.

---

### ▶️ Code Execution

CodeRoom provides an integrated code execution environment.

Supported execution features include:

- Compile and run code
- Standard input
- Standard output
- Error output
- Exit codes
- Execution time
- Compilation errors
- Runtime errors
- Execution timeout
- Stop execution
- Clear terminal

The execution system uses predefined language configurations rather than allowing arbitrary shell commands from the client.

---

### 📁 File & Folder Management

CodeRoom provides a VS Code-style workspace explorer.

Users can:

- Create files
- Create folders
- Upload files
- Upload folders
- Create nested folders
- Open files
- Rename files
- Rename folders
- Delete files
- Delete folders
- Download individual files
- Download the complete workspace

Example:

```text
Project/
├── src/
│   ├── main.cpp
│   └── utils.cpp
├── include/
│   └── utils.h
├── scripts/
│   └── test.py
└── README.md
