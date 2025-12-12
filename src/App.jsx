import React from "react";
import ConnectWallet from "./ConnectWallet";
import MakeTransaction from "./MakeTransaction";
import useWallet from "./useWallet";

export default function App() {
  const { connected, address } = useWallet();

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>stacks connect demo</h1>

      <p>
        status:{" "}
        <strong style={{ color: connected ? "green" : "red" }}>
          {connected ? "connected" : "not connected"}
        </strong>
        {address ? <span> — {address}</span> : null}
      </p>

      <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
        <ConnectWallet />
        <MakeTransaction />
      </div>
    </div>
  );
}
