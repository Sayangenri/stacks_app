// src/MakeTransaction.jsx
import React from "react";
import { openSTXTransfer } from "@stacks/connect";
import * as StacksNetwork from "@stacks/network"; // import the module namespace
import { userSession } from "./session";

/**
 * This file picks the correct network object whether your @stacks/network version
 * exports a class named `StacksTestnet` (older style) or a constant `STACKS_TESTNET`
 * (newer style).
 *
 * Replace RECIPIENT below with a real testnet address when testing.
 */

const RECIPIENT = "ST3NBRSFKX28FQ59FMFMVX3K7V4G3WZKB6TW8F7FP"; // replace as needed
const AMOUNT = "1000"; // adjust units if your wallet interprets differently

function getTestnetNetwork() {
  // if the package exposes a class constructor StacksTestnet -> instantiate it
  if (typeof StacksNetwork.StacksTestnet === "function") {
    try {
      return new StacksNetwork.StacksTestnet();
    } catch (e) {
      // fallback to next option below
      console.warn("Failed to instantiate StacksTestnet(), falling back:", e);
    }
  }

  // if the package exposes a constant STACKS_TESTNET (newer versions)
  if (StacksNetwork.STACKS_TESTNET) {
    return StacksNetwork.STACKS_TESTNET;
  }

  // last resort: try StacksMainnet named export typo guard (unlikely)
  if (typeof StacksNetwork.StacksMainnet === "function") {
    return new StacksNetwork.StacksMainnet(); // fallback to mainnet (not ideal)
  }

  throw new Error("Could not determine Stacks testnet object from @stacks/network");
}

export default function MakeTransaction() {
  const handleTransfer = () => {
    if (!userSession.isUserSignedIn()) {
      alert("please connect wallet first");
      return;
    }

    let network;
    try {
      network = getTestnetNetwork();
    } catch (err) {
      console.error(err);
      alert("unable to resolve Stacks network object. check console for details.");
      return;
    }

    openSTXTransfer({
      recipient: RECIPIENT,
      amount: AMOUNT,
      memo: "test transfer from my-stacks-app",
      network,
      onFinish: (data) => {
        console.log("transfer finished:", data);
        alert("transfer flow finished — check console for details");
      },
      onCancel: () => {
        console.log("transfer cancelled");
      },
    });
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, minWidth: 320 }}>
      <h3>send stx</h3>
      <p>opens the wallet transfer popup (testnet).</p>
      <button onClick={handleTransfer}>open transfer popup</button>
    </div>
  );
}
