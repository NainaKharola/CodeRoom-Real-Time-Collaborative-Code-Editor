# Product Requirements Document (PRD)

# CodeRoom — Real-Time Collaborative Code Editor

## 1. Product Overview

CodeRoom is a web-based real-time collaborative code editor that allows multiple developers or teammates to work together inside private coding rooms.

Users can either:

- Create a new room
- Join an existing room

A room creator can share the room with teammates using:

- Room ID
- Password
- QR code / shareable join link

Once multiple users enter the same room, they can:

- Write code together in real time
- See code changes instantly
- See connected teammates
- Chat with teammates
- Select different programming languages
- Share the room through a QR code

The primary goal is to provide a simple, secure, modern and visually impressive collaborative coding experience.

---

# 2. Problem Statement

When developers work together remotely, they often need to share code through:

- Screenshots
- Messaging applications
- Git repositories
- Screen sharing
- Copy-pasting code

These approaches are not ideal for quick collaborative coding sessions.

CodeRoom solves this by providing a shared coding environment where teammates can enter the same private room and edit code together in real time.

---

# 3. Target Users

## Primary Users

### Students

Students working on:

- College projects
- Hackathons
- DSA practice
- Programming assignments
- Group projects

### Developers

Developers who need:

- Quick pair programming
- Code reviews
- Debugging sessions
- Technical discussions
- Remote collaboration

### Interview Preparation Groups

Users preparing together for:

- Coding interviews
- Online assessments
- DSA practice
- Mock interviews

### Small Development Teams

Small teams that need a lightweight temporary collaborative coding environment.

---

# 4. Product Goals

The product should:

1. Make collaborative coding extremely easy.
2. Allow users to create a room within seconds.
3. Allow teammates to join using a room ID and password.
4. Allow joining through a QR code.
5. Synchronize code changes in real time.
6. Show connected teammates.
7. Provide built-in real-time chat.
8. Support multiple programming languages.
9. Provide a professional developer-focused UI.
10. Keep private rooms secure.

---

# 5. Non-Goals

The initial version will NOT include:

- Full Git/GitHub integration
- Production code deployment
- Online compiler execution
- Arbitrary server-side code execution
- Complex user account management
- Video conferencing
- Voice calls
- File sharing
- Enterprise organization management
- Advanced IDE debugging
- Full project/file-system management

These can be considered for future versions.

---

# 6. Core User Flows

## 6.1 Create Room

User opens the homepage.

User selects:

Create Room

User enters:

- Room Name
- Creator Name
- Room ID or generates one
- Password

System:

1. Validates the input.
2. Checks Room ID availability.
3. Hashes the password.
4. Creates the room.
5. Creates the initial code session.
6. Adds creator as Host.
7. Opens the collaborative room.

After entering the room, the host can:

- Copy Room ID
- Generate QR code
- Copy share link
- View participants
- Start coding

---

# 6.2 Join Room

User selects:

Join Room

User enters:

- Room ID
- Password
- Name

System:

1. Finds the room.
2. Checks whether the room is active.
3. Verifies the password.
4. Adds the user as a participant.
5. Opens the collaborative room.

---

# 6.3 QR Join Flow

Host selects:

Generate QR

System generates a QR code containing a join URL.

Example:

/join?room=CR-7K9P2X

A teammate scans the QR code.

The Join Room page automatically detects the Room ID.

The teammate enters:

- Name
- Password

After successful validation, they enter the room.

IMPORTANT:

The room password must never be stored directly inside the QR code.

---

# 6.4 Collaborative Coding Flow

Inside a room:

- Users see the code editor.
- Users can select a programming language.
- Code changes are synchronized using Socket.IO.
- Users see connected participants.
- Users can communicate through chat.

Example:

Naina types code.

Socket.IO sends the change to the room.

Rahul and Aman immediately receive the update.

The update must not be broadcast to unrelated rooms.

---

# 7. Core Features

## 7.1 Landing Page

The homepage must contain:

- Navbar
- Hero section
- Create Room CTA
- Join Room CTA
- Feature section
- How It Works section
- Footer

The hero section should clearly communicate:

