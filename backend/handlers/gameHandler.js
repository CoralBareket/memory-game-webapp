const rooms = {}; // Stores room information
const waitingPlayers = []; // Store waiting players
const playersInGame = new Set(); // To keep track of players already in the game
const shuffleArray = require('../utils/shuffleArray'); // Utility function for shuffling

const cardTypes = ['🥑', '🤪', '🌟', '🍀', '🦄', '🎯', '🚀', '🐱', '🍕', '🏀', '🌈', '🎵'];

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
    currentTurn: player1Name,
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

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinGame', (playerName) => {
      if (playersInGame.has(playerName)) {
        console.log(`${playerName} is already in a game`);
        return; // Exit the function if the player is already in a game
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

          room.players.splice(playerIndex, 1);
          playersInGame.delete(player.playerName);

          if (room.players.length === 0) {
            delete rooms[room.id];
          } else {
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
          remainingPlayer.leave(room.id);
          waitingPlayers.push(remainingPlayer);
          io.to(remainingPlayer.id).emit('waitingForOpponent');
          console.log(`${remainingPlayer.playerName} has been added back to the waiting room`);

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
};

module.exports.getGameStatus = () => {
  return {
    activeRooms: Object.keys(rooms).length,
    waitingPlayers: waitingPlayers.length,
  };
};

module.exports.startNewGame = (player1Name, player2Name) => {
  const socket1 = waitingPlayers.find(player => player.playerName === player1Name);
  const socket2 = waitingPlayers.find(player => player.playerName === player2Name);

  if (socket1 && socket2) {
    const roomId = createRoom(socket1, socket2);
    return roomId;
  } else {
    return null;
  }
};
