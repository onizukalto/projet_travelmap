"use client";

import { MousePointerClick } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { fitProjection, pathFor } from "@/lib/route-geometry";
import type { Stop } from "@/lib/trips-store";
import { WORLD, type KeyedFeature } from "@/lib/world";
import { loadWorld50m, type RegionalWorld } from "@/lib/world-50m";
import { RouteLegend, RouteLines, type RoutePoint } from "./route-lines";

type Props = {
  stops: Stop[];
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  /** Point posé d'un clic, en attente d'être ajouté. */
  pending: { lon: number; lat: number } | null;
  onPlace: (lon: number, lat: number) => void;
  /** Prévient quand les frontières détaillées sont prêtes (pour trouver le pays d'une étape). */
  onDetailedReady: (features: KeyedFeature[]) => void;
};

/** Carte régionale du voyage, cadrée sur les étapes (frontières 50m chargées à la demande). */
export function TripMap({ stops, selectedDay, onSelectDay, pending, onPlace, onDetailedReady }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 600 });
  const [detailed, setDetailed] = useState<RegionalWorld | null>(null);
  const readyRef = useRef(onDetailedReady);

  useEffect(() => {
    readyRef.current = onDetailedReady;
  }, [onDetailedReady]);

  useEffect(() => {
    let alive = true;
    loadWorld50m()
      .then((world) => {
        if (!alive) return;
        setDetailed(world);
        readyRef.current(world.keyed);
      })
      .catch(() => {
        // Les frontières 110m restent affichées.
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const { width, height } = size;

  // La vue se cadre sur les étapes (et le point en attente), pas à chaque survol.
  const projection = useMemo(() => {
    const frame = pending ? [...stops, pending] : stops;
    return fitProjection(frame, width, height, Math.min(72, width / 8));
  }, [stops, pending, width, height]);

  const land = useMemo(() => {
    const path = pathFor(projection);
    const features = detailed ? detailed.all : WORLD.features.map((f) => f.feature);
    return features
      .map((feature, index) => ({ key: `${feature.id ?? index}`, d: path(feature) }))
      .filter((f): f is { key: string; d: string } => Boolean(f.d));
  }, [projection, detailed]);

  const points: RoutePoint[] = stops.map((s) => {
    const [x, y] = projection([s.lon, s.lat]) ?? [0, 0];
    return { id: s.id, x, y, day: s.day, name: s.name, transport: s.transport };
  });
  const ghost = pending ? projection([pending.lon, pending.lat]) : null;

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const lonLat = projection.invert?.([event.clientX - rect.left, event.clientY - rect.top]);
    if (lonLat) onPlace(lonLat[0], lonLat[1]);
  };

  return (
    <div ref={boxRef} className="relative h-full w-full overflow-hidden rounded-panel border border-line bg-ocean">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label="Carte du voyage. Clique sur la carte pour poser une étape."
        onClick={handleClick}
        className="absolute inset-0 block cursor-crosshair"
      >
        <g strokeWidth="0.7" strokeLinejoin="round" className="fill-land stroke-map-border">
          {land.map(({ key, d }) => (
            <path key={key} d={d} />
          ))}
        </g>
        <RouteLines points={points} selectedDay={selectedDay} onMarkerSelect={onSelectDay} />
        {ghost && (
          <g transform={`translate(${ghost[0]} ${ghost[1]})`} className="pointer-events-none">
            <circle r="13" strokeWidth="2.5" strokeDasharray="4 3" className="fill-visited stroke-ink" />
            <circle r="3" className="fill-ink" />
          </g>
        )}
      </svg>

      {stops.length === 0 && !pending && (
        <p className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-control border border-line bg-surface-raised px-3 py-2 text-caption text-ink">
          <MousePointerClick aria-hidden strokeWidth={1.8} className="size-4 text-ink-2" />
          Clique sur la carte pour poser une étape
        </p>
      )}

      <div className="absolute bottom-3 left-3 rounded-control border border-line bg-surface-raised px-3 py-2">
        <RouteLegend />
      </div>
    </div>
  );
}
