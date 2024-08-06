import React from 'react';
import './Card.css';

const cardColors = {
  '😍': '#ffadad',
  '🤪': '#ffd6a5',
  '🌟': '#fdffb6',
  '🍀': '#caffbf',
  '🦄': '#9bf6ff',
  '🎉': '#a0c4ff',
  '🚀': '#bdb2ff',
  '🐱': '#ffc6ff',
  '🍕': '#fffffc',
  '🏀': '#ffadad',
  '🌈': '#ffd6a5',
  '🎵': '#fdffb6'
};

function Card({ id, type, flipped, onClick }) {
  const frontStyle = {
    backgroundColor: cardColors[type] || '#ffffff', // default color if type not found
  };

  return (
    <div className={`card ${flipped ? 'flipped' : ''}`} onClick={() => onClick(id)}>
      <div className="card-inner">
        <div className="card-front" style={frontStyle}>
          <span>{type}</span>
        </div>
        <div className="card-back">
          <span>?</span>
        </div>
      </div>
    </div>
  );
}

export default Card;
