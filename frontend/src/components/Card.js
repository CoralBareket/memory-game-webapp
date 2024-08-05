import React from 'react';
import './Card.css';

function Card({ id, type, flipped, onClick }) {
  return (
    <div className={`card ${flipped ? 'flipped' : ''}`} onClick={() => onClick(id)}>
      <div className="card-inner">
        <div className="card-front">
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
