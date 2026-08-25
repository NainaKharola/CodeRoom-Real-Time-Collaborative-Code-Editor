
---

# 3. `Rules.md`

This one is **very important for your AI coding agent**.

```markdown
# Development Rules

# CodeRoom Development Rules

These rules must be followed by every developer and AI coding agent working on this project.

---

# 1. General Rules

1. Read PRD.md before implementing features.
2. Read Architecture.md before modifying architecture.
3. Read Rules.md before adding libraries or changing conventions.
4. Read Phases.md before starting a new feature.
5. Read Design.md before changing the UI.
6. Read Memory.md to understand previous implementation decisions.

Never blindly rewrite existing working code.

---

# 2. Technology Rules

## Frontend

Use:

- React
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Axios
- Socket.IO Client
- Monaco Editor
- Lucide React
- QRCode React

Do not introduce another frontend framework.

Do not migrate React to Next.js unless explicitly requested.

---

# 3. Backend Rules

Use:

- Node.js
- Express.js
- Socket.IO
- PostgreSQL
- pg
- bcrypt
- dotenv
- cors
- jsonwebtoken when authentication tokens are required

Do not introduce another backend framework.

---

# 4. Database Rules

PostgreSQL is the primary database.

Do not add:

- MongoDB
- Firebase database
- MySQL
- SQLite

unless explicitly approved.

Use parameterized PostgreSQL queries.

Never concatenate user input directly into SQL queries.

Bad:

SELECT * FROM rooms WHERE room_id = '${roomId}'

Good:

SELECT * FROM rooms WHERE room_id = $1

---

# 5. Password Rules

Passwords must never be stored as plain text.

Always use bcrypt.

Never:

- Return password hashes to frontend.
- Put passwords in URLs.
- Put passwords in QR codes.
- Log passwords.
- Store passwords in localStorage.

---

# 6. Environment Variable Rules

Sensitive values must be stored in .env.

Examples:

DATABASE_URL
JWT_SECRET
CLIENT_URL

Never hardcode:

- Database passwords
- JWT secrets
- API keys
- Private credentials

Never commit .env to Git.

---

# 7. Socket.IO Rules

Socket.IO is the real-time communication layer.

Room-specific events must always be scoped to the correct room.

Correct:

socket.to(roomId).emit(...)

Never broadcast private room information globally.

Do not send sensitive room information to unrelated sockets.

---

# 8. Code Synchronization Rules

Code changes should be sent through Socket.IO.

Do not write to PostgreSQL on every keystroke.

Use debouncing/throttling for persistence.

The originating user should not unnecessarily receive its own code update.

Avoid infinite synchronization loops.

---

# 9. Socket Listener Rules

Always clean up Socket.IO listeners when React components unmount.

Avoid duplicate listeners.

Bad pattern:

socket.on("code-update", handler)

without cleanup.

Use appropriate cleanup logic.

---

# 10. API Rules

API endpoints should:

- Validate input.
- Return consistent responses.
- Handle errors.
- Avoid leaking sensitive information.

Recommended response format:

{
  "success": true,
  "message": "Room created successfully",
  "data": {}
}

Errors:

{
  "success": false,
  "message": "Room not found"
}

---

# 11. HTTP Status Rules

Use appropriate HTTP status codes.

200:
Successful request.

201:
Resource created.

400:
Invalid input.

401:
Authentication required/invalid credentials.

403:
User is not allowed.

404:
Resource not found.

409:
Resource conflict.

500:
Unexpected server error.

---

# 12. Error Handling

Never expose internal errors to users.

Bad:

DatabaseError: password authentication failed for user postgres

Good:

Unable to process the request. Please try again.

Detailed technical errors should be logged on the server.

---

# 13. Logging Rules

Logs should help debugging without exposing sensitive information.

Allowed:

Room creation failed for room ID CR-123

Not allowed:

Password: 123456

DATABASE_URL=postgresql://...

JWT_SECRET=...

---

# 14. Frontend Error Handling

Every API operation should handle:

- Loading
- Success
- Failure

Example:

Create Room

Idle
↓
Loading
↓
Success / Error

Never leave the user with an unresponsive button.

---

# 15. Form Validation

Validate on both:

- Frontend
- Backend

Frontend validation improves UX.

Backend validation provides security.

Never trust frontend validation alone.

---

# 16. React Rules

Use reusable components.

Avoid putting the entire application into App.jsx.

Do not create extremely large components.

Prefer:

components/
pages/
hooks/
services/
context/

---

# 17. State Management

Do not introduce Redux for the initial project.

Use:

- React state
- Context
- Custom hooks

Only introduce a larger state management library if the application actually requires it.

---

# 18. Styling Rules

Use Tailwind CSS.

Keep styling consistent with Design.md.

Avoid random colors.

Avoid excessive gradients.

Avoid excessive animations.

Avoid inconsistent border radius values.

---

# 19. UI Rules

The application should look professional.

Avoid:

- Default browser alerts
- Browser prompt()
- Browser confirm()
- Unstyled forms
- Random emojis as UI icons
- Huge text everywhere
- Excessive shadows
- Excessive animations

Use proper UI components and Lucide icons.

---

# 20. QR Code Rules

QR codes should contain only safe joining information.

Example:

/join?room=CR-123

Never:

/join?room=CR-123&password=123456

---

# 21. Security Rules

Protect against:

- SQL injection
- XSS
- Unauthorized room access
- Sensitive data exposure
- Invalid socket connections
- Malicious input

Users must not gain access to a room merely by changing the URL.

---

# 22. Libraries — Allowed

Already approved:

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Socket.IO
- Socket.IO Client
- Monaco Editor
- QRCode React
- Lucide React
- Express
- PostgreSQL / pg
- bcrypt
- jsonwebtoken
- dotenv
- cors

---

# 23. Libraries — Avoid

Do not add libraries just because they are convenient.

Avoid adding:

- Redux
- Zustand
- Firebase
- MongoDB
- Prisma
- Sequelize
- Mongoose
- Redis
- Next.js
- Material UI
- Bootstrap
- Chakra UI

unless explicitly approved.

The project should remain lightweight.

---

# 24. Code Execution Rule

Do NOT implement arbitrary server-side code execution in the MVP.

Do not execute:

- C++
- Java
- Python
- JavaScript

directly on the backend server from user input.

This creates a serious security risk.

A future code execution feature must use an isolated sandbox/container architecture.

---

# 25. File Modification Rules

Before modifying a file:

1. Read it.
2. Understand its current purpose.
3. Make the smallest necessary change.
4. Preserve existing functionality.
5. Run/test after modification.

Do not delete working features to solve unrelated problems.

---

# 26. Dependency Rules

Before installing a new dependency:

1. Check whether an existing dependency can solve the problem.
2. Check whether the library is necessary.
3. Prefer small, maintained libraries.
4. Do not install duplicate libraries.

---

# 27. Testing Rules

After every major feature:

1. Start frontend.
2. Start backend.
3. Test the feature manually.
4. Check browser console.
5. Check backend logs.
6. Check PostgreSQL if database changes are involved.

For real-time features, test using multiple browser windows.

---

# 28. Git Rules

Use meaningful commits.

Examples:

feat: add room creation

feat: add real-time code sync

feat: add room QR sharing

fix: handle socket reconnect

fix: prevent duplicate socket listeners

Do not commit:

- .env
- node_modules
- build files
- secrets

---

# 29. AI Coding Agent Rules

Before making changes, the AI agent must:

1. Read relevant documentation.
2. Inspect existing files.
3. Understand current implementation.
4. Identify dependencies.
5. Implement only the requested feature.
6. Avoid unrelated refactoring.
7. Test the implementation.
8. Report what was changed.
9. Report any remaining issue.

Never regenerate the entire project unnecessarily.

---

# 30. Completion Rule

A feature is not considered complete until:

- Code is implemented.
- Existing functionality still works.
- No obvious console errors exist.
- Backend starts successfully.
- Frontend starts successfully.
- Relevant database operations work.
- Real-time functionality is tested when applicable.