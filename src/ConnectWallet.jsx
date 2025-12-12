// src/ConnectWallet.jsx
import React, { useState } from "react";
import * as StacksConnect from "@stacks/connect";
import { userSession as legacyUserSession } from "./session";
import useWallet from "./useWallet";

export default function ConnectWallet() {
  const { connected, address, refresh } = useWallet();
  const [log, setLog] = useState([]);

  function addLog(...msgs) {
    setLog((l) => [new Date().toLocaleTimeString() + " — " + msgs.join(" "), ...l].slice(0, 10));
    console.debug(...msgs);
  }

  async function handleConnect() {
    addLog("attempting connect()");
    // prefer new API
    if (typeof StacksConnect.connect === "function") {
      try {
        // if already connected, skip
        if (typeof StacksConnect.isConnected === "function" && StacksConnect.isConnected()) {
          addLog("already connected via isConnected()");
          refresh();
          return;
        }
        const res = await StacksConnect.connect();
        addLog("connect() resolved", JSON.stringify(res || {}));
        // after connect, read local storage helper (if present)
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

    // try showConnect (older name)
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

    // fallback: legacy userSession redirect / sign in pending - open auth UI via userSession
    try {
      addLog("FALLBACK: trying legacy userSession redirect");
      // legacyUserSession.redirectToSignIn ? use that if available - but not all versions expose
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
    // fallback
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
    <div style={{ border: "1px solid #ddd", padding: 16, width: 420 }}>
      <h3>Connect Wallet</h3>

      <div style={{ marginBottom: 12 }}>
        <div>
          <strong>Status:</strong>{" "}
          <span style={{ color: connected ? "green" : "red" }}>{connected ? "connected" : "not connected"}</span>
        </div>
        <div>
          <strong>Address:</strong> {address || "—"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={handleConnect}>Connect</button>
        <button onClick={handleDisconnect}>Disconnect</button>
        <button onClick={showLocalStorage}>Show Local Data</button>
      </div>

      <div style={{ fontSize: 12, color: "#444" }}>
        <div style={{ fontWeight: "bold", marginBottom: 6 }}>Debug log</div>
        <div style={{ maxHeight: 120, overflow: "auto", background: "#fafafa", padding: 8 }}>
          {log.length === 0 ? <div style={{ color: "#777" }}>no logs yet</div> : null}
          {log.map((l, i) => (
            <div key={i} style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 4 }}>
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
