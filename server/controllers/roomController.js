const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const generateRoomId = require('../utils/generateRoomId');
const { runCode } = require('../utils/codeRunner');

/**
 * POST /api/rooms/create
 * Creates a room and registers the creator as the host.
 */
exports.createRoom = async (req, res) => {
  const { roomName, creatorName, password } = req.body;
  let { roomId } = req.body;

  // 1. Basic validation
  if (!roomName || !roomName.trim()) {
    return res.status(400).json({ success: false, message: 'Room name is required.' });
  }
  if (!creatorName || !creatorName.trim()) {
    return res.status(400).json({ success: false, message: 'Creator name is required.' });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ success: false, message: 'Password is required and must be at least 4 characters long.' });
  }

  // 2. Validate or Generate Room ID
  const roomIdRegex = /^[a-zA-Z0-9-]{3,30}$/;
  if (roomId) {
    roomId = roomId.trim();
    if (!roomIdRegex.test(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Room ID format. Use 3-30 alphanumeric characters or dashes.'
      });
    }

    // Check room ID uniqueness
    try {
      const roomCheck = await pool.query('SELECT 1 FROM rooms WHERE room_id = $1', [roomId]);
      if (roomCheck.rowCount > 0) {
        return res.status(409).json({ success: false, message: 'Room ID is already taken.' });
      }
    } catch (dbError) {
      console.error('Error querying rooms table:', dbError.message);
      return res.status(500).json({ success: false, message: 'Database query failed.' });
    }
  } else {
    // Generate unique Room ID loop
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      roomId = generateRoomId();
      const roomCheck = await pool.query('SELECT 1 FROM rooms WHERE room_id = $1', [roomId]);
      if (roomCheck.rowCount === 0) {
        isUnique = true;
      }
      attempts++;
    }
    if (!isUnique) {
      return res.status(500).json({ success: false, message: 'Failed to generate a unique Room ID. Please try again.' });
    }
  }

  // 3. Hash Password
  let passwordHash;
  try {
    passwordHash = await bcrypt.hash(password, 10);
  } catch (hashError) {
    console.error('Bcrypt hashing error:', hashError.message);
    return res.status(500).json({ success: false, message: 'Encryption failed.' });
  }

  // 4. Database Transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // A. Insert Room record
    const insertRoomText = `
      INSERT INTO rooms (room_id, room_name, password_hash, creator_name, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING room_id, room_name, creator_name, created_at
    `;
    const roomResult = await client.query(insertRoomText, [roomId, roomName.trim(), passwordHash, creatorName.trim()]);
    const createdRoom = roomResult.rows[0];

    // B. Insert host participant
    const insertParticipantText = `
      INSERT INTO participants (room_id, name, role)
      VALUES ($1, $2, 'host')
      RETURNING id
    `;
    const participantRes = await client.query(insertParticipantText, [roomId, creatorName.trim()]);
    const hostParticipantId = participantRes.rows[0].id;

    // C. Insert default workspace file (main.cpp)
    const defaultCppCode = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, CodeRoom!" << endl;
    return 0;
}
`;
    const insertFileText = `
      INSERT INTO workspace_files (room_id, name, path, type, content, language, created_by)
      VALUES ($1, 'main.cpp', 'main.cpp', 'file', $2, 'cpp', $3)
    `;
    await client.query(insertFileText, [roomId, defaultCppCode, creatorName.trim()]);

    // D. Insert initial code session (for backwards compatibility)
    const insertSessionText = `
      INSERT INTO code_sessions (room_id, code, language)
      VALUES ($1, $2, 'cpp')
    `;
    await client.query(insertSessionText, [roomId, defaultCppCode]);

    await client.query('COMMIT');

    // 5. Success response (Return only safe details)
    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        roomId: createdRoom.room_id,
        roomName: createdRoom.room_name,
        creatorName: createdRoom.creator_name,
        createdAt: createdRoom.created_at,
        participantId: hostParticipantId
      }
    });

  } catch (txError) {
    await client.query('ROLLBACK');
    console.error('Transaction rollback. Error details:', txError.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete the room creation workspace. Please try again.'
    });
  } finally {
    client.release();
  }
};

/**
 * POST /api/rooms/join
 * Authenticates password and registers a member participant.
 */
exports.joinRoom = async (req, res) => {
  const { roomId, password, teammateName } = req.body;

  // 1. Validation
  if (!roomId || !roomId.trim()) {
    return res.status(400).json({ success: false, message: 'Room ID is required.' });
  }
  if (!teammateName || !teammateName.trim()) {
    return res.status(400).json({ success: false, message: 'Teammate name is required.' });
  }
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }

  try {
    // 2. Find Room
    const roomResult = await pool.query('SELECT * FROM rooms WHERE room_id = $1', [roomId.trim()]);
    if (roomResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const room = roomResult.rows[0];

    // Check if active
    if (!room.is_active) {
      return res.status(400).json({ success: false, message: 'Room is closed.' });
    }

    // 3. Verify Password
    const match = await bcrypt.compare(password, room.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid room password.' });
    }

    // 4. Add Participant (Authoritative Creator check)
    const isCreator = room.creator_name.trim().toLowerCase() === teammateName.trim().toLowerCase();
    let participant;

    if (isCreator) {
      // Find existing host participant row
      const hostResult = await pool.query(
        'SELECT id, room_id, name, role FROM participants WHERE room_id = $1 AND role = \'host\' LIMIT 1',
        [room.room_id]
      );
      if (hostResult.rowCount > 0) {
        participant = hostResult.rows[0];
      } else {
        // If not found, insert as host
        const insertHostResult = await pool.query(
          'INSERT INTO participants (room_id, name, role) VALUES ($1, $2, \'host\') RETURNING id, room_id, name, role',
          [room.room_id, teammateName.trim()]
        );
        participant = insertHostResult.rows[0];
      }
    } else {
      // Add standard member
      const insertParticipantText = `
        INSERT INTO participants (room_id, name, role)
        VALUES ($1, $2, 'member')
        RETURNING id, room_id, name, role
      `;
      const participantResult = await pool.query(insertParticipantText, [room.room_id, teammateName.trim()]);
      participant = participantResult.rows[0];
    }

    // 5. Success Response
    return res.status(200).json({
      success: true,
      message: 'Joined room successfully.',
      data: {
        roomId: room.room_id,
        roomName: room.room_name,
        participantId: participant.id,
        participantName: participant.name,
        role: participant.role
      }
    });

  } catch (error) {
    console.error('Error joining room:', error.stack || error.message);
    return res.status(500).json({ success: false, message: 'Server error joining room.' });
  }
};

/**
 * GET /api/rooms/:roomId
 * Verifies if a room is valid, active and returns details + code session
 */
exports.getRoom = async (req, res) => {
  const { roomId } = req.params;

  try {
    const roomResult = await pool.query('SELECT * FROM rooms WHERE room_id = $1', [roomId]);
    if (roomResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const room = roomResult.rows[0];

    // Fetch active code session
    const sessionResult = await pool.query('SELECT code, language FROM code_sessions WHERE room_id = $1', [roomId]);
    const session = sessionResult.rows[0] || { code: '', language: 'javascript' };

    return res.status(200).json({
      success: true,
      data: {
        roomId: room.room_id,
        roomName: room.room_name,
        creatorName: room.creator_name,
        isActive: room.is_active,
        code: session.code,
        language: session.language
      }
    });

  } catch (error) {
    console.error('Error fetching room details:', error.stack || error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching room details.' });
  }
};

/**
 * GET /api/rooms/:roomId/messages
 * Retrieves last 50 chat messages for a specific room
 */
exports.getRoomMessages = async (req, res) => {
  const { roomId } = req.params;

  try {
    const messagesResult = await pool.query(
      'SELECT id, sender_name AS "senderName", message, created_at AS "createdAt" FROM messages WHERE room_id = $1 ORDER BY created_at ASC LIMIT 50',
      [roomId]
    );

    return res.status(200).json({
      success: true,
      data: messagesResult.rows
    });

  } catch (error) {
    console.error('Error fetching room messages:', error.stack || error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching room messages.' });
  }
};

/**
 * Helper to check host permission
 */
async function isParticipantHost(roomId, participantId) {
  if (!participantId) return false;
  const result = await pool.query('SELECT role FROM participants WHERE room_id = $1 AND id = $2', [roomId, participantId]);
  return result.rowCount > 0 && result.rows[0].role === 'host';
}

/**
 * Helper to check room membership
 */
async function isParticipantMember(roomId, participantId) {
  if (!participantId) return false;
  const result = await pool.query('SELECT role FROM participants WHERE room_id = $1 AND id = $2', [roomId, participantId]);
  return result.rowCount > 0;
}

/**
 * POST /api/rooms/:roomId/end
 * Ends the room (host-only)
 */
exports.endRoom = async (req, res) => {
  const { roomId } = req.params;
  const participantId = req.headers['x-participant-id'];

  try {
    const isHost = await isParticipantHost(roomId, participantId);
    if (!isHost) {
      return res.status(403).json({ success: false, message: 'Unauthorized. Only hosts can end the room.' });
    }

    await pool.query('UPDATE rooms SET is_active = false WHERE room_id = $1', [roomId]);
    return res.status(200).json({ success: true, message: 'Room ended successfully.' });
  } catch (error) {
    console.error('Error ending room:', error.stack || error.message);
    return res.status(500).json({ success: false, message: 'Server error ending room.' });
  }
};

/**
 * GET /api/rooms/:roomId/files
 * Fetches all collaborative files in the room workspace
 */
exports.getRoomFiles = async (req, res) => {
  const { roomId } = req.params;
  const participantId = req.headers['x-participant-id'];

  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) {
      return res.status(403).json({ success: false, message: 'Unauthorized room access.' });
    }

    const filesResult = await pool.query(
      'SELECT id, parent_id AS "parentId", name, path, type, content, language FROM workspace_files WHERE room_id = $1 ORDER BY type DESC, name ASC',
      [roomId]
    );

    return res.status(200).json({ success: true, data: filesResult.rows });
  } catch (error) {
    console.error('Error fetching room files:', error.stack || error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching room files.' });
  }
};

/**
 * POST /api/rooms/:roomId/files
 * Creates a file or folder inside the workspace
 */
exports.createFileOrFolder = async (req, res) => {
  const { roomId } = req.params;
  const participantId = req.headers['x-participant-id'];
  const { name, type, parentId, content } = req.body;

  // 1. Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'File or folder name is required.' });
  }
  if (!['file', 'folder'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid type specified.' });
  }

  // Prevent path traversal
  if (name.includes('/') || name.includes('\\') || name.includes('..')) {
    return res.status(400).json({ success: false, message: 'Invalid characters in name.' });
  }

  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) {
      return res.status(403).json({ success: false, message: 'Unauthorized room access.' });
    }

    // Determine parent path
    let parentPath = '';
    if (parentId) {
      const parentResult = await pool.query('SELECT path FROM workspace_files WHERE id = $1 AND room_id = $2', [parentId, roomId]);
      if (parentResult.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Parent directory not found.' });
      }
      parentPath = parentResult.rows[0].path + '/';
    }

    const itemPath = parentPath + name.trim();

    // Infer language from extension
    let language = 'javascript';
    if (type === 'file') {
      const ext = name.split('.').pop().toLowerCase();
      const languageMap = {
        cpp: 'cpp', c: 'c', java: 'java', py: 'python', js: 'javascript', ts: 'typescript',
        html: 'html', css: 'css', sql: 'sql', go: 'go', rs: 'rust', cs: 'csharp', php: 'php', kt: 'kotlin'
      };
      language = languageMap[ext] || 'javascript';
    }

    // Seeding templates if file and no content provided
    let defaultCode = content !== undefined && content !== null ? content : '';
    if (type === 'file' && (content === undefined || content === null)) {
      if (language === 'cpp') {
        defaultCode = `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CodeRoom!" << endl;\n    return 0;\n}\n`;
      } else if (language === 'python') {
        defaultCode = `print("Hello!")\n`;
      } else if (language === 'javascript') {
        defaultCode = `console.log("Hello!");\n`;
      }
    }

    // Insert
    const insertText = `
      INSERT INTO workspace_files (room_id, parent_id, name, path, type, content, language, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, (SELECT name FROM participants WHERE id = $8))
      RETURNING id, parent_id AS "parentId", name, path, type, content, language
    `;
    const insertResult = await pool.query(insertText, [roomId, parentId || null, name.trim(), itemPath, type, defaultCode, language, participantId]);

    return res.status(201).json({ success: true, data: insertResult.rows[0] });

  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation index check
      return res.status(409).json({ success: false, message: 'A file or folder with this name already exists in this folder.' });
    }
    console.error('Error creating workspace file:', error.stack || error.message);
    return res.status(500).json({ success: false, message: 'Server error creating workspace item.' });
  }
};

