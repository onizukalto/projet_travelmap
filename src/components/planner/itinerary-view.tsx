"use client";

import { BookmarkPlus, Car, ChevronDown, ExternalLink, Gem, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CrowdGauge } from "./crowd-gauge";
import { StepVideo } from "./step-video";
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
    <section aria-label={`Itinéraire : ${itineraire.titre}`} className="overflow-hidden rounded-panel border border-border bg-surface">
      <header className="px-4 pt-4 md:px-5 md:pt-5">
        <h2 className="font-display text-[24px] leading-tight font-extrabold tracking-[-0.03em] text-ink">{itineraire.titre}</h2>
        <p className="mt-0.5 text-small text-muted">{itineraire.verification}</p>
      </header>

      <ol className="mt-3">
        {itineraire.jours.map((jour) => {
          const expanded = open.has(jour.jour);
          const shown = selectedDay === jour.jour;
          const panelId = `jour-${itineraire.titre}-${jour.jour}`.replace(/\s+/g, "-");
          return (
            <li key={jour.jour} className="border-t border-border">
              <h3>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggle(jour.jour)}
                  className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors duration-150 hover:bg-surface-2 md:px-5"
                >
                  {/* Le jour affiché sur la carte prend la pastille jaune. */}
                  <span
                    className={`rounded-badge border px-2 py-0.5 font-display text-[17px] font-extrabold tracking-[-0.02em] whitespace-nowrap transition-colors duration-200 ${
                      shown ? "border-ink bg-accent-yellow text-on-accent" : "border-transparent text-ink"
                    }`}
                  >
                    Jour {jour.jour}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-ink-2">{jour.titre}</span>
                  {jour.etapes.length > 0 ? (
                    <span className="text-small text-muted">{jour.etapes.length}</span>
                  ) : (
                    jour.trajet && <Car aria-label="Jour de route" strokeWidth={1.75} className="size-4 shrink-0 text-muted" />
                  )}
                  <ChevronDown
                    aria-hidden
                    strokeWidth={1.75}
                    className={`size-5 shrink-0 text-ink-2 transition-transform duration-300 ease-[var(--ease-spring)] ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              </h3>
              {expanded && (
                <ol id={panelId} className="pop-in flex flex-col gap-3 px-4 pb-4 md:px-5">
                  {/* Jour de route : le trajet, sous le titre (seul s'il n'y a pas d'étape) */}
                  {jour.trajet && (
                    <li className="flex items-center gap-2 text-caption text-ink-2">
                      <Car aria-hidden strokeWidth={1.75} className="size-4 shrink-0" />
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
                    // Clé unique même si un lieu apparaît deux fois dans la journée.
                    <StepCard key={`${jour.jour}-${index}-${etape.id}`} etape={etape} number={index + 1} />
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>

      {onSave && total > 0 && (
        <div className="border-t border-border p-4 md:px-5">
          <Button variant="primary" onClick={onSave} className="w-full sm:w-auto">
            <BookmarkPlus aria-hidden strokeWidth={1.75} className="size-[18px]" />
            Enregistrer le voyage
          </Button>
        </div>
      )}
    </section>
  );
}

/**
 * Photo d'une étape, en bandeau 16:9 en haut de la fiche, avec le crédit exigé par Google.
 * Chargée seulement quand elle devient visible (chaque photo est facturée). Squelette pendant
 * le chargement, léger fondu à l'apparition ; si elle ne charge pas, le bandeau disparaît.
 */
function PhotoEtape({ photo, auteur }: { photo: string; auteur?: string }) {
  const [etat, setEtat] = useState<"chargement" | "ok" | "erreur">("chargement");
  const ref = useRef<HTMLImageElement>(null);

  // Image déjà en cache : elle peut finir de charger avant que React n'écoute « load ».
  useEffect(() => {
    const image = ref.current;
    if (image?.complete) setEtat(image.naturalWidth > 0 ? "ok" : "erreur");
  }, []);

  if (etat === "erreur") return null;
  return (
    <div className="relative -mx-3.5 -mt-3.5 mb-3.5 aspect-video overflow-hidden border-b border-line bg-surface-2">
      {etat === "chargement" && (
        <div aria-hidden className="absolute inset-0 animate-pulse bg-line motion-reduce:animate-none" />
      )}
      {/* <img> et non next/image : la photo vient directement de Google, sans passer par l'optimiseur. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={`/api/photo?nom=${encodeURIComponent(photo)}`}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setEtat("ok")}
        onError={() => setEtat("erreur")}
        className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${
          etat === "ok" ? "opacity-100" : "opacity-0"
        }`}
      />
      {etat === "ok" && (
        <p className="absolute right-2 bottom-2 max-w-[calc(100%-1rem)] truncate rounded-badge bg-ink/75 px-1.5 py-0.5 text-[11px] leading-tight text-bg">
          Photo : {auteur ? `${auteur} · ` : ""}Google
        </p>
      )}
    </div>
  );
}

function StepCard({ etape, number }: { etape: EtapeRendue; number: number }) {
  return (
    <li
      className={`overflow-hidden rounded-panel border p-3.5 ${
        etape.pepite ? "border-accent-blue bg-pepite-bg" : "border-line bg-surface"
      }`}
    >
      {etape.photo && <PhotoEtape photo={etape.photo} auteur={etape.photoAuteur} />}
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-small font-extrabold tabular-nums ${
            etape.pepite ? "bg-pepite text-bg" : "bg-ink text-bg"
          }`}
        >
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-display text-[17px] font-bold tracking-[-0.01em] text-ink">{etape.nom}</p>
            {etape.pepite && (
              <span className="inline-flex items-center gap-1 rounded-badge border border-accent-blue bg-surface px-2 py-0.5 text-small font-bold text-pepite">
                <Gem aria-hidden strokeWidth={1.75} className="size-3.5" />
                Pépite
              </span>
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-2">
            {etape.type && <span>{etape.type}</span>}
            {etape.note !== null && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Star aria-hidden strokeWidth={1.75} className="size-3.5 fill-visited text-visited-edge" />
                <span>
                  {noteFr.format(etape.note)}
                  <span className="sr-only"> sur 5</span> · {avisFr.format(etape.nombreAvis)} avis
                </span>
              </span>
            )}
            <CrowdGauge affluence={etape.affluence} />
          </p>
          <p className="mt-2 text-caption text-ink">{etape.description}</p>
          {/* Liens de l'étape ; le panneau vidéo s'ouvre sous eux, sur toute la largeur. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-5">
            {etape.lienMaps && (
              <a
                href={etape.lienMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 text-caption font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                Voir sur Google Maps
                <ExternalLink aria-hidden strokeWidth={1.75} className="size-3.5" />
                <span className="sr-only">(nouvel onglet)</span>
              </a>
            )}
            <StepVideo nom={etape.nom} adresse={etape.adresse} />
          </div>
        </div>
      </div>
    </li>
  );
}
