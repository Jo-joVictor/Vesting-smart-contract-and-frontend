"use client";

import { Section, Display, Eyebrow, H2, ArrowLink, InfoRows } from "@/components/ui";
import { Ribbon } from "@/components/graphics";
import { Countdown } from "@/components/Countdown";
import { Timeline } from "./Timeline";
import { ClaimPanel } from "./ClaimPanel";
import { getVestingPhase, useVesting } from "@/hooks/useVesting";
import { useChainNow } from "@/hooks/useChainNow";
import { fmtDuration, fmtToken } from "@/lib/format";

export function VestingView() {
  const d = useVesting();
  const { now, offset } = useChainNow();
  const phase = getVestingPhase(d);

  const cliff = Number(d.cliffDuration ?? 0n);
  const linear = Number(d.linearDuration ?? 0n);
  const tge = d.tgeTime ? Number(d.tgeTime) : undefined;
  const cliffEnd = tge !== undefined ? tge + cliff : undefined;
  const end = cliffEnd !== undefined ? cliffEnd + linear : undefined;
  const tgePct = d.tgeUnlockBps !== undefined ? Number(d.tgeUnlockBps) / 100 : undefined;

  // Next milestone for the countdown
  let milestone: { label: string; at: number } | undefined;
  if (phase === "active" && now !== null && cliffEnd !== undefined && end !== undefined) {
    if (now < cliffEnd) milestone = { label: "Linear release begins in", at: cliffEnd };
    else if (now < end) milestone = { label: "Fully unlocked in", at: end };
  }

  return (
    <>
      {/* Hero */}
      <Section className="pb-12 md:pb-16">
        <div className="flex justify-between">
          <Eyebrow>02 / Vesting</Eyebrow>
          <Eyebrow>NXR / A long-term perspective</Eyebrow>
        </div>

        <Display className="mt-8 max-w-[14ch]">Time, written into the protocol.</Display>

        <div className="mt-12 grid items-end gap-10 md:grid-cols-2">
          <div>
            <p className="max-w-md text-xl leading-relaxed text-muted">
              From allocation to available tokens. Follow how NXR unlocks over time, understand what is claimable,
              and see the commitment beyond the first transaction.
            </p>
            <div className="mt-6 flex gap-6">
              <ArrowLink href="/presale">Explore Presale</ArrowLink>
              <ArrowLink href="/tokenomics">View Tokenomics</ArrowLink>
            </div>
          </div>
          <div>
            <Ribbon className="w-full" />
            <Eyebrow className="mt-2">Allocation → Unlock → Claim</Eyebrow>
          </div>
        </div>
      </Section>

      {/* Timeline */}
      <Section className="border-t border-rule pt-14 md:pt-16">
        <div className="mb-10 flex items-end justify-between gap-4">
          <H2>A clearer view of what comes next.</H2>
          <Eyebrow className="hidden text-right md:block">
            {tgePct ?? "—"}% at TGE · {cliff > 0 ? `${fmtDuration(cliff)} cliff` : "no cliff"} ·{" "}
            {fmtDuration(linear)} linear
          </Eyebrow>
        </div>

        <Timeline d={d} now={now} />

        {phase === "pending" && (
          <p className="mt-10 max-w-xl text-muted">
            The presale hasn&apos;t been finalized yet, so no dates exist. Once it is finalized as successful, the
            timeline above fills in with real dates.
          </p>
        )}
        {phase === "failed" && (
          <p className="mt-10 max-w-xl text-muted">
            The presale did not reach its soft cap, so nothing vests. Contributions can be refunded on the{" "}
            <a href="/presale" className="text-accent underline">presale page</a>.
          </p>
        )}
        {milestone && (
          <div className="mt-12 border-t border-rule pt-8">
            <Eyebrow>{milestone.label}</Eyebrow>
            <Countdown target={milestone.at} offset={offset} size="md" className="mt-3" />
          </div>
        )}
      </Section>

      {/* Mechanics */}
      <Section tone="dark">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <Eyebrow className="text-paper/50">The mechanics, in plain sight</Eyebrow>
            <H2 className="mt-4">
              Allocated is not
              <br />
              the same as
              <br />
              available.
            </H2>
          </div>
          <div className="self-end">
            <p className="text-xl leading-relaxed text-paper/80">
              Vesting separates a long-term allocation from the tokens you can access today.
            </p>
            <p className="mt-4 text-paper/60">
              An unlock makes tokens eligible to claim. A claim is a separate action and does not accelerate the
              remaining release schedule.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-10 border-t border-paper/15 pt-8 md:grid-cols-3">
          {[
            ["01 / Allocation", "A defined commitment", "The full amount you bought, including tokens that are still locked."],
            ["02 / Unlock", "Available over time", `${tgePct ?? "—"}% at TGE, then the rest linearly over ${fmtDuration(linear)}${cliff > 0 ? ` after a ${fmtDuration(cliff)} cliff` : ""}.`],
            ["03 / Claim", "From protocol to wallet", "Unlocked, unclaimed tokens are sent to your wallet when you claim."],
          ].map(([tag, title, body]) => (
            <div key={tag}>
              <Eyebrow className="text-paper/50">{tag}</Eyebrow>
              <h3 className="mt-3 text-2xl tracking-tight">{title}</h3>
              <p className="mt-3 text-sm text-paper/70">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Claim */}
      <Section tone="lilac" className="py-14 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <H2>Your allocation. In perspective.</H2>
          <Eyebrow className="hidden md:block">Live from the vesting contract</Eyebrow>
        </div>

        <ClaimPanel d={d} />

        <div className="mt-10 grid gap-6 border-t border-accent/40 pt-6 sm:grid-cols-2">
          <div>
            <Eyebrow>Held by the vesting contract</Eyebrow>
            <p className="mt-2 font-mono text-sm">{fmtToken(d.vaultBalance, 0)} NXR</p>
          </div>
          <div>
            <Eyebrow>Claimed by all buyers</Eyebrow>
            <p className="mt-2 font-mono text-sm">{fmtToken(d.totalClaimed, 0)} NXR</p>
          </div>
        </div>

        <div className="mt-8">
          <ArrowLink href="/staking">Explore Staking</ArrowLink>
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="mb-8 flex items-end justify-between gap-4">
          <H2>Understand the long view.</H2>
          <Eyebrow className="hidden md:block">Terms before transactions</Eyebrow>
        </div>
        <InfoRows
          items={[
            {
              q: "When do my tokens unlock?",
              a: `${tgePct ?? "—"}% unlocks when the sale is finalized (TGE). ${
                cliff > 0 ? `Nothing more unlocks for ${fmtDuration(cliff)}. ` : ""
              }Then the remainder unlocks linearly over ${fmtDuration(linear)}.`,
            },
            {
              q: "Is an allocation the same as a claim?",
              a: "No. Your allocation includes locked tokens. The claimable portion is what has unlocked and has not been claimed yet.",
            },
            {
              q: "Can I stake tokens after claiming?",
              a: "Yes. Once claimed, NXR is in your wallet and can be staked. Vesting itself does not generate staking rewards, and locked tokens can't be staked.",
            },
          ]}
        />
      </Section>
    </>
  );
}