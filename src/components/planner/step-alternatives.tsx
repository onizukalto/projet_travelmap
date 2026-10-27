"use client";

import { Gem, MapPin, Shuffle, Star } from "lucide-react";
import { useId, useState } from "react";
import { CrowdGauge } from "./crowd-gauge";
import type { Alternative, EtapeRendue } from "./types";

type Etat = { statut: "chargement" } | { statut: "pret"; alternatives: Alternative[] } | { statut: "erreur" };

// Résultats déjà reçus, par id d'étape, pour toute la visite de la page : jamais deux appels
// pour la même étape (refermer, rouvrir le jour, annuler un remplacement). Chaque recherche est facturée.
const memoire = new Map<string, Alternative[]>();
const enCours = new Map<string, Promise<Alternative[]>>();

function chercher(etape: EtapeRendue) {
  const deja = enCours.get(etape.id);
  if (deja) return deja;
  const promesse = fetch("/api/alternative", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: etape.id, nom: etape.nom, type: etape.type, lat: etape.lat, lon: etape.lon }),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`alternative ${res.status}`);
      const { alternatives } = (await res.json()) as { alternatives?: Alternative[] };
      const liste = alternatives ?? [];
      memoire.set(etape.id, liste);
      return liste;
    })
    .finally(() => enCours.delete(etape.id));
  enCours.set(etape.id, promesse);
  return promesse;
}

const noteFr = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const avisFr = new Intl.NumberFormat("fr-FR");

/** Les lieux trop fréquentés pour lesquels on propose une alternative. */
export const AFFLUENCES_A_EVITER = new Set(["moyenne", "forte", "très forte"]);

/**
 * « Une autre alternative » : jusqu'à trois lieux du même type, proches, très bien notés et peu
 * fréquentés, cherchés seulement au clic. À placer dans une ligne flex-wrap : le panneau prend
 * toute la largeur, sous le bouton.
 */
export function StepAlternatives({
  etape,
  onReplace,
  disabled = false,
}: {
  etape: EtapeRendue;
  /** Remplace l'étape par l'alternative choisie (absent : on peut consulter, pas remplacer). */
  onReplace?: (nouvelle: EtapeRendue) => void;
  /** Vrai pendant que l'agent répond : on ne modifie pas l'itinéraire. */
  disabled?: boolean;
}) {
  const id = useId();
  const [ouvert, setOuvert] = useState(false);
  const [etat, setEtat] = useState<Etat | null>(null);

  // Sans coordonnées, impossible de chercher autour du lieu.
  if (etape.lat === undefined || etape.lon === undefined) return null;

  const basculer = async () => {
    if (ouvert) {
      setOuvert(false);
      return;
    }
    setOuvert(true);
    const connues = memoire.get(etape.id);
    if (connues) {
      setEtat({ statut: "pret", alternatives: connues });
      return;
    }
    setEtat({ statut: "chargement" });
    try {
      setEtat({ statut: "pret", alternatives: await chercher(etape) });
    } catch {
      // L'erreur n'est pas gardée en mémoire : on pourra réessayer.
      setEtat({ statut: "erreur" });
    }
  };

  const remplacer = (alternative: Alternative) => {
    // distanceKm ne sert qu'à la proposition : l'étape garde la forme d'une étape.
    const { distanceKm: _distance, ...lieu } = alternative;
    void _distance;
    onReplace?.({
      ...lieu,
      description: `Alternative moins fréquentée à ${etape.nom}.`,
      pepite: true,
      origine: etape,
    });
  };

  return (
    <>
      <button
        type="button"
        aria-expanded={ouvert}
        aria-controls={id}
        onClick={basculer}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-caption font-semibold text-ink-2 transition-colors duration-150 hover:text-ink"
      >
        <Shuffle aria-hidden strokeWidth={1.75} className="size-3.5" />
        {ouvert ? "Masquer les alternatives" : "Une autre alternative"}
      </button>

      {ouvert && etat && (
        <div id={id} className="pop-in basis-full pb-1">
          {etat.statut === "chargement" && (
            <div role="status" aria-label="Recherche d'alternatives…" className="flex flex-col gap-2">
              {[0, 1].map((i) => (
                <div key={i} className="flex gap-3 rounded-control border border-line p-2.5">
                  <div className="size-[72px] shrink-0 animate-pulse rounded-control bg-line motion-reduce:animate-none" />
                  <div className="flex flex-1 flex-col gap-2 pt-1">
                    <div className="h-3.5 w-1/2 animate-pulse rounded-badge bg-line motion-reduce:animate-none" />
                    <div className="h-3 w-3/4 animate-pulse rounded-badge bg-line motion-reduce:animate-none" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {etat.statut === "erreur" && (
            <p role="status" className="text-caption text-warn-ink">
              Alternatives indisponibles pour le moment.
            </p>
          )}
          {etat.statut === "pret" && etat.alternatives.length === 0 && (
            <p role="status" className="text-caption text-ink-2">
              Pas d&apos;alternative plus calme à proximité.
            </p>
          )}
          {etat.statut === "pret" && etat.alternatives.length > 0 && (
            <ul aria-label={`Alternatives à ${etape.nom}`} className="flex flex-col gap-2">
              {etat.alternatives.map((alternative) => (
                <MiniFiche
                  key={alternative.id}
                  alternative={alternative}
                  onChoose={onReplace && !disabled ? () => remplacer(alternative) : undefined}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

function Vignette({ photo }: { photo?: string }) {
  const [echec, setEchec] = useState(false);
  return (
    <div className="flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-control bg-surface-2">
      {photo && !echec ? (
        // Photo servie par /api/photo (chargée seulement si visible) : <img> simple.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/photo?nom=${encodeURIComponent(photo)}`}
          alt=""
          loading="lazy"
          onError={() => setEchec(true)}
          className="size-full object-cover"
        />
      ) : (
        <MapPin aria-hidden strokeWidth={1.75} className="size-5 text-muted" />
      )}
    </div>
  );
}

function MiniFiche({ alternative, onChoose }: { alternative: Alternative; onChoose?: () => void }) {
  return (
    <li className="flex gap-3 rounded-control border border-line bg-surface p-2.5">
      <Vignette photo={alternative.photo} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-display text-[15px] leading-tight font-bold tracking-[-0.01em] text-ink">{alternative.nom}</p>
          <span className="inline-flex items-center gap-1 rounded-badge border border-accent-blue bg-surface px-1.5 py-0.5 text-small font-bold text-pepite">
            <Gem aria-hidden strokeWidth={1.75} className="size-3" />
            Pépite
          </span>
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-2">
          {alternative.type && <span>{alternative.type}</span>}
          {alternative.note !== null && (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Star aria-hidden strokeWidth={1.75} className="size-3.5 fill-visited text-visited-edge" />
              <span>
                {noteFr.format(alternative.note)}
                <span className="sr-only"> sur 5</span> · {avisFr.format(alternative.nombreAvis)} avis
              </span>
            </span>
          )}
          <span className="tabular-nums">à {alternative.distanceKm} km</span>
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <CrowdGauge affluence={alternative.affluence} />
          {onChoose && (
            <button
              type="button"
              onClick={onChoose}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-control border border-border px-3 text-caption font-semibold text-ink transition-[background-color,color,transform] duration-150 hover:bg-ink hover:text-bg active:scale-[0.97]"
            >
              Remplacer par celle-ci
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
