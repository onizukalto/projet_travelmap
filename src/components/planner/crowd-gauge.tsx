const LEVELS: Record<string, number> = {
  "très faible": 1,
  faible: 2,
  moyenne: 3,
  forte: 4,
  "très forte": 5,
};

/** Jauge d'affluence à 5 barres, estimée d'après le nombre d'avis. */
export function CrowdGauge({ affluence }: { affluence: string }) {
  const level = LEVELS[affluence] ?? 0;
  return (
    <span className="inline-flex items-center gap-1.5 text-small text-ink-2">
      <span
        role="img"
        aria-label={`Affluence ${affluence}, ${level} sur 5`}
        className="flex h-3.5 items-end gap-[2px]"
      >
        {[1, 2, 3, 4, 5].map((bar) => (
          <span
            key={bar}
            className={`w-[3px] rounded-[1px] ${bar <= level ? (level <= 2 ? "bg-pepite" : "bg-ink") : "bg-line-strong"}`}
            style={{ height: `${30 + bar * 14}%` }}
          />
        ))}
      </span>
      <span aria-hidden>Affluence {affluence}</span>
    </span>
  );
}
