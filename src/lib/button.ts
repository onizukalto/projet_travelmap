const base =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control px-4 font-semibold transition-[background-color,color,opacity,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0";

/** Bouton principal : fond encre, texte surface. Il s'inverse tout seul en sombre. */
export const buttonPrimary = `${base} bg-ink text-surface hover:opacity-90`;

/** Bouton secondaire : bordure encre, fond transparent. */
export const buttonSecondary = `${base} border border-ink bg-transparent text-ink hover:bg-surface-raised`;
