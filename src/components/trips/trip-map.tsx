"use client";

import { select } from "d3-selection";
import "d3-transition";
import { zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { MousePointerClick } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ZoomControls } from "@/components/ui/zoom-controls";
import { prefersReducedMotion } from "@/lib/use-media-query";
import { fitProjection, pathFor, projectStop } from "@/lib/route-geometry";
import type { Stop } from "@/lib/trips-store";
import { WORLD, type KeyedFeature } from "@/lib/world";
import { loadWorld50m, type RegionalWorld } from "@/lib/world-50m";
import { RouteLegend, RouteLines, type RoutePoint } from "./route-lines";

type Props = {
  stops: Stop[];
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  /** Point posé d'un clic, en attente d'être ajouté. */
  pending?: { lon: number; lat: number } | null;
  /** Clic sur la carte pour poser une étape. Sans cette fonction, la carte se consulte seulement. */
  onPlace?: (lon: number, lat: number) => void;
  /** Prévient quand les frontières détaillées sont prêtes (pour trouver le pays d'une étape). */
  onDetailedReady?: (features: KeyedFeature[]) => void;
  /** Étapes à marquer en vert (pépites). */
  pepiteIds?: ReadonlySet<string>;
  /** Légende à afficher à la place de celle des tracés (null : aucune). */
  legend?: ReactNode;
  /** Étendue minimale de la vue, en degrés (voir fitProjection). */
  minSpan?: number;
  /** Noms des étapes à côté des marqueurs. */
  labels?: boolean;
  /** Position des boutons de zoom (en bas à droite par défaut). */
  controlsClassName?: string;
};

const MAX_ZOOM = 12;

/**
 * Carte régionale du voyage, cadrée sur les étapes (frontières 50m chargées à la demande).
 * Elle se zoome à la molette, au pincement ou avec les boutons, et se déplace en la faisant glisser.
 * Seul le fond de carte est agrandi : les marqueurs et les tracés gardent leur taille.
 */
export function TripMap({
  stops,
  selectedDay,
  onSelectDay,
  pending = null,
  onPlace,
  onDetailedReady,
  pepiteIds,
  legend,
  minSpan,
  labels = false,
  controlsClassName = "right-3 bottom-3",
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 600 });
  const [detailed, setDetailed] = useState<RegionalWorld | null>(null);
  const readyRef = useRef(onDetailedReady);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [view, setView] = useState<ZoomTransform>(zoomIdentity);

  useEffect(() => {
    readyRef.current = onDetailedReady;
  }, [onDetailedReady]);

  useEffect(() => {
    let alive = true;
    loadWorld50m()
      .then((world) => {
        if (!alive) return;
        setDetailed(world);
        readyRef.current?.(world.keyed);
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

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .extent([
        [0, 0],
        [width, height],
      ])
      // Un petit glissement reste un clic : on peut toujours poser une étape.
      .clickDistance(5)
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => setView(event.transform));
    // Pas de zoom au double-clic : un clic sert à poser une étape.
    const selection = select(svg);
    selection.call(behavior).on("dblclick.zoom", null);
    zoomRef.current = behavior;
    return () => {
      selection.on(".zoom", null);
    };
  }, [width, height]);

  const animate = () => {
    const svg = svgRef.current;
    return svg ? select(svg).transition().duration(prefersReducedMotion() ? 0 : 450) : null;
  };
  const zoomBy = (factor: number) => {
    if (zoomRef.current) animate()?.call(zoomRef.current.scaleBy, factor);
  };
  const recenter = () => {
    if (zoomRef.current) animate()?.call(zoomRef.current.transform, zoomIdentity);
  };

  // La vue se cadre sur les étapes (et le point en attente), pas à chaque survol.
  const projection = useMemo(() => {
    const frame = pending ? [...stops, pending] : stops;
    return fitProjection(frame, width, height, Math.min(72, width / 8), minSpan);
  }, [stops, pending, width, height, minSpan]);

  // Mémoïsé : le fond de carte ne se recalcule pas à chaque image du zoom.
  const land = useMemo(() => {
    const path = pathFor(projection);
    const features = detailed ? detailed.all : WORLD.features.map((f) => f.feature);
    return features
      // Les frontières 50m contiennent plusieurs contours avec le même code : on ajoute la position.
      .map((feature, index) => ({ key: `${feature.id ?? "x"}-${index}`, d: path(feature) }))
      .filter((f): f is { key: string; d: string } => Boolean(f.d))
      .map(({ key, d }) => <path key={key} d={d} vectorEffect="non-scaling-stroke" />);
  }, [projection, detailed]);

  // Les étapes sont placées à l'écran après le zoom : elles gardent leur taille.
  const points: RoutePoint[] = stops.flatMap((s) => {
    const at = projectStop(projection, s.lon, s.lat);
    return at
      ? [
          {
            id: s.id,
            x: view.applyX(at[0]),
            y: view.applyY(at[1]),
            day: s.day,
            name: s.name,
            transport: s.transport,
            pepite: pepiteIds?.has(s.id),
          },
        ]
      : [];
  });
  const projectedGhost = pending ? projectStop(projection, pending.lon, pending.lat) : null;
  const ghost = projectedGhost ? view.apply(projectedGhost) : null;
  // La légende ne montre que les moyens de transport du voyage (tous s'il n'a pas encore de trajet).
  const used = [...new Set(stops.slice(1).map((s) => s.transport))];

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!onPlace) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const onMap = view.invert([event.clientX - rect.left, event.clientY - rect.top]);
    const lonLat = projection.invert?.(onMap);
    if (lonLat) onPlace(lonLat[0], lonLat[1]);
  };

  return (
    <div ref={boxRef} className="relative h-full w-full overflow-hidden rounded-panel border border-border bg-ocean">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={onPlace ? "Carte du voyage. Clique sur la carte pour poser une étape." : "Carte de l'itinéraire"}
        onClick={handleClick}
        className={`absolute inset-0 block touch-none ${onPlace ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
      >
        <g
          transform={view.toString()}
          strokeWidth="0.7"
          strokeLinejoin="round"
          className="fill-land stroke-map-border"
        >
          {land}
        </g>
        <RouteLines points={points} selectedDay={selectedDay} onMarkerSelect={onSelectDay} labels={labels} />
        {ghost && (
          <g transform={`translate(${ghost[0]} ${ghost[1]})`} className="pointer-events-none">
            <circle r="13" strokeWidth="2.5" strokeDasharray="4 3" className="fill-visited stroke-ink" />
            <circle r="3" className="fill-ink" />
          </g>
        )}
      </svg>

      {onPlace && stops.length === 0 && !pending && (
        <p className="pop-in pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-caption font-medium text-ink">
          <MousePointerClick aria-hidden strokeWidth={1.75} className="size-4" />
          Clique sur la carte pour poser une étape
        </p>
      )}

      {legend !== null && (
        <div className="absolute bottom-3 left-3 max-w-[calc(100%-10rem)] rounded-control border border-border bg-surface px-3 py-2 md:max-w-[calc(100%-5.5rem)]">
          {legend ?? <RouteLegend only={used.length > 0 ? used : undefined} />}
        </div>
      )}

      <ZoomControls
        className={`absolute ${controlsClassName}`}
        onZoomIn={() => zoomBy(1.8)}
        onZoomOut={() => zoomBy(1 / 1.8)}
        onReset={recenter}
        canZoomIn={view.k < MAX_ZOOM - 0.01}
        canZoomOut={view.k > 1.01}
        canReset={view.k > 1.01 || Math.abs(view.x) > 1 || Math.abs(view.y) > 1}
      />
    </div>
  );
}
