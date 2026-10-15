"use client";

import { useWriteContract } from "wagmi";
import { ActionButton } from "@/components/ActionButton";
import { TxStatus } from "@/components/TxStatus";
import { ArrowLink, Eyebrow } from "@/components/ui";
import { useTx } from "@/hooks/useTx";
import type { PresaleData } from "@/hooks/usePresale";
import { presaleAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";
import { fmtDate, fmtEth, fmtToken } from "@/lib/format";

export function Finalize({ p }: { p: PresaleData }) {
  const tx = useTx();
  const { writeContractAsync } = useWriteContract();

  const reachedSoft = p.totalRaised !== undefined && p.softCap !== undefined && p.totalRaised >= p.softCap;

  return (
    <div className="max-w-2xl">
      <Eyebrow>Sale closed</Eyebrow>
      <p className="mt-3 text-2xl tracking-tight">The sale has ended and is waiting to be finalized.</p>
      <p className="mt-3 text-muted">
        Anyone can finalize. The sale was{" "}
        <span className="text-ink">{reachedSoft ? "above" : "below"}</span> its soft cap of {fmtEth(p.softCap)} ETH
        ({fmtEth(p.totalRaised)} ETH raised), so finalizing will{" "}
        {reachedSoft
          ? "mark it successful and start vesting for all buyers."
          : "mark it unsuccessful and open refunds for all buyers."}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <ActionButton
          label="Finalize sale"
          loading={tx.busy}
          onClick={() =>
            tx.run(() =>
              writeContractAsync({
                address: ADDRESSES.presale,
                abi: presaleAbi,
                functionName: "finalize",
                chainId: TARGET_CHAIN.id,
              })
            )
          }
        />
        <TxStatus status={tx.status} hash={tx.hash} error={tx.error} />
      </div>
    </div>
  );
}

export function Refund({ p }: { p: PresaleData }) {
  const tx = useTx();
  const { writeContractAsync } = useWriteContract();
  const owed = p.contributions ?? 0n;

  return (
    <div className="max-w-2xl">
      <Eyebrow>Soft cap not reached</Eyebrow>
      <p className="mt-3 text-2xl tracking-tight">This sale did not succeed. Contributions are refundable.</p>
      <p className="mt-3 text-muted">
        {owed > 0n ? (
          <>
            You can reclaim <span className="font-mono text-ink">{fmtEth(owed, 6)} ETH</span> in full.
          </>
        ) : (
          "Connect the wallet you used to participate to see whether you have a refund waiting."
        )}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <ActionButton
          label="Claim refund"
          disabled={owed === 0n}
          loading={tx.busy}
          onClick={() =>
            tx.run(() =>
              writeContractAsync({
                address: ADDRESSES.presale,
                abi: presaleAbi,
                functionName: "claimRefund",
                chainId: TARGET_CHAIN.id,
              })
            )
          }
        />
        <TxStatus status={tx.status} hash={tx.hash} error={tx.error} />
      </div>
    </div>
  );
}

export function SaleSuccess({ p }: { p: PresaleData }) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>Sale successful</Eyebrow>
      <p className="mt-3 text-2xl tracking-tight">The presale is complete and vesting has started.</p>
      <p className="mt-3 text-muted">
        Token generation was recorded on {p.tgeTime ? fmtDate(p.tgeTime) : "—"}.
        {p.purchased !== undefined && p.purchased > 0n && (
          <>
            {" "}
            You bought <span className="font-mono text-ink">{fmtToken(p.purchased)} NXR</span>. Follow your unlocks
            and claim from the vesting page.
          </>
        )}
      </p>
      <div className="mt-6">
        <ArrowLink href="/vesting">Go to Vesting Dashboard</ArrowLink>
      </div>
    </div>
  );
}