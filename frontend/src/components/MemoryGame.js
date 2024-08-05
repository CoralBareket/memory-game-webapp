import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Card from './Card';
import './MemoryGame.css';

const socket = io('http://localhost:3000');

function MemoryGame() {
  const [gameState, setGameState] = useState({
    cards: [],
    flippedIndices: [],
    matchedIndices: [],
  });

  useEffect(() => {
    socket.on('gameState', (state) => {
      setGameState(state);
    });

    return () => {
      socket.off('gameState');
    };
  }, []);

  const handleCardClick = (id) => {
    socket.emit('cardFlipped', id);
  };

  return (
    <div className="memory-game">
      {gameState.cards.map((card) => (
        <Card
          key={card.id}
          id={card.id}
          type={card.type}
          flipped={gameState.flippedIndices.includes(card.id) || gameState.matchedIndices.includes(card.id)}
          onClick={handleCardClick}
        />
      ))}
    </div>
  );
}

export default MemoryGame;
