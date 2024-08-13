import React, { useState } from 'react';
import MemoryGame from './components/MemoryGame';
import './App.css';

function App() {
  const [playerName, setPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      setGameStarted(true);
    }
  };

  return (
    <div className="App">
      {!gameStarted && (
        <header className="App-header">
          <h1>Memory Game</h1>
        </header>
      )}
      {!gameStarted ? (
        <form onSubmit={startGame}>
          <label>
            Enter your name:
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
          </label>
          <button type="submit">Start Game</button>
        </form>
      ) : (
        <MemoryGame playerName={playerName} />
      )}
    </div>
  );
}

export default App;
