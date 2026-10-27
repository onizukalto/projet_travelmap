import { Compass, Map, Route, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** Les trois sections du site, partagées par l'en-tête et la barre d'onglets mobile. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/carte", label: "Ma carte", icon: Map },
  { href: "/voyages", label: "Voyages", icon: Route },
  { href: "/planifier", label: "Planifier", icon: Compass },
];

/** Page d'arrivée de l'application (après connexion, logo de l'en-tête). « / » est l'accueil public. */
export const APP_HOME = "/carte";

/** Page où revenir après la connexion : seulement une page de ce site (jamais une autre adresse). */
export function destinationSure(suite: string | string[] | null | undefined) {
  if (typeof suite !== "string" || !suite.startsWith("/") || suite.startsWith("//")) return APP_HOME;
  if (suite === "/" || suite.startsWith("/connexion") || suite.startsWith("/api/") || suite.startsWith("/auth/")) {
    return APP_HOME;
  }
  return suite;
}

/** Un lien est actif sur sa page et sur ses sous-pages (ex. /voyages/123). */
export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
