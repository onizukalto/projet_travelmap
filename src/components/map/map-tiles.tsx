"use client";

import { ArrowUpRight, Check, Download } from "lucide-react";
import Link from "next/link";
import { StatusSwatch } from "@/components/map-patterns";
import { MiniRouteMap } from "@/components/trips/mini-route-map";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Tile } from "@/components/ui/tile";
import {
  CONTINENTS,
  CONTINENT_CODES,
  COUNTRY_BY_KEY,
  UN_MEMBER_COUNT,
  plannerCode,
} from "@/data/countries";
import type { DisplayStatus } from "@/lib/map-store";
import type { MapStats } from "@/lib/map-stats";
import {
  km,
  parseDate,
  plural,
  tripDays,
  tripKm,
  tripMonth,
} from "@/lib/trip-utils";
import { useTripsHydrated, useTripsStore, type Trip } from "@/lib/trips-store";
import { LEGEND_ORDER, STATUS_LABELS } from "./status-meta";

const pourcent = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const formatPourcent = (value: number) => pourcent.format(value);

type TileBase = { index: number; className?: string };

/** Le chiffre-roi : la part du monde explorée, avec une barre à 10 segments. */
export function WorldShareTile({
  stats,
  index,
  className,
}: TileBase & { stats: MapStats }) {
  const share = stats.worldShare * 100;
  return (
    <Tile index={index} label="Du monde exploré" className={className}>
      <p className="font-display text-[76px] leading-[0.85] font-extrabold tracking-[-0.06em] text-ink md:text-hero">
        <AnimatedNumber value={share} format={formatPourcent} />
        <span
          aria-hidden
          className="ml-1 align-top text-[0.42em] tracking-[-0.02em]"
        >
          %
        </span>
      </p>
      <div aria-hidden className="mt-auto flex gap-1 pt-6">
        {Array.from({ length: 10 }, (_, i) => {
          const fill = Math.min(1, Math.max(0, share / 10 - i));
          return (
            <span
              key={i}
              className="relative h-3 flex-1 overflow-hidden rounded-[2px] border border-border bg-surface-2"
            >
              <span
                className="absolute inset-0 origin-left bg-accent-yellow transition-transform duration-700 ease-[var(--ease-spring)]"
                style={{ transform: `scaleX(${fill})` }}
              />
            </span>
          );
        })}
      </div>
      <p className="mt-2.5 text-caption text-ink-2">
        {plural(stats.countryCount, "pays", "pays")} sur {UN_MEMBER_COUNT}{" "}
        membres de l&apos;ONU
      </p>
    </Tile>
  );
}

/** Nombre de pays sur 193. */
export function CountriesTile({
  stats,
  homeName,
  index,
  className,
}: TileBase & { stats: MapStats; homeName: string | null }) {
  return (
    <Tile index={index} label="Pays" className={className}>
      <p className="font-display leading-none font-extrabold tracking-[-0.05em] text-ink">
        <AnimatedNumber value={stats.countryCount} className="text-[56px]" />
        <span className="ml-1 text-[22px] text-muted">/{UN_MEMBER_COUNT}</span>
      </p>
      <p className="mt-auto pt-4 text-caption text-ink-2">
        {homeName ? `Tu vis : ${homeName}` : "Visités ou habités"}
      </p>
    </Tile>
  );
}

/** Continents « X sur 6 », avec ceux qui manquent. */
export function ContinentsTile({
  stats,
  index,
  className,
}: TileBase & { stats: MapStats }) {
  return (
    <Tile index={index} label="Continents" className={className}>
      <p className="font-display leading-none font-extrabold tracking-[-0.05em] text-ink">
        <AnimatedNumber
          value={stats.continents.length}
          className="text-[56px]"
        />
        <span className="ml-1 text-[22px] text-muted">/6</span>
      </p>
      <ul className="mt-auto flex flex-wrap gap-1 pt-4">
        {CONTINENT_CODES.map((code) => {
          const done = stats.continents.includes(code);
          return (
            <li key={code}>
              <Badge tone={done ? "yellow" : "dashed"}>
                {done && (
                  <Check aria-hidden strokeWidth={2.5} className="size-3" />
                )}
                {CONTINENTS[code]}
                <span className="sr-only">
                  {done ? " : visité" : " : à découvrir"}
                </span>
              </Badge>
            </li>
          );
        })}
      </ul>
    </Tile>
  );
}

