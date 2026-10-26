import { TRANSPORT_STROKE, curve } from "@/lib/route-geometry";
import { TRANSPORT_NAMES } from "@/lib/trip-utils";
import type { Transport } from "@/lib/trips-store";

export type RoutePoint = {
  id: string;
  x: number;
  y: number;
  day: number;
  name: string;
  transport: Transport;
  /** Lieu peu fréquenté proposé par l'assistant : marqueur vert. */
  pepite?: boolean;
};

type Props = {
  points: RoutePoint[];
  /** Jour mis en avant : les autres étapes s'estompent. */
  selectedDay?: number | null;
  radius?: number;
  numbers?: boolean;
  /** Affiche le nom de chaque étape à côté de son marqueur. */
  labels?: boolean;
  onMarkerSelect?: (day: number) => void;
};

/** Tracés entre les étapes et marqueurs numérotés. */
export function RouteLines({
  points,
  selectedDay = null,
  radius = 11,
  numbers = true,
  labels = false,
  onMarkerSelect,
}: Props) {
  const dim = (day: number) => selectedDay !== null && day !== selectedDay;

  return (
    <g>
      <g fill="none" strokeLinecap="round" className="stroke-ink">
        {points.slice(1).map((point, i) => {
          const from = points[i];
          const style = TRANSPORT_STROKE[point.transport];
          return (
            <path
              key={point.id}
              d={curve([from.x, from.y], [point.x, point.y], style.bend)}
              strokeWidth={style.width}
              strokeDasharray={style.dash}
              opacity={dim(point.day) ? 0.25 : 1}
              className="transition-opacity duration-200"
            />
          );
        })}
      </g>
      {points.map((point, index) => {
        const active = selectedDay !== null && point.day === selectedDay;
        const label = `Étape ${index + 1} : ${point.name}, jour ${point.day}`;
        const interactive = Boolean(onMarkerSelect);
        return (
          <g
            key={point.id}
            transform={`translate(${point.x} ${point.y})`}
            opacity={dim(point.day) ? 0.4 : 1}
            className={`transition-opacity duration-200 ${interactive ? "cursor-pointer outline-none [&:focus-visible>circle:first-child]:stroke-ink" : ""}`}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? label : undefined}
            onClick={(event) => {
              if (!onMarkerSelect) return;
              event.stopPropagation();
              onMarkerSelect(point.day);
            }}
            onKeyDown={(event) => {
              if (onMarkerSelect && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                onMarkerSelect(point.day);
              }
            }}
          >
            {interactive && <title>{`${label} · arrivée : ${TRANSPORT_NAMES[point.transport]}`}</title>}
            <circle
              r={active ? radius + 3 : radius}
              strokeWidth={active ? 3 : 2.5}
              className={
                active ? "fill-visited stroke-ink" : point.pepite ? "fill-pepite stroke-land" : "fill-ink stroke-land"
              }
            />
            {numbers && (
              <text
                y={radius * 0.42}
                textAnchor="middle"
                fontSize={radius * 1.18}
                fontWeight={800}
                className={`pointer-events-none ${active || point.pepite ? "fill-ink dark:fill-bg" : "fill-surface"}`}
              >
                {index + 1}
              </text>
            )}
            {labels && (
              <text
                x={radius + 6}
                y={4.5}
                fontSize={13}
                fontWeight={700}
                strokeWidth={4}
                strokeLinejoin="round"
                style={{ paintOrder: "stroke" }}
                className="pointer-events-none fill-ink stroke-land"
              >
                {point.name}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Légende des tracés. */
export function RouteLegend({ only, className = "" }: { only?: Transport[]; className?: string }) {
  const items = (Object.keys(TRANSPORT_STROKE) as Transport[]).filter((t) => !only || only.includes(t));
  return (
    <ul aria-label="Légende des tracés" className={`flex flex-wrap gap-x-4 gap-y-1.5 ${className}`}>
      {items.map((transport) => {
        const style = TRANSPORT_STROKE[transport];
        return (
          <li key={transport} className="flex items-center gap-2 text-small text-ink-2">
            <svg aria-hidden viewBox="0 0 32 8" className="h-2 w-8">
              <line
                x1="3"
                x2="29"
                y1="4"
                y2="4"
                strokeWidth={style.width}
                strokeDasharray={style.dash}
                strokeLinecap="round"
                className="stroke-ink"
              />
            </svg>
            {TRANSPORT_NAMES[transport]}
          </li>
        );
      })}
    </ul>
  );
}
