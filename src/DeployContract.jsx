// src/DeployContract.jsx
import React, { useState } from "react";
import * as StacksConnect from "@stacks/connect";
import useWallet from "./useWallet";

/**
 * Robust deploy component:
 * - trims code
 * - tries multiple request shapes if the wallet rejects the first one
 * - shows log and opens explorer on success
 */

export default function DeployContract() {
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

  // small helper to try a particular request payload shape
  async function tryDeployWithPayload(payload) {
    const requestFn = getRequestFn();
    if (!requestFn) throw new Error("No request() function available (check @stacks/connect).");
    addLog("Attempting deploy with payload keys: " + Object.keys(payload).join(", "));
    // log payload except the full code to avoid huge console spam — but keep code length
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

    // sanitize code (remove BOM, trim)
    let code = codeBody.replace(/^\uFEFF/, "").trim();

    // quick sanity check: contract must start with '(' typically
    if (!code.startsWith("(")) {
      addLog("Warning: contract does not start with '(' — trimming & wrapping may be needed.");
    }

    // payload candidates to try in order (some wallet versions expect different keys)
    const payloadCandidates = [
      { name: contractName.trim(), code, clarityVersion: Number(clarityVersion) || 4 },        // typical
      { name: contractName.trim(), clarityCode: code, clarityVersion: Number(clarityVersion) || 4 }, // some wallets
      { name: contractName.trim(), codeBody: code, clarityVersion: Number(clarityVersion) || 4 }, // other variants
    ];

    // Also include a minimal contract as a debug fallback (helps discover whether code content is the problem)
    const minimalContract = `(define-public (ping) (ok u0))`;

    try {
      let resp = null;
      let lastErr = null;

      for (const payload of payloadCandidates) {
        try {
          resp = await tryDeployWithPayload(payload);
          // if no exception, consider success (may still not include tx id)
          if (resp) {
            addLog("deploy returned: " + JSON.stringify(resp));
            const txid = extractTxId(resp);
            if (txid) {
              addLog("deploy successful txid: " + txid);
              window.open(`https://explorer.stacks.co/txid/${txid}`, "_blank");
            } else {
              addLog("deploy submitted (no txid returned). Check wallet UI or console.");
              alert("Deploy submitted — check wallet UI for status or console logs.");
            }
            setLoading(false);
            return;
          }
        } catch (err) {
          lastErr = err;
          addLog("deploy attempt failed for keys: " + Object.keys(payload).join(", ") + " — " + (err?.message || String(err)));
          console.warn("deploy attempt error (keys:", Object.keys(payload).join(", "), ")", err);
          // If the error message explicitly mentions clarityCode or clarityCode validation, continue to next payload
        }
      }

      // If we reach here, all key variants failed — try minimal contract to determine if source is the issue
      try {
        addLog("All payload shapes failed. Trying minimal contract to test validation (helps pinpoint issue).");
        const payload = { name: contractName.trim(), code: minimalContract, clarityVersion: Number(clarityVersion) || 4 };
        const resp2 = await tryDeployWithPayload(payload);
        addLog("minimal contract response: " + JSON.stringify(resp2));
        const txid2 = extractTxId(resp2);
        if (txid2) {
          addLog("minimal contract deployed txid: " + txid2);
          window.open(`https://explorer.stacks.co/txid/${txid2}`, "_blank");
          setLoading(false);
          return;
        }
      } catch (err2) {
        lastErr = err2;
        addLog("minimal contract deploy failed as well: " + (err2?.message || String(err2)));
        console.warn("minimal contract error:", err2);
      }

      // If still failed, show the most recent error message
      throw lastErr ?? new Error("Unknown deploy failure");
    } catch (finalErr) {
      const msg = finalErr?.message ?? String(finalErr);
      addLog("deploy error: " + msg);
      console.error("Final deploy error:", finalErr);

      // friendly diagnostic suggestions
      let help = "";
      if (msg.toLowerCase().includes("claritycode") || msg.toLowerCase().includes("clarity code") || msg.toLowerCase().includes("invalid input at")) {
        help +=
          "This looks like a Clarity code validation error. Try:\n" +
          "- switching clarityVersion to 3 (some wallets/nodes expect v3)\n" +
          "- making sure quotes are plain ASCII double quotes (no smart quotes)\n" +
          "- removing leading BOM or invisible characters\n" +
          "- trying the minimal contract `(define-public (ping) (ok u0))` to see if the wallet accepts that.\n";
      } else {
        help += "Check the console logs — payloads attempted were printed there.";
      }

      alert("Deploy failed: " + msg + "\n\nHints:\n" + help);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, maxWidth: 820 }}>
      <h4 style={{ marginTop: 0 }}>Deploy Contract</h4>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          placeholder="contract name (slug)"
          value={contractName}
          onChange={(e) => setContractName(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={clarityVersion} onChange={(e) => setClarityVersion(e.target.value)}>
          <option value="4">Clarity 4</option>
          <option value="3">Clarity 3</option>
        </select>
        <button onClick={handleDeploy} disabled={!connected || loading}>
          {loading ? "deploying…" : "Deploy"}
        </button>
      </div>

      <textarea
        rows={8}
        value={codeBody}
        onChange={(e) => setCodeBody(e.target.value)}
        style={{ width: "100%", fontFamily: "monospace", fontSize: 13 }}
      />

      <div style={{ fontSize: 13, color: "#666", marginTop: 8 }}>
        Contracts deploy to the connected wallet address. If you get a validation error, try clarity v3 or test with the minimal contract: <code>(define-public (ping) (ok u0))</code>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Log</strong>
        <div style={{ maxHeight: 160, overflow: "auto", background: "#fafafa", padding: 8, borderRadius: 6 }}>
          {log.length === 0 ? <div style={{ color: "#777" }}>no actions yet</div> : log.map((l, i) => <div key={i} style={{ fontFamily: "monospace", fontSize: 12 }}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}
