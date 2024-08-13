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

let rooms = {}; // Stores room information
let waitingPlayers = []; // Store waiting players
let playersInGame = new Set(); // To keep track of players already in game

const cardTypes = ['🥑', '🤪', '🌟', '🍀', '🦄', '🎯', '🚀', '🐱', '🍕', '🏀', '🌈', '🎵'];

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function initializeGameState(player1Name, player2Name) {
  return {
    cards: shuffleArray([...cardTypes, ...cardTypes]).map((type, index) => ({
      id: index,
      type,
      flipped: false,
    })),
    flippedIndices: [],
    matchedIndices: [],
    players: [player1Name, player2Name],
    currentTurn: player1Name, // Player 1 starts the game by default
    scores: {
      [player1Name]: 0,
      [player2Name]: 0,
    },
  };
}

function createRoom(player1, player2) {
  const roomId = `room-${Date.now()}`;
  const gameState = initializeGameState(player1.playerName, player2.playerName);

  rooms[roomId] = {
    id: roomId,
    players: [player1, player2],
    gameState: gameState,
  };

  player1.join(roomId);
  player2.join(roomId);

  return roomId;
}

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinGame', (playerName) => {
    if (playersInGame.has(playerName)) {
      console.log(`${playerName} is already in a game`);
      return; // Exit the function if player is already in a game
    }

    console.log(`${playerName} is trying to join a game`);
    socket.playerName = playerName;
    playersInGame.add(playerName);

    if (waitingPlayers.length > 0) {
      const opponent = waitingPlayers.shift();
      const roomId = createRoom(opponent, socket);
      
      io.to(roomId).emit('gameState', rooms[roomId].gameState);
      io.to(roomId).emit('startGame');
      
      console.log(`Game started in room ${roomId} with ${opponent.playerName} and ${playerName}`);
    } else {
      waitingPlayers.push(socket);
      socket.emit('waitingForOpponent');
      console.log(`${playerName} is now waiting for an opponent`);
    }
  });

  socket.on('cardFlipped', (index) => {
    const room = Object.values(rooms).find(r => r.players.some(p => p.id === socket.id));
    if (!room) return;

    const gameState = room.gameState;

    if (gameState.currentTurn === socket.playerName && gameState.flippedIndices.length < 2 && !gameState.flippedIndices.includes(index) && !gameState.matchedIndices.includes(index)) {
      gameState.flippedIndices.push(index);
      gameState.cards[index].flipped = true;

      if (gameState.flippedIndices.length === 2) {
        const [index1, index2] = gameState.flippedIndices;
        let matched = false;

        if (gameState.cards[index1].type === gameState.cards[index2].type) {
          gameState.matchedIndices.push(index1, index2);
          gameState.scores[socket.playerName] += 100;
          matched = true;
        }

        setTimeout(() => {
          gameState.flippedIndices.forEach(i => {
            if (!gameState.matchedIndices.includes(i)) {
              gameState.cards[i].flipped = false;
            }
          });
          gameState.flippedIndices = [];

          // If the player didn't match the pair, switch the turn
          if (!matched) {
            gameState.currentTurn = gameState.players.find(player => player !== gameState.currentTurn);
          }

          if (gameState.matchedIndices.length === gameState.cards.length) {
            determineWinner(room.id);
          } else {
            io.to(room.id).emit('gameState', gameState);
          }
        }, 1000);
      }
      io.to(room.id).emit('gameState', gameState);
    }
  });

  socket.on('leaveGame', () => {
    const room = Object.values(rooms).find(r => r.players.some(p => p.id === socket.id));
    if (room) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];

        // Remove the player from the room and the game
        room.players.splice(playerIndex, 1);
        playersInGame.delete(player.playerName);

        // If the room is empty, delete it
        if (room.players.length === 0) {
          delete rooms[room.id];
        } else {
          // Notify the other player that their opponent has left
          io.to(room.id).emit('playerLeft', socket.playerName);
        }
        console.log(`${player.playerName} has left the game`);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    waitingPlayers = waitingPlayers.filter(player => player !== socket);
    if (socket.playerName) {
      playersInGame.delete(socket.playerName);
    }

    const room = Object.values(rooms).find(r => r.players.some(p => p.id === socket.id));
    if (room) {
      const remainingPlayer = room.players.find(p => p.id !== socket.id);
      io.to(room.id).emit('playerLeft', socket.playerName);
      if (remainingPlayer) {
        // Put the remaining player back in the waiting queue
        remainingPlayer.leave(room.id);
        waitingPlayers.push(remainingPlayer);
        io.to(remainingPlayer.id).emit('waitingForOpponent');
        console.log(`${remainingPlayer.playerName} has been added back to the waiting room`);

        // Clean up the room
        delete rooms[room.id];
      }
    }
  });

});

function determineWinner(roomId) {
  const room = rooms[roomId];
  const gameState = room.gameState;
  const [player1, player2] = gameState.players;
  const score1 = gameState.scores[player1];
  const score2 = gameState.scores[player2];

  let winner, loser;

  if (score1 > score2) {
    winner = player1;
    loser = player2;
  } else if (score2 > score1) {
    winner = player2;
    loser = player1;
  } else {
    winner = null;
  }

  io.to(roomId).emit('gameOver', {
    winner,
    loser,
    scores: gameState.scores,
  });
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
