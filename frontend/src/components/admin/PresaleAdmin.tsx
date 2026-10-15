"use client";

import { useWriteContract } from "wagmi";
import { ActionButton } from "@/components/ActionButton";
import { TxStatus } from "@/components/TxStatus";
import { useTx } from "@/hooks/useTx";
import type { AdminData } from "@/hooks/useAdmin";
import { presaleAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";
import { fmtEth, fmtToken } from "@/lib/format";
import { AdminCard, Block, PauseControl, Stat } from "./parts";

export function PresaleAdmin({ a }: { a: AdminData }) {
  const p = a.presale;
  const tx = useTx();
  const { writeContractAsync } = useWriteContract();

  const canWithdraw = p.finalized === true && p.successful === true && (p.ethBalance ?? 0n) > 0n;
  const reason =
    p.finalized !== true
      ? "The sale must be finalized first."
      : p.successful !== true
        ? "The sale failed, so ETH stays in the contract for buyer refunds."
        : (p.ethBalance ?? 0n) === 0n
          ? "Nothing left to withdraw."
          : "";

  return (
    <AdminCard
      title="Presale"
      address={ADDRESSES.presale}
      owner={p.owner}
      isOwner={p.isOwner}
      connected={a.connected}
    >
      <div className="grid gap-8 sm:grid-cols-3">
        <Stat label="ETH held" value={fmtEth(p.ethBalance, 4)} unit="ETH" />
        <Stat label="NXR sold" value={fmtToken(p.totalSold, 0)} unit="NXR" />
        <Stat
          label="State"
          value={p.finalized === undefined ? "—" : !p.finalized ? "Not finalized" : p.successful ? "Successful" : "Failed"}
        />
      </div>

      <Block
        title="Withdraw proceeds"
        desc="Sends the contract's entire ETH balance to the owner. Only possible after a successful finalization."
      >
        {reason && <p className="font-mono text-[11px] text-muted">{reason}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <ActionButton
            variant="dark"
            label={`Withdraw ${fmtEth(p.ethBalance, 4)} ETH`}
            disabled={!p.isOwner || !canWithdraw}
            loading={tx.busy}
            onClick={() =>
              tx.run(() =>
                writeContractAsync({
                  address: ADDRESSES.presale,
                  abi: presaleAbi,
                  functionName: "withdrawProceeds",
                  chainId: TARGET_CHAIN.id,
                })
              )
            }
          />
          <TxStatus status={tx.status} hash={tx.hash} error={tx.error} />
        </div>
      </Block>

      <PauseControl target="presale" paused={p.paused} isOwner={p.isOwner} />
    </AdminCard>
  );
}