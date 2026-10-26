// Classes des boutons pour les écrans qui n'utilisent pas encore les composants
// du design system (src/components/ui/button.tsx). Même apparence, sans ressort.
const base =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-control border px-4 font-semibold transition-[background-color,color,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0";

/** Bouton principal : encre pleine, qui s'inverse en jaune au survol. */
export const buttonPrimary = `${base} border-ink bg-ink text-bg hover:bg-accent-yellow hover:text-on-accent disabled:hover:bg-ink disabled:hover:text-bg`;

/** Bouton secondaire : contour encre, qui se remplit au survol. */
export const buttonSecondary = `${base} border-ink bg-transparent text-ink hover:bg-ink hover:text-bg`;
