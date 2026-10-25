/**
 * Motifs de hachures partagés, à placer une fois par page.
 * Les couleurs viennent des variables CSS : elles changent avec le thème.
 */
export function MapPatterns() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <defs>
        <pattern
          id="hachures-envie"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="6" height="6" className="fill-land" />
          <line x1="0" y1="0" x2="0" y2="6" strokeWidth="1.6" className="stroke-wish-hatch" />
        </pattern>
        <pattern
          id="hachures-prevu"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="6" height="6" className="fill-land" />
          <line x1="0" y1="0" x2="0" y2="6" strokeWidth="2" className="stroke-planned-hatch" />
        </pattern>
      </defs>
    </svg>
  );
}

export type Status = "home" | "visited" | "wish" | "planned";

/** Pastille de légende : un petit morceau de carte dans le style du statut. */
export function StatusSwatch({ status }: { status: Status }) {
  const shape = {
    home: "fill-home stroke-home",
    visited: "fill-visited stroke-visited-edge",
    wish: "stroke-map-border",
    planned: "stroke-map-border",
  }[status];
  const fill =
    status === "wish"
      ? "url(#hachures-envie)"
      : status === "planned"
        ? "url(#hachures-prevu)"
        : undefined;

  return (
    <svg aria-hidden viewBox="0 0 28 20" className="h-5 w-7 shrink-0">
      <rect x="0.5" y="0.5" width="27" height="19" rx="3" fill={fill} className={shape} />
    </svg>
  );
}
