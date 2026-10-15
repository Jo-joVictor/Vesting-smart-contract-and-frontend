"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";
import { formatUnits, isAddress } from "viem";
import { ActionButton } from "@/components/ActionButton";
import { TxStatus } from "@/components/TxStatus";
import { useTx } from "@/hooks/useTx";
import type { AdminData } from "@/hooks/useAdmin";
import { vestingAbi } from "@/lib/abis";
import { ADDRESSES, TARGET_CHAIN } from "@/lib/config";
import { fmtToken } from "@/lib/format";
import { AdminCard, AmountField, Block, FundForm, Stat, parseAmt } from "./parts";

export function VestingAdmin({ a }: { a: AdminData }) {
  const v = a.vesting;
  const finalized = a.presale.finalized === true;

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const tx = useTx(() => setAmount(""));
  const { writeContractAsync } = useWriteContract();

  const to = recipient || a.address || "";
  const value = parseAmt(amount);
  const validTo = isAddress(to);
  const tooMuch = value !== undefined && value > v.rescuable;
  const valid = validTo && value !== undefined && value > 0n && !tooMuch && finalized;

  return (
    <AdminCard
      title="Vesting"
      address={ADDRESSES.vesting}
      owner={v.owner}
      isOwner={v.isOwner}
      connected={a.connected}
    >
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Held by contract" value={fmtToken(v.balance, 0)} unit="NXR" />
        <Stat label="Still owed to buyers" value={fmtToken(v.stillOwed, 0)} unit="NXR" />
        <Stat label="Claimed so far" value={fmtToken(v.totalClaimed, 0)} unit="NXR" />
        <Stat label="Rescuable (unsold)" value={fmtToken(v.rescuable, 0)} unit="NXR" />
      </div>

      <FundForm
        to={ADDRESSES.vesting}
        title="Fund vesting"
        desc="Buyers claim from this contract's own balance, so it must hold at least what buyers are owed. If it is short, claims revert."
        suggested={v.shortfall}
        suggestedLabel="Shortfall to cover buyers"
        walletBalance={a.walletNxr}
      />

      <Block
        title="Rescue unsold tokens"
        desc="Moves tokens that no buyer is owed out of the vesting contract. After a failed sale nothing is owed, so everything is rescuable. Only available once the sale is finalized."
      >
        {!finalized && (
          <p className="font-mono text-[11px] text-muted">Available after the presale is finalized.</p>
        )}
        <input
          placeholder={a.address ? `Recipient (defaults to ${a.address.slice(0, 8)}…)` : "Recipient address 0x…"}
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.trim())}
          className="w-full border-b border-ink/30 bg-transparent pb-2 font-mono text-sm outline-none placeholder:text-ink/30"
        />
        <AmountField
          value={amount}
          onChange={setAmount}
          onMax={() => setAmount(formatUnits(v.rescuable, 18))}
        />
        {recipient && !validTo && <p className="font-mono text-[11px] text-danger">Not a valid address.</p>}
        {tooMuch && (
          <p className="font-mono text-[11px] text-danger">
            Exceeds the rescuable amount ({fmtToken(v.rescuable)} NXR). Buyers are still owed the rest.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <ActionButton
            variant="dark"
            label="Rescue tokens"
            disabled={!v.isOwner || !valid}
            loading={tx.busy}
            onClick={() =>
              value !== undefined &&
              tx.run(() =>
                writeContractAsync({
                  address: ADDRESSES.vesting,
                  abi: vestingAbi,
                  functionName: "rescueUnsold",
                  args: [to as `0x${string}`, value],
                  chainId: TARGET_CHAIN.id,
                })
              )
            }
          />
          <TxStatus status={tx.status} hash={tx.hash} error={tx.error} />
        </div>
      </Block>
    </AdminCard>
  );
}