/**
 * PUT /api/rooms/:roomId/files/:fileId
 * Renames a node or saves its editor code content
 */
exports.updateFileOrFolder = async (req, res) => {
  const { roomId, fileId } = req.params;
  const participantId = req.headers['x-participant-id'];
  const { name, content, parentId } = req.body;

  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) {
      return res.status(403).json({ success: false, message: 'Unauthorized room access.' });
    }

    // Check if item exists
    const fileResult = await pool.query('SELECT * FROM workspace_files WHERE id = $1 AND room_id = $2', [fileId, roomId]);
    if (fileResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'File or folder not found.' });
    }

    const currentItem = fileResult.rows[0];

    let newName = currentItem.name;
    let newPath = currentItem.path;
    let newContent = currentItem.content;
    let newLanguage = currentItem.language;
    let newParentId = currentItem.parent_id;
    let parentPath = '';

    if (parentId !== undefined) {
      newParentId = parentId ? Number(parentId) : null;
      if (newParentId) {
        const parentResult = await pool.query('SELECT path FROM workspace_files WHERE id = $1 AND room_id = $2', [newParentId, roomId]);
        if (parentResult.rowCount === 0) {
          return res.status(404).json({ success: false, message: 'Parent directory not found.' });
        }
        parentPath = parentResult.rows[0].path + '/';
      }
    } else if (currentItem.parent_id) {
      const parentResult = await pool.query('SELECT path FROM workspace_files WHERE id = $1 AND room_id = $2', [currentItem.parent_id, roomId]);
      if (parentResult.rowCount > 0) {
        parentPath = parentResult.rows[0].path + '/';
      }
    }

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
      }
      if (name.includes('/') || name.includes('\\') || name.includes('..')) {
        return res.status(400).json({ success: false, message: 'Invalid characters in name.' });
      }
      newName = name.trim();
    }

    if (name !== undefined || parentId !== undefined) {
      newPath = parentPath + newName;
    }

    if (content !== undefined) {
      newContent = content;
      const ext = newName.split('.').pop().toLowerCase();
      const languageMap = {
        cpp: 'cpp', c: 'c', java: 'java', py: 'python', js: 'javascript', ts: 'typescript',
        html: 'html', css: 'css', sql: 'sql', go: 'go', rs: 'rust', cs: 'csharp', php: 'php', kt: 'kotlin'
      };
      newLanguage = languageMap[ext] || 'javascript';
    }

    // Update
    await pool.query(
      'UPDATE workspace_files SET name = $1, path = $2, content = $3, language = $4, parent_id = $5, updated_at = NOW() WHERE id = $6 AND room_id = $7',
      [newName, newPath, newContent, newLanguage, newParentId, fileId, roomId]
    );

    // Recursively update children path if folder name or location changes
    if ((name !== undefined || parentId !== undefined) && currentItem.type === 'folder') {
      const updateChildPaths = async (pId, oldPathPrefix, newPathPrefix) => {
        const children = await pool.query('SELECT id, path FROM workspace_files WHERE parent_id = $1', [pId]);
        for (const child of children.rows) {
          const relativePart = child.path.substring(oldPathPrefix.length);
          const updatedChildPath = newPathPrefix + relativePart;
          await pool.query('UPDATE workspace_files SET path = $1 WHERE id = $2', [updatedChildPath, child.id]);
          await updateChildPaths(child.id, oldPathPrefix, newPathPrefix);
        }
      };
      await updateChildPaths(fileId, currentItem.path, newPath);
    }

    return res.status(200).json({
      success: true,
      message: 'File updated successfully.',
      data: { id: fileId, name: newName, path: newPath, content: newContent, language: newLanguage, parentId: newParentId }
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'A file or folder with this name already exists in this folder.' });
    }
    console.error('Error updating workspace file:', error.stack || error.message);
    return res.status(500).json({ success: false, message: 'Server error updating workspace file.' });
  }
};

