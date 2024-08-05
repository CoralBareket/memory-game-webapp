const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

let gameState = {
  cards: [],
  flippedIndices: [],
  matchedIndices: [],
  players: [],
  currentTurn: null,
};

const cardTypes = ['😍', '🤪', '🌟', '🍀', '🦄', '🎉', '🚀', '🐱', '🍕', '🏀', '🌈', '🎵'];

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function initializeGameState() {
  gameState = {
    cards: shuffleArray([...cardTypes, ...cardTypes]).map((type, index) => ({
      id: index,
      type,
      flipped: false, // Ensure all cards start as not flipped
    })),
    flippedIndices: [],
    matchedIndices: [],
    players: [],
    currentTurn: null,
  };
}

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinGame', (playerName) => {
    if (gameState.players.length < 2 && !gameState.players.includes(playerName)) {
      socket.playerName = playerName;
      gameState.players.push(playerName);
      if (gameState.players.length === 2) {
        gameState.currentTurn = gameState.players[0]; // Start with the first player
      }
      io.emit('gameState', gameState);
    }
  });

  socket.emit('gameState', gameState);

  socket.on('cardFlipped', (index) => {
    if (gameState.currentTurn === socket.playerName && gameState.flippedIndices.length < 2 && !gameState.flippedIndices.includes(index) && !gameState.matchedIndices.includes(index)) {
      gameState.flippedIndices.push(index);
      gameState.cards[index].flipped = true; // Set the card as flipped

      if (gameState.flippedIndices.length === 2) {
        const [index1, index2] = gameState.flippedIndices;
        if (gameState.cards[index1].type === gameState.cards[index2].type) {
          gameState.matchedIndices.push(index1, index2);
        }

        setTimeout(() => {
          gameState.flippedIndices.forEach(i => {
            if (!gameState.matchedIndices.includes(i)) {
              gameState.cards[i].flipped = false;
            }
          });
          gameState.flippedIndices = [];
          gameState.currentTurn = gameState.players.find(player => player !== gameState.currentTurn); // Switch turn
          io.emit('gameState', gameState);
        }, 500);
      }
      io.emit('gameState', gameState);
    }
  });

  socket.on('resetGame', () => {
    initializeGameState();
    io.emit('gameState', gameState);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

initializeGameState();
