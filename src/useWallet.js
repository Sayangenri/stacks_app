// src/useWallet.js
import { useEffect, useState } from "react";
import { connect, isConnected, disconnect } from "@stacks/connect";

export default function useWallet() {
  const [connected, setConnected] = useState(isConnected());
  const [addresses, setAddresses] = useState(null);

  useEffect(() => {
    if (isConnected()) {
      // You can store addresses in localStorage or a global store after first connect
      const cached = JSON.parse(localStorage.getItem("stx-addresses") || "null");
      if (cached) setAddresses(cached);
    }
  }, []);

  const connectWallet = async () => {
    try {
      const res = await connect({
        appDetails: {
          name: "my-stacks-app",
          icon: window.location.origin + "/logo.png",
        },
      });
      // res.addresses contains mainnet/testnet STX addresses
      localStorage.setItem("stx-addresses", JSON.stringify(res.addresses));
      setAddresses(res.addresses);
      setConnected(true);
    } catch (e) {
      console.error("connect failed", e);
    }
  };

  const signOut = () => {
    disconnect();
    localStorage.removeItem("stx-addresses");
    setAddresses(null);
    setConnected(false);
  };

  return { connected, addresses, connectWallet, signOut };
}