/**
 * DELETE /api/rooms/:roomId/files/:fileId
 * Deletes a workspace file or folder (cascades nested nodes)
 */
exports.deleteFileOrFolder = async (req, res) => {
  const { roomId, fileId } = req.params;
  const participantId = req.headers['x-participant-id'];

  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) {
      return res.status(403).json({ success: false, message: 'Unauthorized room access.' });
    }

    const deleteResult = await pool.query('DELETE FROM workspace_files WHERE id = $1 AND room_id = $2', [fileId, roomId]);
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'File or folder not found.' });
    }

    return res.status(200).json({ success: true, message: 'Item deleted successfully.' });
  } catch (error) {
    console.error('Error deleting workspace file:', error.stack || error.message);
    return res.status(500).json({ success: false, message: 'Server error deleting workspace item.' });
  }
};

/**
 * POST /api/rooms/:roomId/run
 * Compiles and runs user workspace code inside the sandboxed environment
 */
exports.runRoomCode = async (req, res) => {
  const { roomId } = req.params;
  const participantId = req.headers['x-participant-id'];
  const { fileId, input, stdin } = req.body;
  const executionInput = stdin !== undefined ? stdin : input;

  console.log('=== RUN CODE DIAGNOSTICS ===');
  console.log('req.body:', JSON.stringify(req.body));
  console.log('fileId:', fileId);
  console.log('executionInput:', JSON.stringify(executionInput));

  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) {
      return res.status(403).json({ success: false, message: 'Unauthorized room access.' });
    }

    // Retrieve file content and default language
    const fileResult = await pool.query(
      'SELECT content, language FROM workspace_files WHERE id = $1 AND room_id = $2 AND type = \'file\'',
      [fileId, roomId]
    );

    if (fileResult.rowCount === 0) {
      console.log('File not found in DB!');
      return res.status(404).json({ success: false, message: 'File not found or is a folder.' });
    }

    const { content, language: dbLanguage } = fileResult.rows[0];
    const targetLanguage = req.body.language || dbLanguage;
    console.log('Code to run on target language:', targetLanguage);

    // Execute sandboxed code
    const runResult = await runCode(targetLanguage, content, executionInput);
    console.log('Run Result:', JSON.stringify(runResult));

    return res.status(200).json({
      success: true,
      data: runResult
    });

  } catch (error) {
    console.error('Error executing room code:', error.stack || error.message);
    return res.status(500).json({ success: false, message: 'Server error executing room code.' });
  }
};

