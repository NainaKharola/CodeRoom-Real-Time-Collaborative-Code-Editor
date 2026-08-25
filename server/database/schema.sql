-- Create rooms table if it does not exist
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) UNIQUE NOT NULL,
  room_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  creator_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for searching rooms by room_id (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_rooms_room_id ON rooms(room_id);

-- Create participants table if it does not exist
CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) REFERENCES rooms(room_id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('host', 'member')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching participants inside a room
CREATE INDEX IF NOT EXISTS idx_participants_room_id ON participants(room_id);

-- Create code_sessions table if it does not exist
CREATE TABLE IF NOT EXISTS code_sessions (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) REFERENCES rooms(room_id) ON DELETE CASCADE UNIQUE NOT NULL,
  code TEXT DEFAULT '',
  language VARCHAR(50) DEFAULT 'javascript',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for retrieving code sessions by room_id
CREATE INDEX IF NOT EXISTS idx_code_sessions_room_id ON code_sessions(room_id);

-- Create messages table if it does not exist
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) REFERENCES rooms(room_id) ON DELETE CASCADE NOT NULL,
  sender_name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for listing chat messages by room_id
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);

-- Create workspace_files table if it does not exist
CREATE TABLE IF NOT EXISTS workspace_files (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) REFERENCES rooms(room_id) ON DELETE CASCADE NOT NULL,
  parent_id INTEGER REFERENCES workspace_files(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  path TEXT NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('file', 'folder')),
  content TEXT DEFAULT '',
  language VARCHAR(50) DEFAULT 'javascript',
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for querying workspace files by room_id
CREATE INDEX IF NOT EXISTS idx_workspace_files_room_id ON workspace_files(room_id);

-- Unique index constraints to prevent naming conflicts in directories within rooms
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_files_unique_root ON workspace_files(room_id, name) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_files_unique_sub ON workspace_files(room_id, parent_id, name) WHERE parent_id IS NOT NULL;

-- Comments table
CREATE TABLE IF NOT EXISTS file_comments (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) REFERENCES rooms(room_id) ON DELETE CASCADE NOT NULL,
  file_id INTEGER REFERENCES workspace_files(id) ON DELETE CASCADE NOT NULL,
  author VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  line INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS idx_file_comments_room_id ON file_comments(room_id);

-- File Versions table
CREATE TABLE IF NOT EXISTS file_versions (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) REFERENCES rooms(room_id) ON DELETE CASCADE NOT NULL,
  file_id INTEGER REFERENCES workspace_files(id) ON DELETE CASCADE NOT NULL,
  author VARCHAR(100) NOT NULL,
  content TEXT DEFAULT '',
  version_label VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_file_versions_room_id ON file_versions(room_id);

-- Workspace Snapshots table
CREATE TABLE IF NOT EXISTS workspace_snapshots (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(50) REFERENCES rooms(room_id) ON DELETE CASCADE NOT NULL,
  creator_name VARCHAR(100) NOT NULL,
  snapshot_name VARCHAR(100) NOT NULL,
  files_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_workspace_snapshots_room_id ON workspace_snapshots(room_id);

