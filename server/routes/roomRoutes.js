const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

// Map POST /api/rooms/create to Controller
router.post('/create', roomController.createRoom);

// Map POST /api/rooms/join to Controller
router.post('/join', roomController.joinRoom);

// Map GET /api/rooms/:roomId to Controller
router.get('/:roomId', roomController.getRoom);

// Map GET /api/rooms/:roomId/messages to Controller
router.get('/:roomId/messages', roomController.getRoomMessages);

// Map POST /api/rooms/:roomId/end to Controller (host only)
router.post('/:roomId/end', roomController.endRoom);

// Map workspace file explorer actions to Controller
router.get('/:roomId/files', roomController.getRoomFiles);
router.post('/:roomId/files', roomController.createFileOrFolder);
router.put('/:roomId/files/:fileId', roomController.updateFileOrFolder);
router.delete('/:roomId/files/:fileId', roomController.deleteFileOrFolder);
router.post('/:roomId/run', roomController.runRoomCode);

// Phase 5 API Routes (Comments, Versions, and Snapshots)
router.get('/:roomId/comments', roomController.getComments);
router.post('/:roomId/comments', roomController.createComment);
router.put('/:roomId/comments/:commentId/resolve', roomController.resolveComment);

router.get('/:roomId/files/:fileId/versions', roomController.getFileVersions);
router.post('/:roomId/files/:fileId/versions', roomController.createFileVersion);
router.post('/:roomId/files/:fileId/versions/:versionId/restore', roomController.restoreFileVersion);

router.get('/:roomId/snapshots', roomController.getSnapshots);
router.post('/:roomId/snapshots', roomController.createSnapshot);
router.post('/:roomId/snapshots/:snapshotId/restore', roomController.restoreSnapshot);

module.exports = router;
