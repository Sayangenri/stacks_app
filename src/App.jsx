import { useEffect } from "react";
import { userSession } from "./session";

export default function AppRoot() {
  useEffect(() => {
    async function handleAuth() {
      if (userSession.isSignInPending()) {
        const data = await userSession.handlePendingSignIn();
        console.log("auth completed", data);
      }
    }
    handleAuth();
  }, []);
  return (
    <div style={{ padding: 32 }}>
      <h1>Stacks App</h1>

      <p>
        Wallet Status:{" "}
        {connected ? (
          <span style={{ color: "green" }}>Connected</span>
        ) : (
          <span style={{ color: "red" }}>Not Connected</span>
        )}
      </p>

      <ConnectWallet />
      <br />
      <MakeTransaction />
    </div>
  );
}
