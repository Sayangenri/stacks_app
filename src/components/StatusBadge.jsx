import React from 'react';
import './StatusBadge.css';

export default function StatusBadge({ status, children }) {
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot"></span>
      {children}
    </span>
  );
}