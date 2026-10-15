"use client";

import { Section, Display, Eyebrow } from "@/components/ui";
import { useAdmin } from "@/hooks/useAdmin";
import { PresaleAdmin } from "./PresaleAdmin";
import { StakingAdmin } from "./StakingAdmin";
import { VestingAdmin } from "./VestingAdmin";

export function AdminView() {
  const a = useAdmin();
  const ownsAny = a.presale.isOwner || a.staking.isOwner || a.vesting.isOwner;

  return (
    <Section>
      <Eyebrow>Owner console</Eyebrow>
      <Display className="mt-6 !text-[clamp(2.5rem,6vw,4.5rem)]">Admin</Display>
      <p className="mt-6 max-w-xl text-muted">
        Controls for the contract owner. Reads are public. Writes only succeed from the address each contract
        recognizes as its owner.
      </p>

      {a.connected && !ownsAny && (
        <p className="mt-6 max-w-xl border-l-2 border-danger pl-4 text-sm text-danger">
          The connected wallet doesn&apos;t own any of the three contracts, so every action below is disabled.
        </p>
      )}

      <div className="mt-12">
        <PresaleAdmin a={a} />
        <StakingAdmin a={a} />
        <VestingAdmin a={a} />
      </div>
    </Section>
  );
}