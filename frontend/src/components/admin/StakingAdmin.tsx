"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";
import { formatUnits } from "viem";
import { ActionButton } from "@/components/ActionButton";
import { TxStatus } from "@/components/TxStatus";
import { useTx } from "@/hooks/useTx";
import type { AdminData } from "@/hooks/useAdmin";
import { stakingAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";
import { fmtDuration, fmtToken } from "@/lib/format";
import { AdminCard, AmountField, Block, FundForm, PauseControl, Stat, parseAmt } from "./parts";

export function StakingAdmin({ a }: { a: AdminData }) {
  const s = a.staking;
  const [amount, setAmount] = useState("");
  const tx = useTx(() => setAmount(""));
  const { writeContractAsync } = useWriteContract();

  const value = parseAmt(amount);
  const fits = value !== undefined && value > 0n && value <= s.uncommitted;
  const shortfall = value !== undefined && value > s.uncommitted ? value - s.uncommitted : 0n;
  const tooSmall =
    value !== undefined && s.duration !== undefined && s.duration > 0n && value > 0n && value < s.duration;

  return (
    <AdminCard
      title="Staking"
      address={ADDRESSES.staking}
      owner={s.owner}
      isOwner={s.isOwner}
      connected={a.connected}
    >
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Contract balance" value={fmtToken(s.balance, 0)} unit="NXR" />
        <Stat label="Staked principal" value={fmtToken(s.totalStaked, 0)} unit="NXR" />
        <Stat label="Owed to stakers" value={fmtToken(s.outstanding, 2)} unit="NXR" />
        <Stat label="Uncommitted rewards" value={fmtToken(s.uncommitted, 2)} unit="NXR" />
      </div>

      <FundForm
        to={ADDRESSES.staking}
        title="1 · Fund rewards"
        desc="Send NXR into the staking contract first. notifyRewardAmount refuses to start a period that isn't fully backed, and staked principal never counts as reward funding."
        suggested={shortfall}
        suggestedLabel="Shortfall for the amount below"
        walletBalance={a.walletNxr}
      />

      <Block
        title="2 · Start a reward period"
        desc={`Streams the amount evenly over ${s.duration ? fmtDuration(s.duration) : "the rewards duration"}. If a period is still running, its unpaid remainder is rolled into the new one and the clock restarts.`}
      >
        <AmountField
          value={amount}
          onChange={setAmount}
          onMax={() => setAmount(formatUnits(s.uncommitted, 18))}
        />
        <p className="font-mono text-[11px] text-muted">
          Available to commit: {fmtToken(s.uncommitted, 2)} NXR
        </p>
        {value !== undefined && value > s.uncommitted && (
          <p className="font-mono text-[11px] text-danger">
            Not enough uncommitted NXR in the contract. Send {fmtToken(shortfall, 2)} NXR more in step 1.
          </p>
        )}
        {tooSmall && (
          <p className="font-mono text-[11px] text-danger">
            Amount is smaller than the duration in seconds, so the reward rate would round to zero.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <ActionButton
            variant="dark"
            label="Start reward period"
            disabled={!s.isOwner || !fits || tooSmall}
            loading={tx.busy}
            onClick={() =>
              value !== undefined &&
              tx.run(() =>
                writeContractAsync({
                  address: ADDRESSES.staking,
                  abi: stakingAbi,
                  functionName: "notifyRewardAmount",
                  args: [value],
                  chainId: TARGET_CHAIN.id,
                })
              )
            }
          />
          <TxStatus status={tx.status} hash={tx.hash} error={tx.error} />
        </div>
      </Block>

      <PauseControl target="staking" paused={s.paused} isOwner={s.isOwner} />
    </AdminCard>
  );
}