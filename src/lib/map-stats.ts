import {
  CONTINENT_CODES,
  COUNTRY_BY_KEY,
  UN_MEMBER_COUNT,
  countingState,
  type ContinentCode,
} from "@/data/countries";
import type { CountryStatus, DisplayStatus } from "@/lib/map-store";

export type MapStats = {
  /** États membres de l'ONU où l'on vit ou que l'on a visités (territoires compris). */
  countryCount: number;
  /** Part des 193 États, de 0 à 1. */
  worldShare: number;
  continents: ContinentCode[];
  missingContinents: ContinentCode[];
  counts: Record<DisplayStatus, number>;
};

export function computeStats(
  statuses: Record<string, CountryStatus>,
  planned: ReadonlySet<string> = new Set(),
): MapStats {
  const states = new Set<string>();
  const continents = new Set<ContinentCode>();
  const counts: Record<DisplayStatus, number> = { home: 0, visited: 0, wish: 0, planned: 0 };

  for (const [key, status] of Object.entries(statuses)) {
    const country = COUNTRY_BY_KEY.get(key);
    if (!country) continue;
    counts[status] += 1;
    if (status === "wish") continue;
    continents.add(country.continent);
    const state = countingState(country);
    if (state) states.add(state);
  }
  counts.planned = planned.size;

  return {
    countryCount: states.size,
    worldShare: states.size / UN_MEMBER_COUNT,
    continents: CONTINENT_CODES.filter((c) => continents.has(c)),
    missingContinents: CONTINENT_CODES.filter((c) => !continents.has(c)),
    counts,
  };
}
