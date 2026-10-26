"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { NAV_ITEMS, isActive } from "@/lib/nav";

/**
 * Navigation principale (ordinateur et tablette). Le lien actif est une pastille jaune
 * qui glisse d'un lien à l'autre quand on change de page.
 * L'adresse d'une page dynamique (/voyages/123) n'est connue qu'à la visite :
 * en attendant, les liens s'affichent sans pastille.
 */
export function MainNav() {
  return (
    <Suspense fallback={<NavLinks pathname={null} />}>
      <ActiveNav />
    </Suspense>
  );
}

function ActiveNav() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Navigation principale" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname !== null && isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-11 items-center rounded-control px-3.5 text-[15px] transition-colors duration-150 ${
                  active ? "font-bold text-on-accent" : "font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="pastille-navigation"
                    aria-hidden
                    className="absolute inset-x-0 inset-y-1 rounded-control border border-border bg-accent-yellow"
                  />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