// Comments API
exports.getComments = async (req, res) => {
  const { roomId } = req.params;
  const participantId = req.headers['x-participant-id'];
  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) return res.status(403).json({ success: false, message: 'Unauthorized room access.' });

    const result = await pool.query(
      'SELECT c.*, f.name as file_name FROM file_comments c JOIN workspace_files f ON c.file_id = f.id WHERE c.room_id = $1 ORDER BY c.created_at DESC',
      [roomId]
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching comments.' });
  }
};

exports.createComment = async (req, res) => {
  const { roomId } = req.params;
  const participantId = req.headers['x-participant-id'];
  const { fileId, author, message, line } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Comment message cannot be empty.' });
  }

  const parsedFileId = parseInt(fileId, 10);
  const parsedLine = parseInt(line, 10);

  if (isNaN(parsedFileId) || isNaN(parsedLine)) {
    return res.status(400).json({ success: false, message: 'Invalid file ID or line number.' });
  }

  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) return res.status(403).json({ success: false, message: 'Unauthorized room access.' });

    const fileCheck = await pool.query('SELECT id FROM workspace_files WHERE id = $1 AND room_id = $2', [parsedFileId, roomId]);
    if (fileCheck.rowCount === 0) return res.status(404).json({ success: false, message: 'File not found in this room.' });

    const result = await pool.query(
      'INSERT INTO file_comments (room_id, file_id, author, message, line) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [roomId, parsedFileId, author, message.trim(), parsedLine]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ success: false, message: 'Server error creating comment.' });
  }
};

