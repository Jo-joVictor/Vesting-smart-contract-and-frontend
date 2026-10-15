"use client";
import { useCallback, useState } from "react";
import { usePublicClient } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import type { Hash } from "viem";
import { TARGET_CHAIN } from "@/lib/config";
import { decodeError } from "@/lib/errors";

export type TxStatus = "idle" | "signing" | "confirming" | "success" | "error";

/**
 * Wraps any write call: sign -> wait for receipt -> refetch all contract reads.
 *
 *   const tx = useTx();
 *   await tx.run(() => writeContractAsync({ ... }));
 */
export function useTx(onSuccess?: () => void) {
  const publicClient = usePublicClient({ chainId: TARGET_CHAIN.id });
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [hash, setHash] = useState<Hash>();
  const [error, setError] = useState<string>();

  const reset = useCallback(() => {
    setStatus("idle");
    setHash(undefined);
    setError(undefined);
  }, []);

  const run = useCallback(
    async (send: () => Promise<Hash>) => {
      setError(undefined);
      setHash(undefined);
      setStatus("signing");
      try {
        const h = await send();
        setHash(h);
        setStatus("confirming");
        const receipt = await publicClient!.waitForTransactionReceipt({ hash: h });
        if (receipt.status === "reverted") throw new Error("Transaction reverted on-chain.");
        setStatus("success");
        await queryClient.invalidateQueries();
        onSuccess?.();
        return true;
      } catch (e) {
        setError(decodeError(e));
        setStatus("error");
        return false;
      }
    },
    [publicClient, queryClient, onSuccess]
  );

  return {
    run,
    reset,
    status,
    hash,
    error,
    busy: status === "signing" || status === "confirming",
  };
}