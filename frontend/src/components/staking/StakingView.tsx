"use client";

import { Section, Display, Eyebrow, H2, ArrowLink, InfoRows } from "@/components/ui";
import { ActionButton } from "@/components/ActionButton";
import { Countdown } from "@/components/Countdown";
import { Torus } from "@/components/graphics";
import { StakePanel } from "./StakePanel";
import { useStaking } from "@/hooks/useStaking";
import { useChainNow } from "@/hooks/useChainNow";
import { useAccount } from "wagmi";
import { fmtBps, fmtDate, fmtDuration, fmtToken } from "@/lib/format";

export function StakingView() {
  const d = useStaking();
  const { isConnected } = useAccount();
  const { now, offset } = useChainNow();

  const periodEnd = d.periodFinish !== undefined ? Number(d.periodFinish) : undefined;
  const rewardsActive = now !== null && periodEnd !== undefined && periodEnd > now;
  const hasStakers = d.totalStaked !== undefined && d.totalStaked > 0n;

  // aprBps() keeps returning a number after a reward period ends, so only show it while rewards are flowing.
  const aprLabel = d.aprBps === undefined ? "—" : rewardsActive ? fmtBps(d.aprBps) : "0.00%";
  const aprNote = !rewardsActive
    ? "No reward period is currently active."
    : !hasStakers
      ? "No one is staking yet, so APR is shown as zero until the pool has stakers."
      : "APR is a simple annual rate. It is not compounded.";

  return (
    <>
      {/* Hero */}
      <Section className="pb-12 md:pb-16">
        <div className="flex justify-between">
          <Eyebrow>03 / Staking</Eyebrow>
          <Eyebrow>Participation, with purpose</Eyebrow>
        </div>

        <Display className="mt-8">More than holding</Display>

        <div className="mt-12 grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="max-w-md text-xl leading-relaxed text-muted">
              Holding is a beginning. Staking is participation. Commit NXR to a shared pool and understand how your
              share of rewards is calculated.
            </p>
            <div className="mt-6 flex gap-6">
              <ArrowLink href="/vesting">Manage Vesting</ArrowLink>
              <ArrowLink href="/tokenomics">View Tokenomics</ArrowLink>
            </div>
          </div>
          <Torus className="w-full" />
        </div>

        <div className="mt-14 grid items-start gap-10 border-t border-rule pt-10 md:grid-cols-[1fr_1.2fr_1fr]">
          <div>
            <Eyebrow>Variable APR / Live</Eyebrow>
            <p className="mt-3 text-[clamp(3.5rem,8vw,6rem)] font-light leading-none tracking-tight text-accent">
              {aprLabel}
            </p>
          </div>
          <div>
            <p className="text-2xl tracking-tight">A rate. Not a promise.</p>
            <p className="mt-3 text-muted">
              APR changes with pool size and reward emission. Actual returns can differ from the displayed estimate.{" "}
              {aprNote}
            </p>
          </div>
          <div>
            <Eyebrow>Pool snapshot / Live</Eyebrow>
            <p className="mt-3 text-3xl font-light tracking-tight">{fmtToken(d.totalStaked, 0)} NXR</p>
            {rewardsActive && periodEnd !== undefined ? (
              <div className="mt-4">
                <Eyebrow>Reward period ends in</Eyebrow>
                <Countdown target={periodEnd} offset={offset} size="md" className="mt-2" />
              </div>
            ) : (
              <p className="mt-3 font-mono text-[11px] text-muted">
                {periodEnd ? `Last period ended ${fmtDate(periodEnd)}` : "No reward period started yet"}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* Mechanics */}
      <Section tone="dark">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <Eyebrow className="text-paper/50">The mechanics, in plain sight</Eyebrow>
            <H2 className="mt-4">
              One pool.
              <br />A proportional
              <br />
              share.
            </H2>
          </div>
          <div className="self-end">
            <p className="text-xl leading-relaxed text-paper/80">
              Your stake is part of a collective pool. Your share of that pool determines your share of its
              distributed rewards.
            </p>
            <p className="mt-4 text-paper/60">
              Rewards come from the staking allocation, which represents 30% of the token distribution. Each funding
              round streams out evenly over {d.rewardsDuration ? fmtDuration(d.rewardsDuration) : "—"}.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-10 border-t border-paper/15 pt-8 md:grid-cols-3">
          {[
            ["01 / You contribute", "Stake NXR", "Tokens join the shared pool."],
            ["02 / The pool calculates", "Your pool share", "Your stake ÷ total staked."],
            ["03 / Rewards distribute", "Earn over time", "Your share × pool rewards, second by second."],
          ].map(([tag, title, body]) => (
            <div key={tag}>
              <Eyebrow className="text-paper/50">{tag}</Eyebrow>
              <h3 className="mt-3 text-2xl tracking-tight">{title}</h3>
              <p className="mt-3 text-sm text-paper/70">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Action */}
      <Section tone="lilac" className="py-14 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <H2>Make your stake.</H2>
          <Eyebrow className="hidden md:block">{isConnected ? "Wallet connected" : "Wallet not connected"}</Eyebrow>
        </div>

        {isConnected ? (
          <StakePanel d={d} rewardsActive={rewardsActive} />
        ) : (
          <div className="grid items-center gap-6 border-y border-accent py-6 md:grid-cols-[1fr_1fr_auto]">
            <div>
              <Eyebrow>Amount to stake</Eyebrow>
              <p className="mt-2 text-4xl font-light tracking-tight text-ink/40">0 NXR</p>
            </div>
            <div>
              <Eyebrow>Available balance</Eyebrow>
              <p className="mt-2 text-xl text-muted">Connect to view your NXR</p>
            </div>
            <ActionButton label="Connect Wallet →" onClick={() => {}} />
          </div>
        )}

        <p className="mt-6 max-w-xl text-sm text-muted">
          Only unlocked NXR in your wallet can be staked. Staking asks for a token approval first, then a stake
          transaction. Network fees are separate.
        </p>
        <div className="mt-6">
          <ArrowLink href="/vesting">Manage Vesting</ArrowLink>
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="mb-8 flex items-end justify-between gap-4">
          <H2>Understand the commitment.</H2>
          <ArrowLink href="/tokenomics" className="hidden md:inline-flex">
            View Tokenomics
          </ArrowLink>
        </div>
        <InfoRows
          items={[
            {
              q: "Why does APR move?",
              a: "When more tokens enter the pool, each token represents a smaller portion of the available rewards. A new funding round changes the reward rate too.",
            },
            {
              q: "Is there a lock-up?",
              a: "No lock-up in the contract: you can unstake any time, even if staking is paused. Rewards only accrue while your tokens are staked.",
            },
            {
              q: "What happens to vested tokens?",
              a: "Tokens must be claimed from the Vesting page into your wallet before they can be staked. Locked tokens can't be staked.",
            },
            {
              q: "What are the risks?",
              a: "Staking involves smart-contract and market risk. Token values and rewards can change, and no yield or principal is guaranteed. This deployment is on a test network.",
            },
          ]}
        />
      </Section>
    </>
  );
}