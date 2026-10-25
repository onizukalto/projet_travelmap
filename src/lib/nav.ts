import { Compass, Map, Route, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Les trois sections du site, partagées par l'en-tête et la barre d'onglets mobile. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Ma carte", icon: Map },
  { href: "/voyages", label: "Voyages", icon: Route },
  { href: "/planifier", label: "Planifier", icon: Compass },
];

/** Un lien est actif sur sa page et sur ses sous-pages (ex. /voyages/123). */
export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
