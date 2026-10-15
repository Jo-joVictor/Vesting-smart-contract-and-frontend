"use client";

import { useQuery } from "@tanstack/react-query";
import { Eyebrow } from "./ui";
import { explorerTx } from "@/lib/config";
import { fmtEth, fmtToken, shortAddr } from "@/lib/format";

type Item = {
  kind: string;
  label: string;
  who?: string;
  amount?: string;
  unit?: "NXR" | "ETH";
  ts: number;
  tx: string;
};

const ago = (ts: number) => {
  const s = Math.max(0, Math.floor(Date.now() / 1000) - ts);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export function ActivityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: async (): Promise<{ items: Item[]; error?: string }> => (await fetch("/api/activity")).json(),
    refetchInterval: 30_000,
  });

  const items = data?.items ?? [];

  return (
    <div>
      <div className="flex items-end justify-between">
        <Eyebrow>Recent activity · all contracts</Eyebrow>
      </div>

      <div className="mt-4 border-t border-rule">
        {isLoading && <p className="py-6 text-sm text-muted">Loading activity…</p>}
        {!isLoading && items.length === 0 && (
          <p className="py-6 text-sm text-muted">{data?.error ?? "No on-chain activity yet."}</p>
        )}

        {items.map((i) => {
          const amt =
            i.amount === undefined
              ? ""
              : i.unit === "ETH"
                ? `${fmtEth(BigInt(i.amount), 4)} ETH`
                : `${fmtToken(BigInt(i.amount), 2)} NXR`;
          return (
            <a
              key={i.tx + i.kind + i.amount}
              href={explorerTx(i.tx)}
              target="_blank"
              rel="noreferrer"
              className="grid grid-cols-[5.5rem_1fr_auto] items-baseline gap-4 border-b border-rule py-3 text-sm hover:bg-ink/[0.02] md:grid-cols-[6rem_1fr_10rem_6rem]"
            >
              <span className="font-mono text-[11px] uppercase tracking-wider text-accent">{i.kind}</span>
              <span>
                {i.who && <span className="font-mono text-xs">{shortAddr(i.who)} </span>}
                <span className="text-muted">{i.label}</span>
              </span>
              <span className="hidden font-mono text-xs md:block">{amt}</span>
              <span className="text-right font-mono text-[11px] text-muted">{ago(i.ts)}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}