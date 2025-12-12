// src/MakeTransaction.jsx
import React, { useState } from "react";
import * as StacksConnect from "@stacks/connect";
import { userSession as legacyUserSession } from "./session";
import useWallet from "./useWallet";

export default function MakeTransaction() {
  const { connected } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("100000"); // example microstacks or unit depends on API
  const [txLog, setTxLog] = useState([]);

  function addTxLog(msg) {
    setTxLog((s) => [new Date().toLocaleTimeString() + " — " + msg, ...s].slice(0, 10));
  }

  async function sendTransaction() {
    if (!connected) {
      alert("connect wallet first");
      return;
    }
    if (!recipient) {
      alert("enter recipient");
      return;
    }

    // Preferred: new request() API
    if (typeof StacksConnect.request === "function") {
      try {
        addTxLog("calling request('stx_transferStx')");
        const res = await StacksConnect.request("stx_transferStx", {
          amount: amount,
          recipient,
          memo: "Demo transfer",
        });
        addTxLog("request returned txid: " + (res?.txid || JSON.stringify(res)));
        console.log("request('stx_transferStx') ->", res);
        return;
      } catch (e) {
        addTxLog("request() error: " + (e.message || e));
        console.error(e);
      }
    }

    // Fallback: openSTXTransfer from older connect implementations
    if (typeof StacksConnect.openSTXTransfer === "function") {
      try {
        addTxLog("calling openSTXTransfer (fallback)");
        await StacksConnect.openSTXTransfer({
          recipient,
          amount,
          memo: "Demo transfer",
          userSession: legacyUserSession,
          onFinish: (data) => {
            addTxLog("openSTXTransfer onFinish: " + JSON.stringify(data || {}));
            console.log("openSTXTransfer finished:", data);
          },
        });
        return;
      } catch (e) {
        addTxLog("openSTXTransfer error: " + (e.message || e));
        console.error(e);
      }
    }

    addTxLog("No suitable transfer API found in @stacks/connect");
    alert("No suitable transfer API found. Check console.");
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 16, width: 420 }}>
      <h3>Send STX</h3>

      <div style={{ display: "grid", gap: 8 }}>
        <input placeholder="recipient address" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
        <input placeholder="amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={sendTransaction} disabled={!connected}>
            Send
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12 }}>
        <div style={{ fontWeight: "bold" }}>Tx log</div>
        <div style={{ maxHeight: 120, overflow: "auto", background: "#fafafa", padding: 8 }}>
          {txLog.length === 0 ? <div style={{ color: "#777" }}>no transactions yet</div> : null}
          {txLog.map((t, i) => (
            <div key={i} style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 4 }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
