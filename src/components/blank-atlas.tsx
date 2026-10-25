/**
 * Planisphère vierge : la silhouette d'une projection Equal Earth,
 * son graticule et les noms des océans. Sert de décor aux états vides.
 */
const W = 1000;
const H = 500;
const TOP = 24;
const BOTTOM = H - 24;
const CX = W / 2;
const HALF_EQUATOR = 470;
const HALF_POLE = 280;

/** Méridien à la longitude `lon` : droit aux pôles, bombé à l'équateur. */
function meridian(lon: number) {
  const pole = CX + (lon / 180) * HALF_POLE;
  const equator = CX + (lon / 180) * HALF_EQUATOR;
  // Point de contrôle choisi pour que la courbe passe par l'équateur à mi-hauteur.
  const control = (8 * equator - 2 * pole) / 6;
  return `M${pole} ${TOP} C${control} ${TOP + 120} ${control} ${BOTTOM - 120} ${pole} ${BOTTOM}`;
}

const outline =
  `${meridian(-180)} L${CX + HALF_POLE} ${BOTTOM} ` +
  `C${(8 * (CX + HALF_EQUATOR) - 2 * (CX + HALF_POLE)) / 6} ${BOTTOM - 120} ` +
  `${(8 * (CX + HALF_EQUATOR) - 2 * (CX + HALF_POLE)) / 6} ${TOP + 120} ${CX + HALF_POLE} ${TOP} Z`;

const MERIDIANS = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
const PARALLELS = [-60, -30, 0, 30, 60];

export function BlankAtlas({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Planisphère vierge"
      className={className}
    >
      <defs>
        <clipPath id="atlas-sphere">
          <path d={outline} />
        </clipPath>
      </defs>
      <path d={outline} className="fill-ocean" />
      <g clipPath="url(#atlas-sphere)" fill="none" strokeWidth="1.2" className="stroke-graticule">
        {MERIDIANS.map((lon) => (
          <path key={lon} d={meridian(lon)} />
        ))}
        {PARALLELS.map((lat) => {
          const y = H / 2 - (lat / 90) * (H / 2 - TOP);
          return <line key={lat} x1="0" x2={W} y1={y} y2={y} />;
        })}
      </g>
      <path d={outline} fill="none" strokeWidth="1.5" className="stroke-map-border" />
      <g className="ocean-label text-[17px] max-md:text-[30px]">
        <text x="190" y="215">
          Océan Pacifique
        </text>
        <text x="390" y="320">
          Océan Atlantique
        </text>
        <text x="630" y="360">
          Océan Indien
        </text>
        <text x="420" y="74" className="text-[14px] max-md:text-[26px]">
          Océan Arctique
        </text>
      </g>
    </svg>
  );
}
