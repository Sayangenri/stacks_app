import React from 'react';
import './LogViewer.css';

export default function LogViewer({ logs = [], title = 'Activity Log' }) {
  return (
    <div className="log-viewer">
      <div className="log-header">
        <span className="body-small text-secondary">{title}</span>
      </div>
      <div className="log-content">
        {logs.length === 0 ? (
          <div className="log-empty text-muted body-small">No activity yet</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="log-entry">
              <span className="text-mono">{log}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}