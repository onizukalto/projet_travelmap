"use client";

import { Gem } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { CrowdGauge } from "@/components/planner/crowd-gauge";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { curve, fitProjection, pathFor, projectStop } from "@/lib/route-geometry";
import { WORLD } from "@/lib/world";
import { ColoringMap, type ColoringStep } from "./coloring-map";

const pourcent = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const formatPourcent = (value: number) => pourcent.format(value);

/** Quelques pays d'Europe, coloriés un à un dans la démonstration « Ta carte ». */
const EUROPE: ColoringStep[] = [
  { key: "250", status: "home" },
  { key: "724", status: "visited" },
  { key: "620", status: "visited" },
  { key: "380", status: "visited" },
  { key: "276", status: "wish" },
  { key: "300", status: "planned" },
  { key: "352", status: "wish" },
  { key: "578", status: "visited" },
];
const EUROPE_CADRE = ["250", "724", "620", "380", "276", "300", "352", "578", "642", "616"];

/** Les trois fonctionnalités, en bento, chacune avec sa mini-démonstration. */
export function Features() {
  return (
    <section id="fonctionnalites" aria-labelledby="titre-fonctionnalites" className="mx-auto max-w-[1600px] scroll-mt-20 px-4 py-20 md:px-6 md:py-28 lg:px-8">
      <div className="scroll-reveal grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
        <h2
          id="titre-fonctionnalites"
          className="font-display text-[40px] leading-[0.95] font-extrabold tracking-[-0.045em] text-ink md:text-[64px]"
        >
          Trois outils,
          <br />
          une seule carte.
        </h2>
        <p className="max-w-[48ch] text-lg text-ink-2 lg:justify-self-end">
          Ce que tu as vu, ce que tu as vécu et ce que tu rêves de voir, au même endroit. Chaque pays colorié nourrit
          les deux autres.
        </p>
      </div>

      <div className="bento mt-10 md:mt-14 lg:grid-cols-3">
        <FeatureTile
          index={0}
          titre="Ta carte"
          texte="Colorie les pays où tu vis, que tu as visités, qui te font envie. Tes stats se mettent à jour à chaque clic."
        >
          <MapDemo />
        </FeatureTile>
        <FeatureTile
          index={1}
          titre="Tes voyages"
          texte="Chaque voyage a ses étapes jour par jour, et son tracé se dessine tout seul sur la carte."
        >
          <RouteDemo />
        </FeatureTile>
        <FeatureTile
          index={2}
          titre="Ton planificateur IA"
          texte="Décris ton voyage : l'assistant construit l'itinéraire, vérifie chaque lieu et propose des pépites."
        >
          <PlannerDemo />
        </FeatureTile>
      </div>
    </section>
  );
}

function FeatureTile({ index, titre, texte, children }: { index: number; titre: string; texte: string; children: ReactNode }) {
  return (
    <article className="scroll-reveal flex flex-col" style={{ "--d": `${index * 80}ms` } as CSSProperties}>
      <div aria-hidden className="relative h-64 overflow-hidden border-b border-border bg-ocean md:h-72">
        {children}
      </div>
      <div className="p-5 md:p-6">
        <h3 className="font-display text-[26px] leading-tight font-bold tracking-[-0.03em] text-ink">{titre}</h3>
        <p className="mt-2 text-ink-2">{texte}</p>
      </div>
    </article>
  );
}

/** « Ta carte » : un compteur qui monte et des pays d'Europe qui se colorient. */
function MapDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <div ref={ref} className="absolute inset-0">
      <ColoringMap steps={EUROPE} focus={EUROPE_CADRE} interval={420} className="absolute inset-0 h-full w-full" />
      <div className="absolute top-4 left-4 rounded-control border border-border bg-surface px-3 py-2">
        <p className="text-small text-muted">Du monde exploré</p>
        <p className="font-display text-[34px] leading-none font-extrabold tracking-[-0.05em] text-ink">
          <AnimatedNumber value={inView ? 18.6 : 0} format={formatPourcent} />
          <span className="ml-0.5 text-[0.55em]">%</span>
        </p>
      </div>
    </div>
  );
}