exports.resolveComment = async (req, res) => {
  const { roomId, commentId } = req.params;
  const participantId = req.headers['x-participant-id'];
  const { resolvedBy } = req.body;
  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) return res.status(403).json({ success: false, message: 'Unauthorized room access.' });

    const result = await pool.query(
      'UPDATE file_comments SET resolved = true, resolved_at = CURRENT_TIMESTAMP, resolved_by = $1 WHERE id = $2 AND room_id = $3 RETURNING *',
      [resolvedBy, commentId, roomId]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Comment not found.' });
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error resolving comment:', error);
    return res.status(500).json({ success: false, message: 'Server error resolving comment.' });
  }
};

// Versions API
exports.getFileVersions = async (req, res) => {
  const { roomId, fileId } = req.params;
  const participantId = req.headers['x-participant-id'];
  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) return res.status(403).json({ success: false, message: 'Unauthorized room access.' });

    const result = await pool.query(
      'SELECT * FROM file_versions WHERE file_id = $1 AND room_id = $2 ORDER BY created_at DESC',
      [fileId, roomId]
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching versions.' });
  }
};

exports.createFileVersion = async (req, res) => {
  const { roomId, fileId } = req.params;
  const participantId = req.headers['x-participant-id'];
  const { author, content, versionLabel } = req.body;
  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) return res.status(403).json({ success: false, message: 'Unauthorized room access.' });

    const fileCheck = await pool.query('SELECT id FROM workspace_files WHERE id = $1 AND room_id = $2', [fileId, roomId]);
    if (fileCheck.rowCount === 0) return res.status(404).json({ success: false, message: 'File not found in this room.' });

    const result = await pool.query(
      'INSERT INTO file_versions (room_id, file_id, author, content, version_label) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [roomId, fileId, author, content, versionLabel]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating version:', error);
    return res.status(500).json({ success: false, message: 'Server error creating version.' });
  }
};

