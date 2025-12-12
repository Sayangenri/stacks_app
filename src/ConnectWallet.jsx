// src/ConnectWallet.jsx
import React, { useEffect, useState, useRef } from "react";
import * as StacksConnect from "@stacks/connect";
import { appConfig, userSession } from "./session";

/**
 * Robust ConnectWallet:
 * - detects various @stacks/connect exports
 * - polls after initiating connect to catch popup/redirect flows
 * - listens for window focus (helps when user approves in another window)
 * - displays resolved STX address after connect
 */

function pickShowConnect() {
  const candidates = ["showConnect", "connect", "request"];
  for (const name of candidates) {
    if (typeof StacksConnect[name] === "function") return StacksConnect[name];
  }
  if (StacksConnect.default && typeof StacksConnect.default.showConnect === "function")
    return StacksConnect.default.showConnect;
  if (typeof StacksConnect.default === "function") return StacksConnect.default;
  return null;
}

export default function ConnectWallet() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [isPending, setIsPending] = useState(userSession.isSignInPending?.() || false);
  const pollRef = useRef(null);

  // load user data if already signed in
  const refreshUserData = () => {
    if (userSession.isUserSignedIn()) {
      try {
        const data = userSession.loadUserData();
        setUserData(data);
        setIsPending(false);
        return true;
      } catch (e) {
        console.warn("refreshUserData: failed to load userData", e);
      }
    }
    return false;
  };

  useEffect(() => {
    refreshUserData();

    // if sign-in pending (redirect), show pending indicator
    if (userSession.isSignInPending && userSession.isSignInPending()) {
      setIsPending(true);
    }

    // listen for window focus (user may approve in wallet tab/popup)
    const onFocus = () => {
      if (userSession.isUserSignedIn()) {
        refreshUserData();
      }
    };
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  // helper to read a friendly address string
  const getAddressString = (data) => {
    if (!data) return null;
    const profile = data.profile || {};
    const stxAddress = profile.stxAddress;
    if (!stxAddress) return null;
    // common shapes: { mainnet: "...", testnet: "..." } or a string
    if (typeof stxAddress === "string") return stxAddress;
    if (stxAddress.testnet) return stxAddress.testnet;
    if (stxAddress.mainnet) return stxAddress.mainnet;
    // fallback
    return JSON.stringify(stxAddress);
  };

  // poll for sign-in (used after initiating connect)
  const startPollingForSignIn = (timeoutMs = 10000, intervalMs = 500) => {
    if (pollRef.current) clearInterval(pollRef.current);
    const start = Date.now();
    pollRef.current = setInterval(() => {
      if (userSession.isUserSignedIn()) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        refreshUserData();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setIsPending(false);
      }
    }, intervalMs);
  };

  const handleConnect = () => {
    setError(null);
    const fn = pickShowConnect();
    if (!fn) {
      setError("No compatible connect function found. Check console for available exports.");
      console.error("Available @stacks/connect exports:", Object.keys(StacksConnect));
      return;
    }

    const opts = {
      appDetails: {
        name: "my-stacks-app",
        icon: window.location.origin + "/logo.png",
      },
      userSession,
      onFinish: () => {
        // many implementations call onFinish; still poll to be safe
        refreshUserData();
      },
    };

    try {
      const maybePromise = fn(opts);
      // start polling — covers popup/redirect flows that don't call onFinish in-app
      setIsPending(true);
      startPollingForSignIn(15000, 500);

      if (maybePromise && typeof maybePromise.then === "function") {
        maybePromise
          .then(() => {
            // sometimes resolves immediately
            if (userSession.isUserSignedIn()) refreshUserData();
          })
          .catch((e) => {
            console.warn("connect promise rejected", e);
            setError("connect flow failed (see console)");
            setIsPending(false);
          });
      }
    } catch (e) {
      console.error("Error while invoking connect function:", e);
      setError("failed to start connect (see console)");
      setIsPending(false);
    }
  };

  const handleSignOut = () => {
    try {
      userSession.signUserOut(window.location.origin);
      setUserData(null);
      setIsPending(false);
    } catch (e) {
      console.error("sign out failed:", e);
      setError("sign out failed (see console)");
    }
  };

  const address = getAddressString(userData);

  return (
    <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, minWidth: 320 }}>
      <h3>wallet</h3>

      <div style={{ marginBottom: 10 }}>
        {isPending ? (
          <span style={{ color: "#b47cff", fontWeight: "bold" }}>● sign-in pending…</span>
        ) : address ? (
          <span style={{ color: "green", fontWeight: "bold" }}>● wallet connected ✓</span>
        ) : (
          <span style={{ color: "red", fontWeight: "bold" }}>● wallet not connected ✗</span>
        )}
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}

      {address ? (
        <>
          <p><strong>address:</strong></p>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{address}</pre>
          <button onClick={handleSignOut}>sign out</button>
        </>
      ) : (
        <>
          <p>not connected</p>
          <button onClick={handleConnect}>connect stacks wallet</button>
        </>
      )}
    </div>
  );
}