/** Un road trip dans le sud de l'Italie, du nord au sud. */
const ROUTE = [
  { name: "Milan", lat: 45.46, lon: 9.19 },
  { name: "Florence", lat: 43.77, lon: 11.25 },
  { name: "Rome", lat: 41.9, lon: 12.5 },
  { name: "Naples", lat: 40.85, lon: 14.27 },
  { name: "Matera", lat: 40.67, lon: 16.6 },
  { name: "Lecce", lat: 40.35, lon: 18.17 },
];

/** « Tes voyages » : un tracé d'itinéraire qui se dessine, puis les étapes qui apparaissent. */
function RouteDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const { land, points, route } = useMemo(() => {
    const projection = fitProjection(ROUTE, 400, 300, 40, 3);
    const path = pathFor(projection);
    const land = WORLD.features.map(({ key, feature }) => ({ key, d: path(feature) ?? "" })).filter((f) => f.d);
    const points = ROUTE.map((s) => projectStop(projection, s.lon, s.lat)).filter((p): p is [number, number] => p !== null);
    const route = points.slice(1).map((p, i) => curve(points[i], p, 0.08)).join(" ");
    return { land, points, route };
  }, []);

  return (
    <div ref={ref} className={`absolute inset-0 ${inView ? "is-drawn" : ""}`}>
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <g strokeWidth="0.7" className="fill-land stroke-map-border">
          {land.map(({ key, d }) => (
            <path key={key} d={d} />
          ))}
        </g>
        <defs>
          <clipPath id="demo-trace">
            <rect className="route-reveal" x="0" y="0" width="400" height="300" />
          </clipPath>
        </defs>
        <path d={route} fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-ink" clipPath="url(#demo-trace)" />
        {points.map(([x, y], i) => (
          <g key={i} className="route-stop" style={{ "--d": `${200 + i * 260}ms` } as CSSProperties}>
            <circle cx={x} cy={y} r="9" strokeWidth="2.5" className={i === points.length - 1 ? "fill-accent-yellow stroke-ink" : "fill-ink stroke-land"} />
            <text x={x} y={y + 3.8} textAnchor="middle" fontSize="10" fontWeight="800" className={i === points.length - 1 ? "fill-on-accent" : "fill-surface"}>
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

const CARTES = [
  { jour: 1, lieu: "Stepantsminda", type: "Village", affluence: "forte", pepite: false },
  { jour: 2, lieu: "Lac Abudelauri", type: "Lac", affluence: "faible", pepite: true },
  { jour: 3, lieu: "Vallée de Truso", type: "Vallée", affluence: "très faible", pepite: false },
];

/** « Ton planificateur IA » : des cartes d'étapes qui s'empilent, avec un badge « Pépite ». */
function PlannerDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return (
    <div ref={ref} className="absolute inset-0 flex items-center justify-center p-6">
      <ol className="flex w-full max-w-xs flex-col">
        {CARTES.map((carte, i) => (
          <motion.li
            key={carte.jour}
            initial={false}
            animate={inView ? { y: 0, opacity: 1, rotate: (i - 1) * 1.2 } : { y: 48, opacity: 0, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.15 + i * 0.22 }}
            className={`-mt-3 rounded-panel border bg-surface-raised p-3.5 first:mt-0 ${carte.pepite ? "border-pepite" : "border-border"}`}
            style={{ zIndex: i }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-small font-semibold text-muted">Jour {carte.jour}</p>
              {carte.pepite && (
                <motion.span
                  initial={false}
                  animate={inView ? { scale: 1 } : { scale: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.9 }}
                  className="inline-flex items-center gap-1 rounded-badge bg-pepite-bg px-1.5 py-0.5 text-small font-bold text-pepite"
                >
                  <Gem aria-hidden strokeWidth={2} className="size-3" />
                  Pépite
                </motion.span>
              )}
            </div>
            <p className="mt-0.5 font-display text-[19px] leading-tight font-bold tracking-[-0.02em] text-ink">{carte.lieu}</p>
            <div className="mt-1.5 flex items-center gap-3 text-small text-ink-2">
              <span>{carte.type}</span>
              <CrowdGauge affluence={carte.affluence} />
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
