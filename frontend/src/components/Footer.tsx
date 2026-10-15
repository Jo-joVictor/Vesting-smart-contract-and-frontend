import { Container, ArrowLink, Eyebrow } from "./ui";
import { ADDRESSES, TARGET_CHAIN, explorerAddress } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-rule bg-paper">
      <Container className="py-14">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div>
            <p className="text-2xl tracking-tight">Nexora Labs</p>
            <p className="mt-2 text-muted">Token infrastructure. Built for the long term.</p>
          </div>

          <div className="flex gap-16">
            <div className="space-y-2">
              <Eyebrow>Explore</Eyebrow>
              <ArrowLink href="/presale" external={false} className="flex">Presale</ArrowLink>
              <ArrowLink href="/vesting" className="flex">Vesting</ArrowLink>
              <ArrowLink href="/staking" className="flex">Staking</ArrowLink>
              <ArrowLink href="/tokenomics" className="flex">Tokenomics</ArrowLink>
            </div>
            <div className="space-y-2">
              <Eyebrow>Contracts</Eyebrow>
              <ArrowLink href={explorerAddress(ADDRESSES.token)} external className="flex">Token</ArrowLink>
              <ArrowLink href={explorerAddress(ADDRESSES.presale)} external className="flex">Presale</ArrowLink>
              <ArrowLink href={explorerAddress(ADDRESSES.vesting)} external className="flex">Vesting</ArrowLink>
              <ArrowLink href={explorerAddress(ADDRESSES.staking)} external className="flex">Staking</ArrowLink>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-rule pt-6 font-mono text-[11px] uppercase tracking-wider text-muted md:flex-row">
          <span>© {new Date().getFullYear()} Nexora Labs</span>
          <span>{TARGET_CHAIN.name} deployment · Not financial advice</span>
          <span>Terms / Privacy</span>
        </div>
      </Container>
    </footer>
  );
}