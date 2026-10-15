import { Section, Display, Eyebrow, H2, ArrowLink, InfoRows } from "@/components/ui";
import { AllocationCards } from "@/components/AllocationCards";
import { OnChainCheck } from "@/components/OnChainCheck";
import { Wave } from "@/components/graphics";

const FLOWS = [
  { tag: "Presale / 40%", title: "Allocate → Vest → Participate", body: "A clear path from contribution to available tokens." },
  { tag: "Staking / 30%", title: "Stake → Accrue → Claim", body: "Rewards aligned with a participant's share of the pool." },
  { tag: "Treasury / 30%", title: "Reserve → Build → Sustain", body: "Capacity for the needs of an evolving ecosystem." },
];

export default function Tokenomics() {
  return (
    <>
      <Section className="pb-12 md:pb-16">
        <div className="flex justify-between">
          <Eyebrow>04 / Tokenomics</Eyebrow>
          <Eyebrow>NXR / The allocation thesis</Eyebrow>
        </div>

        <Display className="mt-8 max-w-[12ch]">A system with nothing to hide.</Display>

        <div className="mt-10 flex items-end justify-between gap-6">
          <p className="max-w-lg text-xl leading-relaxed text-muted">
            A deliberate balance between access, participation, and resilience. Three allocations, each with a clear
            role in the Nexora ecosystem.
          </p>
          <Eyebrow className="hidden md:block">40 / 30 / 30 — by design</Eyebrow>
        </div>

        <div className="mt-14">
          <AllocationCards />
        </div>
      </Section>

      {/* Purpose */}
      <Section tone="dark">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Eyebrow className="text-paper/50">Different roles. Shared direction.</Eyebrow>
            <H2 className="mt-4">
              Every allocation
              <br />
              has a purpose.
            </H2>
            <p className="mt-6 max-w-md leading-relaxed text-paper/70">
              Participation starts with access, grows through staking, and is supported by a treasury designed for
              continuity.
            </p>
          </div>
          <Wave className="w-full" stroke="#c9c9bf" />
        </div>

        <div className="mt-14 grid gap-10 border-t border-paper/15 pt-8 md:grid-cols-3">
          {FLOWS.map((f) => (
            <div key={f.tag}>
              <Eyebrow className="text-paper/50">{f.tag}</Eyebrow>
              <h3 className="mt-3 text-2xl tracking-tight">{f.title}</h3>
              <p className="mt-3 text-sm text-paper/70">{f.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Verify */}
      <Section>
        <div className="mb-8 flex items-end justify-between gap-4">
          <H2>Verify it yourself.</H2>
          <Eyebrow className="hidden md:block">Read live from the contracts</Eyebrow>
        </div>
        <OnChainCheck />
      </Section>

      {/* Principles */}
      <Section className="pt-0 md:pt-0">
        <div className="mb-8 flex items-end justify-between gap-4">
          <H2>Read the whole picture.</H2>
          <Eyebrow className="hidden md:block">Principles, not price promises</Eyebrow>
        </div>
        <InfoRows
          items={[
            {
              q: "Allocation is not valuation.",
              a: "The 40 / 30 / 30 split describes the distribution of tokens, not their market value. Participation does not guarantee appreciation or a financial return.",
            },
            {
              q: "Unlocks deserve context.",
              a: "Vesting and reward schedules determine when tokens become available. Allocation percentages alone do not describe circulating supply at a given time.",
            },
            {
              q: "Terms before transactions.",
              a: "The contract addresses are listed in the footer so you can inspect the code and state before you participate. Treasury policy is not enforced on-chain by these contracts.",
            },
          ]}
        />
      </Section>

      <Section tone="lilac" className="py-14 md:py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <H2>Find your place in the protocol.</H2>
          <div className="flex flex-col gap-2">
            <ArrowLink href="/presale">Join Presale</ArrowLink>
            <ArrowLink href="/staking">Explore Staking</ArrowLink>
          </div>
        </div>
      </Section>
    </>
  );
}