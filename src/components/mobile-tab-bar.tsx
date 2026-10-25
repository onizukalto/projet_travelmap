"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "@/lib/nav";

/** Barre d'onglets en bas de l'écran, sur mobile uniquement. */
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[4.5rem] flex-col items-center justify-center gap-1 transition-colors duration-150 ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <Icon aria-hidden strokeWidth={active ? 2.2 : 1.8} className="size-6" />
                <span
                  className={`marker px-0.5 pt-0.5 text-small leading-tight ${
                    active ? "font-bold" : "font-semibold"
                  }`}
                >
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
