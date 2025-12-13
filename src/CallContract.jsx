import React, { useEffect, useState } from "react";
import * as StacksConnect from "@stacks/connect";
import useWallet from "./useWallet";
import { Cl } from "@stacks/transactions";
import Card from "./components/Card";
import Button from "./components/Button";
import Input from "./components/Input";
import LogViewer from "./components/LogViewer";
import { Play, Loader2 } from "lucide-react";

export default function CallContract({ lastDeployed }) {
  const { request: walletRequest, connected } = useWallet();

  const [contractAddress, setContractAddress] = useState("");
  const [contractName, setContractName] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [argsRaw, setArgsRaw] = useState("");
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lastDeployed && lastDeployed.address && lastDeployed.name) {
      setContractAddress(lastDeployed.address);
      setContractName(lastDeployed.name);
      addLog(`auto-filled from last deployed: ${lastDeployed.address}.${lastDeployed.name}`);
    }
  }, [lastDeployed]);

  function addLog(msg) {
    setLog((s) => [`${new Date().toLocaleTimeString()} — ${msg}`, ...s].slice(0, 20));
    console.log(msg);
  }

  function getRequestFn() {
    if (typeof walletRequest === "function") return walletRequest;
    if (typeof StacksConnect.request === "function") return StacksConnect.request;
    return null;
  }

  function extractTxId(resp) {
    return resp?.txId ?? resp?.txid ?? resp?.txID ?? resp?.tx?.tx_id ?? null;
  }

  function parseArgs(raw) {
    if (!raw) return [];
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    return parts.map((p) => {
      if (/^u?\d+$/.test(p)) return Cl.uint(BigInt(p.replace(/^u/, "")));
      if (p === "true") return Cl.bool(true);
      if (p === "false") return Cl.bool(false);
      if (/^".*"$/.test(p)) return Cl.stringAscii(p.slice(1, -1));
      if (p.startsWith("s:")) return Cl.stringAscii(p.slice(2));
      if (/^(ST|SP)[0-9A-Z]{20,40}$/i.test(p)) return Cl.standardPrincipalCV(p);
      return Cl.stringAscii(p);
    });
  }

  async function tryCallPayload(payload) {
    const requestFn = getRequestFn();
    if (!requestFn) throw new Error("No request() function available (check @stacks/connect).");
    addLog("Attempting call with keys: " + Object.keys(payload).join(", "));
    console.log("call payload (full):", payload);
    const resp = await requestFn("stx_callContract", payload);
    return resp;
  }

  async function handleCall() {
    if (!connected) {
      alert("connect wallet first");
      return;
    }
    if (!contractAddress.trim() || !contractName.trim() || !functionName.trim()) {
      alert("enter contract address, contract name, and function name");
      return;
    }

    const parsedArgs = parseArgs(argsRaw);
    setLoading(true);
    addLog(`calling ${contractAddress}.${contractName}::${functionName} with ${parsedArgs.length} args`);

    const payloadCandidates = [
      {
        contractAddress: contractAddress.trim(),
        contractName: contractName.trim(),
        functionName: functionName.trim(),
        functionArgs: parsedArgs,
      },
      {
        contract: `${contractAddress.trim()}.${contractName.trim()}`,
        functionName: functionName.trim(),
        functionArgs: parsedArgs,
      },
      {
        contractAddress: contractAddress.trim(),
        contractName: contractName.trim(),
        functionName: functionName.trim(),
        args: parsedArgs,
      },
    ];

    let resp = null;
    let lastError = null;

    for (const payload of payloadCandidates) {
      try {
        resp = await tryCallPayload(payload);
        addLog("Call request succeeded with this payload shape.");
        break;
      } catch (err) {
        lastError = err;
        addLog("Call attempt failed: " + (err.message || err));
        console.warn("Call attempt error:", err);
      }
    }

    if (!resp) {
      addLog("All call attempts failed. Last error: " + (lastError?.message || lastError));
      alert("Contract call failed. Check console for details.");
      setLoading(false);
      return;
    }

    const txId = extractTxId(resp);
    if (txId) {
      addLog(`Call txId: ${txId}`);
    } else {
      addLog("No txId found in response. Check console.");
      console.warn("Call response (no txId):", resp);
    }

    setLoading(false);
  }

  return (
    <Card title="Call Smart Contract" icon={<Play size={20} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
          <Input
            label="Contract Address"
            placeholder="SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            disabled={loading}
          />

          <Input
            label="Contract Name"
            placeholder="my-contract"
            value={contractName}
            onChange={(e) => setContractName(e.target.value)}
            disabled={loading}
          />
        </div>

        <Input
          label="Function Name"
          placeholder="say-hi"
          value={functionName}
          onChange={(e) => setFunctionName(e.target.value)}
          disabled={loading}
        />

        <div className="input-group">
          <label className="input-label body-small">
            Function Arguments (comma-separated)
          </label>
          <input
            className="input"
            placeholder='u123, "hello", true, SP2J6ZY...'
            value={argsRaw}
            onChange={(e) => setArgsRaw(e.target.value)}
            disabled={loading}
          />
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            💡 Examples: u123 (uint), "text" (string), true/false (bool), SP... (principal)
          </div>
        </div>

        <Button
          variant="primary"
          icon={loading ? <Loader2 size={18} className="spin" /> : <Play size={18} />}
          onClick={handleCall}
          disabled={!connected || loading}
        >
          {loading ? 'Calling...' : 'Call Function'}
        </Button>

        <LogViewer logs={log} title="Contract Call Activity" />
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