import Link from "next/link";
import {
  countByTransport,
  countryNames,
  dateRange,
  departure,
  km,
  plural,
  preparation,
  tripDays,
  tripKm,
  tripMonth,
} from "@/lib/trip-utils";
import type { Trip, TripStatus } from "@/lib/trips-store";
import { MiniRouteMap } from "./mini-route-map";

const BADGE: Record<TripStatus, string> = {
  planned: "bg-warn-bg text-warn-ink",
  done: "bg-pepite-bg text-pepite",
  idea: "border border-dashed border-line-strong text-ink-2",
};

export function StatusBadge({ status }: { status: TripStatus }) {
  const label = { planned: "Prévu", done: "Terminé", idea: "Idée" }[status];
  return (
    <span className={`inline-flex items-center rounded-badge px-2 pt-1 pb-0.5 text-small font-bold ${BADGE[status]}`}>
      {label}
    </span>
  );
}

/** Barre de préparation, calculée sur la checklist. */
export function PrepBar({ trip }: { trip: Trip }) {
  const { done, total, ratio } = preparation(trip);
  return (
    <div>
      <div className="flex items-baseline justify-between text-caption">
        <span className="font-semibold text-ink">Préparation</span>
        <span className="text-ink-2 tabular-nums">
          {total ? `${done} sur ${total}` : "Checklist vide"}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Préparation"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full origin-left rounded-full bg-ink transition-transform duration-500 ease-out"
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-small text-muted">{label}</dt>
      <dd className="text-[22px] leading-tight font-extrabold text-ink tabular-nums">{value}</dd>
    </div>
  );
}

/** Grande fiche du prochain voyage. */
export function NextTripCard({ trip }: { trip: Trip }) {
  const countries = countryNames(trip);
  return (
    <Link
      href={`/voyages/${trip.id}`}
      className="group grid overflow-hidden rounded-panel border border-line bg-surface transition-colors duration-150 hover:border-ink-2 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
    >
      <MiniRouteMap
        trip={trip}
        detailed
        className="block aspect-[5/3] h-full w-full md:aspect-auto md:min-h-72"
      />
      <div className="flex flex-col gap-4 p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={trip.status} />
          <span className="text-caption font-semibold text-ink-2">{departure(trip)}</span>
        </div>
        <div>
          <h3 className="text-[24px] leading-tight font-extrabold text-ink group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
            {trip.title}
          </h3>
          <p className="mt-1 text-ink-2">{dateRange(trip) ?? "Dates à fixer"}</p>
          {countries.length > 0 && <p className="mt-1 text-caption text-muted">{countries.join(", ")}</p>}
        </div>
        <dl className="grid grid-cols-3 gap-3">
          <Figure label="Durée" value={plural(tripDays(trip), "jour", "jours")} />
          <Figure label="Étapes" value={trip.stops.length} />
          <Figure label="Ferries" value={countByTransport(trip, "ferry")} />
        </dl>
        {trip.stops.length > 0 && (
          <p className="text-caption text-ink-2">
            <span className="sr-only">Parcours : </span>
            {trip.stops.map((stop, index) => (
              <span key={stop.id}>
                {index > 0 && <span aria-hidden className="px-1.5 text-muted">→</span>}
                {stop.name}
              </span>
            ))}
          </p>
        )}
        <div className="mt-auto">
          <PrepBar trip={trip} />
        </div>
      </div>
    </Link>
  );
}

/** Fiche compacte : souvenir, voyage prévu ou idée (bordure en pointillés). */
export function TripCard({ trip }: { trip: Trip }) {
  const idea = trip.status === "idea";
  const meta =
    trip.status === "done"
      ? (tripMonth(trip) ?? "Sans date")
      : trip.status === "planned"
        ? departure(trip)
        : "Idée";
  const distance = tripKm(trip);
  const details =
    trip.status === "idea"
      ? [plural(trip.stops.length, "étape", "étapes")]
      : [plural(tripDays(trip), "jour", "jours"), distance ? `${km.format(distance)} km` : null].filter(
          (part): part is string => Boolean(part),
        );

  return (
    <Link
      href={`/voyages/${trip.id}`}
      className={`group flex flex-col overflow-hidden rounded-panel bg-surface transition-colors duration-150 ${
        idea
          ? "border-2 border-dashed border-line-strong hover:border-ink-2"
          : "border border-line hover:border-ink-2"
      }`}
    >
      <MiniRouteMap trip={trip} className="block aspect-[5/3] w-full" />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-small font-semibold text-ink-2 first-letter:uppercase">{meta}</p>
        <h3 className="text-[18px] leading-snug font-bold text-ink group-hover:underline group-hover:underline-offset-4">
          {trip.title}
        </h3>
        <p className="mt-auto flex flex-wrap gap-x-2 pt-1 text-caption text-muted tabular-nums">
          {details.map((part, index) => (
            <span key={part} className="flex gap-x-2">
              {index > 0 && <span aria-hidden>·</span>}
              {part}
            </span>
          ))}
        </p>
      </div>
    </Link>
  );
}
