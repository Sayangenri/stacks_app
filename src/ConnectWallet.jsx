import React, { useState } from "react";
import * as StacksConnect from "@stacks/connect";
import { userSession as legacyUserSession } from "./session";
import useWallet from "./useWallet";
import Card from "./components/Card";
import Button from "./components/Button";
import StatusBadge from "./components/StatusBadge";
import LogViewer from "./components/LogViewer";
import { Wallet, Power, Eye } from "lucide-react";

export default function ConnectWallet() {
  const { connected, address, refresh } = useWallet();
  const [log, setLog] = useState([]);

  function addLog(...msgs) {
    setLog((l) => [new Date().toLocaleTimeString() + " — " + msgs.join(" "), ...l].slice(0, 10));
    console.debug(...msgs);
  }

  async function handleConnect() {
    addLog("attempting connect()");
    if (typeof StacksConnect.connect === "function") {
      try {
        if (typeof StacksConnect.isConnected === "function" && StacksConnect.isConnected()) {
          addLog("already connected via isConnected()");
          refresh();
          return;
        }
        const res = await StacksConnect.connect();
        addLog("connect() resolved", JSON.stringify(res || {}));
        if (typeof StacksConnect.getLocalStorage === "function") {
          const ls = StacksConnect.getLocalStorage();
          addLog("getLocalStorage()", JSON.stringify(ls || {}));
        }
        refresh();
        return;
      } catch (e) {
        addLog("connect() threw:", e.message || e);
        console.error(e);
      }
    }

    if (typeof StacksConnect.showConnect === "function") {
      try {
        await StacksConnect.showConnect({
          userSession: legacyUserSession,
          appDetails: { name: "my-stacks-app", icon: window.location.origin + "/vite.svg" },
          onFinish: () => {
            addLog("showConnect onFinish");
            refresh();
          },
        });
        return;
      } catch (e) {
        addLog("showConnect threw:", e.message || e);
        console.error(e);
      }
    }

    try {
      addLog("FALLBACK: trying legacy userSession redirect");
      if (legacyUserSession && typeof legacyUserSession.redirectToSignIn === "function") {
        legacyUserSession.redirectToSignIn();
        return;
      }
      addLog("No suitable connect API found. Check @stacks/connect version and wallet extension.");
      alert("No suitable connect API found in @stacks/connect. Check console for details.");
    } catch (e) {
      addLog("Fallback failed:", e.message || e);
      console.error(e);
      alert("Connect failed — check console.");
    }
  }

  async function handleDisconnect() {
    addLog("attempting disconnect");
    if (typeof StacksConnect.disconnect === "function") {
      try {
        await StacksConnect.disconnect();
        addLog("disconnect() done");
        refresh();
        return;
      } catch (e) {
        addLog("disconnect() error:", e.message || e);
        console.error(e);
      }
    }
    try {
      legacyUserSession.signUserOut(window.location.origin);
      addLog("legacy signUserOut done");
      refresh();
    } catch (e) {
      addLog("sign out fallback failed:", e.message || e);
    }
  }

  async function showLocalStorage() {
    addLog("showLocalStorage()");
    if (typeof StacksConnect.getLocalStorage === "function") {
      try {
        const ls = StacksConnect.getLocalStorage();
        addLog("getLocalStorage ->", JSON.stringify(ls || {}));
        console.log("localStorage object from @stacks/connect:", ls);
      } catch (e) {
        addLog("getLocalStorage error:", e.message || e);
      }
    } else {
      try {
        const data = legacyUserSession.loadUserData();
        addLog("legacy loadUserData ->", JSON.stringify(data || {}));
        console.log("legacy userSession.loadUserData()", data);
      } catch (e) {
        addLog("legacy loadUserData error:", e.message || e);
      }
    }
  }

  return (
    <Card title="Wallet Connection" icon={<Wallet size={20} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="body-small text-secondary">Status</span>
            <StatusBadge status={connected ? 'connected' : 'disconnected'}>
              {connected ? 'Connected' : 'Disconnected'}
            </StatusBadge>
          </div>
          
          {address && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <span className="body-small text-secondary">Wallet Address</span>
              <code className="text-mono" style={{ 
                padding: 'var(--space-3)', 
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                wordBreak: 'break-all',
                fontSize: 'var(--text-xs)'
              }}>
                {address}
              </code>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Button 
            variant="primary" 
            icon={<Wallet size={18} />}
            onClick={handleConnect}
          >
            Connect
          </Button>
          <Button 
            variant="secondary" 
            icon={<Power size={18} />}
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
          <Button 
            variant="ghost" 
            icon={<Eye size={18} />}
            onClick={showLocalStorage}
          >
            Inspect
          </Button>
        </div>

        <LogViewer logs={log} title="Connection Activity" />
      </div>
    </Card>
  );
}