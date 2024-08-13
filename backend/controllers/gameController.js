const gameHandler = require('../handlers/gameHandler');

// Example controller function to get game status
exports.getStatus = (req, res) => {
  const status = gameHandler.getGameStatus();
  res.status(200).json(status);
};

// Example controller function to start a new game
exports.startGame = (req, res) => {
  const { playerName1, playerName2 } = req.body;
  const gameId = gameHandler.startNewGame(playerName1, playerName2);
  res.status(201).json({ gameId });
};
