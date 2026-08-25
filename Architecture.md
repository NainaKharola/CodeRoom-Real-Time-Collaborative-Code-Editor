# Architecture

# CodeRoom — System Architecture

## 1. Architecture Overview

CodeRoom follows a client-server architecture.

The application consists of:

1. React frontend
2. Node.js + Express backend
3. Socket.IO real-time communication layer
4. PostgreSQL database

High-level architecture:

Browser
    |
    | HTTP / REST
    |
    v
Node.js + Express
    |
    +--------------------+
    |                    |
    v                    v
PostgreSQL           Socket.IO
                         |
                  Real-time rooms
                         |
             +-----------+-----------+
             |           |           |
           User A      User B      User C

---

# 2. Application Flow

## Landing Page

/

User sees:

- Hero
- Create Room
- Join Room

---

## Create Room

/

    |
    v

Create Room Form

    |
    v

POST /api/rooms/create

    |
    v

Validate request

    |
    v

Check Room ID

    |
    v

Hash password

    |
    v

Create room in PostgreSQL

    |
    v

Create code session

    |
    v

Create host participant

    |
    v

/room/:roomId

---

# 3. Join Room Flow

/

    |
    v

Join Room

    |
    v

POST /api/rooms/join

    |
    v

Find Room

    |
    v

Validate Password

    |
    v

Create Participant

    |
    v

/room/:roomId

---

# 4. QR Flow

Host:

Collaborative Room
        |
        v
Generate QR
        |
        v
QR contains:
/join?room=ROOM_ID

Teammate:

Scan QR
        |
        v
Join Page
        |
        v
Room ID automatically populated
        |
        v
Name + Password
        |
        v
Join Room
        |
        v
Collaborative Editor

---

# 5. Collaborative Room Flow

/room/:roomId

        |
        +-------------------+
        |                   |
        v                   v
Fetch room information   Connect Socket.IO
                            |
                            v
                       Join Socket Room
                            |
              +-------------+-------------+
              |             |             |
              v             v             v
           Code          Users          Chat
              |             |             |
              +-------------+-------------+
                            |
                            v
                       PostgreSQL

6. Real-Time Code Flow

User A edits code.

Monaco Editor
|
v
onChange
|
v
Socket.IO
|
v
Server
|
v
socket.to(roomId)
|
+------------+------------+
| | |
v v v
User B User C User D

The originating user should not receive its own update again.

7. Initial Code Flow

When a new user joins:

New User
|
v
join-room
|
v
Socket.IO Room
|
v
Request Current Code
|
v
Server
|
v
PostgreSQL / Current Room State
|
v
initial-code
|
v
New User's Monaco Editor


---

# 8. Chat Flow

User sends message.

ChatPanel
    |
    v
send-message
    |
    v
Socket.IO
    |
    v
Room
    |
    +------------+------------+
    |            |            |
    v            v            v
User A        User B        User C

Server can persist the message to PostgreSQL.

---

# 9. Participants Flow

User joins.

Socket.IO:

join-room
    |
    v
Server
    |
    +--> Add participant
    |
    +--> Notify room
    |
    +--> Broadcast room-users

When user disconnects:

disconnect
    |
    v
Server
    |
    +--> Update participant state
    |
    +--> Broadcast user-left
10. Frontend Architecture

The frontend uses React with reusable components.

Recommended structure:

client/
│
├── src/
│ ├── assets/
│ │
│ ├── components/
│ │ ├── Navbar.jsx
│ │ ├── Hero.jsx
│ │ ├── FeatureCard.jsx
│ │ ├── CreateRoomModal.jsx
│ │ ├── JoinRoomModal.jsx
│ │ ├── QRModal.jsx
│ │ ├── RoomHeader.jsx
│ │ ├── CodeEditor.jsx
│ │ ├── Participants.jsx
│ │ └── ChatPanel.jsx
│ │
│ ├── pages/
│ │ ├── Home.jsx
│ │ ├── JoinRoom.jsx
│ │ └── Room.jsx
│ │
│ ├── context/
│ │ └── RoomContext.jsx
│ │
│ ├── hooks/
│ │ └── useSocket.js
│ │
│ ├── services/
│ │ └── api.js
│ │
│ ├── App.jsx
│ ├── main.jsx
│ └── index.css

11. Backend Architecture

server/
│
├── config/
│ └── db.js
│
├── controllers/
│ └── roomController.js
│
├── routes/
│ └── roomRoutes.js
│
├── sockets/
│ └── roomSocket.js
│
├── middleware/
│ └── authMiddleware.js
│
├── utils/
│ ├── generateRoomId.js
│ └── generateToken.js
│
├── server.js
├── package.json
└── .env

12. Responsibilities
React

Responsible for:

UI
Forms
Navigation
Monaco Editor
Chat UI
Participants UI
QR UI
Socket.IO client

React should not directly access PostgreSQL.

Express

Responsible for:

REST APIs
Validation
Room creation
Room joining
Database operations
Authentication/session validation
Socket.IO

Responsible for:

Real-time code synchronization
Participants
Chat
Room events
Connection status
PostgreSQL

Responsible for:

Persistent rooms
Participants
Code sessions
Messages
13. API Structure

POST /api/rooms/create

Creates a room.

POST /api/rooms/join

Joins a room.

GET /api/rooms/:roomId

Gets room information.

GET /api/rooms/:roomId/code

Gets persisted code.

GET /api/rooms/:roomId/messages

Gets recent messages.

14. Socket Events
Room

join-room
user-joined
user-left
room-users

Code

code-change
code-update
request-initial-code
initial-code

Language

language-change
language-update

Chat

send-message
receive-message

Connection

disconnect
reconnect

15. Technology Stack
Frontend

React
Vite
JavaScript
Tailwind CSS
React Router
Axios
Monaco Editor
Socket.IO Client
Lucide React
QRCode React

Backend

Node.js
Express.js
Socket.IO
bcrypt
jsonwebtoken
dotenv
cors

Database

PostgreSQL
pg

16. Data Ownership

Real-time state:

Current connected users
Active socket connections
Temporary code updates
Live chat events

Persistent state:

Rooms
Password hashes
Participants
Saved code
Messages
17. Important Architecture Principle

Socket.IO is responsible for real-time communication.

PostgreSQL is responsible for persistence.

Do NOT use PostgreSQL as the real-time messaging layer.

Correct:

User
|
Socket.IO
|
Other Users

Persistence:

User
|
Server
|
PostgreSQL

18. Scalability Consideration

The first version will use a single Node.js server.

For future scaling, Socket.IO can use a Redis adapter so that multiple backend instances can communicate.

Redis is NOT required for the initial MVP.

Do not introduce Redis unless scaling requires it.