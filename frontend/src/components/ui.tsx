import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-6 md:px-10", className)}>{children}</div>;
}

const tones = {
  paper: "bg-paper text-ink",
  dark: "bg-forest text-paper",
  lilac: "bg-lilac text-ink",
} as const;

export function Section({
  tone = "paper",
  id,
  className,
  children,
}: {
  tone?: keyof typeof tones;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={tones[tone]}>
      <Container className={cn("py-16 md:py-24", className)}>{children}</Container>
    </section>
  );
}

/** Tiny uppercase mono label, e.g. "01 / PRESALE" */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-[11px] uppercase tracking-wider text-muted", className)}>
      {children}
    </p>
  );
}

/** Huge hero headline */
export function Display({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={cn(
        "text-[clamp(2.75rem,8vw,6.5rem)] font-medium leading-[0.98] tracking-[-0.03em]",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-[clamp(2rem,4.5vw,3.5rem)] font-normal leading-[1.05] tracking-[-0.02em]", className)}>
      {children}
    </h2>
  );
}

export function ArrowLink({
  href,
  children,
  external,
  className,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  const cls = cn("inline-flex items-center gap-1 text-sm text-accent hover:text-accent-dark", className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children} <span aria-hidden>↗</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children} <span aria-hidden>→</span>
    </Link>
  );
}

type Variant = "dark" | "accent" | "outline";

export function Button({
  variant = "dark",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    dark: "bg-ink text-paper hover:bg-black",
    accent: "bg-accent text-white hover:bg-accent-dark",
    outline: "border border-ink/30 text-ink hover:border-ink",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-[3px] px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className
      )}
    />
  );
}

/** Two-column Q/A rows ("Before you begin", "Understand the commitment") */
export function InfoRows({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <dl className="border-t border-rule">
      {items.map(({ q, a }) => (
        <div key={q} className="grid gap-2 border-b border-rule py-6 md:grid-cols-[1fr_1.5fr] md:gap-10">
          <dt className="text-lg">{q}</dt>
          <dd className="text-muted">{a}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-[3px] w-full bg-rule", className)}>
      <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${value}%` }} />
    </div>
  );
}