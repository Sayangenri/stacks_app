import React from 'react';
import './Card.css';

export default function Card({ children, title, icon, className = '' }) {
  return (
    <div className={`card glass-card ${className}`}>
      {(title || icon) && (
        <div className="card-header">
          {icon && <span className="card-icon">{icon}</span>}
          {title && <h3 className="card-title heading-4">{title}</h3>}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}