"use client";

import { Compass, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RouteSketch } from "@/components/route-sketch";
import { buttonPrimary, buttonSecondary } from "@/lib/button";
import { parseDate, plural, tripDays } from "@/lib/trip-utils";
import { useTripsHydrated, useTripsStore, type Trip } from "@/lib/trips-store";
import { RouteLegend } from "./route-lines";
import { NextTripCard, TripCard } from "./trip-cards";
import { TripFormDialog } from "./trip-form-dialog";

type Filter = "all" | "planned" | "done" | "idea";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "planned", label: "Prévus" },
  { value: "done", label: "Terminés" },
  { value: "idea", label: "Idées" },
];

const time = (date?: string) => (date ? +parseDate(date) : null);

export function VoyagesView() {
  const trips = useTripsStore((state) => state.trips);
  const createTrip = useTripsStore((state) => state.createTrip);
  const hydrated = useTripsHydrated();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);

  const { upcoming, done, ideas } = useMemo(() => {
    const byStart = (a: Trip, b: Trip) =>
      (time(a.startDate) ?? Infinity) - (time(b.startDate) ?? Infinity);
    const byRecent = (a: Trip, b: Trip) =>
      (time(b.endDate ?? b.startDate) ?? 0) - (time(a.endDate ?? a.startDate) ?? 0);
    return {
      upcoming: trips.filter((t) => t.status === "planned").sort(byStart),
      done: trips.filter((t) => t.status === "done").sort(byRecent),
      ideas: trips.filter((t) => t.status === "idea"),
    };
  }, [trips]);

  const counts: Record<Filter, number> = {
    all: trips.length,
    planned: upcoming.length,
    done: done.length,
    idea: ideas.length,
  };

  const daysOnRoad = done.reduce((sum, trip) => sum + tripDays(trip), 0);
  const summary =
    trips.length === 0
      ? "Ton carnet est vide pour l'instant."
      : done.length === 0
        ? `${plural(upcoming.length, "voyage prévu", "voyages prévus")}, aucun terminé pour l'instant.`
        : `${plural(done.length, "voyage terminé", "voyages terminés")}, ${plural(daysOnRoad, "jour", "jours")} sur la route.`;

  const show = (section: Filter) => filter === "all" || filter === section;
  const [next, ...laterTrips] = upcoming;
  const nothingInFilter = filter !== "all" && counts[filter] === 0;

  const openForm = () => setCreating(true);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6 md:py-12 lg:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[32px] leading-[1.1] font-extrabold tracking-[-0.02em] text-ink md:text-page-title">
            Voyages
          </h1>
          <p className="mt-2 min-h-[1.55em] text-ink-2">{hydrated ? summary : ""}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/planifier" className={buttonSecondary}>
            <Compass aria-hidden strokeWidth={1.8} className="size-[18px]" />
            Planifier avec l&apos;assistant
          </Link>
          <button type="button" onClick={openForm} className={buttonPrimary}>
            <Plus aria-hidden strokeWidth={1.8} className="size-[18px]" />
            Nouveau voyage
          </button>
        </div>
      </div>

      {!hydrated ? (
        <div aria-hidden className="mt-10 h-72 animate-pulse rounded-panel bg-surface motion-reduce:animate-none" />
      ) : trips.length === 0 ? (
        <EmptyCarnet onCreate={openForm} />
      ) : (
        <>
          <div role="group" aria-label="Filtrer les voyages" className="mt-8 flex flex-wrap gap-2">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-3.5 text-caption transition-colors duration-150 ${
                  filter === value
                    ? "border-ink bg-ink font-bold text-surface"
                    : "border-line bg-surface text-ink hover:border-ink-2"
                }`}
              >
                {label}
                <span className={`tabular-nums ${filter === value ? "opacity-80" : "text-muted"}`}>
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>

          {nothingInFilter && (
            <div className="mt-8 flex flex-col items-start gap-4 rounded-panel border-2 border-dashed border-line-strong p-6 md:p-8">
              <p className="text-ink">
                {filter === "planned" && "Aucun voyage prévu. Fixe des dates à une idée ou crée un nouveau voyage."}
                {filter === "done" && "Aucun voyage terminé pour l'instant. Tes souvenirs apparaîtront ici."}
                {filter === "idea" && "Aucune idée en réserve. Note une envie de voyage, même sans dates."}
              </p>
              <button type="button" onClick={openForm} className={buttonSecondary}>
                <Plus aria-hidden strokeWidth={1.8} className="size-[18px]" />
                Nouveau voyage
              </button>
            </div>
          )}

          {show("planned") && next && (
            <section aria-labelledby="a-venir" className="mt-10">
              <h2 id="a-venir" className="text-section text-ink md:text-[24px]">
                À venir
              </h2>
              <div className="mt-4">
                <NextTripCard trip={next} />
              </div>
              {laterTrips.length > 0 && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {laterTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              )}
            </section>
          )}

          {show("idea") && ideas.length > 0 && (
            <section aria-labelledby="idees" className="mt-12">
              <h2 id="idees" className="text-section text-ink md:text-[24px]">
                Idées
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ideas.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          )}

          {show("done") && done.length > 0 && (
            <section aria-labelledby="souvenirs" className="mt-12">
              <h2 id="souvenirs" className="text-section text-ink md:text-[24px]">
                Souvenirs
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {done.map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <TripFormDialog
        open={creating}
        heading="Nouveau voyage"
        submitLabel="Créer le voyage"
        onClose={() => setCreating(false)}
        onSubmit={(fields) => {
          const id = createTrip(fields);
          setCreating(false);
          router.push(`/voyages/${id}`);
        }}
      />
    </div>
  );
}

function EmptyCarnet({ onCreate }: { onCreate: () => void }) {
  return (
    <section
      aria-labelledby="carnet-vide"
      className="mt-8 grid overflow-hidden rounded-panel border-2 border-dashed border-line-strong bg-surface md:mt-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      <div className="border-b-2 border-dashed border-line-strong md:border-r-2 md:border-b-0">
        <RouteSketch className="block h-full w-full" />
      </div>
      <div className="flex flex-col justify-center p-6 md:p-10">
        <h2 id="carnet-vide" className="text-section text-ink md:text-[24px]">
          Ton carnet de voyages est vide
        </h2>
        <p className="mt-3 max-w-[46ch] text-ink">
          Note un voyage passé ou prépare le prochain. Ajoute ses étapes jour par jour : le tracé se
          dessine sur la carte, et les pays traversés se colorient tout seuls.
        </p>
        <RouteLegend className="mt-6" />
        <button type="button" onClick={onCreate} className={`${buttonPrimary} mt-7 self-start`}>
          <Plus aria-hidden strokeWidth={1.8} className="size-[18px]" />
          Créer mon premier voyage
        </button>
      </div>
    </section>
  );
}
