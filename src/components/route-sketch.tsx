/**
 * Croquis d'un road trip : une côte, deux îles et un tracé en quatre étapes.
 * Reprend les conventions des tracés : route en trait plein,
 * ferry en tirets, vol en pointillés.
 */
const STOPS = [
  { n: 1, x: 62, y: 236 },
  { n: 2, x: 140, y: 168 },
  { n: 3, x: 248, y: 206 },
  { n: 4, x: 388, y: 84 },
  { n: 5, x: 442, y: 262 },
];

export function RouteSketch({ className = "" }: { className?: string }) {
  const [a, b, c, d, e] = STOPS;
  return (
    <svg
      viewBox="0 0 480 300"
      role="img"
      aria-label="Exemple de tracé : deux étapes par la route, une traversée en ferry et un vol"
      className={className}
    >
      <rect width="480" height="300" className="fill-ocean" />
      <g fill="none" strokeWidth="1" className="stroke-graticule">
        <line x1="0" x2="480" y1="100" y2="100" />
        <line x1="0" x2="480" y1="200" y2="200" />
        <line x1="160" x2="160" y1="0" y2="300" />
        <line x1="320" x2="320" y1="0" y2="300" />
      </g>
      <g strokeWidth="1.2" className="fill-land stroke-map-border">
        <path d="M0 118 C60 98 118 132 170 110 C222 90 262 138 302 150 C326 200 282 244 300 300 L0 300 Z" />
        <path d="M342 62 C370 40 420 44 440 70 C456 96 420 120 384 116 C354 112 330 88 342 62 Z" />
        <path d="M402 232 C432 216 470 224 480 240 L480 300 L392 300 C380 272 386 246 402 232 Z" />
      </g>
      <text x="310" y="196" fontSize="14" className="ocean-label">
        Mer Égée
      </text>
      <g fill="none" strokeLinecap="round" className="stroke-ink">
        <path d={`M${a.x} ${a.y} Q 96 196 ${b.x} ${b.y}`} strokeWidth="3" />
        <path d={`M${b.x} ${b.y} Q 200 168 ${c.x} ${c.y}`} strokeWidth="3" />
        <path d={`M${c.x} ${c.y} Q 330 160 ${d.x} ${d.y}`} strokeWidth="2.5" strokeDasharray="9 7" />
        <path d={`M${d.x} ${d.y} Q 470 170 ${e.x} ${e.y}`} strokeWidth="2.5" strokeDasharray="0.1 7" />
      </g>
      {STOPS.map(({ n, x, y }) => (
        <g key={n}>
          <circle cx={x} cy={y} r="13" strokeWidth="2.5" className="fill-ink stroke-land" />
          <text
            x={x}
            y={y + 5}
            textAnchor="middle"
            fontSize="14"
            fontWeight="800"
            className="fill-surface"
          >
            {n}
          </text>
        </g>
      ))}
    </svg>
  );
}
