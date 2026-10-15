"use client";

import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { Button } from "./ui";
import { shortAddr } from "@/lib/format";
import { TARGET_CHAIN } from "@/lib/config";

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useAppKit();

  if (!isConnected) {
    return <Button onClick={() => open()}>Connect Wallet</Button>;
  }

  const wrong = chainId !== TARGET_CHAIN.id;

  return (
    <Button
      variant={wrong ? "accent" : "dark"}
      onClick={() => open(wrong ? { view: "Networks" } : undefined)}
    >
      {wrong ? "Wrong network" : <span className="font-mono text-xs">{shortAddr(address)}</span>}
    </Button>
  );
}