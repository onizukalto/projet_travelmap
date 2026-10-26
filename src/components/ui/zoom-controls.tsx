"use client";

import { Minus, Plus, Scan } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  /** Vrai si la vue a bougé (zoom ou déplacement) : on peut recentrer. */
  canReset: boolean;
  className?: string;
};

/** Boutons + / − / recentrer, communs à toutes les cartes. */
export function ZoomControls({ onZoomIn, onZoomOut, onReset, canZoomIn, canZoomOut, canReset, className = "" }: Props) {
  return (
    <div
      // En ligne sur petit écran (la carte y est basse), en colonne ensuite.
      className={`flex flex-row overflow-hidden rounded-control border border-border bg-surface md:flex-col ${className}`}
    >
      <ZoomButton label="Zoomer" onClick={onZoomIn} disabled={!canZoomIn}>
        <Plus aria-hidden strokeWidth={1.75} className="size-5" />
      </ZoomButton>
      <ZoomButton label="Dézoomer" onClick={onZoomOut} disabled={!canZoomOut}>
        <Minus aria-hidden strokeWidth={1.75} className="size-5" />
      </ZoomButton>
      <ZoomButton label="Recentrer la carte" onClick={onReset} disabled={!canReset}>
        <Scan aria-hidden strokeWidth={1.75} className="size-[18px]" />
      </ZoomButton>
    </div>
  );
}

function ZoomButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-11 cursor-pointer items-center justify-center border-r border-line text-ink transition-[background-color,color,transform] duration-150 last:border-r-0 md:border-r-0 md:border-b md:last:border-b-0 hover:bg-ink hover:text-bg active:scale-90 disabled:cursor-default disabled:text-muted disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted disabled:active:scale-100"
    >
      {children}
    </button>
  );
}
