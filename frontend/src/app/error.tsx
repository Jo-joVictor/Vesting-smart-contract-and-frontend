"use client";

import { Section, Display, Eyebrow, Button } from "@/components/ui";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Section>
      <Eyebrow>Something went wrong</Eyebrow>
      <Display className="mt-6">Unexpected error.</Display>
      <p className="mt-6 max-w-md text-xl text-muted">
        The page failed to render. This is usually temporary, so try again.
      </p>
      <div className="mt-8">
        <Button onClick={reset}>Try again</Button>
      </div>
    </Section>
  );
}