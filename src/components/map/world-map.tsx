"use client";

import { MousePointerClick } from "lucide-react";
import { select } from "d3-selection";
import "d3-transition";
import { zoom, zoomIdentity, type D3ZoomEvent, type ZoomBehavior } from "d3-zoom";
import {
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from "react";
import { ZoomControls } from "@/components/ui/zoom-controls";
import { COUNTRY_BY_KEY } from "@/data/countries";
import type { CountryStatus, DisplayStatus } from "@/lib/map-store";
import { prefersReducedMotion } from "@/lib/use-media-query";
import { WORLD } from "@/lib/world";
import { STATUS_FILL, STATUS_LABELS } from "./status-meta";

const MAX_ZOOM = 12;
const { width: W, height: H } = WORLD;

export type MapAnchor = { x: number; y: number; width: number; height: number };

/** Remplissage façon Been : la couleur `to` se diffuse dans le pays, par-dessus `from`. */
export type Spread = { key: string; from: string; to: string; nonce: number };

export type WorldMapHandle = {
  /** Centre la carte sur un pays et renvoie où placer son panneau. */
  zoomToCountry: (key: string) => MapAnchor | null;
  svg: () => SVGSVGElement | null;
  /** Point de la carte (en pixels) au centre du conteneur. */
  center: () => MapAnchor | null;
};

type Props = {
  statuses: Record<string, CountryStatus>;
  planned: ReadonlySet<string>;
  hidden: ReadonlySet<DisplayStatus>;
  selectedKey: string | null;
  animateKey: string | null;
  showInvite: boolean;
  /** Pays en train de se remplir (changement de statut). */
  spread?: Spread | null;
  /** La carte remplit son conteneur (tuile du bento) au lieu de garder sa hauteur naturelle. */
  fill?: boolean;
  onSelect: (key: string, anchor: MapAnchor) => void;
  onUserZoom: () => void;
  ref?: Ref<WorldMapHandle>;
};

function displayStatus(
  key: string,
  statuses: Record<string, CountryStatus>,
  planned: ReadonlySet<string>,
): DisplayStatus | undefined {
  const status = statuses[key];
  // « Prévu » ne recouvre que les pays qui ne sont ni « j'y vis » ni « visité ».
  if (planned.has(key) && status !== "home" && status !== "visited") return "planned";
  return status;
}

type LayerProps = Pick<Props, "statuses" | "planned" | "hidden" | "animateKey">;

/** Les pays. Mémoïsé : il ne se redessine pas pendant le survol ni le zoom. */
const CountriesLayer = memo(function CountriesLayer({
  statuses,
  planned,
  hidden,
}: Omit<LayerProps, "animateKey">) {
  return (
    <g>
      {WORLD.shapes.map(({ key, d }) => {
        const status = displayStatus(key, statuses, planned);
        return (
          <path
            key={key}
            data-key={key}
            data-status={status}
            d={d}
            className={`country ${status && hidden.has(status) ? "is-faded" : ""}`}
            style={{ fill: STATUS_FILL[status ?? "none"] }}
          />
        );
      })}
    </g>
  );
});

/**
 * Remplissage façon Been : on recouvre le pays de son ancienne couleur, puis la nouvelle
 * couleur s'étend depuis son centre, à travers un cercle de découpe qui grandit
 * (transform: scale, en CSS). Sans animation (moins de mouvement), le cercle est plein d'emblée.
 */
function SpreadLayer({ spread }: { spread: Spread }) {
  const shape = WORLD.shapeByKey.get(spread.key);
  if (!shape) return null;
  const [cx, cy] = shape.centroid;
  const [[x0, y0], [x1, y1]] = shape.bounds;
  const r = Math.max(...[x0, x1].flatMap((x) => [y0, y1].map((y) => Math.hypot(x - cx, y - cy)))) + 2;
  const clipId = `remplissage-${spread.nonce}`;
  return (
    <g className="pointer-events-none" data-export-skip>
      <defs>
        <clipPath id={clipId}>
          <circle className="spread-circle" cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <path d={shape.d} className="country" style={{ fill: spread.from }} />
      <path d={shape.d} className="country" style={{ fill: spread.to }} clipPath={`url(#${clipId})`} />
    </g>
  );
}

/** Petits États sans contour : un point de taille constante à l'écran. */
function PointsLayer({ statuses, planned, hidden, animateKey, k }: LayerProps & { k: number }) {
  return (
    <g>
      {WORLD.points.map(({ key, x, y }) => {
        const status = displayStatus(key, statuses, planned);
        return (
          <g key={`${key}-${status ?? "none"}`}>
            <circle
              data-key={key}
              data-status={status}
              data-point
              cx={x}
              cy={y}
              r={3.5 / k}
              className={`country ${status && hidden.has(status) ? "is-faded" : ""} ${
                key === animateKey ? "ink-in" : ""
              }`}
              style={{ fill: STATUS_FILL[status ?? "none"], stroke: "var(--ink-2)" }}
            />
            {/* Zone de clic plus large, invisible */}
            <circle
              data-key={key}
              data-export-skip
              cx={x}
              cy={y}
              r={10 / k}
              fill="transparent"
              className="cursor-pointer"
            />
          </g>
        );
      })}
    </g>
  );
}

function outlineFor(key: string, k: number, strokeWidth: number) {
  const shape = WORLD.shapeByKey.get(key);
  if (shape) {
    return (
      <path
        d={shape.d}
        fill="none"
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        className="pointer-events-none stroke-ink"
      />
    );
  }
  const point = WORLD.pointByKey.get(key);
  if (!point) return null;
  return (
    <circle
      cx={point.x}
      cy={point.y}
      r={6 / k}
      fill="none"
      strokeWidth={strokeWidth}
      vectorEffect="non-scaling-stroke"
      className="pointer-events-none stroke-ink"
    />
  );
}

export function WorldMap({
  statuses,
  planned,
  hidden,
  selectedKey,
  animateKey,
  showInvite,
  spread = null,
  fill = false,
  onSelect,
  onUserZoom,
  ref,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const layerRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const onUserZoomRef = useRef(onUserZoom);
  const [k, setK] = useState(1);
  const [hover, setHover] = useState<{ key: string; x: number; y: number } | null>(null);

  useEffect(() => {
    onUserZoomRef.current = onUserZoom;
  }, [onUserZoom]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .translateExtent([
        [0, 0],
        [W, H],
      ])
      .clickDistance(5)
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        layerRef.current?.setAttribute("transform", event.transform.toString());
        setK(event.transform.k);
        if (event.sourceEvent) onUserZoomRef.current();
      });
    const selection = select(svg);
    selection.call(behavior);
    zoomRef.current = behavior;
    return () => {
      selection.on(".zoom", null);
    };
  }, []);

  const animate = () => {
    const svg = svgRef.current;
    if (!svg) return null;
    return select(svg)
      .transition()
      .duration(prefersReducedMotion() ? 0 : 450);
  };

  const zoomBy = (factor: number) => {
    const behavior = zoomRef.current;
    if (behavior) animate()?.call(behavior.scaleBy, factor);
  };

  const reset = () => {
    const behavior = zoomRef.current;
    if (behavior) animate()?.call(behavior.transform, zoomIdentity);
  };

  useImperativeHandle(ref, () => ({
    zoomToCountry: (key) => {
      const behavior = zoomRef.current;
      const svg = svgRef.current;
      const container = containerRef.current;
      if (!behavior || !svg || !container) return null;
      const shape = WORLD.shapeByKey.get(key);
      const point = WORLD.pointByKey.get(key);
      let scale = 6;
      let cx = point?.x ?? W / 2;
      let cy = point?.y ?? H / 2;
      let halfWidth = 6;
      if (shape) {
        const [[x0, y0], [x1, y1]] = shape.bounds;
        scale = Math.min(6, Math.max(1, 0.45 / Math.max((x1 - x0) / W, (y1 - y0) / H)));
        [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
        halfWidth = ((x1 - x0) / 2) * scale;
      }
      // Le pays se place un peu à gauche du centre : son panneau s'ouvre à sa droite.
      const focusX = W * 0.4;
      const target = zoomIdentity
        .translate(focusX, H / 2)
        .scale(scale)
        .translate(-cx, -cy);
      animate()?.call(behavior.transform, target);

      const matrix = svg.getScreenCTM();
      const rect = container.getBoundingClientRect();
      if (!matrix) return null;
      const edge = new DOMPoint(Math.min(focusX + halfWidth, W * 0.62), H / 2).matrixTransform(matrix);
      return { x: edge.x - rect.left, y: edge.y - rect.top - 80, width: rect.width, height: rect.height };
    },
    svg: () => svgRef.current,
    center: () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return { x: rect.width / 2, y: rect.height / 2, width: rect.width, height: rect.height };
    },
  }));

  const keyAt = (target: EventTarget) =>
    (target as Element).closest?.("[data-key]")?.getAttribute("data-key") ?? null;

  const handlePointerMove = (event: ReactPointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const key = keyAt(event.target);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!key || !rect) {
      setHover(null);
      return;
    }
    setHover({ key, x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  const handleClick = (event: React.MouseEvent) => {
    const key = keyAt(event.target);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!key || !rect) return;
    setHover(null);
    onSelect(key, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    });
  };

  const hoverCountry = hover ? COUNTRY_BY_KEY.get(hover.key) : null;
  const hoverStatus = hover ? displayStatus(hover.key, statuses, planned) : undefined;

  return (
    <div
      ref={containerRef}
      className={
        fill
          ? "relative h-full w-full overflow-hidden bg-ocean"
          : "relative overflow-hidden rounded-panel border border-border bg-ocean"
      }
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Carte du monde. Utilise la recherche pour choisir un pays au clavier."
        className={
          fill
            ? "absolute inset-0 block h-full w-full touch-none select-none"
            : "block h-auto max-h-[calc(100svh-17rem)] min-h-[220px] w-full touch-none select-none"
        }
      >
        <defs>
          <pattern
            id="carte-hachures-envie"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(45) scale(${1 / k})`}
          >
            <rect width="5" height="5" className="fill-land" />
            <line x1="0" y1="0" x2="0" y2="5" strokeWidth="1.5" className="stroke-wish-hatch" />
          </pattern>
          <pattern
            id="carte-hachures-prevu"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(45) scale(${1 / k})`}
          >
            <rect width="5" height="5" className="fill-land" />
            <line x1="0" y1="0" x2="0" y2="5" strokeWidth="1.8" className="stroke-planned-hatch" />
          </pattern>
        </defs>
        <g
          ref={layerRef}
          data-zoom-layer
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHover(null)}
          onClick={handleClick}
        >
          <path d={WORLD.sphere} className="fill-ocean" />
          <path
            d={WORLD.graticule}
            fill="none"
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
            className="pointer-events-none stroke-graticule"
          />
          <g className="ocean-label pointer-events-none" fontSize={13 / k} textAnchor="middle">
            {WORLD.oceans.map(({ name, at: [x, y] }) => (
              <text key={name} x={x} y={y}>
                {name}
              </text>
            ))}
          </g>
          <CountriesLayer statuses={statuses} planned={planned} hidden={hidden} />
          {spread && <SpreadLayer key={spread.nonce} spread={spread} />}
          <PointsLayer
            statuses={statuses}
            planned={planned}
            hidden={hidden}
            animateKey={animateKey}
            k={k}
          />
          <g data-export-skip>
            {hover && hover.key !== selectedKey && outlineFor(hover.key, k, 1.4)}
            {selectedKey && outlineFor(selectedKey, k, 2.2)}
          </g>
        </g>
      </svg>

      {showInvite && (
        <p className="pop-in pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-caption font-medium text-ink md:top-4 md:left-4">
          <MousePointerClick aria-hidden strokeWidth={1.75} className="size-4" />
          Clique sur un pays pour le colorier
        </p>
      )}

      {hover && hoverCountry && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-10 rounded-badge bg-ink px-2.5 py-1.5 text-caption whitespace-nowrap text-bg"
          style={{ transform: `translate(${hover.x + 14}px, ${hover.y + 16}px)` }}
        >
          <span className="font-semibold">{hoverCountry.name}</span>
          {hoverStatus && <span className="ml-1.5 opacity-75">· {STATUS_LABELS[hoverStatus]}</span>}
        </div>
      )}

      <ZoomControls
        className="absolute right-3 bottom-3 md:right-4 md:bottom-4"
        onZoomIn={() => zoomBy(1.8)}
        onZoomOut={() => zoomBy(1 / 1.8)}
        onReset={reset}
        canZoomIn={k < MAX_ZOOM - 0.01}
        canZoomOut={k > 1.01}
        canReset={k > 1.01}
      />
    </div>
  );
}

