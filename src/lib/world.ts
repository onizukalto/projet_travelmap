import { geoEqualEarth, geoGraticule10, geoPath } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { COUNTRIES, COUNTRY_BY_KEY, UNCODED_FEATURES } from "@/data/countries";

/**
 * Géométrie de la carte du monde, calculée une seule fois au chargement du module :
 * projection Equal Earth, tracés SVG des pays, graticule de 10°, noms des océans.
 */

export const MAP_WIDTH = 1000;
const MARGIN = 10;
const ANTARCTICA = "010";

export type CountryShape = {
  key: string;
  d: string;
  bounds: [[number, number], [number, number]];
  centroid: [number, number];
};

export type KeyedFeature = { key: string; feature: Feature<Geometry, { name: string }> };

export type CountryPoint = {
  key: string;
  x: number;
  y: number;
};

type Props = { name: string };
const topology = world as unknown as Topology<{ countries: GeometryCollection<Props> }>;

function buildWorld() {
  const collection = feature(topology, topology.objects.countries);
  const features = (collection.features as Feature<Geometry, Props>[]).filter(
    (f) => f.id !== ANTARCTICA,
  );

  const projection = geoEqualEarth().fitWidth(MAP_WIDTH, { type: "Sphere" });
  let path = geoPath(projection);

  // On recadre en hauteur sur les terres (sans l'Antarctique).
  const [[, top], [, bottom]] = path.bounds({ type: "FeatureCollection", features });
  const [tx, ty] = projection.translate();
  projection.translate([tx, ty - top + MARGIN]);
  path = geoPath(projection);
  const height = Math.ceil(bottom - top + MARGIN * 2);

  const shapes: CountryShape[] = [];
  const keyed: KeyedFeature[] = [];
  for (const f of features) {
    const key = (f.id as string | undefined) ?? UNCODED_FEATURES[f.properties.name];
    if (!key || !COUNTRY_BY_KEY.has(key)) continue;
    keyed.push({ key, feature: f });
    shapes.push({
      key,
      d: path(f) ?? "",
      bounds: path.bounds(f),
      centroid: path.centroid(f),
    });
  }

  const points: CountryPoint[] = COUNTRIES.filter((c) => c.point).map((c) => {
    const [x, y] = projection(c.point!) ?? [0, 0];
    return { key: c.key, x, y };
  });

  const label = (lon: number, lat: number) => projection([lon, lat]) ?? [0, 0];

  return {
    width: MAP_WIDTH,
    height,
    sphere: path({ type: "Sphere" }) ?? "",
    graticule: path(geoGraticule10()) ?? "",
    shapes,
    /** Contours géographiques (longitude, latitude), pour retrouver le pays d'un point. */
    features: keyed,
    shapeByKey: new Map(shapes.map((s) => [s.key, s])),
    points,
    pointByKey: new Map(points.map((p) => [p.key, p])),
    oceans: [
      { name: "Océan Pacifique", at: label(-132, -8) },
      { name: "Océan Atlantique", at: label(-38, 24) },
      { name: "Océan Indien", at: label(78, -22) },
    ],
  };
}

export const WORLD = buildWorld();
