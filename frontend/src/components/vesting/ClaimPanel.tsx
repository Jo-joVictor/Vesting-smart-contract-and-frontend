"use client";

import { useAccount, useWriteContract } from "wagmi";
import { ActionButton } from "@/components/ActionButton";
import { TxStatus } from "@/components/TxStatus";
import { ArrowLink, Eyebrow } from "@/components/ui";
import { useTx } from "@/hooks/useTx";
import { getVestingPhase, type VestingData } from "@/hooks/useVesting";
import { vestingAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";
import { fmtToken, pctOf } from "@/lib/format";

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <p className={`mt-2 text-2xl font-light tracking-tight md:text-3xl ${accent ? "text-accent" : ""}`}>
        {value} <span className="font-mono text-xs text-muted">NXR</span>
      </p>
    </div>
  );
}

export function ClaimPanel({ d }: { d: VestingData }) {
  const { isConnected } = useAccount();
  const tx = useTx();
  const { writeContractAsync } = useWriteContract();
  const phase = getVestingPhase(d);

  const claim = () =>
    tx.run(() =>
      writeContractAsync({
        address: ADDRESSES.vesting,
        abi: vestingAbi,
        functionName: "claim",
        chainId: TARGET_CHAIN.id,
      })
    );

  // Disconnected: ActionButton renders "Connect Wallet →" on its own.
  if (!isConnected) {
    return (
      <div className="grid items-center gap-6 border-y border-accent py-6 md:grid-cols-[1fr_auto_1fr_auto]">
        <div>
          <Eyebrow>Your NXR allocation</Eyebrow>
          <p className="mt-2 text-2xl text-muted">Connect to view allocation</p>
        </div>
        <span className="hidden text-2xl text-accent md:block" aria-hidden>→</span>
        <div>
          <Eyebrow>Available to claim</Eyebrow>
          <p className="mt-2 text-2xl text-muted">Connect to view claimable NXR</p>
        </div>
        <ActionButton label="Claim" onClick={() => {}} />
      </div>
    );
  }

  const purchased = d.purchased ?? 0n;
  const claimed = d.claimed ?? 0n;
  const vested = d.vested ?? 0n;
  const claimable = d.claimable ?? 0n;

  if (d.purchased !== undefined && purchased === 0n) {
    return (
      <div className="max-w-2xl">
        <p className="text-2xl tracking-tight">This wallet has no presale allocation.</p>
        <p className="mt-3 text-muted">
          Only wallets that bought in the presale have something to vest. Check you&apos;re connected with the
          wallet you used to participate.
        </p>
        <div className="mt-6">
          <ArrowLink href="/presale">View the presale</ArrowLink>
        </div>
      </div>
    );
  }

  const claimedPct = pctOf(claimed, purchased);
  const vestedPct = pctOf(vested, purchased);
  const claimablePct = Math.max(0, vestedPct - claimedPct);
  const underfunded = d.vaultBalance !== undefined && claimable > 0n && d.vaultBalance < claimable;

  const canClaim = phase === "active" && claimable > 0n && !underfunded;

  const label =
    phase === "pending"
      ? "Claim (opens after finalization)"
      : phase === "failed"
        ? "No vesting: sale failed"
        : claimable > 0n
          ? `Claim ${fmtToken(claimable)} NXR`
          : "Nothing to claim yet";

  const hint =
    phase === "pending"
      ? "Your allocation is recorded. Nothing unlocks until the presale ends and is finalized as successful."
      : phase === "failed"
        ? "The presale missed its soft cap, so nothing vests. Claim your ETH refund on the presale page."
        : undefined;

  return (
    <div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total allocation" value={fmtToken(purchased)} />
        <Stat label="Unlocked so far" value={fmtToken(vested)} />
        <Stat label="Already claimed" value={fmtToken(claimed)} />
        <Stat label="Available to claim" value={fmtToken(claimable)} accent />
      </div>

      <div className="mt-8">
        <div className="flex h-[6px] w-full overflow-hidden bg-rule">
          <div className="h-full bg-ink transition-[width] duration-500" style={{ width: `${claimedPct}%` }} />
          <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${claimablePct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted">
          <span className="flex items-center gap-2"><i className="inline-block h-2 w-2 bg-ink" /> Claimed</span>
          <span className="flex items-center gap-2"><i className="inline-block h-2 w-2 bg-accent" /> Claimable</span>
          <span className="flex items-center gap-2"><i className="inline-block h-2 w-2 bg-rule" /> Locked</span>
          <span className="ml-auto">{vestedPct.toFixed(1)}% unlocked</span>
        </div>
      </div>

      {hint && <p className="mt-6 max-w-xl text-sm text-muted">{hint}</p>}

      {underfunded && (
        <p className="mt-6 max-w-xl font-mono text-[11px] text-danger">
          The vesting contract currently holds fewer NXR than you can claim, so a claim would fail. The team needs
          to fund the vesting contract.
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <ActionButton
          label={label}
          disabled={!canClaim}
          loading={tx.busy}
          loadingLabel={tx.status === "signing" ? "Confirm in wallet…" : "Claiming…"}
          onClick={claim}
        />
        <TxStatus status={tx.status} hash={tx.hash} error={tx.error} />
      </div>
    </div>
  );
}