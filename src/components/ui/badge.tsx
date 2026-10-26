import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "yellow" | "orange" | "blue" | "ink" | "dashed";

const tones: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface text-ink",
  yellow: "border-border bg-accent-yellow text-on-accent",
  orange: "border-border bg-accent-orange text-on-accent",
  blue: "border-transparent bg-pepite-bg text-pepite",
  ink: "border-ink bg-ink text-bg",
  dashed: "border-dashed border-line-strong bg-transparent text-ink-2",
};

/** Petite étiquette : statut, catégorie, compteur. */
export function Badge({ tone = "neutral", children, className = "" }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-badge border px-1.5 py-0.5 text-small leading-tight font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
