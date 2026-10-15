"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";
import { Container } from "./ui";
import { useIsOwner } from "@/hooks/useIsOwner";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string };

export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Overview" },
  { href: "/presale", label: "Presale" },
  { href: "/vesting", label: "Vesting" },
  { href: "/staking", label: "Staking" },
  { href: "/tokenomics", label: "Tokenomics" },
];

function NavLinks({ links, className }: { links: NavLink[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn("items-center gap-8 text-sm", className)}>
      {links.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative whitespace-nowrap py-5 text-muted transition-colors hover:text-ink",
              active && "font-medium text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-accent"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Nav() {
  const isOwner = useIsOwner();
  const links = isOwner ? [...NAV_LINKS, { href: "/admin", label: "Admin" }] : NAV_LINKS;

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/90 backdrop-blur">
      <Container>
        <div className="flex h-[72px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[17px] font-medium tracking-tight">
            <span className="text-2xl font-bold leading-none">N</span> Nexora Labs
          </Link>
          <NavLinks links={links} className="hidden md:flex" />
          <ConnectButton />
        </div>
        <NavLinks links={links} className="-mb-px flex gap-6 overflow-x-auto md:hidden" />
      </Container>
    </header>
  );
}