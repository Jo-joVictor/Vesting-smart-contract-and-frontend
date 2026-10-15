"use client";

import { useState, type ReactNode } from "react";
import { useWriteContract } from "wagmi";
import { formatUnits, parseUnits, type Address } from "viem";
import { ActionButton } from "@/components/ActionButton";
import { TxStatus } from "@/components/TxStatus";
import { Eyebrow, H2 } from "@/components/ui";
import { useTx } from "@/hooks/useTx";
import { presaleAbi, stakingAbi, tokenAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN, explorerAddress } from "@/lib/config";
import { fmtToken, shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

export function parseAmt(s: string): bigint | undefined {
  if (!s || !/^\d*\.?\d*$/.test(s) || s === ".") return undefined;
  try {
    return parseUnits(s, 18);
  } catch {
    return undefined;
  }
}

export function AdminCard({
  title,
  address,
  owner,
  isOwner,
  connected,
  children,
}: {
  title: string;
  address: Address;
  owner?: Address;
  isOwner: boolean;
  connected: boolean;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-rule py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <H2 className="!text-3xl md:!text-4xl">{title}</H2>
          <a
            href={explorerAddress(address)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block font-mono text-[11px] text-accent underline"
          >
            {shortAddr(address)} ↗
          </a>
        </div>
        <div className="text-right">
          <Eyebrow>Owner</Eyebrow>
          <p className="mt-1 font-mono text-xs">{owner ? shortAddr(owner) : "—"}</p>
          <p
            className={cn(
              "mt-1 font-mono text-[11px] uppercase tracking-wider",
              isOwner ? "text-emerald-700" : "text-danger"
            )}
          >
            {!connected ? "Connect wallet" : isOwner ? "You are the owner" : "Not the owner · read-only"}
          </p>
        </div>
      </div>
      <div className="mt-8 space-y-10">{children}</div>
    </section>
  );
}

export function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <p className="mt-2 text-xl font-light tracking-tight md:text-2xl">
        {value} {unit && <span className="font-mono text-xs text-muted">{unit}</span>}
      </p>
    </div>
  );
}

export function Block({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
      <div>
        <h3 className="text-lg">{title}</h3>
        {desc && <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function AmountField({
  value,
  onChange,
  onMax,
  unit = "NXR",
  placeholder = "0",
}: {
  value: string;
  onChange: (v: string) => void;
  onMax?: () => void;
  unit?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex items-baseline gap-3 border-b border-ink/30 pb-2">
      <input
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(",", "."))}
        className="w-full bg-transparent text-2xl font-light tracking-tight outline-none placeholder:text-ink/25"
      />
      {onMax && (
        <button
          type="button"
          onClick={onMax}
          className="font-mono text-[11px] uppercase tracking-wider text-accent hover:underline"
        >
          Max
        </button>
      )}
      <span className="font-mono text-sm">{unit}</span>
    </div>
  );
}

/** pause() / unpause() for presale or staking. */
export function PauseControl({
  target,
  paused,
  isOwner,
}: {
  target: "presale" | "staking";
  paused?: boolean;
  isOwner: boolean;
}) {
  const tx = useTx();
  const { writeContractAsync } = useWriteContract();

  const send = (fn: "pause" | "unpause") => {
    if (target === "presale") {
      return writeContractAsync({
        address: ADDRESSES.presale,
        abi: presaleAbi,
        functionName: fn,
        chainId: TARGET_CHAIN.id,
      });
    }
    return writeContractAsync({
      address: ADDRESSES.staking,
      abi: stakingAbi,
      functionName: fn,
      chainId: TARGET_CHAIN.id,
    });
  };

  return (
    <Block
      title="Pause"
      desc={
        target === "presale"
          ? "Pausing blocks new purchases only. Finalize, refunds and withdrawals keep working."
          : "Pausing blocks new stakes only. Unstake, claim and exit keep working."
      }
    >
      <p className="font-mono text-xs">
        Status:{" "}
        <span className={paused ? "text-danger" : "text-emerald-700"}>
          {paused === undefined ? "—" : paused ? "Paused" : "Active"}
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <ActionButton
          variant={paused ? "accent" : "outline"}
          label={paused ? "Unpause" : "Pause"}
          disabled={!isOwner || paused === undefined}
          loading={tx.busy}
          onClick={() => tx.run(() => send(paused ? "unpause" : "pause"))}
        />
        <TxStatus status={tx.status} hash={tx.hash} error={tx.error} />
      </div>
    </Block>
  );
}

/** Plain ERC-20 transfer from the connected wallet into a protocol contract. */
export function FundForm({
  to,
  title,
  desc,
  suggested,
  suggestedLabel,
  walletBalance,
}: {
  to: Address;
  title: string;
  desc: string;
  suggested?: bigint;
  suggestedLabel: string;
  walletBalance?: bigint;
}) {
  const [amount, setAmount] = useState("");
  const tx = useTx(() => setAmount(""));
  const { writeContractAsync } = useWriteContract();

  const value = parseAmt(amount);
  const tooMuch = value !== undefined && walletBalance !== undefined && value > walletBalance;
  const valid = value !== undefined && value > 0n && !tooMuch;

  return (
    <Block title={title} desc={desc}>
      <AmountField value={amount} onChange={setAmount} onMax={() => walletBalance !== undefined && setAmount(formatUnits(walletBalance, 18))} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
        <span>Your wallet: {fmtToken(walletBalance)} NXR</span>
        {suggested !== undefined && suggested > 0n && (
          <button
            type="button"
            className="text-accent underline"
            onClick={() => setAmount(formatUnits(suggested, 18))}
          >
            {suggestedLabel}: {fmtToken(suggested)} NXR
          </button>
        )}
      </div>
      {tooMuch && <p className="font-mono text-[11px] text-danger">Amount exceeds your NXR balance.</p>}
      <div className="flex flex-wrap items-center gap-4">
        <ActionButton
          variant="dark"
          label="Send NXR"
          disabled={!valid}
          loading={tx.busy}
          onClick={() =>
            value !== undefined &&
            tx.run(() =>
              writeContractAsync({
                address: ADDRESSES.token,
                abi: tokenAbi,
                functionName: "transfer",
                args: [to, value],
                chainId: TARGET_CHAIN.id,
              })
            )
          }
        />
        <TxStatus status={tx.status} hash={tx.hash} error={tx.error} />
      </div>
    </Block>
  );
}