import type { Feature, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { COUNTRY_BY_KEY, UNCODED_FEATURES } from "@/data/countries";
import type { KeyedFeature } from "@/lib/world";

type Props = { name: string };

export type RegionalWorld = {
  /** Tous les contours, pour dessiner la carte. */
  all: Feature<Geometry, Props>[];
  /** Les contours reliés à un pays du fichier countries, pour retrouver le pays d'un point. */
  keyed: KeyedFeature[];
};

let cache: Promise<RegionalWorld> | null = null;

/** Frontières détaillées (1:50m), chargées seulement quand une carte de voyage s'affiche. */
export function loadWorld50m() {
  cache ??= import("world-atlas/countries-50m.json").then((module) => {
    const topology = (module.default ?? module) as unknown as Topology<{
      countries: GeometryCollection<Props>;
    }>;
    const collection = feature(topology, topology.objects.countries);
    const all = (collection.features as Feature<Geometry, Props>[]).filter(
      (f) => f.id !== "010",
    );
    const keyed: KeyedFeature[] = [];
    for (const f of all) {
      const key = (f.id as string | undefined) ?? UNCODED_FEATURES[f.properties.name];
      if (key && COUNTRY_BY_KEY.has(key)) keyed.push({ key, feature: f });
    }
    return { all, keyed };
  });
  return cache;
}
