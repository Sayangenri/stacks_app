import React from 'react';
import './Input.css';

export default function Input({ 
  label, 
  error, 
  icon,
  ...props 
}) {
  return (
    <div className="input-group">
      {label && <label className="input-label body-small">{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input 
          className={`input ${icon ? 'input-with-icon' : ''} ${error ? 'input-error' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="input-error-text body-small">{error}</span>}
    </div>
  );
}