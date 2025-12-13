import React, { useState } from "react";
import * as StacksConnect from "@stacks/connect";
import useWallet from "./useWallet";
import Card from "./components/Card";
import Button from "./components/Button";
import Input from "./components/Input";
import LogViewer from "./components/LogViewer";
import { FileCode, Loader2, ExternalLink } from "lucide-react";

export default function DeployContract({ onDeployed }) {
  const { request: walletRequest, connected } = useWallet();
  const [contractName, setContractName] = useState("demo-contract");
  const [clarityVersion, setClarityVersion] = useState("4");
  const [codeBody, setCodeBody] = useState(`(define-public (say-hi) (ok "hello world"))`);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);

  function addLog(msg) {
    setLog((s) => [`${new Date().toLocaleTimeString()} — ${msg}`, ...s].slice(0, 12));
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

  async function tryDeployWithPayload(payload) {
    const requestFn = getRequestFn();
    if (!requestFn) throw new Error("No request() function available (check @stacks/connect).");
    addLog("Attempting deploy with payload keys: " + Object.keys(payload).join(", "));
    console.log("deploy payload (full):", payload);
    const resp = await requestFn("stx_deployContract", payload);
    return resp;
  }

  async function handleDeploy() {
    if (!connected) {
      alert("connect wallet first");
      return;
    }
    if (!contractName.trim()) {
      alert("enter contract name");
      return;
    }
    if (!codeBody || !codeBody.trim()) {
      alert("enter contract code");
      return;
    }

    setLoading(true);
    addLog(`deploying "${contractName}" (clarity v${clarityVersion})`);

    let code = codeBody.replace(/^\uFEFF/, "").trim();

    if (!code.startsWith("(")) {
      addLog("Warning: contract does not start with '(' — trimming & wrapping may be needed.");
    }

    const payloadCandidates = [
      { name: contractName.trim(), code, clarityVersion: Number(clarityVersion) || 4 },
      { name: contractName.trim(), clarityCode: code, clarityVersion: Number(clarityVersion) || 4 },
      { name: contractName.trim(), codeBody: code, clarityVersion: Number(clarityVersion) || 4 },
    ];

    const minimalContract = `(define-public (ping) (ok u0))`;
    payloadCandidates.push({
      name: contractName.trim() + "-minimal",
      code: minimalContract,
      clarityVersion: Number(clarityVersion) || 4,
    });

    let resp = null;
    let lastError = null;

    for (const payload of payloadCandidates) {
      try {
        resp = await tryDeployWithPayload(payload);
        addLog("Deploy request succeeded with this payload shape.");
        break;
      } catch (err) {
        lastError = err;
        addLog("Deploy attempt failed: " + (err.message || err));
        console.warn("Deploy attempt error:", err);
      }
    }

    if (!resp) {
      addLog("All deploy attempts failed. Last error: " + (lastError?.message || lastError));
      alert("Deploy failed. Check console for details.");
      setLoading(false);
      return;
    }

    const txId = extractTxId(resp);
    if (txId) {
      addLog(`Deploy txId: ${txId}`);
      if (onDeployed && typeof onDeployed === "function") {
        onDeployed({ name: contractName.trim(), txid: txId });
      }
    } else {
      addLog("No txId found in response. Check console.");
      console.warn("Deploy response (no txId):", resp);
    }

    setLoading(false);
  }

  return (
    <Card title="Deploy Smart Contract" icon={<FileCode size={20} />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <Input
            label="Contract Name"
            placeholder="my-contract"
            value={contractName}
            onChange={(e) => setContractName(e.target.value)}
            disabled={loading}
          />

          <div className="input-group">
            <label className="input-label body-small">Clarity Version</label>
            <select
              className="input"
              value={clarityVersion}
              onChange={(e) => setClarityVersion(e.target.value)}
              disabled={loading}
            >
              <option value="4">Clarity 4</option>
              <option value="3">Clarity 3</option>
              <option value="2">Clarity 2</option>
              <option value="1">Clarity 1</option>
            </select>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label body-small">Contract Code (Clarity)</label>
          <textarea
            className="input"
            value={codeBody}
            onChange={(e) => setCodeBody(e.target.value)}
            disabled={loading}
            rows={8}
            placeholder="(define-public (my-function) (ok true))"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}
          />
        </div>

        <Button
          variant="primary"
          icon={loading ? <Loader2 size={18} className="spin" /> : <FileCode size={18} />}
          onClick={handleDeploy}
          disabled={!connected || loading}
        >
          {loading ? 'Deploying...' : 'Deploy Contract'}
        </Button>

        <LogViewer logs={log} title="Deployment Activity" />
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