require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./config/db');
const roomRoutes = require('./routes/roomRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// Load Socket Handlers
require('./sockets/roomSocket')(io);

// Load API Routes
app.use('/api/rooms', roomRoutes);

// Simple healthcheck route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CodeRoom server is running.' });
});

// Test database connection on start
pool.query('SELECT NOW()')
  .then(() => {
    console.log('PostgreSQL database connection pool established successfully.');
    server.listen(PORT, () => {
      console.log(`CodeRoom server is listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('CRITICAL: Database connection failed. Server not started.', err.message);
    process.exit(1);
  });
