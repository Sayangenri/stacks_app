import React from 'react';
import './Button.css';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  onClick,
  ...props 
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="btn-icon">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="btn-icon">{icon}</span>}
    </button>
  );
}