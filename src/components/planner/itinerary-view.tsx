"use client";

import { BookmarkPlus, Car, ChevronDown, ExternalLink, Gem, Star } from "lucide-react";
import { useState } from "react";
import { buttonPrimary } from "@/lib/button";
import { CrowdGauge } from "./crowd-gauge";
import type { EtapeRendue, ItineraireRendu } from "./types";

const noteFr = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const avisFr = new Intl.NumberFormat("fr-FR");

type Props = {
  itineraire: ItineraireRendu;
  /** Jour affiché sur la carte. */
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  /** Absent pour un ancien itinéraire de la conversation : on n'enregistre que le dernier. */
  onSave?: () => void | Promise<void>;
};

/** L'itinéraire proposé par l'assistant : un accordéon par jour. */
export function ItineraryView({ itineraire, selectedDay, onSelectDay, onSave }: Props) {
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([itineraire.jours[0]?.jour]));
  const total = itineraire.jours.reduce((n, j) => n + j.etapes.length, 0);

  const toggle = (day: number) => {
    const willOpen = !open.has(day);
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
    if (willOpen) onSelectDay(day);
  };

  return (
    <section aria-label={`Itinéraire : ${itineraire.titre}`} className="rounded-panel border border-line bg-surface">
      <header className="px-4 pt-4 md:px-5 md:pt-5">
        <h3 className="text-section text-ink">{itineraire.titre}</h3>
        <p className="mt-0.5 text-small text-muted">{itineraire.verification}</p>
      </header>

      <ol className="mt-3">
        {itineraire.jours.map((jour) => {
          const expanded = open.has(jour.jour);
          const shown = selectedDay === jour.jour;
          const panelId = `jour-${itineraire.titre}-${jour.jour}`.replace(/\s+/g, "-");
          return (
            <li key={jour.jour} className="border-t border-line">
              <h4>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggle(jour.jour)}
                  className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left hover:bg-bg md:px-5"
                >
                  <span
                    className={`px-0.5 pt-0.5 font-extrabold whitespace-nowrap text-ink ${
                      shown ? "shadow-[inset_0_-8px_0_var(--visited)] dark:shadow-[inset_0_-3px_0_var(--visited)]" : ""
                    }`}
                  >
                    Jour {jour.jour}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-ink-2">{jour.titre}</span>
                  {jour.etapes.length > 0 ? (
                    <span className="text-small text-muted">{jour.etapes.length}</span>
                  ) : (
                    jour.trajet && <Car aria-label="Jour de route" strokeWidth={1.8} className="size-4 shrink-0 text-muted" />
                  )}
                  <ChevronDown
                    aria-hidden
                    strokeWidth={1.8}
                    className={`size-5 shrink-0 text-ink-2 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              </h4>
              {expanded && (
                <ol id={panelId} className="flex flex-col gap-3 px-4 pb-4 md:px-5">
                  {/* Jour de route : le trajet, sous le titre (seul s'il n'y a pas d'étape) */}
                  {jour.trajet && (
                    <li className="flex items-center gap-2 text-caption text-ink-2">
                      <Car aria-hidden strokeWidth={1.8} className="size-4 shrink-0" />
                      <span>
                        <span className="sr-only">Trajet : </span>
                        {jour.trajet}
                      </span>
                    </li>
                  )}
                  {jour.etapes.length === 0 && !jour.trajet && (
                    <li className="text-caption text-ink-2">Aucune étape vérifiée pour ce jour.</li>
                  )}
                  {jour.etapes.map((etape, index) => (
                    <StepCard key={`${etape.id}-${index}`} etape={etape} number={index + 1} />
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>

      {onSave && total > 0 && (
        <div className="border-t border-line p-4 md:px-5">
          <button type="button" onClick={onSave} className={`${buttonPrimary} w-full sm:w-auto`}>
            <BookmarkPlus aria-hidden strokeWidth={1.8} className="size-[18px]" />
            Enregistrer le voyage
          </button>
        </div>
      )}
    </section>
  );
}

function StepCard({ etape, number }: { etape: EtapeRendue; number: number }) {
  return (
    <li
      className={`rounded-panel border p-3.5 ${
        etape.pepite ? "border-pepite/40 bg-pepite-bg/50" : "border-line bg-surface-raised"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-small font-extrabold tabular-nums ${
            etape.pepite ? "bg-pepite text-surface dark:text-bg" : "bg-ink text-surface"
          }`}
        >
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-bold text-ink">{etape.nom}</p>
            {etape.pepite && (
              <span className="inline-flex items-center gap-1 rounded-badge bg-pepite-bg px-2 pt-0.5 text-small font-bold text-pepite">
                <Gem aria-hidden strokeWidth={1.8} className="size-3.5" />
                Pépite
              </span>
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-2">
            {etape.type && <span>{etape.type}</span>}
            {etape.note !== null && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Star aria-hidden strokeWidth={1.8} className="size-3.5 fill-visited text-visited-edge" />
                <span>
                  {noteFr.format(etape.note)}
                  <span className="sr-only"> sur 5</span> · {avisFr.format(etape.nombreAvis)} avis
                </span>
              </span>
            )}
            <CrowdGauge affluence={etape.affluence} />
          </p>
          <p className="mt-2 text-caption text-ink">{etape.description}</p>
          {etape.lienMaps && (
            <a
              href={etape.lienMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex min-h-11 items-center gap-1.5 text-caption font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            >
              Voir sur Google Maps
              <ExternalLink aria-hidden strokeWidth={1.8} className="size-3.5" />
              <span className="sr-only">(nouvel onglet)</span>
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
