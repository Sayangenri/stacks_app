// src/MakeTransaction.jsx
import React, { useState } from "react";
import * as StacksConnect from "@stacks/connect";
import { userSession as legacyUserSession } from "./session";
import useWallet from "./useWallet";

export default function MakeTransaction() {
  const { connected, request: walletRequest } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("100000"); // example microSTX (1 STX = 1_000_000)
  const [txLog, setTxLog] = useState([]);
  const [loading, setLoading] = useState(false);

  function addTxLog(msg) {
    const ts = new Date().toLocaleTimeString();
    setTxLog((s) => [`${ts} — ${msg}`, ...s].slice(0, 10));
  }

  // picks the best request function (prefers wallet-provided request via hook)
  function getRequestFn() {
    if (typeof walletRequest === "function") return walletRequest;
    if (typeof StacksConnect.request === "function") return StacksConnect.request;
    return null;
  }

  function extractTxId(resp) {
    if (!resp) return null;
    return resp.txId ?? resp.txid ?? resp.txID ?? resp?.tx?.tx_id ?? null;
  }

  async function sendTransaction() {
    if (!connected) {
      alert("Connect wallet first");
      return;
    }
    if (!recipient) {
      alert("Enter recipient address");
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      alert("Enter a valid numeric amount (microSTX). Example: 1000000 = 1 STX");
      return;
    }

    const requestFn = getRequestFn();
    if (!requestFn) {
      addTxLog("No request() function available in @stacks/connect or wallet hook.");
      alert("No suitable connect/request API found. Check console.");
      return;
    }

    setLoading(true);
    addTxLog(`Starting transfer → ${amount} microSTX to ${recipient}`);

    try {
      // Primary flow: request('stx_transferStx')
      const res = await requestFn("stx_transferStx", {
        recipient,
        amount: amount.toString(),
        memo: "Demo transfer",
      });

      addTxLog("request returned: " + JSON.stringify(res));
      console.log("stx_transferStx response:", res);

      const txid = extractTxId(res);
      if (txid) {
        addTxLog("txid: " + txid);
        const explorerUrl = `https://explorer.stacks.co/txid/${txid}`;
        // open explorer in a new tab so user can follow confirmation
        window.open(explorerUrl, "_blank");
      } else {
        addTxLog("No txid returned by request; check wallet UI or console for details.");
        alert("Transaction submitted (no txid in response). Check wallet UI or console.");
      }
    } catch (err) {
      // If user or wallet rejects, we still want helpful logs
      const msg = err?.message ?? JSON.stringify(err) ?? String(err);
      addTxLog("request() error: " + msg);
      console.error("stx_transferStx error:", err);

      // If the error looks like 'request not supported', fallback to legacy openSTXTransfer
      if (typeof StacksConnect.openSTXTransfer === "function") {
        addTxLog("Attempting fallback openSTXTransfer");
        try {
          await StacksConnect.openSTXTransfer({
            recipient,
            amount: amount.toString(),
            memo: "Demo transfer",
            userSession: legacyUserSession,
            onFinish: (data) => {
              addTxLog("openSTXTransfer onFinish: " + JSON.stringify(data || {}));
              const txid = extractTxId(data);
              if (txid) {
                const url = `https://explorer.stacks.co/txid/${txid}`;
                window.open(url, "_blank");
              }
            },
          });
        } catch (fallbackErr) {
          const fm = fallbackErr?.message ?? JSON.stringify(fallbackErr) ?? String(fallbackErr);
          addTxLog("openSTXTransfer error: " + fm);
          console.error("openSTXTransfer error:", fallbackErr);
          alert("Transaction failed or was cancelled: " + fm);
        }
      } else {
        // No fallback available
        alert("Transaction failed or was cancelled: " + msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 16, width: 420, borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Send STX</h3>

      <div style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="recipient address (SP... or ST...)"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.trim())}
        />
        <input
          placeholder="amount (microSTX — 1 STX = 1,000,000)"
          value={amount}
          onChange={(e) => setAmount(e.target.value.trim())}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={sendTransaction} disabled={!connected || loading}>
            {loading ? "sending…" : "Send"}
          </button>
          {!connected ? (
            <div style={{ alignSelf: "center", color: "#666", fontSize: 13 }}>connect wallet to enable</div>
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12 }}>
        <div style={{ fontWeight: "bold" }}>Tx log</div>
        <div style={{ maxHeight: 160, overflow: "auto", background: "#fafafa", padding: 8, borderRadius: 6 }}>
          {txLog.length === 0 ? <div style={{ color: "#777" }}>no transactions yet</div> : null}
          {txLog.map((t, i) => (
            <div key={i} style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 6 }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
