const { pool } = require('../config/db');

// In-memory store for active connections
// Structure: { [roomId]: { [socketId]: { participantId, participantName, role } } }
const activeRooms = {};
const saveTimeouts = {};

/**
 * Debounced database update helper for room code sessions
 */
function debounceSaveCode(roomId, code, language) {
  if (saveTimeouts[roomId]) {
    clearTimeout(saveTimeouts[roomId]);
  }

  saveTimeouts[roomId] = setTimeout(async () => {
    try {
      // Upsert into code_sessions
      await pool.query(`
        INSERT INTO code_sessions (room_id, code, language, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (room_id)
        DO UPDATE SET code = EXCLUDED.code, language = EXCLUDED.language, updated_at = NOW()
      `, [roomId, code, language]);
    } catch (err) {
      console.error(`Failed to automatically persist code for room ${roomId}:`, err.message);
    }
  }, 800); // 800ms debounce window
}

const fileSaveTimeouts = {};

/**
 * Debounced database update helper for specific files in the workspace
 */
function debounceSaveFile(roomId, fileId, content) {
  if (fileSaveTimeouts[fileId]) {
    clearTimeout(fileSaveTimeouts[fileId]);
  }

  fileSaveTimeouts[fileId] = setTimeout(async () => {
    try {
      await pool.query(
        'UPDATE workspace_files SET content = $1, updated_at = NOW() WHERE id = $2 AND room_id = $3',
        [content, fileId, roomId]
      );
    } catch (err) {
      console.error(`Failed to auto-persist file ${fileId}:`, err.message);
    }
  }, 800);
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    // 1. Join Room
    socket.on('join-room', async ({ roomId, participantId, participantName, role }) => {
      socket.join(roomId);

      if (!activeRooms[roomId]) {
        activeRooms[roomId] = {};
      }

      let activeRole = role || 'member';
      let activeName = participantName || 'Teammate';

      try {
        const res = await pool.query(
          'SELECT name, role FROM participants WHERE id = $1 AND room_id = $2',
          [participantId, roomId]
        );
        if (res.rowCount > 0) {
          activeName = res.rows[0].name;
          activeRole = res.rows[0].role;
        }
      } catch (err) {
        console.error('Error querying database for authoritative participant socket role:', err.message);
      }

      // Save user session associated to socket id
      activeRooms[roomId][socket.id] = { 
        roomId, 
        participantId, 
        participantName: activeName, 
        role: activeRole 
      };

      // Broadcast room join notification to others
      socket.to(roomId).emit('room-notification', `${activeName} joined the room`);

      // Broadcast active participants lists to all occupants
      io.to(roomId).emit('room-participants', Object.values(activeRooms[roomId]));
    });

    // 2. Real-Time File Code Change
    socket.on('file-change', ({ roomId, fileId, content, participantId }) => {
      if (!socket.rooms.has(roomId)) return;
      // Broadcast ONLY to other sockets in the same room
      socket.to(roomId).emit('file-update', { fileId, content, participantId });

      // Trigger debounced save
      debounceSaveFile(roomId, fileId, content);
    });

    // 3. Real-Time Workspace Update (file/folder created, renamed, deleted)
    socket.on('workspace-change', (payload) => {
      if (payload && payload.roomId) {
        if (!socket.rooms.has(payload.roomId)) return;
        socket.to(payload.roomId).emit('workspace-update', payload);
      }
    });

    // 4. End Room broadcast (Host-only trigger)
    socket.on('end-room-session', ({ roomId }) => {
      if (!socket.rooms.has(roomId)) return;
      io.to(roomId).emit('room-ended');
    });

    // 5. Real-Time Code Change (Legacy / Backwards compatible support)
    socket.on('code-change', ({ roomId, code, language, participantId }) => {
      if (!socket.rooms.has(roomId)) return;
      socket.to(roomId).emit('code-update', { code, language, participantId });
      debounceSaveCode(roomId, code, language);
    });

    // 6. Real-Time Language Change
    socket.on('language-change', async ({ roomId, language }) => {
      if (!socket.rooms.has(roomId)) return;
      socket.to(roomId).emit('language-update', { language });

      try {
        await pool.query('UPDATE code_sessions SET language = $1, updated_at = NOW() WHERE room_id = $2', [language, roomId]);
      } catch (err) {
        console.error('Error updating language in DB:', err.message);
      }
    });

    // 7. Real-Time Chat Message
    socket.on('send-message', async ({ roomId, senderName, message }) => {
      if (!socket.rooms.has(roomId)) return;
      if (!message || !message.trim()) return;

      try {
        // Save chat history
        const result = await pool.query(
          'INSERT INTO messages (room_id, sender_name, message) VALUES ($1, $2, $3) RETURNING created_at',
          [roomId, senderName.trim(), message.trim()]
        );
        
        const createdAt = result.rows[0].created_at;

        // Broadcast to the whole room (including sender to get clean timestamps)
        io.to(roomId).emit('receive-message', {
          senderName: senderName.trim(),
          message: message.trim(),
          createdAt
        });
      } catch (err) {
        console.error('Error saving chat message to database:', err.message);
      }
    });

    // Phase 5: Collaborative Cursors
    socket.on('cursor-position-update', ({ roomId, fileId, position, selection, participantId, userName }) => {
      if (!socket.rooms.has(roomId)) return;
      socket.to(roomId).emit('remote-cursor-update', { fileId, position, selection, participantId, userName });
    });

    // Phase 5: Typing Indicators
    socket.on('typing-indicator-update', ({ roomId, fileId, participantId, userName, isTyping }) => {
      if (!socket.rooms.has(roomId)) return;
      socket.to(roomId).emit('remote-typing-update', { fileId, participantId, userName, isTyping });
    });

    // Phase 5: Active File presence
    socket.on('presence-active-file', ({ roomId, fileId, fileName }) => {
      if (!socket.rooms.has(roomId)) return;
      if (activeRooms[roomId] && activeRooms[roomId][socket.id]) {
        activeRooms[roomId][socket.id].activeFile = fileName || 'None';
        io.to(roomId).emit('room-participants', Object.values(activeRooms[roomId]));
      }
    });

    // Phase 5: Comments, version history, snapshots updates
    socket.on('comments-change', ({ roomId }) => {
      if (!socket.rooms.has(roomId)) return;
      socket.to(roomId).emit('comments-update');
    });

    socket.on('history-change', ({ roomId, fileId }) => {
      if (!socket.rooms.has(roomId)) return;
      socket.to(roomId).emit('history-update', { fileId });
    });

    socket.on('snapshot-change', ({ roomId }) => {
      if (!socket.rooms.has(roomId)) return;
      socket.to(roomId).emit('snapshot-update');
    });

    socket.on('lock-change', ({ roomId, fileId, lockedBy, lockedByName }) => {
      if (!socket.rooms.has(roomId)) return;
      socket.to(roomId).emit('lock-update', { fileId, lockedBy, lockedByName });
    });

    // 8. Leave Room manually
    socket.on('leave-room', ({ roomId }) => {
      socket.leave(roomId);
      if (activeRooms[roomId] && activeRooms[roomId][socket.id]) {
        const user = activeRooms[roomId][socket.id];
        delete activeRooms[roomId][socket.id];
        
        socket.to(roomId).emit('room-notification', `${user.participantName || 'Teammate'} left the room`);

        // Clean key if room is empty
        if (Object.keys(activeRooms[roomId]).length === 0) {
          delete activeRooms[roomId];
        } else {
          io.to(roomId).emit('room-participants', Object.values(activeRooms[roomId]));
        }
      }
    });

    // 9. Handle Disconnection
    socket.on('disconnect', () => {
      for (const roomId of Object.keys(activeRooms)) {
        if (activeRooms[roomId][socket.id]) {
          const user = activeRooms[roomId][socket.id];
          delete activeRooms[roomId][socket.id];

          socket.to(roomId).emit('room-notification', `${user.participantName || 'Teammate'} left the room`);

          if (Object.keys(activeRooms[roomId]).length === 0) {
            delete activeRooms[roomId];
          } else {
            io.to(roomId).emit('room-participants', Object.values(activeRooms[roomId]));
          }
          break;
        }
      }
    });
  });
};
