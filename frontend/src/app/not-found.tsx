import { Section, Display, Eyebrow, ArrowLink } from "@/components/ui";

export default function NotFound() {
  return (
    <Section>
      <Eyebrow>404</Eyebrow>
      <Display className="mt-6">Nothing here.</Display>
      <p className="mt-6 max-w-md text-xl text-muted">That page doesn&apos;t exist, or it has moved.</p>
      <div className="mt-8 flex gap-6">
        <ArrowLink href="/">Overview</ArrowLink>
        <ArrowLink href="/presale">Presale</ArrowLink>
      </div>
    </Section>
  );
}