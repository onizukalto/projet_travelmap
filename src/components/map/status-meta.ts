import type { DisplayStatus } from "@/lib/map-store";

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  home: "J'y vis",
  visited: "Visité",
  planned: "Prévu",
  wish: "Envie",
};

/** Ordre des pastilles de légende. */
export const LEGEND_ORDER: DisplayStatus[] = ["home", "visited", "planned", "wish"];

/** Remplissage SVG d'un pays selon son statut. */
export const STATUS_FILL: Record<DisplayStatus | "none", string> = {
  none: "var(--land)",
  home: "var(--home)",
  visited: "var(--visited)",
  wish: "url(#carte-hachures-envie)",
  planned: "url(#carte-hachures-prevu)",
};
