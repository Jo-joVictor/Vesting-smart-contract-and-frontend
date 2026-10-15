import { Eyebrow, ProgressBar } from "@/components/ui";
import { fmtEth, fmtToken, pctOf } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PresaleData } from "@/hooks/usePresale";

const ONE = 10n ** 18n;

export function StageTable({ p }: { p: PresaleData }) {
  const activeIndex = p.stages.findIndex((s) => s && s.sold < s.allocation);

  return (
    <div className="border-t border-rule">
      <div className="hidden grid-cols-[0.6fr_1.2fr_1.2fr_2fr_0.8fr] gap-6 border-b border-rule py-3 md:grid">
        {["Stage", "Price", "Allocation", "Sold", "Status"].map((h) => (
          <Eyebrow key={h}>{h}</Eyebrow>
        ))}
      </div>

      {p.stages.map((s, i) => {
        const soldOut = s ? s.sold >= s.allocation : false;
        const status = !s ? "—" : soldOut ? "Sold out" : i === activeIndex ? "Active" : "Upcoming";
        const perEth = s && s.priceWei > 0n ? (ONE * ONE) / s.priceWei : undefined;

        return (
          <div
            key={i}
            className="grid gap-3 border-b border-rule py-5 md:grid-cols-[0.6fr_1.2fr_1.2fr_2fr_0.8fr] md:items-center md:gap-6"
          >
            <p className="text-lg">Stage {i + 1}</p>
            <div>
              <p className="font-mono text-sm">{fmtEth(s?.priceWei, 10)} ETH</p>
              <p className="font-mono text-[11px] text-muted">{fmtToken(perEth, 0)} NXR per ETH</p>
            </div>
            <p className="font-mono text-sm">{fmtToken(s?.allocation, 0)} NXR</p>
            <div>
              <ProgressBar value={pctOf(s?.sold, s?.allocation)} />
              <p className="mt-2 font-mono text-[11px] text-muted">
                {fmtToken(s?.sold, 0)} / {fmtToken(s?.allocation, 0)}
              </p>
            </div>
            <p
              className={cn(
                "font-mono text-xs uppercase tracking-wider",
                status === "Active" ? "text-accent" : "text-muted"
              )}
            >
              {status}
            </p>
          </div>
        );
      })}
    </div>
  );
}