"Code Together. Build Together."

The visual should represent a real collaborative code editor.

---

# 7.2 Create Room

Fields:

- Room Name
- Creator Name
- Room ID
- Password

Features:

- Generate Room ID
- Validate Room ID uniqueness
- Password validation
- Create room
- Redirect to collaborative room

---

# 7.3 Join Room

Fields:

- Room ID
- Name
- Password

Features:

- Validate room
- Validate password
- Add participant
- Redirect to room

---

# 7.4 QR Code Sharing

Host can:

- Generate QR
- Copy room link
- Download QR
- Copy Room ID

QR should contain a safe join URL.

---

# 7.5 Real-Time Code Editor

Use Monaco Editor.

Supported languages initially:

- JavaScript
- TypeScript
- Python
- Java
- C++
- HTML
- CSS

Editor features:

- Syntax highlighting
- Line numbers
- Dark theme
- Minimap
- Automatic layout
- Proper indentation
- Word wrapping
- Language selection

---

# 7.6 Real-Time Synchronization

Socket.IO should synchronize:

- Code
- Language
- Participants
- Join events
- Leave events
- Connection status
- Chat

Only users inside the same room should receive room-specific updates.

---

# 7.7 Participants

Display:

- Name
- Online status
- Host badge
- Total online users

Example:

Naina — Host
Rahul — Online
Aman — Online
Priya — Online

Participant information must update in real time.

---

# 7.8 Real-Time Chat

Users can:

- Send messages
- Receive messages
- See sender
- See timestamp
- See their own messages differently

Messages belong to a room.

Messages should not leak between rooms.

Recent chat history can be loaded from PostgreSQL.

---

# 7.9 Room Management

Host should be able to:

- View Room ID
- Copy Room ID
- Generate QR
- Share Room
- Leave Room
- End Room

If the host ends a room, connected users should receive an appropriate notification.

---

# 8. Database Requirements

PostgreSQL should store persistent information.

Initial tables:

### rooms

- id
- room_id
- room_name
- password_hash
- creator_name
- created_at
- is_active

### participants

- id
- room_id
- name
- role
- joined_at
- last_active

### code_sessions

- id
- room_id
- code
- language
- updated_at

### messages

- id
- room_id
- sender_name
- message
- created_at

---

# 9. Security Requirements

The application must:

- Hash passwords using bcrypt.
- Never store passwords in plain text.
- Never expose password hashes to the frontend.
- Validate all user input.
- Protect room access.
- Ensure users can only access rooms they have joined.
- Keep environment variables private.
- Avoid exposing database credentials.
- Configure CORS correctly.
- Handle Socket.IO authorization.
- Prevent cross-room message/code broadcasting.

---

# 10. Performance Requirements

Real-time collaboration must feel immediate.

Requirements:

- Avoid unnecessary database writes on every keystroke.
- Use Socket.IO for real-time synchronization.
- Debounce/throttle persistence to PostgreSQL.
- Broadcast only to relevant rooms.
- Avoid unnecessary React re-renders.
- Clean up Socket.IO listeners when components unmount.

---

# 11. Responsive Requirements

The application should work well on:

- Desktop
- Laptop
- Tablet

Desktop is the primary target because collaborative coding requires significant screen space.

Mobile should provide a usable experience but does not need to reproduce the full desktop editor layout.

---

# 12. Success Criteria

The MVP is successful when:

1. A user can create a room.
2. A user can join the room using ID/password.
3. A QR code can be generated.
4. A teammate can join through the QR link.
5. Multiple users can enter the same room.
6. Code changes synchronize in real time.
7. Participants update in real time.
8. Chat works in real time.
9. Multiple programming languages work.
10. Room passwords are securely stored.
11. Users from different rooms cannot see each other's data.
12. The application has a polished professional UI.

---

# 13. Future Features

Potential future features:

- GitHub integration
- User accounts
- Saved projects
- File explorer
- Multiple files
- Code execution sandbox
- Voice chat
- Video conferencing
- Cursor sharing
- Selection highlighting
- Version history
- Code snapshots
- Room expiration
- Invite links
- Team/workspace accounts