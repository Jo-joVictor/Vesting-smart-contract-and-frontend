"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { Button } from "./ui";
import { TARGET_CHAIN } from "@/lib/config";

export function ActionButton({
  label,
  onClick,
  disabled,
  loading,
  loadingLabel = "Working…",
  variant = "accent",
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  variant?: "dark" | "accent" | "outline";
  className?: string;
}) {
  const { isConnected, chainId } = useAccount();
  const { open } = useAppKit();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) {
    return (
      <Button variant={variant} className={className} onClick={() => open()}>
        Connect Wallet →
      </Button>
    );
  }

  if (chainId !== TARGET_CHAIN.id) {
    return (
      <Button
        variant={variant}
        className={className}
        disabled={isPending}
        onClick={() => switchChain({ chainId: TARGET_CHAIN.id })}
      >
        {isPending ? "Switching…" : `Switch to ${TARGET_CHAIN.name}`}
      </Button>
    );
  }

  return (
    <Button variant={variant} className={className} disabled={disabled || loading} onClick={onClick}>
      {loading ? loadingLabel : label}
    </Button>
  );
}