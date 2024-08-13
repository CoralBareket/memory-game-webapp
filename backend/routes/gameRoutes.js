const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Example API routes
router.get('/status', gameController.getStatus); // Example route to get game status
router.post('/start', gameController.startGame); // Example route to start a new game

module.exports = router;
