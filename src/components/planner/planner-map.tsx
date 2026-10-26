"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { MiniRouteMap } from "@/components/trips/mini-route-map";
import { TripMap } from "@/components/trips/trip-map";
import type { Trip } from "@/lib/trips-store";
import { stopsDuJour, type ItineraireRendu } from "./types";

type Props = {
  itineraire: ItineraireRendu;
  day: number;
  onDayChange: (day: number) => void;
};

/** Carte du jour affiché, sélecteur « Jour N sur M » et mini-carte du parcours complet. */
export function PlannerMap({ itineraire, day, onDayChange }: Props) {
  const days = itineraire.jours.map((j) => j.jour);
  const index = Math.max(0, days.indexOf(day));
  const current = itineraire.jours[index];
  const stops = useMemo(() => stopsDuJour(itineraire, day), [itineraire, day]);
  const pepites = useMemo(
    () => new Set(current?.etapes.filter((e) => e.pepite).map((e) => `${day}-${e.id}`) ?? []),
    [current, day],
  );

  // Le parcours complet, au format attendu par la mini-carte des voyages.
  const fullRoute = useMemo<Trip>(
    () => ({
      id: "apercu",
      title: itineraire.titre,
      countries: [],
      status: "idea",
      stops: itineraire.jours.flatMap((j) => stopsDuJour(itineraire, j.jour)),
      notes: "",
      checklist: [],
      budget: [],
    }),
    [itineraire],
  );

  const go = (step: number) => onDayChange(days[Math.min(days.length - 1, Math.max(0, index + step))]);

  return (
    <div className="relative h-full min-h-0">
      <TripMap
        stops={stops}
        selectedDay={null}
        onSelectDay={() => {}}
        pepiteIds={pepites}
        minSpan={0.25}
        labels
        legend={
          <ul aria-label="Légende" className="flex gap-4 text-small text-ink-2">
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-3 rounded-full bg-ink" />
              Étape
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-3 rounded-full bg-pepite" />
              Pépite
            </li>
          </ul>
        }
      />

      <div className="absolute top-3 left-3 flex items-center gap-1 rounded-control border border-line bg-surface-raised p-1">
        <button
          type="button"
          aria-label="Jour précédent"
          disabled={index === 0}
          onClick={() => go(-1)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-control text-ink hover:bg-bg disabled:cursor-default disabled:text-muted disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <ChevronLeft aria-hidden strokeWidth={1.8} className="size-5" />
        </button>
        <p aria-live="polite" className="min-w-0 px-1 text-center">
          <span className="block font-bold text-ink tabular-nums">
            Jour {day} sur {days.length}
          </span>
          {current && <span className="block max-w-56 truncate text-small text-ink-2">{current.titre}</span>}
        </p>
        <button
          type="button"
          aria-label="Jour suivant"
          disabled={index === days.length - 1}
          onClick={() => go(1)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-control text-ink hover:bg-bg disabled:cursor-default disabled:text-muted disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <ChevronRight aria-hidden strokeWidth={1.8} className="size-5" />
        </button>
      </div>

      {fullRoute.stops.length > 1 && (
        <figure className="absolute right-3 bottom-3 hidden w-44 overflow-hidden rounded-control border border-line bg-surface-raised sm:block">
          <MiniRouteMap trip={fullRoute} className="block aspect-[5/3] w-full" />
          <figcaption className="px-2 py-1 text-small text-ink-2">Parcours complet</figcaption>
        </figure>
      )}
    </div>
  );
}
