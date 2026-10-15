"use client";

import { Eyebrow } from "./ui";
import { ALLOCATIONS } from "@/lib/tokenomics";
import { useProtocolStats } from "@/hooks/useProtocolStats";
import { fmtToken } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AllocationCards() {
  const { totalSupply } = useProtocolStats();

  return (
    <div>
      {/* proportional bar */}
      <div className="flex gap-1" role="img" aria-label="Allocation: 40% presale, 30% staking, 30% treasury">
        {ALLOCATIONS.map((a) => (
          <div key={a.id} className={cn("h-[5px]", a.bar)} style={{ flex: a.pct }} />
        ))}
      </div>

      <div className="mt-8 grid gap-10 md:grid-cols-3">
        {ALLOCATIONS.map((a) => {
          const amount = totalSupply !== undefined ? (totalSupply * BigInt(a.pct)) / 100n : undefined;
          return (
            <article key={a.id}>
              <Eyebrow>
                {a.index} / {a.phase}
              </Eyebrow>
              <p className={cn("mt-8 text-[clamp(4rem,9vw,7rem)] font-light leading-none tracking-tight", a.text)}>
                {a.pct}%
              </p>
              <h3 className="mt-8 text-3xl tracking-tight">{a.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{a.body}</p>
              <p className="mt-5 font-mono text-xs">{fmtToken(amount, 0)} NXR</p>
              <Eyebrow className="mt-3">{a.tags}</Eyebrow>
            </article>
          );
        })}
      </div>

      <div className="mt-10 flex justify-between border-t border-rule pt-4">
        <Eyebrow>Total allocation / 100%</Eyebrow>
        <Eyebrow>Percentages of total supply · No token price implied</Eyebrow>
      </div>
    </div>
  );
}