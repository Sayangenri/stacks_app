import React, { useState } from "react";
import * as StacksConnect from "@stacks/connect";
import { userSession as legacyUserSession } from "./session";
import useWallet from "./useWallet";
import Card from "./components/Card";
import Button from "./components/Button";
import Input from "./components/Input";
import LogViewer from "./components/LogViewer";
import { Send, Loader2 } from "lucide-react";

export default function MakeTransaction() {
  const { connected, request: walletRequest } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("100000");
  const [txLog, setTxLog] = useState([]);
  const [loading, setLoading] = useState(false);

  function addTxLog(msg) {
    const ts = new Date().toLocaleTimeString();
    setTxLog((s) => [`${ts} — ${msg}`, ...s].slice(0, 10));
  }

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
    addTxLog("Preparing STX transfer...");

    try {
      const txOptions = {
        stxAddress: recipient,
        amount: amount,
        network: "testnet",
      };

      addTxLog(`Requesting transfer of ${amount} microSTX to ${recipient}`);
      const resp = await requestFn("stx_transferStx", txOptions);
      addTxLog("Transfer request sent. Response: " + JSON.stringify(resp));

      const txId = extractTxId(resp);
      if (txId) {
        addTxLog(`Transaction ID: ${txId}`);
        console.log("Transaction ID:", txId);
      } else {
        addTxLog("No txId found in response. Check console for full response.");
        console.warn("No txId in response:", resp);
      }
    } catch (err) {
      addTxLog("Transfer error: " + (err.message || err));
      console.error("Transfer error:", err);
      alert("Transfer failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Send Transaction" icon={<Send size={20} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input
          label="Recipient Address"
          placeholder="SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          disabled={loading}
        />

        <Input
          label="Amount (microSTX)"
          type="number"
          placeholder="1000000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
        />

        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>
          💡 1 STX = 1,000,000 microSTX
        </div>

        <Button
          variant="primary"
          icon={loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          onClick={sendTransaction}
          disabled={!connected || loading}
        >
          {loading ? 'Sending...' : 'Send STX'}
        </Button>

        <LogViewer logs={txLog} title="Transaction Activity" />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </Card>
  );
}