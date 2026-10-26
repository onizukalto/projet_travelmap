import type { ColoringStep } from "./coloring-map";

/** Les pays qui se colorient tout seuls sur la carte du monde (héros de l'accueil, page de connexion), dans l'ordre. */
export const SEQUENCE_MONDE: ColoringStep[] = [
  { key: "250", status: "home" },
  { key: "724", status: "visited" },
  { key: "392", status: "wish" },
  { key: "604", status: "visited" },
  { key: "352", status: "planned" },
  { key: "504", status: "visited" },
  { key: "554", status: "wish" },
  { key: "124", status: "visited" },
  { key: "704", status: "planned" },
  { key: "710", status: "visited" },
  { key: "032", status: "wish" },
  { key: "268", status: "planned" },
  { key: "484", status: "visited" },
  { key: "036", status: "wish" },
];
