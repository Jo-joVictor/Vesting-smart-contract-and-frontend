import { Eyebrow } from "@/components/ui";
import { fmtEth, pctOf } from "@/lib/format";
import type { PresaleData } from "@/hooks/usePresale";

export function SaleProgress({ p }: { p: PresaleData }) {
  const pct = pctOf(p.totalRaised, p.hardCap);
  const softPct = pctOf(p.softCap, p.hardCap);
  const remaining =
    p.hardCap !== undefined && p.totalRaised !== undefined ? p.hardCap - p.totalRaised : undefined;
  const softReached = p.totalRaised !== undefined && p.softCap !== undefined && p.totalRaised >= p.softCap;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <Eyebrow>Amount raised</Eyebrow>
          <p className="mt-2 text-5xl font-light tracking-tight md:text-7xl">{fmtEth(p.totalRaised)} ETH</p>
        </div>
        <div className="text-right">
          <Eyebrow>Hard cap</Eyebrow>
          <p className="mt-2 text-2xl font-light tracking-tight md:text-4xl">{fmtEth(p.hardCap)} ETH</p>
        </div>
      </div>

      <div className="relative mt-6 h-[3px] w-full bg-rule">
        <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
        <div
          className="absolute -top-[5px] h-[13px] w-px bg-ink"
          style={{ left: `${softPct}%` }}
          title={`Soft cap ${fmtEth(p.softCap)} ETH`}
        />
      </div>

      <div className="mt-3 flex flex-wrap justify-between gap-2">
        <Eyebrow>
          {pct.toFixed(1)}% of hard cap · Soft cap {fmtEth(p.softCap)} ETH {softReached ? "· reached" : ""}
        </Eyebrow>
        <Eyebrow>{fmtEth(remaining)} ETH remaining</Eyebrow>
      </div>
    </div>
  );
}