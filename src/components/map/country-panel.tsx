"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { StatusSwatch } from "@/components/map-patterns";
import { CONTINENTS, countryByAlpha2, plannerCode, type Country } from "@/data/countries";
import { buttonSecondary } from "@/lib/button";
import type { CountryStatus } from "@/lib/map-store";
import { useDismiss } from "@/lib/use-dismiss";
import type { MapAnchor } from "./world-map";

const CHOICES: { value: CountryStatus; label: string }[] = [
  { value: "home", label: "J'y vis" },
  { value: "visited", label: "Visité" },
  { value: "wish", label: "Envie" },
];

const PANEL_WIDTH = 328;
const PANEL_HEIGHT = 300;

type Props = {
  country: Country;
  status: CountryStatus | undefined;
  /** Position du clic dans la carte (ordinateur). Absent sur mobile. */
  anchor: MapAnchor | null;
  mobile: boolean;
  onSet: (status: CountryStatus) => void;
  onClear: () => void;
  onClose: (restoreFocus: boolean) => void;
};

/** Panneau flottant d'un pays : près du clic sur ordinateur, en bas de l'écran sur mobile. */
export function CountryPanel({ country, status, anchor, mobile, onSet, onClear, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);
  useDismiss(ref, true, () => onClose(false));

  // Échap ferme et rend le focus à l'élément d'origine.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    firstRef.current?.focus({ preventScroll: true });
  }, [country.key]);

  const parent = country.parent ? countryByAlpha2(country.parent) : null;
  const note = country.un
    ? null
    : parent
      ? `Compte pour : ${parent.name}`
      : "Hors du décompte des 193 pays de l'ONU";

  let position: React.CSSProperties | undefined;
  if (!mobile && anchor) {
    const fitsRight = anchor.x + 16 + PANEL_WIDTH <= anchor.width - 8;
    const left = fitsRight ? anchor.x + 16 : Math.max(8, anchor.x - 16 - PANEL_WIDTH);
    const top = Math.min(Math.max(8, anchor.y - 32), Math.max(8, anchor.height - PANEL_HEIGHT));
    position = { left, top, width: PANEL_WIDTH };
  }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-labelledby="panneau-pays-titre"
      className={
        mobile
          ? "sheet-in fixed inset-x-0 bottom-0 z-50 rounded-t-panel border-t border-line bg-surface-raised px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-float"
          : "pop-in absolute z-20 rounded-panel border border-line bg-surface-raised p-4 shadow-float"
      }
      style={position}
    >
      {mobile && <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" />}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="panneau-pays-titre" className="text-section text-ink">
            {country.name}
          </h2>
          <p className="text-caption text-ink-2">
            {CONTINENTS[country.continent]}
            {note && <span className="block text-muted">{note}</span>}
          </p>
        </div>
        <button
          type="button"
          aria-label="Fermer"
          onClick={() => onClose(true)}
          className="-mt-1 -mr-1 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-2 hover:bg-bg hover:text-ink"
        >
          <X aria-hidden strokeWidth={1.8} className="size-5" />
        </button>
      </div>

      <div role="group" aria-label="Statut" className="mt-4 grid grid-cols-3 gap-1.5">
        {CHOICES.map(({ value, label }, index) => {
          const pressed = status === value;
          return (
            <button
              key={value}
              ref={index === 0 ? firstRef : undefined}
              type="button"
              aria-pressed={pressed}
              onClick={() => onSet(value)}
              className={`flex min-h-11 cursor-pointer flex-col items-center justify-center gap-1 rounded-control border px-1 py-2 text-caption transition-colors duration-150 ${
                pressed
                  ? "border-ink bg-bg font-bold text-ink"
                  : "border-line text-ink-2 hover:border-ink-2 hover:text-ink"
              }`}
            >
              <StatusSwatch status={value} />
              {label}
            </button>
          );
        })}
      </div>

      {status && (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-control text-caption font-semibold text-ink-2 hover:bg-bg hover:text-ink"
        >
          <X aria-hidden strokeWidth={1.8} className="size-4" />
          Retirer le statut
        </button>
      )}

      <Link
        href={`/planifier?pays=${plannerCode(country)}`}
        className={`${buttonSecondary} mt-3 w-full justify-between py-2 text-left`}
      >
        Planifier un voyage {country.prep} {country.name}
        <ArrowRight aria-hidden strokeWidth={1.8} className="size-[18px] shrink-0" />
      </Link>
    </div>
  );
}
