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
  });
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    socket.emit('joinGame', playerName);

    socket.on('gameState', (state) => {
      setGameState(state);
      if (state.matchedIndices.length === state.cards.length) {
        setGameOver(true);
        clearInterval(timerRef.current);
      }
    });

    return () => {
      socket.off('gameState');
    };
  }, [playerName]);

  useEffect(() => {
    if (!gameOver) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [gameOver]);

  const handleCardClick = (id) => {
    if (gameState.currentTurn === playerName) {
      socket.emit('cardFlipped', id);
    }
  };

  const handlePlayAgain = () => {
    setGameOver(false);
    setTimeElapsed(0);
    socket.emit('resetGame');
  };

  return (
    <div className="memory-game-container">
      <div className="game-info">
        <h2>Player: {playerName}</h2>
        <h2>Current Turn: {gameState.currentTurn}</h2>
        <h2>Time: {Math.floor(timeElapsed / 60)}:{timeElapsed % 60}</h2>
      </div>
      {gameOver ? (
        <div>
          <h2>Congratulations, {playerName}! You finished the game in {Math.floor(timeElapsed / 60)}:{timeElapsed % 60}.</h2>
          <button onClick={handlePlayAgain}>Play Again</button>
        </div>
      ) : (
        <div className="memory-game">
          {gameState.cards.map((card) => (
            <Card
              key={card.id}
              id={card.id}
              type={card.type}
              flipped={card.flipped}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MemoryGame;
