import type { Hash } from "viem";
import type { TxStatus as Status } from "@/hooks/useTx";
import { explorerTx } from "@/lib/config";
import { cn } from "@/lib/utils";

export function TxStatus({
  status,
  hash,
  error,
  className,
}: {
  status: Status;
  hash?: Hash;
  error?: string;
  className?: string;
}) {
  if (status === "idle") return null;

  const text =
    status === "signing"
      ? "Confirm in your wallet…"
      : status === "confirming"
        ? "Waiting for confirmation…"
        : status === "success"
          ? "Transaction confirmed."
          : error;

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-2 font-mono text-[11px]",
        status === "error" ? "text-danger" : "text-muted",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          status === "error" ? "bg-danger" : status === "success" ? "bg-emerald-600" : "animate-pulse bg-accent"
        )}
      />
      {text}
      {hash && (
        <a href={explorerTx(hash)} target="_blank" rel="noreferrer" className="text-accent underline">
          View tx ↗
        </a>
      )}
    </p>
  );
}