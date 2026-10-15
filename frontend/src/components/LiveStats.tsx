"use client";

import { Container, Eyebrow } from "./ui";
import { useProtocolStats } from "@/hooks/useProtocolStats";
import { fmtBps, fmtEth, fmtToken } from "@/lib/format";
import { TARGET_CHAIN } from "@/lib/config";

export function LiveStats() {
  const s = useProtocolStats();

  const items: [string, string][] = [
    ["Total supply", `${fmtToken(s.totalSupply, 0)} NXR`],
    ["Presale raised", `${fmtEth(s.totalRaised)} / ${fmtEth(s.hardCap)} ETH`],
    ["Total staked", `${fmtToken(s.totalStaked, 0)} NXR`],
    ["Staking APR", fmtBps(s.aprBps)],
  ];

  return (
    <section className="border-y border-rule">
      <Container>
        <div className="flex items-center justify-between pt-6">
          <Eyebrow>Live on-chain · {TARGET_CHAIN.name}</Eyebrow>
        </div>
        <div className="grid grid-cols-2 gap-y-8 py-8 md:grid-cols-4">
          {items.map(([label, value]) => (
            <div key={label}>
              <Eyebrow>{label}</Eyebrow>
              <p className="mt-2 text-xl tracking-tight md:text-2xl">{value}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** "FIXED BOUNDARY / 0.25 ETH HARD CAP", read live from the presale contract. */
export function HardCapTag() {
  const { hardCap } = useProtocolStats();
  return <>Fixed boundary / {fmtEth(hardCap)} ETH hard cap</>;
}