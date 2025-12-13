import React, { useState } from "react";
import ConnectWallet from "./ConnectWallet";
import MakeTransaction from "./MakeTransaction";
import DeployContract from "./DeployContract";
import CallContract from "./CallContract";
import useWallet from "./useWallet";
import StatusBadge from "./components/StatusBadge";
import "./App.css";

export default function App() {
  const { connected, address } = useWallet();
  const [lastDeployed, setLastDeployed] = useState(null);

  function handleDeployed(info) {
    setLastDeployed(info);
  }

  return (
    <div className="app-container">
      <div className="app-background">
        <div className="gradient-orb gradient-orb-1"></div>
        <div className="gradient-orb gradient-orb-2"></div>
        <div className="gradient-orb gradient-orb-3"></div>
      </div>

      <div className="app-content">
        <header className="app-header">
          <div className="header-content">
            <div className="header-brand">
              <div className="brand-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 2L4 8V14C4 22 10 28 16 30C22 28 28 22 28 14V8L16 2Z" 
                    fill="url(#gradient)" stroke="currentColor" strokeWidth="2"/>
                  <defs>
                    <linearGradient id="gradient" x1="4" y1="2" x2="28" y2="30">
                      <stop offset="0%" stopColor="#1560BD"/>
                      <stop offset="100%" stopColor="#008B8B"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div>
                <h1 className="heading-2">Stacks Connect</h1>
                <p className="body-small text-secondary">Blockchain Wallet Interface</p>
              </div>
            </div>

            <div className="header-status">
              <StatusBadge status={connected ? 'connected' : 'disconnected'}>
                {connected ? 'Connected' : 'Disconnected'}
              </StatusBadge>
              {address && (
                <div className="address-display">
                  <span className="body-small text-tertiary">Address:</span>
                  <code className="text-mono text-primary">{address.slice(0, 8)}...{address.slice(-6)}</code>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-main">
          <div className="grid-layout">
            <div className="grid-item">
              <ConnectWallet />
            </div>
            <div className="grid-item">
              <MakeTransaction />
            </div>
            <div className="grid-item grid-item-full">
              <DeployContract onDeployed={handleDeployed} />
            </div>
            <div className="grid-item grid-item-full">
              <CallContract lastDeployed={lastDeployed} />
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <p className="body-small text-muted">
            Built with Stacks Connect • Powered by React & Vite
          </p>
        </footer>
      </div>
    </div>
  );
}