/** Les prochaines envies : les pays marqués « Envie », avec un raccourci vers le planificateur. */
export function WishesTile({
  wishKeys,
  index,
  className,
}: TileBase & { wishKeys: string[] }) {
  const wishes = wishKeys
    .map((key) => COUNTRY_BY_KEY.get(key))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const shown = wishes.slice(0, 5);

  return (
    <Tile
      index={index}
      label="Prochaines envies"
      action={
        wishes.length > 0 ? <Badge tone="blue">{wishes.length}</Badge> : null
      }
      className={className}
    >
      {wishes.length === 0 ? (
        <p className="text-caption text-ink-2">
          Marque des pays « Envie » sur la carte : ils s&apos;afficheront ici,
          prêts à être planifiés.
        </p>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {shown.map((country) => (
            <li
              key={country.key}
              className="border-t border-line first:border-t-0"
            >
              <Link
                href={`/planifier?pays=${plannerCode(country)}`}
                aria-label={`Planifier un voyage ${country.prep} ${country.name}`}
                className="group flex min-h-11 items-center gap-3 rounded-control px-2 transition-colors duration-150 hover:bg-surface-2"
              >
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-[2px] border border-border bg-pepite-bg"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-ink">
                  {country.name}
                </span>
                <span className="text-small text-muted">
                  {CONTINENTS[country.continent]}
                </span>
                <ArrowUpRight
                  aria-hidden
                  strokeWidth={1.75}
                  className="size-4 text-ink-2 transition-transform duration-200 ease-[var(--ease-spring)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </li>
          ))}
          {wishes.length > shown.length && (
            <li className="border-t border-line px-2 pt-2 text-small text-muted">
              Et{" "}
              {plural(
                wishes.length - shown.length,
                "autre envie",
                "autres envies",
              )}
            </li>
          )}
        </ul>
      )}
    </Tile>
  );
}

const time = (trip: Trip) =>
  +parseDate(trip.endDate ?? trip.startDate ?? "1970-01-01");

/** Le dernier voyage terminé, avec sa mini-carte. */
export function LastTripTile({ index, className }: TileBase) {
  const trips = useTripsStore((state) => state.trips);
  const hydrated = useTripsHydrated();
  const last = trips
    .filter((t) => t.status === "done")
    .sort((a, b) => time(b) - time(a))[0];

  return (
    <Tile index={index} label="Dernier voyage" className={className}>
      {!hydrated ? (
        <div
          aria-hidden
          className="aspect-[16/9] rounded-control bg-surface-2"
        />
      ) : last ? (
        <Link
          href={`/voyages/${last.id}`}
          className="group -m-1 flex flex-col gap-3 rounded-control p-1"
        >
          <div className="overflow-hidden rounded-control border border-border">
            <MiniRouteMap
              trip={last}
              className="block aspect-[16/9] w-full transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-[1.04]"
            />
          </div>
          <div>
            <p className="text-small text-muted first-letter:uppercase">
              {tripMonth(last) ?? "Sans date"}
            </p>
            <p className="font-display text-[20px] leading-tight font-bold tracking-[-0.02em] text-ink group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
              {last.title}
            </p>
            <p className="mt-0.5 text-caption text-ink-2 tabular-nums">
              {plural(tripDays(last), "jour", "jours")}
              {tripKm(last) > 0 && ` · ${km.format(tripKm(last))} km`}
            </p>
          </div>
        </Link>
      ) : (
        <div className="flex flex-1 flex-col items-start gap-4">
          <p className="text-caption text-ink-2">
            Aucun voyage terminé pour l&apos;instant. Note ton dernier road trip
            !
          </p>
          <ButtonLink href="/voyages" variant="secondary" className="mt-auto">
            Ajouter un voyage
          </ButtonLink>
        </div>
      )}
    </Tile>
  );
}

type LegendProps = TileBase & {
  stats: MapStats;
  hidden: ReadonlySet<DisplayStatus>;
  onToggle: (status: DisplayStatus) => void;
  onShare: () => void;
  sharing: boolean;
  shareError: boolean;
};

/** Légende : quatre pastilles qui servent aussi de filtres, et le bouton de partage. */
export function LegendTile({
  stats,
  hidden,
  onToggle,
  onShare,
  sharing,
  shareError,
  index,
  className,
}: LegendProps) {
  return (
    <Tile index={index} label="Légende et filtres" className={className}>
      <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center md:justify-between lg:flex-col lg:items-start lg:justify-between">
        <div className="flex flex-col gap-3">
          <ul aria-label="Filtres de la carte" className="flex flex-wrap gap-2">
            {LEGEND_ORDER.map((status) => {
              const shown = !hidden.has(status);
              return (
                <li key={status}>
                  <button
                    type="button"
                    aria-pressed={shown}
                    title={shown ? "Estomper ces pays" : "Afficher ces pays"}
                    onClick={() => onToggle(status)}
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-3 text-caption transition-[background-color,color,transform] duration-150 active:scale-95 ${
                      shown
                        ? "border-border bg-surface text-ink hover:bg-surface-2"
                        : "border-dashed border-line-strong text-muted hover:text-ink"
                    }`}
                  >
                    <span
                      className={`transition-opacity duration-150 ${shown ? "" : "opacity-30"}`}
                    >
                      <StatusSwatch status={status} />
                    </span>
                    <span className="font-semibold">
                      {STATUS_LABELS[status]}
                    </span>
                    <AnimatedNumber
                      value={stats.counts[status]}
                      className="text-ink-2 tabular-nums"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-small text-muted">
            Touche une pastille pour estomper ces pays sur la carte.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 md:items-end lg:items-start">
          <Button variant="primary" onClick={onShare} disabled={sharing}>
            <Download aria-hidden strokeWidth={1.75} className="size-[18px]" />
            {sharing ? "Préparation…" : "Partager ma carte"}
          </Button>
          <p role="status" className="text-small text-warn-ink empty:hidden">
            {shareError ? "L'image n'a pas pu être créée. Réessaie." : ""}
          </p>
        </div>
      </div>
    </Tile>
  );
}
