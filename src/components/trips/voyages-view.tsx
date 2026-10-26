"use client";

import { Compass, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { RouteSketch } from "@/components/route-sketch";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Tile } from "@/components/ui/tile";
import { km, parseDate, plural, tripDays, tripKm } from "@/lib/trip-utils";
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
const kilometres = (value: number) => km.format(Math.round(value));

/** La page Voyages : stats en bento, filtres, prochain voyage, idées et souvenirs. */
export function VoyagesView() {
  const trips = useTripsStore((state) => state.trips);
  const createTrip = useTripsStore((state) => state.createTrip);
  const hydrated = useTripsHydrated();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);

  const { upcoming, done, ideas } = useMemo(() => {
    const byStart = (a: Trip, b: Trip) => (time(a.startDate) ?? Infinity) - (time(b.startDate) ?? Infinity);
    const byRecent = (a: Trip, b: Trip) =>
      (time(b.endDate ?? b.startDate) ?? 0) - (time(a.endDate ?? a.startDate) ?? 0);
    return {
      upcoming: trips.filter((t) => t.status === "planned").sort(byStart),
      done: trips.filter((t) => t.status === "done").sort(byRecent),
      ideas: trips.filter((t) => t.status === "idea"),
    };
  }, [trips]);

  // Les stats des voyages terminés, calculées sur les données réelles.
  const stats = useMemo(
    () => ({
      jours: done.reduce((sum, trip) => sum + tripDays(trip), 0),
      km: done.reduce((sum, trip) => sum + tripKm(trip), 0),
      pays: new Set(done.flatMap((trip) => trip.countries)).size,
    }),
    [done],
  );

  const counts: Record<Filter, number> = {
    all: trips.length,
    planned: upcoming.length,
    done: done.length,
    idea: ideas.length,
  };

  const summary =
    trips.length === 0
      ? "Ton carnet est vide pour l'instant."
      : done.length === 0
        ? `${plural(upcoming.length, "voyage prévu", "voyages prévus")}, aucun terminé pour l'instant.`
        : `${plural(done.length, "voyage terminé", "voyages terminés")}, ${plural(stats.jours, "jour", "jours")} sur la route.`;

  const show = (section: Filter) => filter === "all" || filter === section;
  const [next, ...laterTrips] = upcoming;
  const nothingInFilter = filter !== "all" && counts[filter] === 0;
  const openForm = () => setCreating(true);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 md:px-6 md:py-12 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-[48px] leading-[0.9] font-extrabold tracking-[-0.05em] text-ink md:text-[72px]">
            Voyages
          </h1>
          <p className="mt-3 min-h-[1.55em] text-lg text-ink-2">{hydrated ? summary : ""}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/planifier" variant="secondary">
            <Compass aria-hidden strokeWidth={1.75} className="size-[18px]" />
            Planifier avec l&apos;assistant
          </ButtonLink>
          <Button variant="primary" onClick={openForm}>
            <Plus aria-hidden strokeWidth={1.75} className="size-[18px]" />
            Nouveau voyage
          </Button>
        </div>
      </div>

      {!hydrated ? (
        <div aria-hidden className="mt-10 h-72 animate-pulse rounded-panel bg-surface-2 motion-reduce:animate-none" />
      ) : trips.length === 0 ? (
        <EmptyCarnet onCreate={openForm} />
      ) : (
        <>
          {/* Les stats des voyages terminés, en bento */}
          <div className="bento mt-8 grid-cols-2 lg:grid-cols-4">
            <StatTile index={0} label="Voyages terminés" value={done.length} />
            <StatTile index={1} label="Jours sur la route" value={stats.jours} />
            <StatTile index={2} label="Kilomètres parcourus" value={stats.km} format={kilometres} suffixe="km" />
            <StatTile index={3} label="Pays traversés" value={stats.pays} />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Segmented
              ariaLabel="Filtrer les voyages"
              value={filter}
              onChange={setFilter}
              className="w-full sm:w-auto"
              options={FILTERS.map(({ value, label }) => ({
                value,
                label: `${label} ${counts[value]}`,
              }))}
            />
          </div>

          {nothingInFilter && (
            <div className="mt-8 flex flex-col items-start gap-4 rounded-panel border border-dashed border-line-strong p-6 md:p-8">
              <p className="text-ink">
                {filter === "planned" && "Aucun voyage prévu. Fixe des dates à une idée ou crée un nouveau voyage."}
                {filter === "done" && "Aucun voyage terminé pour l'instant. Tes souvenirs apparaîtront ici."}
                {filter === "idea" && "Aucune idée en réserve. Note une envie de voyage, même sans dates."}
              </p>
              <Button variant="secondary" onClick={openForm}>
                <Plus aria-hidden strokeWidth={1.75} className="size-[18px]" />
                Nouveau voyage
              </Button>
            </div>
          )}

          {show("planned") && next && (
            <Section id="a-venir" titre="À venir" compte={upcoming.length}>
              <div className="scroll-reveal">
                <NextTripCard trip={next} />
              </div>
              {laterTrips.length > 0 && <Grille trips={laterTrips} />}
            </Section>
          )}

          {show("idea") && ideas.length > 0 && (
            <Section id="idees" titre="Idées" compte={ideas.length}>
              <Grille trips={ideas} />
            </Section>
          )}

          {show("done") && done.length > 0 && (
            <Section id="souvenirs" titre="Souvenirs" compte={done.length}>
              <Grille trips={done} />
            </Section>
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

function StatTile({
  index,
  label,
  value,
  format,
  suffixe,
}: {
  index: number;
  label: string;
  value: number;
  format?: (value: number) => string;
  suffixe?: string;
}) {
  return (
    <Tile index={index} label={label}>
      <p className="font-display leading-none font-extrabold tracking-[-0.05em] text-ink">
        <AnimatedNumber value={value} format={format} className="text-[44px] md:text-[56px]" />
        {suffixe && <span className="ml-1.5 text-[20px] text-muted">{suffixe}</span>}
      </p>
    </Tile>
  );
}

function Section({ id, titre, compte, children }: { id: string; titre: string; compte: number; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-14">
      <h2 id={id} className="scroll-reveal flex items-center gap-3 font-display text-[28px] font-extrabold tracking-[-0.035em] text-ink md:text-[36px]">
        {titre}
        <Badge tone="neutral">{compte}</Badge>
      </h2>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Grille({ trips }: { trips: Trip[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {trips.map((trip) => (
        // L'apparition au défilement est sur l'élément de liste, le survol sur la fiche : jamais les deux au même endroit.
        <li key={trip.id} className="scroll-reveal flex">
          <TripCard trip={trip} />
        </li>
      ))}
    </ul>
  );
}

function EmptyCarnet({ onCreate }: { onCreate: () => void }) {
  return (
    <section aria-labelledby="carnet-vide" className="bento mt-8 md:mt-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="bg-ocean">
        <RouteSketch className="block h-full w-full" />
      </div>
      <div className="flex flex-col justify-center p-6 md:p-10">
        <h2 id="carnet-vide" className="font-display text-[28px] leading-tight font-extrabold tracking-[-0.035em] text-ink md:text-[36px]">
          Ton carnet de voyages est vide
        </h2>
        <p className="mt-3 max-w-[46ch] text-ink-2">
          Note un voyage passé ou prépare le prochain. Ajoute ses étapes jour par jour : le tracé se dessine sur la carte,
          et les pays traversés se colorient tout seuls.
        </p>
        <RouteLegend className="mt-6" />
        <Button variant="primary" onClick={onCreate} className="mt-7 self-start">
          <Plus aria-hidden strokeWidth={1.75} className="size-[18px]" />
          Créer mon premier voyage
        </Button>
      </div>
    </section>
  );
}
