"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "@/lib/nav";

/** Navigation principale (ordinateur et tablette). Le lien actif est surligné au marqueur. */
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 items-center rounded-control px-3 transition-colors duration-150 hover:bg-bg ${
                  active ? "font-bold text-ink" : "font-semibold text-ink-2 hover:text-ink"
                }`}
              >
                <span className="marker px-0.5 pt-0.5">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
