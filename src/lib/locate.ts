import { geoContains, geoDistance } from "d3-geo";
import { COUNTRIES, countryByAlpha2 } from "@/data/countries";
import { WORLD, type KeyedFeature } from "@/lib/world";

const MICROSTATES = COUNTRIES.filter((c) => c.point);
const NEAR = (1.2 * Math.PI) / 180;

/**
 * Pays d'un point, calculé dans le navigateur avec les frontières de world-atlas :
 * d'abord les frontières détaillées si elles sont chargées, puis les 110m,
 * puis le petit État le plus proche, et enfin le code pays donné par la recherche.
 */
export function countryAt(
  lon: number,
  lat: number,
  options: { detailed?: KeyedFeature[]; alpha2?: string } = {},
): string | null {
  const point: [number, number] = [lon, lat];
  for (const list of [options.detailed ?? [], WORLD.features]) {
    for (const { key, feature } of list) {
      if (geoContains(feature, point)) return key;
    }
  }
  let nearest: { key: string; distance: number } | null = null;
  for (const country of MICROSTATES) {
    const distance = geoDistance(point, country.point!);
    if (distance < NEAR && (!nearest || distance < nearest.distance)) {
      nearest = { key: country.key, distance };
    }
  }
  if (nearest) return nearest.key;
  if (options.alpha2) return countryByAlpha2(options.alpha2.toUpperCase())?.key ?? null;
  return null;
}
