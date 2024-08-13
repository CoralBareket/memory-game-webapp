import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Card from './Card';
import './MemoryGame.css';

const socket = io('http://localhost:3000');

function MemoryGame({ playerName }) {
  const [gameState, setGameState] = useState({
    cards: [],
    flippedIndices: [],
    matchedIndices: [],
    players: [],
    currentTurn: null,
    scores: {},
  });
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [spectator, setSpectator] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    socket.emit('joinGame', playerName);

    socket.on('gameState', (state) => {
      setGameState(state);
    });

    socket.on('startGame', () => {
      setGameStarted(true);
      setWaiting(false);
      startTimer();
    });

    socket.on('waitingForOpponent', () => {
      setGameStarted(false);
      setWaiting(true);
    });

    socket.on('spectatorMode', () => {
      setSpectator(true);
    });

    socket.on('gameOver', (result) => {
      setGameOver(true);
      clearInterval(timerRef.current);

      if (result.winner === playerName) {
        setGameResult(`Congratulations ${playerName}! You won with a score of ${result.scores[playerName]}!`);
      } else if (result.loser === playerName) {
        setGameResult(`Sorry ${playerName}, you lost. Better luck next time!`);
      } else {
        setGameResult(`It's a tie! Both players have equal scores.`);
      }
    });

    socket.on('playerLeft', (leftPlayerName) => {
      setGameOver(true);
      setGameResult(`${leftPlayerName} has left the game. The game has ended.`);
      clearInterval(timerRef.current);
    });

    return () => {
      socket.off('gameState');
      socket.off('startGame');
      socket.off('waitingForOpponent');
      socket.off('spectatorMode');
      socket.off('gameOver');
      socket.off('playerLeft');
    };
  }, [playerName]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeElapsed((prevTime) => prevTime + 1);
    }, 1000);
  };

  const handleCardClick = (id) => {
    if (gameState.currentTurn === playerName) {
      socket.emit('cardFlipped', id);
    }
  };

  const renderEmptyGrid = () => {
    const gridSize = 24; // Adjust this if your grid size is different
    return Array.from({ length: gridSize }).map((_, index) => (
      <div key={index} className="card empty-card"></div>
    ));
  };

  return (
    <div className="memory-game-container">
      <div className="game-info">
        <h2>Player: {playerName}</h2>
        <h2>Current Turn: {gameState.currentTurn}</h2>
        <h2>Time: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</h2>
        <h2>Your Score: {gameState.scores[playerName]}</h2>
      </div>
      {spectator ? (
        <div>
          <h2>You are currently a spectator. Please wait for a new game to join.</h2>
        </div>
      ) : waiting ? (
        <div>
          <h2>Waiting for an opponent to join...</h2>
        </div>
      ) : gameOver ? (
        <div>
          <h2>{gameResult}</h2>
        </div>
      ) : (
        <div className="memory-game">
          {gameStarted
            ? gameState.cards.map((card) => (
                <Card
                  key={card.id}
                  id={card.id}
                  type={card.type}
                  flipped={card.flipped}
                  onClick={handleCardClick}
                />
              ))
            : renderEmptyGrid()}
        </div>
      )}
    </div>
  );
}

export default MemoryGame;
