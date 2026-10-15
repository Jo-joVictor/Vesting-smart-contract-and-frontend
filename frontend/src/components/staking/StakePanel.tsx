"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { ActionButton } from "@/components/ActionButton";
import { TxStatus } from "@/components/TxStatus";
import { Eyebrow } from "@/components/ui";
import { useTx } from "@/hooks/useTx";
import type { StakingData } from "@/hooks/useStaking";
import { stakingAbi, tokenAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";
import { fmtToken, pctOf } from "@/lib/format";
import { cn } from "@/lib/utils";

type Mode = "stake" | "unstake";

function parseAmount(s: string): bigint | undefined {
  if (!s || !/^\d*\.?\d*$/.test(s) || s === ".") return undefined;
  try {
    return parseUnits(s, 18);
  } catch {
    return undefined;
  }
}

export function StakePanel({ d, rewardsActive }: { d: StakingData; rewardsActive: boolean }) {
  const { isConnected } = useAccount();
  const [mode, setMode] = useState<Mode>("stake");
  const [amount, setAmount] = useState("");
  const { writeContractAsync } = useWriteContract();

  const approveTx = useTx();
  const actionTx = useTx(() => setAmount(""));
  const claimTx = useTx();
  const exitTx = useTx();

  const value = parseAmount(amount);
  const wallet = d.walletBalance ?? 0n;
  const staked = d.staked ?? 0n;
  const earned = d.earned ?? 0n;
  const allowance = d.allowance ?? 0n;

  const max = mode === "stake" ? wallet : staked;
  const needsApproval = mode === "stake" && value !== undefined && value > 0n && value > allowance;

  let problem: string | undefined;
  if (value !== undefined && value > 0n && value > max) {
    problem = mode === "stake" ? "Amount exceeds your available NXR balance." : "Amount exceeds your staked balance.";
  }
  const stakePaused = mode === "stake" && d.paused === true;
  const valid = value !== undefined && value > 0n && !problem;

  const share = pctOf(staked, d.totalStaked);
  const perDay =
    rewardsActive && d.totalStaked && d.totalStaked > 0n && d.rewardRate !== undefined
      ? (staked * d.rewardRate * 86_400n) / d.totalStaked
      : undefined;

  const switchMode = (m: Mode) => {
    setMode(m);
    setAmount("");
    approveTx.reset();
    actionTx.reset();
  };

  const approve = () => {
    if (!valid || value === undefined) return;
    actionTx.reset();
    return approveTx.run(() =>
      writeContractAsync({
        address: ADDRESSES.token,
        abi: tokenAbi,
        functionName: "approve",
        args: [ADDRESSES.staking, value],
        chainId: TARGET_CHAIN.id,
      })
    );
  };

  const submit = () => {
    if (!valid || value === undefined) return;
    approveTx.reset();
    return actionTx.run(() =>
      writeContractAsync({
        address: ADDRESSES.staking,
        abi: stakingAbi,
        functionName: mode === "stake" ? "stake" : "withdraw",
        args: [value],
        chainId: TARGET_CHAIN.id,
      })
    );
  };

  return (
    <div>
      {/* Position */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Available in wallet", isConnected ? fmtToken(d.walletBalance) : "—", "NXR"],
          ["Your stake", isConnected ? fmtToken(d.staked) : "—", "NXR"],
          ["Pool share", isConnected ? `${share.toFixed(2)}` : "—", "%"],
          ["Rewards earned", isConnected ? fmtToken(d.earned, 4) : "—", "NXR"],
        ].map(([label, v, unit]) => (
          <div key={label}>
            <Eyebrow>{label}</Eyebrow>
            <p className="mt-2 text-2xl font-light tracking-tight md:text-3xl">
              {v} <span className="font-mono text-xs text-muted">{unit}</span>
            </p>
          </div>
        ))}
      </div>
      {perDay !== undefined && perDay > 0n && (
        <p className="mt-4 font-mono text-[11px] text-muted">
          ≈ {fmtToken(perDay, 4)} NXR per day at the current rate and pool size.
        </p>
      )}

      {/* Mode tabs */}
      <div className="mt-10 flex gap-6 border-b border-accent/40">
        {(["stake", "unstake"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={cn(
              "-mb-px border-b-2 pb-3 text-sm capitalize",
              mode === m ? "border-accent font-medium text-ink" : "border-transparent text-muted hover:text-ink"
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="grid items-end gap-6 border-b border-accent py-6 md:grid-cols-[1fr_auto]">
        <div>
          <div className="flex items-center justify-between">
            <Eyebrow>{mode === "stake" ? "Amount to stake" : "Amount to unstake"}</Eyebrow>
            <button
              type="button"
              disabled={!isConnected}
              onClick={() => setAmount(formatUnits(max, 18))}
              className="font-mono text-[11px] uppercase tracking-wider text-accent hover:underline disabled:opacity-40"
            >
              Max
            </button>
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <input
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(",", "."))}
              className="w-full bg-transparent text-4xl font-light tracking-tight outline-none placeholder:text-ink/25 md:text-5xl"
            />
            <span className="font-mono text-sm">NXR</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {needsApproval ? (
            <ActionButton
              label={`Approve ${fmtToken(value)} NXR`}
              onClick={approve}
              disabled={!valid}
              loading={approveTx.busy}
              loadingLabel={approveTx.status === "signing" ? "Confirm in wallet…" : "Approving…"}
            />
          ) : (
            <ActionButton
              label={mode === "stake" ? "Stake NXR" : "Unstake NXR"}
              onClick={submit}
              disabled={!valid || stakePaused}
              loading={actionTx.busy}
              loadingLabel={actionTx.status === "signing" ? "Confirm in wallet…" : "Confirming…"}
            />
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {problem && <p className="font-mono text-[11px] text-danger">{problem}</p>}
        {stakePaused && (
          <p className="font-mono text-[11px] text-danger">
            Staking is paused by the owner. Unstaking and claiming still work.
          </p>
        )}
        {needsApproval && (
          <p className="font-mono text-[11px] text-muted">
            Step 1 of 2: approve exactly this amount for the staking contract. Then press Stake.
          </p>
        )}
        <TxStatus status={approveTx.status} hash={approveTx.hash} error={approveTx.error} />
        <TxStatus status={actionTx.status} hash={actionTx.hash} error={actionTx.error} />
      </div>

      {/* Rewards */}
      <div className="mt-10 grid gap-6 border-t border-accent/40 pt-6 md:grid-cols-2">
        <div>
          <Eyebrow>Rewards</Eyebrow>
          <p className="mt-2 text-sm text-muted">
            Claim what you&apos;ve earned and keep your stake, or exit to withdraw everything in one transaction.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <ActionButton
            variant="dark"
            label={earned > 0n ? `Claim ${fmtToken(earned, 4)} NXR` : "No rewards yet"}
            disabled={earned === 0n}
            loading={claimTx.busy}
            onClick={() =>
              claimTx.run(() =>
                writeContractAsync({
                  address: ADDRESSES.staking,
                  abi: stakingAbi,
                  functionName: "getReward",
                  chainId: TARGET_CHAIN.id,
                })
              )
            }
          />
          <ActionButton
            variant="outline"
            label="Exit"
            disabled={staked === 0n && earned === 0n}
            loading={exitTx.busy}
            onClick={() =>
              exitTx.run(() =>
                writeContractAsync({
                  address: ADDRESSES.staking,
                  abi: stakingAbi,
                  functionName: "exit",
                  chainId: TARGET_CHAIN.id,
                })
              )
            }
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <TxStatus status={claimTx.status} hash={claimTx.hash} error={claimTx.error} />
          <TxStatus status={exitTx.status} hash={exitTx.hash} error={exitTx.error} />
        </div>
      </div>
    </div>
  );
}