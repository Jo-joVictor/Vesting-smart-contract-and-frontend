"use client";

import { InfoRows } from "./ui";
import { useProtocolStats } from "@/hooks/useProtocolStats";
import { fmtToken, pctOf } from "@/lib/format";

export function OnChainCheck() {
  const s = useProtocolStats();

  const presalePct = pctOf(s.presaleAllocation, s.totalSupply);
  const stakingPoolTarget = s.totalSupply !== undefined ? (s.totalSupply * 30n) / 100n : undefined;
  const stakingPct = pctOf(s.rewardsCommitted, stakingPoolTarget);

  return (
    <InfoRows
      items={[
        {
          q: "Presale allocation",
          a: (
            <span>
              <span className="font-mono text-ink">{fmtToken(s.presaleAllocation, 0)} NXR</span> configured in the
              presale contract, which is {presalePct.toFixed(1)}% of total supply. Sold so far:{" "}
              <span className="font-mono text-ink">{fmtToken(s.totalSold, 0)} NXR</span>.
            </span>
          ),
        },
        {
          q: "Staking rewards funded",
          a: (
            <span>
              <span className="font-mono text-ink">{fmtToken(s.rewardsCommitted, 0)} NXR</span> committed to reward
              periods so far, {stakingPct.toFixed(1)}% of the 30% staking pool. Rewards are funded in stages, not
              all at once.
            </span>
          ),
        },
        {
          q: "Currently staked",
          a: (
            <span>
              <span className="font-mono text-ink">{fmtToken(s.totalStaked, 0)} NXR</span> is staked by participants
              right now.
            </span>
          ),
        },
      ]}
    />
  );
}