import React from 'react';
import './Card.css';

const cardColors = {
  '🥑': '#FFCCCB', // Light Red
  '🤪': '#FFEB99', // Light Yellow
  '🌟': '#B2FF66', // Light Green
  '🍀': '#C5E3BF', // Mint Green
  '🦄': '#B5EAD7', // Pale Turquoise
  '🎯': '#B2D8FF', // Light Blue
  '🚀': '#D3B2FF', // Lavender
  '🐱': '#FFC8DD', // Light Pink
  '🍕': '#FFD699', // Light Peach
  '🏀': '#FFABAB', // Light Coral
  '🌈': '#FFCCFF', // Light Magenta
  '🎵': '#CCE6FF'  // Light Sky Blue
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
