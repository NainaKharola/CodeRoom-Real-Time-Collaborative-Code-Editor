# Project Memory

# CodeRoom

This file contains important project decisions, implementation history, conventions, and current status.

AI coding agents must read this file before making major changes.

---

# 1. Project Identity

Project Name:

CodeRoom

Project Type:

Real-Time Collaborative Code Editor

Primary Goal:

Allow multiple users to collaborate on code in private real-time rooms.

---

# 2. Current Project Structure

Root:

collaborative-code-editor/

Frontend:

client/

Backend:

server/

Documentation:

PRD.md
Architecture.md
Rules.md
Phases.md
Design.md
Memory.md

---

# 3. Technology Stack

Frontend:

React
Vite
JavaScript
Tailwind CSS

Backend:

Node.js
Express.js

Real-time:

Socket.IO

Database:

PostgreSQL

Editor:

Monaco Editor

Other:

Axios
React Router
QRCode React
Lucide React
bcrypt
jsonwebtoken
dotenv
cors

---

# 4. Core Product Flow

Homepage:

Create Room
or
Join Room

Create Room:

Create Room
→
Enter Room Details
→
Create Room
→
Collaborative Room
→
Generate QR / Share

Join Room:

Join Room
→
Room ID
→
Password
→
Name
→
Collaborative Room

QR:

Scan QR
→
Join URL
→
Room ID automatically detected
→
Name + Password
→
Collaborative Room

---

# 5. Database

Database:

collaborative_editor

Tables:

rooms
participants
code_sessions
messages

---

# 6. Room Model

Room contains:

- Room ID
- Room Name
- Password Hash
- Creator Name
- Created At
- Active Status

Host is represented as:

role = host

Regular users:

role = member

---

# 7. Security Decisions

Room passwords use bcrypt.

Passwords are never:

- Stored in plain text.
- Sent back to frontend.
- Included in QR codes.
- Included in URLs.
- Logged.

Environment variables are stored in:

server/.env

---

# 8. Real-Time Decisions

Socket.IO is responsible for real-time communication.

PostgreSQL is responsible for persistence.

Room-specific Socket.IO events must always be scoped to the correct room.

Code synchronization must not be implemented by polling PostgreSQL.

---

# 9. Code Persistence

Current collaborative code should be synchronized through Socket.IO.

PostgreSQL should be updated using debounced/throttled persistence.

Do not write to PostgreSQL for every keystroke.

---

# 10. Supported Languages

Initial:

JavaScript
TypeScript
Python
Java
C++
HTML
CSS

---

# 11. UI Direction

Theme:

Dark developer SaaS

Primary accent:

Purple / Indigo

Main background:

Deep navy / black

Primary font:

Inter

Code font:

JetBrains Mono

Design reference:

Modern developer collaboration platform.

Hero:

"Code Together. Build Together."

---

# 12. Important Design Decisions

The homepage should have:

- Strong hero
- Create Room CTA
- Join Room CTA
- Collaborative editor visual
- Feature cards
- How It Works

The room should resemble a modern IDE.

---

# 13. Approved Libraries

Frontend:

React
Vite
Tailwind CSS
React Router
Axios
Socket.IO Client
Monaco Editor
QRCode React
Lucide React

Backend:

Node.js
Express
Socket.IO
pg
bcrypt
jsonwebtoken
dotenv
cors

---

# 14. Libraries Not Currently Approved

Do not introduce without explicit approval:

Redux
Zustand
MongoDB
Mongoose
Prisma
Sequelize
Firebase
Redis
Next.js
Material UI
Bootstrap
Chakra UI

---

# 15. Code Execution

Code execution is NOT part of the MVP.

Do not execute user-submitted code directly on the Node.js server.

Any future code execution feature must use an isolated sandbox/container.

---

# 16. Current Development Status

Phase 0:

COMPLETED

- Project root created.
- React/Vite client created.
- Node server created.
- Frontend dependencies installed.
- Backend dependencies installed.

Phase 1:

IN PROGRESS

Documentation files being created.

---

# 17. Current Known Decisions

The application does not require permanent user accounts for the initial MVP.

Users primarily identify themselves by:

Name + Room Session

Room password protects private rooms.

---

# 18. Future Ideas

Potential future features:

- GitHub integration
- User accounts
- Saved projects
- Multiple files
- File explorer
- Cursor sharing
- Code execution sandbox
- Voice chat
- Video calls
- Version history
- Room expiration

These are NOT part of the MVP unless explicitly approved.

---

# 19. AI Agent Instructions

Before modifying the project:

1. Read PRD.md.
2. Read Architecture.md.
3. Read Rules.md.
4. Read Phases.md.
5. Read Design.md.
6. Read Memory.md.
7. Inspect the actual source code.
8. Make only the required changes.
9. Preserve working functionality.
10. Test the changes.
11. Update Memory.md when an important architectural or product decision changes.

Do not assume that old plans are still correct if the source code or Memory.md says otherwise.

---

# 20. Decision Log

## Initial Setup

Decision:

Use React + Node.js + Socket.IO + PostgreSQL.

Reason:

Simple, free/open-source, JavaScript-based and appropriate for real-time collaboration.

---

## Database

Decision:

Use PostgreSQL.

Reason:

Relational structure is appropriate for rooms, participants and messages.

---

## Real-Time

Decision:

Use Socket.IO.

Reason:

Reliable room-based real-time communication and reconnect handling.

---

## Editor

Decision:

Use Monaco Editor.

Reason:

Provides a VS Code-like coding experience and supports multiple languages.

---

## QR

Decision:

Use QRCode React.

Reason:

Simple client-side QR generation.

---

# 21. Change Log

Add future changes here.

Example:

## 2026-08-25

- Initial project documentation created.
- Architecture established.
- React + Node + Socket.IO + PostgreSQL stack selected.
- Dark purple developer SaaS theme selected.