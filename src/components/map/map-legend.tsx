"use client";

import { Download } from "lucide-react";
import { StatusSwatch } from "@/components/map-patterns";
import { CONTINENTS, UN_MEMBER_COUNT } from "@/data/countries";
import { buttonSecondary } from "@/lib/button";
import type { DisplayStatus } from "@/lib/map-store";
import type { MapStats } from "@/lib/map-stats";
import { LEGEND_ORDER, STATUS_LABELS } from "./status-meta";

const percent = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

type Props = {
  stats: MapStats;
  hidden: ReadonlySet<DisplayStatus>;
  onToggle: (status: DisplayStatus) => void;
  onShare: () => void;
  sharing: boolean;
  shareError: boolean;
};

/** Bande sous la carte : compteur, barre d'échelle, continents, filtres et partage. */
export function MapLegend({ stats, hidden, onToggle, onShare, sharing, shareError }: Props) {
  const share = stats.worldShare * 100;

  return (
    <section
      aria-label="Statistiques et légende"
      className="grid gap-6 rounded-panel border border-line bg-surface p-5 md:grid-cols-[auto_auto_1fr_auto] md:items-center md:gap-8 md:px-6"
    >
      <div>
        <p className="text-ink">
          <span className="text-[32px] leading-none font-extrabold tabular-nums">
            {stats.countryCount}
          </span>{" "}
          <span className="text-ink-2">pays sur {UN_MEMBER_COUNT}</span>
        </p>
        {/* Barre d'échelle à 10 segments, comme sur une carte */}
        <div className="mt-2 w-56">
          <div aria-hidden className="flex h-3 overflow-hidden rounded-[2px] border border-ink">
            {Array.from({ length: 10 }, (_, i) => {
              const fill = Math.min(1, Math.max(0, share / 10 - i));
              return (
                <div
                  key={i}
                  className={`relative flex-1 border-l border-ink first:border-l-0 ${
                    i % 2 ? "bg-surface-raised" : "bg-line"
                  }`}
                >
                  <div
                    className="absolute inset-0 origin-left bg-visited transition-transform duration-500 ease-out"
                    style={{ transform: `scaleX(${fill})` }}
                  />
                </div>
              );
            })}
          </div>
          <p className="mt-1 text-small text-ink-2 tabular-nums">
            {percent.format(share)} % du monde
          </p>
        </div>
      </div>

      <div>
        <p className="text-ink">
          <span className="text-[32px] leading-none font-extrabold tabular-nums">
            {stats.continents.length}
          </span>{" "}
          <span className="text-ink-2">continents sur 6</span>
        </p>
        <p className="mt-1 max-w-64 text-small text-ink-2">
          {stats.missingContinents.length === 0
            ? "Les six continents sont cochés."
            : `Il manque : ${stats.missingContinents.map((c) => CONTINENTS[c]).join(", ")}.`}
        </p>
      </div>

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
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-control border px-3 text-caption transition-colors duration-150 ${
                  shown
                    ? "border-line text-ink hover:border-ink-2"
                    : "border-dashed border-line-strong text-muted"
                }`}
              >
                <span className={shown ? "" : "opacity-35"}>
                  <StatusSwatch status={status} />
                </span>
                <span className="font-semibold">{STATUS_LABELS[status]}</span>
                <span className="tabular-nums text-ink-2">{stats.counts[status]}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-1.5">
        <button type="button" onClick={onShare} disabled={sharing} className={buttonSecondary}>
          <Download aria-hidden strokeWidth={1.8} className="size-[18px]" />
          {sharing ? "Préparation…" : "Partager ma carte"}
        </button>
        <p role="status" className="text-small text-warn-ink empty:hidden">
          {shareError ? "L'image n'a pas pu être créée. Réessaie." : ""}
        </p>
      </div>
    </section>
  );
}
