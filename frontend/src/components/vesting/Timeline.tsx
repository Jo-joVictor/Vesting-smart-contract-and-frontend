import { Eyebrow } from "@/components/ui";
import { fmtDate, fmtDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VestingData } from "@/hooks/useVesting";

type Step = { label: string; title: string; desc: string; at?: number };

export function Timeline({ d, now }: { d: VestingData; now: number | null }) {
  const live = d.finalized && d.successful && d.tgeTime !== undefined && d.tgeTime > 0n;
  const tge = live ? Number(d.tgeTime) : undefined;
  const cliff = Number(d.cliffDuration ?? 0n);
  const linear = Number(d.linearDuration ?? 0n);
  const tgePct = d.tgeUnlockBps !== undefined ? Number(d.tgeUnlockBps) / 100 : undefined;

  const cliffEnd = tge !== undefined ? tge + cliff : undefined;
  const end = cliffEnd !== undefined ? cliffEnd + linear : undefined;

  const steps: Step[] = [
    {
      label: "The starting point",
      title: "Allocation recorded",
      desc: "Your purchase is recorded by the presale contract. Nothing unlocks until the sale is finalized as successful.",
    },
    {
      label: "Token generation (TGE)",
      title: tgePct !== undefined ? `${tgePct}% unlocks` : "Initial unlock",
      desc: "The first portion becomes claimable the moment the sale is finalized.",
      at: tge,
    },
    {
      label: cliff > 0 ? `Cliff · ${fmtDuration(cliff)}` : "No cliff",
      title: "Linear release begins",
      desc: "After the cliff, the remaining tokens unlock continuously, second by second.",
      at: cliffEnd,
    },
    {
      label: `Linear · ${fmtDuration(linear)}`,
      title: "Release complete",
      desc: "The full allocation is unlocked. Claims are tracked separately from unlocks.",
      at: end,
    },
  ];

  const done = steps.map((s, i) => (i === 0 ? true : s.at !== undefined && now !== null && now >= s.at));
  const activeIdx = done.findIndex((x) => !x);

  return (
    <div className="grid gap-8 md:grid-cols-4 md:gap-6">
      {steps.map((s, i) => {
        const isDone = done[i];
        const isActive = i === activeIdx;
        return (
          <div key={s.title} className="relative border-t border-accent pt-5 md:border-t-0 md:pt-0">
            {/* connector line (desktop) */}
            <div className="absolute left-0 right-[-1.5rem] top-[5px] hidden h-px bg-accent/40 md:block" />
            <span
              className={cn(
                "absolute left-0 top-[-5px] block h-[11px] w-[11px] rounded-full border border-accent md:top-0",
                isDone ? "bg-accent" : isActive ? "bg-paper ring-4 ring-accent/20" : "bg-paper"
              )}
            />
            <div className="md:pt-8">
              <Eyebrow>{s.label}</Eyebrow>
              <h3 className="mt-3 text-xl tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
              <p className="mt-3 font-mono text-[11px] text-ink">
                {i === 0
                  ? isDone
                    ? "Recorded on purchase"
                    : ""
                  : s.at !== undefined
                    ? fmtDate(s.at)
                    : i === 1
                      ? "When the sale finalizes"
                      : i === 2
                        ? `TGE + ${fmtDuration(cliff)}`
                        : `TGE + ${fmtDuration(cliff + linear)}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}