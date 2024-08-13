const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const gameRoutes = require('./routes/gameRoutes'); // Importing routes

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Initialize routes
app.use('/api/game', gameRoutes);

// Initialize Socket.io handlers
require('./handlers/gameHandler')(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
