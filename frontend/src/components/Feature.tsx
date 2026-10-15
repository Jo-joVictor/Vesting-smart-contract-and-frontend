import type { ReactNode } from "react";
import { ArrowLink, Eyebrow, H2 } from "./ui";
import { cn } from "@/lib/utils";

export function Feature({
  eyebrow,
  title,
  body,
  cta,
  href,
  caption,
  graphic,
  reverse,
  dark,
}: {
  eyebrow: string;
  title: ReactNode;
  body: string;
  cta: string;
  href: string;
  caption: ReactNode;
  graphic: ReactNode;
  reverse?: boolean;
  dark?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
      <div className={cn(reverse && "md:order-2")}>
        <Eyebrow className={dark ? "text-paper/50" : undefined}>{eyebrow}</Eyebrow>
        <H2 className="mt-4">{title}</H2>
        <p className={cn("mt-6 max-w-md leading-relaxed", dark ? "text-paper/70" : "text-muted")}>{body}</p>
        <div className="mt-6">
          <ArrowLink href={href} className={dark ? "text-paper hover:text-white" : undefined}>
            {cta}
          </ArrowLink>
        </div>
      </div>

      <div className={cn(reverse && "md:order-1")}>
        {graphic}
        <Eyebrow className={cn("mt-3", dark && "text-paper/50")}>{caption}</Eyebrow>
      </div>
    </div>
  );
}