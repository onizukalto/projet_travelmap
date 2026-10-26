"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { NAV_ITEMS, isActive } from "@/lib/nav";

/** Barre d'onglets en bas de l'écran, sur mobile uniquement. L'onglet actif est une pastille jaune. */
export function MobileTabBar() {
  return (
    <Suspense fallback={<TabBar pathname={null} />}>
      <ActiveTabBar />
    </Suspense>
  );
}

function ActiveTabBar() {
  return <TabBar pathname={usePathname()} />;
}

function TabBar({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-3 gap-1 px-2 py-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname !== null && isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-control transition-colors duration-150 ${
                  active ? "text-on-accent" : "text-muted hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="pastille-onglets"
                    aria-hidden
                    className="absolute inset-0 rounded-control border border-border bg-accent-yellow"
                  />
                )}
                <Icon aria-hidden strokeWidth={active ? 2.2 : 1.75} className="relative size-[22px]" />
                <span className={`relative text-small leading-tight ${active ? "font-bold" : "font-medium"}`}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
