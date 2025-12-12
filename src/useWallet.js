// src/useWallet.js
import { useEffect, useState } from "react";
import * as StacksConnect from "@stacks/connect";
import { userSession as legacyUserSession } from "./session";

/**
 * Exposes:
 *  - connected: boolean
 *  - address: friendly stx address (testnet/mainnet or string)
 *  - refresh(): re-fetch state
 *
 * Uses new @stacks/connect helpers (isConnected/getLocalStorage) if available.
 * Falls back to legacy userSession when needed.
 */

function getAddressFromLocalStorage(ls) {
  try {
    if (!ls) return null;
    // tutorial shape: { addresses: { stx: [{ address: "SP..." }] } }
    if (ls.addresses && ls.addresses.stx && ls.addresses.stx[0]) {
      return ls.addresses.stx[0].address;
    }
    // older userSession shape: { profile: { stxAddress: { testnet/mainnet } } }
    if (ls.profile && ls.profile.stxAddress) {
      const a = ls.profile.stxAddress;
      if (typeof a === "string") return a;
      return a.testnet || a.mainnet || JSON.stringify(a);
    }
    return null;
  } catch (e) {
    console.warn("getAddressFromLocalStorage error", e);
    return null;
  }
}

export default function useWallet() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState(null);

  const refresh = () => {
    // New API: isConnected + getLocalStorage
    if (typeof StacksConnect.isConnected === "function") {
      try {
        const c = StacksConnect.isConnected();
        setConnected(Boolean(c));
        const ls = typeof StacksConnect.getLocalStorage === "function" ? StacksConnect.getLocalStorage() : null;
        const a = getAddressFromLocalStorage(ls);
        setAddress(a);
        return;
      } catch (e) {
        console.warn("useWallet: new API check failed", e);
      }
    }

    // Fallback: legacy userSession
    try {
      const isSigned = legacyUserSession.isUserSignedIn();
      setConnected(Boolean(isSigned));
      if (isSigned) {
        const data = legacyUserSession.loadUserData();
        const a = getAddressFromLocalStorage(data);
        setAddress(a);
      } else {
        setAddress(null);
      }
    } catch (e) {
      console.warn("useWallet: fallback check failed", e);
      setConnected(false);
      setAddress(null);
    }
  };

  useEffect(() => {
    refresh();
    // add focus listener to try refresh when user returns from wallet popup/tab
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connected, address, refresh };
}
