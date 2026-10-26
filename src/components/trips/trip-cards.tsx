"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  countByTransport,
  countryNames,
  dateRange,
  departure,
  km,
  parseDate,
  plural,
  preparation,
  tripDays,
  today,
  tripKm,
  tripMonth,
} from "@/lib/trip-utils";
import type { Trip, TripStatus } from "@/lib/trips-store";
import { MiniRouteMap } from "./mini-route-map";

const BADGE: Record<TripStatus, { tone: BadgeTone; label: string }> = {
  planned: { tone: "orange", label: "Prévu" },
  done: { tone: "yellow", label: "Terminé" },
  idea: { tone: "dashed", label: "Idée" },
};

/** Statut d'un voyage : Prévu (orange), Terminé (jaune), Idée (pointillés). */
export function StatusBadge({ status }: { status: TripStatus }) {
  const { tone, label } = BADGE[status];
  return <Badge tone={tone}>{label}</Badge>;
}

/** Barre de préparation, calculée sur la checklist. */
export function PrepBar({ trip }: { trip: Trip }) {
  const { done, total, ratio } = preparation(trip);
  return (
    <div>
      <div className="flex items-baseline justify-between text-caption">
        <span className="font-semibold text-ink">Préparation</span>
        <span className="text-ink-2 tabular-nums">{total ? `${done} sur ${total}` : "Checklist vide"}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Préparation"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
        className="mt-1.5 h-3 overflow-hidden rounded-[3px] border border-border bg-surface-2"
      >
        <div
          className="h-full origin-left bg-accent-yellow transition-transform duration-700 ease-[var(--ease-spring)]"
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
    </div>
  );
}

/** Le compte à rebours en gros chiffre : « 59 jours avant le départ ». */
function Countdown({ trip }: { trip: Trip }) {
  const jours = trip.startDate ? Math.round((+parseDate(trip.startDate) - +today()) / 86_400_000) : null;
  if (jours === null || jours < 1) {
    return <p className="font-display text-[28px] leading-none font-extrabold tracking-[-0.03em] text-ink">{departure(trip)}</p>;
  }
  return (
    <p className="flex items-baseline gap-2 text-ink">
      <span className="font-display text-[64px] leading-[0.85] font-extrabold tracking-[-0.05em] tabular-nums md:text-[80px]">
        {jours}
      </span>
      <span className="text-caption font-medium text-ink-2">{jours > 1 ? "jours avant le départ" : "jour avant le départ"}</span>
    </p>
  );
}

function Figure({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-4 py-3 first:pl-0">
      <dt className="text-small text-muted">{label}</dt>
      <dd className="font-display text-[22px] leading-tight font-bold tracking-[-0.02em] text-ink tabular-nums">{value}</dd>
    </div>
  );
}

/** Grande fiche du prochain voyage, avec un léger parallaxe sur sa carte. */
export function NextTripCard({ trip }: { trip: Trip }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-18, 18]);
  const countries = countryNames(trip);

  return (
    <Link
      ref={ref}
      href={`/voyages/${trip.id}`}
      className="group grid overflow-hidden rounded-panel border border-border bg-surface transition-[transform,box-shadow] duration-200 ease-[var(--ease-spring)] hover:-translate-y-1 hover:shadow-float lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
    >
      <div className="relative overflow-hidden border-b border-border bg-ocean lg:border-r lg:border-b-0">
        <motion.div style={{ y }} className="h-full scale-[1.08]">
          <MiniRouteMap trip={trip} detailed className="block aspect-[16/10] h-full w-full lg:aspect-auto lg:min-h-80" />
        </motion.div>
      </div>
      <div className="flex flex-col gap-5 p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={trip.status} />
          <span className="text-caption text-ink-2">{dateRange(trip) ?? "Dates à fixer"}</span>
        </div>
        <Countdown trip={trip} />
        <div>
          <h3 className="flex items-start justify-between gap-3 font-display text-[28px] leading-tight font-extrabold tracking-[-0.03em] text-ink">
            {trip.title}
            <ArrowUpRight
              aria-hidden
              strokeWidth={1.75}
              className="mt-1 size-6 shrink-0 transition-transform duration-200 ease-[var(--ease-spring)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </h3>
          {countries.length > 0 && <p className="mt-1 text-caption text-muted">{countries.join(", ")}</p>}
        </div>
        <dl className="grid grid-cols-3 divide-x divide-line border-y border-line">
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
    trip.status === "done" ? (tripMonth(trip) ?? "Sans date") : trip.status === "planned" ? departure(trip) : null;
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
      className={`group flex w-full flex-col overflow-hidden rounded-panel bg-surface transition-[transform,box-shadow] duration-200 ease-[var(--ease-spring)] hover:-translate-y-1 hover:shadow-float ${
        idea ? "border border-dashed border-line-strong" : "border border-border"
      }`}
    >
      <div className={`overflow-hidden bg-ocean ${idea ? "border-b border-dashed border-line-strong" : "border-b border-border"}`}>
        <MiniRouteMap
          trip={trip}
          className="block aspect-[16/10] w-full transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={trip.status} />
          {meta && <span className="text-small text-ink-2 first-letter:uppercase">{meta}</span>}
        </div>
        <h3 className="font-display text-[20px] leading-snug font-bold tracking-[-0.02em] text-ink group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
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
