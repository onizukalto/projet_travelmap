"use client";

import { Car, ChevronLeft, ChevronRight } from "lucide-react";
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
  // Jour de route sans étape : on cadre sur la destination (le jour suivant), en marqueurs estompés.
  const destination = useMemo(() => {
    if (stops.length > 0) return [];
    const suivants = itineraire.jours.filter((j) => j.jour > day).map((j) => stopsDuJour(itineraire, j.jour));
    return suivants.find((s) => s.length > 0) ?? [];
  }, [itineraire, day, stops]);
  const pepites = useMemo(
    // Même format d'id que stopsDuJour : jour, position, lieu.
    () => new Set(current?.etapes.flatMap((e, i) => (e.pepite ? [`${day}-${i}-${e.id}`] : [])) ?? []),
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
        stops={stops.length > 0 ? stops : destination}
        selectedDay={stops.length > 0 ? null : day}
        onSelectDay={() => {}}
        pepiteIds={pepites}
        minSpan={1}
        labels
        // La mini-carte du parcours occupe le coin bas droit à partir de sm.
        controlsClassName="right-3 bottom-3 sm:top-3 sm:bottom-auto"
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

      <div className="absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-control border border-border bg-surface p-1 sm:max-w-[calc(100%-5.5rem)]">
        <button
          type="button"
          aria-label="Jour précédent"
          disabled={index === 0}
          onClick={() => go(-1)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-control text-ink transition-colors duration-150 hover:bg-surface-2 disabled:cursor-default disabled:text-muted disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <ChevronLeft aria-hidden strokeWidth={1.75} className="size-5" />
        </button>
        <p aria-live="polite" className="min-w-0 px-1 text-center">
          <span className="block font-display text-[17px] font-extrabold tracking-[-0.02em] text-ink tabular-nums">
            Jour {day} sur {days.length}
          </span>
          {current && <span className="block max-w-56 truncate text-small text-ink-2">{current.titre}</span>}
          {current?.trajet && (
            <span className="flex max-w-64 items-start justify-center gap-1 text-small text-ink-2">
              <Car aria-hidden strokeWidth={1.75} className="mt-0.5 size-3.5 shrink-0" />
              {current.trajet}
            </span>
          )}
        </p>
        <button
          type="button"
          aria-label="Jour suivant"
          disabled={index === days.length - 1}
          onClick={() => go(1)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-control text-ink transition-colors duration-150 hover:bg-surface-2 disabled:cursor-default disabled:text-muted disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <ChevronRight aria-hidden strokeWidth={1.75} className="size-5" />
        </button>
      </div>

      {fullRoute.stops.length > 1 && (
        <figure className="absolute right-3 bottom-3 hidden w-44 overflow-hidden rounded-control border border-border bg-surface sm:block">
          <MiniRouteMap trip={fullRoute} className="block aspect-[5/3] w-full" />
          <figcaption className="border-t border-line px-2 py-1 text-small text-ink-2">Parcours complet</figcaption>
        </figure>
      )}
    </div>
  );
}
