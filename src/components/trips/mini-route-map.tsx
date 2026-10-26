"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { fitProjection, pathFor, projectStop } from "@/lib/route-geometry";
import type { Trip } from "@/lib/trips-store";
import { WORLD } from "@/lib/world";
import { loadWorld50m, type RegionalWorld } from "@/lib/world-50m";
import { RouteLines, type RoutePoint } from "./route-lines";

const W = 400;
const H = 240;

/**
 * Mini-carte du tracé d'un voyage, pour les fiches de la liste.
 * `detailed` : frontières 50m chargées à la demande (pour la grande fiche).
 */
export const MiniRouteMap = memo(function MiniRouteMap({
  trip,
  className = "",
  detailed = false,
}: {
  trip: Trip;
  className?: string;
  detailed?: boolean;
}) {
  const [world50, setWorld50] = useState<RegionalWorld | null>(null);

  useEffect(() => {
    if (!detailed) return;
    let alive = true;
    loadWorld50m()
      .then((world) => alive && setWorld50(world))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [detailed]);

  const { land, points } = useMemo(() => {
    const projection = fitProjection(trip.stops, W, H, 36);
    const path = pathFor(projection);
    const features = world50 ? world50.all : WORLD.features.map((f) => f.feature);
    const land = features
      .map((feature, index) => ({ key: `${feature.id ?? index}`, d: path(feature) }))
      .filter((f): f is { key: string; d: string } => Boolean(f.d));
    const points: RoutePoint[] = trip.stops.flatMap((s) => {
      const at = projectStop(projection, s.lon, s.lat);
      return at ? [{ id: s.id, x: at[0], y: at[1], day: s.day, name: s.name, transport: s.transport }] : [];
    });
    return { land, points };
  }, [trip.stops, world50]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden preserveAspectRatio="xMidYMid slice" className={className}>
      <rect width={W} height={H} className="fill-ocean" />
      <g strokeWidth="0.6" className="fill-land stroke-map-border">
        {land.map(({ key, d }) => (
          <path key={key} d={d} />
        ))}
      </g>
      <RouteLines points={points} radius={8} numbers={points.length <= 12} />
    </svg>
  );
});