exports.restoreFileVersion = async (req, res) => {
  const { roomId, fileId, versionId } = req.params;
  const participantId = req.headers['x-participant-id'];
  const { author } = req.body;
  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) return res.status(403).json({ success: false, message: 'Unauthorized room access.' });

    const versionResult = await pool.query(
      'SELECT content, version_label FROM file_versions WHERE id = $1 AND file_id = $2 AND room_id = $3',
      [versionId, fileId, roomId]
    );
    if (versionResult.rowCount === 0) return res.status(404).json({ success: false, message: 'Version not found.' });

    const { content, version_label } = versionResult.rows[0];

    const newLabel = `Restored from ${version_label || 'Version ' + versionId}`;
    await pool.query(
      'INSERT INTO file_versions (room_id, file_id, author, content, version_label) VALUES ($1, $2, $3, $4, $5)',
      [roomId, fileId, author, content, newLabel]
    );

    await pool.query(
      'UPDATE workspace_files SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND room_id = $3',
      [content, fileId, roomId]
    );

    return res.status(200).json({ success: true, content });
  } catch (error) {
    console.error('Error restoring version:', error);
    return res.status(500).json({ success: false, message: 'Server error restoring version.' });
  }
};

// Snapshots API
exports.getSnapshots = async (req, res) => {
  const { roomId } = req.params;
  const participantId = req.headers['x-participant-id'];
  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) return res.status(403).json({ success: false, message: 'Unauthorized room access.' });

    const result = await pool.query(
      'SELECT * FROM workspace_snapshots WHERE room_id = $1 ORDER BY created_at DESC',
      [roomId]
    );
    return res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching snapshots.' });
  }
};

exports.createSnapshot = async (req, res) => {
  const { roomId } = req.params;
  const participantId = req.headers['x-participant-id'];
  const { creatorName, snapshotName } = req.body;
  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) return res.status(403).json({ success: false, message: 'Unauthorized room access.' });

    const filesResult = await pool.query(
      'SELECT id, parent_id, name, path, type, content, language FROM workspace_files WHERE room_id = $1',
      [roomId]
    );

    const result = await pool.query(
      'INSERT INTO workspace_snapshots (room_id, creator_name, snapshot_name, files_data) VALUES ($1, $2, $3, $4) RETURNING *',
      [roomId, creatorName, snapshotName, JSON.stringify(filesResult.rows)]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return res.status(500).json({ success: false, message: 'Server error creating snapshot.' });
  }
};

exports.restoreSnapshot = async (req, res) => {
  const { roomId, snapshotId } = req.params;
  const participantId = req.headers['x-participant-id'];
  try {
    const isAuth = await isParticipantMember(roomId, participantId);
    if (!isAuth) return res.status(403).json({ success: false, message: 'Unauthorized room access.' });

    const snapshotResult = await pool.query(
      'SELECT files_data FROM workspace_snapshots WHERE id = $1 AND room_id = $2',
      [snapshotId, roomId]
    );
    if (snapshotResult.rowCount === 0) return res.status(404).json({ success: false, message: 'Snapshot not found.' });

    const snapshotFiles = snapshotResult.rows[0].files_data;

    await pool.query('DELETE FROM workspace_files WHERE room_id = $1', [roomId]);

    const idMap = {};
    const sortedFiles = [...snapshotFiles].sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      return 0;
    });

    for (const file of sortedFiles) {
      const parentId = file.parent_id ? idMap[file.parent_id] : null;
      const insertResult = await pool.query(
        'INSERT INTO workspace_files (room_id, parent_id, name, path, type, content, language) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [roomId, parentId, file.name, file.path, file.type, file.content, file.language]
      );
      idMap[file.id] = insertResult.rows[0].id;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error restoring snapshot:', error);
    return res.status(500).json({ success: false, message: 'Server error restoring snapshot.' });
  }
};
