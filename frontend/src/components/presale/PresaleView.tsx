"use client";

import { Section, Display, Eyebrow, H2, ArrowLink, InfoRows } from "@/components/ui";
import { Countdown } from "@/components/Countdown";
import { Wave } from "@/components/graphics";
import { SaleProgress } from "./SaleProgress";
import { StageTable } from "./StageTable";
import { BuyForm } from "./BuyForm";
import { Finalize, Refund, SaleSuccess } from "./PostSale";
import { getPhase, usePresale } from "@/hooks/usePresale";
import { useChainNow } from "@/hooks/useChainNow";
import { fmtDate, fmtEth, fmtToken } from "@/lib/format";
import { TARGET_CHAIN } from "@/lib/config";

const STEPS = [
  {
    t: "Connect on Ethereum",
    d: "Use a compatible wallet and review the network before participating. Keep enough ETH aside for transaction fees.",
  },
  {
    t: "Review your allocation",
    d: "Enter an ETH amount, check the estimated NXR allocation read from the contract, and set your slippage before confirming.",
  },
  {
    t: "Follow your vesting",
    d: "After a successful sale, your vesting view is the place to follow allocation, unlock timing, and claimable tokens.",
  },
];

export function PresaleView() {
  const p = usePresale();
  const { now, offset } = useChainNow();
  const phase = getPhase(p, now);

  const countdownTarget =
    phase === "upcoming" ? Number(p.startTime) : phase === "live" ? Number(p.endTime) : undefined;

  const statusLabel =
    phase === "upcoming"
      ? "Sale opens in"
      : phase === "live"
        ? "Sale ends in"
        : phase === "ended"
          ? "Sale ended · awaiting finalization"
          : phase === "success"
            ? "Sale successful"
            : phase === "failed"
              ? "Soft cap not reached"
              : "Loading sale…";

  return (
    <>
      {/* Hero */}
      <Section className="pb-12 md:pb-16">
        <div className="flex justify-between">
          <Eyebrow>01 / Presale</Eyebrow>
          <Eyebrow>
            {TARGET_CHAIN.name} / NXR
          </Eyebrow>
        </div>

        <Display className="mt-8">
          Your entry.
          <br />
          On your terms.
        </Display>

        <div className="mt-12 grid items-end gap-10 md:grid-cols-2">
          <p className="max-w-lg text-xl leading-relaxed text-muted">
            A straightforward way to participate in Nexora. Defined allocation, a visible hard cap, and no
            unnecessary steps between you and the protocol.
          </p>

          <div>
            <Eyebrow>{statusLabel}</Eyebrow>
            {countdownTarget !== undefined && (
              <Countdown target={countdownTarget} offset={offset} className="mt-3" />
            )}
            {phase === "upcoming" && p.startTime !== undefined && (
              <p className="mt-3 font-mono text-[11px] text-muted">{fmtDate(p.startTime)}</p>
            )}
            {phase === "live" && p.endTime !== undefined && (
              <p className="mt-3 font-mono text-[11px] text-muted">Closes {fmtDate(p.endTime)} or when sold out</p>
            )}
          </div>
        </div>

        <div className="mt-14 border-t border-rule pt-10">
          <SaleProgress p={p} />
        </div>
      </Section>

      {/* Action panel */}
      <Section tone="lilac" className="py-14 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <H2>A simple place to begin.</H2>
          <Eyebrow className="hidden text-right md:block">
            Min {fmtEth(p.minContribution, 6)} ETH · Max {fmtEth(p.maxContribution, 6)} ETH per wallet
          </Eyebrow>
        </div>

        {phase === "loading" && <p className="text-muted">Reading the presale contract…</p>}

        {phase === "upcoming" && (
          <p className="max-w-xl text-2xl tracking-tight">
            The sale hasn&apos;t started yet. This panel unlocks when the countdown reaches zero.
          </p>
        )}

        {phase === "live" && <BuyForm p={p} />}
        {phase === "ended" && <Finalize p={p} />}
        {phase === "failed" && <Refund p={p} />}
        {phase === "success" && <SaleSuccess p={p} />}

        {/* User position */}
        {(p.purchased !== undefined || p.contributions !== undefined) && (
          <div className="mt-10 grid gap-6 border-t border-accent/40 pt-6 sm:grid-cols-2">
            <div>
              <Eyebrow>Your contribution</Eyebrow>
              <p className="mt-2 text-2xl font-light tracking-tight">{fmtEth(p.contributions, 6)} ETH</p>
            </div>
            <div>
              <Eyebrow>Your NXR allocation</Eyebrow>
              <p className="mt-2 text-2xl font-light tracking-tight">{fmtToken(p.purchased)} NXR</p>
            </div>
          </div>
        )}

        <div className="mt-8">
          <ArrowLink href="/vesting">Go to Vesting Dashboard</ArrowLink>
        </div>
      </Section>

      {/* Stages */}
      <Section>
        <div className="mb-8 flex items-end justify-between gap-4">
          <H2>Staged pricing.</H2>
          <Eyebrow className="hidden md:block">Price rises as each stage fills</Eyebrow>
        </div>
        <StageTable p={p} />
      </Section>

      {/* Steps */}
      <Section tone="dark">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <Eyebrow className="text-paper/50">From intent to allocation</Eyebrow>
            <H2 className="mt-4">
              Three steps.
              <br />
              Nothing hidden.
            </H2>
            <p className="mt-6 max-w-sm text-paper/70">
              Know the sequence before you begin. Every interaction should have a clear purpose.
            </p>
            <Wave className="mt-10 hidden w-full max-w-sm md:block" stroke="#c9c9bf" />
          </div>

          <ol className="border-t border-paper/15">
            {STEPS.map((s, i) => (
              <li key={s.t} className="grid grid-cols-[3rem_1fr] gap-2 border-b border-paper/15 py-7">
                <span className="font-mono text-[11px] text-paper/50">0{i + 1}</span>
                <div>
                  <h3 className="text-2xl tracking-tight">{s.t}</h3>
                  <p className="mt-2 text-paper/70">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="mb-8 flex items-end justify-between gap-4">
          <H2>Before you begin.</H2>
          <Eyebrow className="hidden md:block">A little clarity goes a long way</Eyebrow>
        </div>
        <InfoRows
          items={[
            {
              q: "What are the caps?",
              a: `The hard cap is ${fmtEth(p.hardCap)} ETH; the sale closes when it is reached, when all ${fmtToken(
                p.totalAllocation,
                0
              )} NXR are sold, or when the timer ends. The soft cap is ${fmtEth(
                p.softCap
              )} ETH: if it isn't reached, the sale fails and everyone can refund.`,
            },
            {
              q: "What happens to ETH above my limit?",
              a: "Each wallet has a contribution limit. Anything above your remaining allowance, or above what is left in the sale, is returned to you in the same transaction.",
            },
            {
              q: "When can I access my tokens?",
              a: "Tokens are not sent at purchase. Once the sale is finalized as successful, they unlock on the vesting schedule and you claim them from the Vesting page.",
            },
            {
              q: "What should I know before participating?",
              a: "Digital assets carry risk. Prices can fluctuate, transactions are irreversible, and smart contracts can contain bugs. This deployment is on a test network.",
            },
          ]}
        />
      </Section>
    </>
  );
}