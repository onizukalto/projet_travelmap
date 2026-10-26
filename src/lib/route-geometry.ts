import { geoMercator, geoPath, type GeoProjection } from "d3-geo";
import type { Transport } from "@/lib/trips-store";
import { round2 } from "@/lib/world";

/**
 * Styles des tracés : route en trait plein, ferry en tirets, vol en pointillés,
 * train en trait fin, à pied en petits points.
 */
export const TRANSPORT_STROKE: Record<
  Transport,
  { width: number; dash?: string; bend: number }
> = {
  road: { width: 2.6, bend: 0.08 },
  ferry: { width: 2.2, dash: "9 6", bend: 0.12 },
  flight: { width: 2.4, dash: "0.1 6", bend: 0.22 },
  train: { width: 1.3, bend: 0.06 },
  walk: { width: 2, dash: "0.1 3.6", bend: 0.05 },
};

export const TRANSPORT_ORDER: Transport[] = ["road", "ferry", "flight", "train", "walk"];

/** Une courbe douce entre deux étapes (pas un vrai itinéraire routier). */
export function curve(a: [number, number], b: [number, number], bend: number) {
  const [x0, y0] = a;
  const [x1, y1] = b;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const cx = round2(mx - (y1 - y0) * bend);
  const cy = round2(my + (x1 - x0) * bend);
  return `M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`;
}

type LonLat = { lon: number; lat: number };

/**
 * Projection Mercator cadrée sur les étapes, avec une marge, et découpée au cadre.
 * `minSpan` : étendue minimale de la vue, en degrés (4 par défaut, pour un voyage ;
 * plus petit pour une seule journée dans une vallée).
 */
export function fitProjection(
  stops: LonLat[],
  width: number,
  height: number,
  padding: number,
  minSpan = 4,
): GeoProjection {
  const coordinates = stops.map((s) => [s.lon, s.lat]);
  if (coordinates.length === 0) coordinates.push([-170, -50], [170, 72]);
  // Pour une seule étape ou des étapes très proches, on élargit la vue jusqu'à minSpan.
  const lons = coordinates.map(([lon]) => lon);
  const lats = coordinates.map(([, lat]) => lat);
  const span = Math.max(Math.max(...lons) - Math.min(...lons), Math.max(...lats) - Math.min(...lats));
  if (span < minSpan) {
    const lon = (Math.max(...lons) + Math.min(...lons)) / 2;
    const lat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const half = minSpan / 2;
    coordinates.push([lon - half, lat - half], [lon + half, lat + half]);
  }
  return geoMercator()
    .fitExtent(
      [
        [padding, padding],
        [width - padding, height - padding],
      ],
      { type: "MultiPoint", coordinates },
    )
    .clipExtent([
      [0, 0],
      [width, height],
    ]);
}

export function pathFor(projection: GeoProjection) {
  return geoPath(projection).digits(2);
}

/** Projette une étape en coordonnées arrondies ; null si le point est invalide. */
export function projectStop(projection: GeoProjection, lon: number, lat: number): [number, number] | null {
  const projected = projection([lon, lat]);
  if (!projected || !projected.every(Number.isFinite)) return null;
  return [round2(projected[0]), round2(projected[1])];
}
