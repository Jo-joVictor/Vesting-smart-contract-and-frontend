"use client";

import { useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { formatEther, parseEther } from "viem";
import { ActionButton } from "@/components/ActionButton";
import { TxStatus } from "@/components/TxStatus";
import { Eyebrow } from "@/components/ui";
import { useTx } from "@/hooks/useTx";
import type { PresaleData } from "@/hooks/usePresale";
import { presaleAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";
import { fmtEth, fmtToken } from "@/lib/format";
import { cn } from "@/lib/utils";

const SLIPPAGE_OPTIONS = [50, 100, 300]; // bps
const GAS_RESERVE = parseEther("0.003");

const minBig = (a: bigint, b: bigint) => (a < b ? a : b);

function parseAmount(s: string): bigint | undefined {
  if (!s || !/^\d*\.?\d*$/.test(s)) return undefined;
  try {
    return parseEther(s);
  } catch {
    return undefined;
  }
}

export function BuyForm({ p }: { p: PresaleData }) {
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(100);
  const tx = useTx(() => setAmount(""));
  const { writeContractAsync } = useWriteContract();

  const value = parseAmount(amount);
  const { minContribution, maxContribution, hardCap, totalRaised } = p;

  const walletRemaining =
    maxContribution !== undefined ? maxContribution - (p.contributions ?? 0n) : undefined;
  const capRemaining = hardCap !== undefined && totalRaised !== undefined ? hardCap - totalRaised : undefined;

  // The contract clamps msg.value to the wallet's remaining allowance before quoting.
  const quoteInput =
    value !== undefined && walletRemaining !== undefined ? minBig(value, walletRemaining) : undefined;

  const { data: quoteData, isFetching } = useReadContract({
    address: ADDRESSES.presale,
    abi: presaleAbi,
    functionName: "quote",
    args: [quoteInput ?? 0n],
    chainId: TARGET_CHAIN.id,
    query: { enabled: !!quoteInput && quoteInput > 0n, refetchInterval: 15_000 },
  });

  const tokensOut = quoteInput && quoteInput > 0n ? quoteData?.[0] : undefined;
  const accepted = quoteInput && quoteInput > 0n ? quoteData?.[1] : undefined;
  const minOut = tokensOut !== undefined ? (tokensOut * BigInt(10_000 - slippageBps)) / 10_000n : undefined;
  const excess = value !== undefined && accepted !== undefined && value > accepted ? value - accepted : 0n;

  // Mirror the contract's validation so users see the reason before signing.
  let problem: string | undefined;
  if (walletRemaining === 0n) {
    problem = "You've reached the per-wallet contribution limit.";
  } else if (value !== undefined && value > 0n && accepted !== undefined && tokensOut !== undefined) {
    const capFill =
      accepted > 0n &&
      minContribution !== undefined &&
      value >= minContribution &&
      (accepted === capRemaining || accepted === walletRemaining);

    if (minContribution !== undefined && accepted < minContribution && !capFill) {
      problem = `Minimum contribution is ${fmtEth(minContribution, 6)} ETH.`;
    } else if (tokensOut === 0n) {
      problem = "That amount is too small to buy any tokens.";
    } else if (p.ethBalance !== undefined && value > p.ethBalance) {
      problem = "Insufficient ETH balance.";
    }
  }

  const ready = value !== undefined && value > 0n && accepted !== undefined && !problem && !isFetching;
  const blockedByPause = p.paused === true;

  const setMax = () => {
    if (walletRemaining === undefined) return;
    let v = walletRemaining;
    if (capRemaining !== undefined) v = minBig(v, capRemaining);
    if (p.ethBalance !== undefined) {
      const spendable = p.ethBalance > GAS_RESERVE ? p.ethBalance - GAS_RESERVE : 0n;
      v = minBig(v, spendable);
    }
    setAmount(formatEther(v));
  };

  const buy = () => {
    if (!ready || value === undefined || minOut === undefined) return;
    tx.reset();
    return tx.run(() =>
      writeContractAsync({
        address: ADDRESSES.presale,
        abi: presaleAbi,
        functionName: "buy",
        args: [minOut],
        value,
        chainId: TARGET_CHAIN.id,
      })
    );
  };

  return (
    <div>
      <div className="grid items-end gap-6 border-y border-accent py-6 md:grid-cols-[1fr_auto_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <Eyebrow>You contribute</Eyebrow>
            <button
              type="button"
              onClick={setMax}
              className="font-mono text-[11px] uppercase tracking-wider text-accent hover:underline"
            >
              Max
            </button>
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(",", "."))}
              className="w-full bg-transparent text-4xl font-light tracking-tight outline-none placeholder:text-ink/25 md:text-5xl"
            />
            <span className="font-mono text-sm">ETH</span>
          </div>
        </div>

        <span className="hidden pb-3 text-2xl text-accent md:block" aria-hidden>
          →
        </span>

        <div>
          <Eyebrow>Estimated allocation</Eyebrow>
          <div className="mt-2 flex items-baseline gap-3">
            <p className="text-4xl font-light tracking-tight md:text-5xl">
              {tokensOut !== undefined ? fmtToken(tokensOut, 2) : "—"}
            </p>
            <span className="font-mono text-sm">NXR</span>
          </div>
        </div>
      </div>

      {/* Quote details */}
      <dl className="mt-5 grid gap-2 font-mono text-xs text-muted sm:grid-cols-2">
        <div className="flex justify-between gap-4">
          <dt>Your remaining limit</dt>
          <dd className="text-ink">{fmtEth(walletRemaining, 6)} ETH</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Wallet balance</dt>
          <dd className="text-ink">{fmtEth(p.ethBalance, 4)} ETH</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>ETH used</dt>
          <dd className="text-ink">{fmtEth(accepted, 6)} ETH</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Minimum received</dt>
          <dd className="text-ink">{fmtToken(minOut, 2)} NXR</dd>
        </div>
        {excess > 0n && (
          <div className="flex justify-between gap-4 sm:col-span-2">
            <dt>Excess ETH returned to you</dt>
            <dd className="text-ink">{fmtEth(excess, 6)} ETH</dd>
          </div>
        )}
      </dl>

      {/* Slippage */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Eyebrow>Slippage tolerance</Eyebrow>
        {SLIPPAGE_OPTIONS.map((bps) => (
          <button
            key={bps}
            type="button"
            onClick={() => setSlippageBps(bps)}
            className={cn(
              "rounded-[3px] border px-3 py-1 font-mono text-xs",
              slippageBps === bps ? "border-accent bg-accent text-white" : "border-ink/20 hover:border-ink"
            )}
          >
            {bps / 100}%
          </button>
        ))}
      </div>

      {problem && <p className="mt-4 font-mono text-[11px] text-danger">{problem}</p>}
      {blockedByPause && (
        <p className="mt-4 font-mono text-[11px] text-danger">Purchases are temporarily paused by the owner.</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <ActionButton
          label="Buy NXR"
          onClick={buy}
          disabled={!ready || blockedByPause}
          loading={tx.busy}
          loadingLabel={tx.status === "signing" ? "Confirm in wallet…" : "Confirming…"}
        />
        <TxStatus status={tx.status} hash={tx.hash} error={tx.error} />
      </div>

      <p className="mt-6 max-w-xl text-sm text-muted">
        Network fees are separate. Prices step up as each stage sells out, and the quote above is read from the
        contract. If the price moves against you by more than your slippage setting, the transaction reverts instead
        of filling.
      </p>
    </div>
  );
}