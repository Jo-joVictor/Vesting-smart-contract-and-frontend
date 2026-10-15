import { Section, Display, Eyebrow, H2, ArrowLink } from "@/components/ui";
import { Feature } from "@/components/Feature";
import { HardCapTag, LiveStats } from "@/components/LiveStats";
import { Torus, Wave, Ribbon } from "@/components/graphics";
import { TARGET_CHAIN } from "@/lib/config";
import { ActivityFeed } from "@/components/ActivityFeed";

export default function Overview() {
  return (
    <>
      {/* Hero */}
      <Section className="pb-12 md:pb-16">
        <div className="flex justify-between gap-4">
          <Eyebrow>Independent infrastructure / {TARGET_CHAIN.name}</Eyebrow>
          <Eyebrow className="hidden text-right md:block">Built on conviction. Not complexity.</Eyebrow>
        </div>

        <Display className="mt-8 max-w-[14ch]">Trustless token infrastructure</Display>

        <div className="mt-16 grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="max-w-md text-xl leading-relaxed text-muted">
              From the first allocation to the long-term stake. One clear foundation for token participation,
              vesting, and rewards.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              <ArrowLink href="/presale">Join Presale</ArrowLink>
              <ArrowLink href="/staking">Explore Staking</ArrowLink>
              <ArrowLink href="/vesting">View Vesting</ArrowLink>
            </div>
            <Eyebrow className="mt-8">Less friction. More transparency.</Eyebrow>
          </div>
          <div>
            <Torus className="w-full" />
            <div className="mt-2 flex justify-between">
              <Eyebrow>Fig. 01 — An open system</Eyebrow>
              <Eyebrow className="text-accent">[ N / X ]</Eyebrow>
            </div>
          </div>
        </div>
      </Section>

      <LiveStats />

      {/* 01 Presale */}
      <Section tone="dark">
        <Feature
          dark
          eyebrow="01 / Presale"
          title={
            <>
              A clear beginning.
              <br />
              An open invitation.
            </>
          }
          body="Participate with ETH through a direct, transparent allocation flow. A defined hard cap keeps the terms visible from the start."
          cta="Explore the presale"
          href="/presale"
          caption={<HardCapTag />}
          graphic={<Wave className="w-full" stroke="#c9c9bf" />}
        />
      </Section>

      {/* 02 Vesting */}
      <Section tone="lilac">
        <Feature
          reverse
          eyebrow="02 / Vesting"
          title={
            <>
              Time, written
              <br />
              into the protocol.
            </>
          }
          body="Understand what is allocated, what is available, and what comes next. Vesting makes long-term commitments easier to follow."
          cta="View Vesting"
          href="/vesting"
          caption="Allocation → Unlock → Claim"
          graphic={<Ribbon className="w-full" />}
        />
      </Section>

      {/* 03 Staking */}
      <Section>
        <Feature
          eyebrow="03 / Staking"
          title={
            <>
              Put conviction
              <br />
              to work.
            </>
          }
          body="Move beyond holding with a shared staking pool. Explore how participation and reward allocation work, with the mechanics in plain sight."
          cta="Explore Staking"
          href="/staking"
          caption="Participation / Shared rewards"
          graphic={<Torus className="w-full" />}
        />
      </Section>

      <Section className="py-14 md:py-20">
        <ActivityFeed />
      </Section>

      {/* CTA */}
      <Section tone="lilac" className="py-14 md:py-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow>The next step is yours</Eyebrow>
            <H2 className="mt-4">Built for what comes next.</H2>
          </div>
          <ArrowLink href="/presale">Join Presale</ArrowLink>
        </div>
      </Section>
    </>
  );
}