"use client";

import { Check, Gem, Search, X } from "lucide-react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { CrowdGauge } from "@/components/planner/crowd-gauge";

const TEMPS = [
  {
    titre: "Il cherche de vrais lieux",
    texte: "L'agent interroge Google Maps pour chaque idée : sites, sentiers, villages, avec leur note et leur fréquentation.",
  },
  {
    titre: "Il vérifie chaque lieu",
    texte: "Un lieu qu'il n'a pas trouvé ne passe pas : il est retiré de l'itinéraire, au lieu d'être inventé.",
  },
  {
    titre: "Il construit l'itinéraire, loin de la foule",
    texte: "Jour par jour, avec des alternatives très bien notées mais peu connues : les pépites.",
  },
];

/** Opacité d'un temps : pleine pendant son tiers de la section, estompée avant et après. */
function useTemps(progress: MotionValue<number>, i: number) {
  const debut = i / 3;
  const fin = (i + 1) / 3;
  // Les repères doivent rester entre 0 et 1, dans l'ordre : le navigateur refuse sinon
  // (motion confie ces animations liées au défilement au navigateur).
  const opacite = useTransform(
    progress,
    [Math.max(0, debut - 0.06), debut + 0.02, fin - 0.02, Math.min(1, fin + 0.06)],
    [i === 0 ? 1 : 0, 1, 1, i === 2 ? 1 : 0],
  );
  // Avancement à l'intérieur de ce temps, de 0 à 1
  const local = useTransform(progress, [debut, fin], [0, 1]);
  return { opacite, local };
}

/**
 * « Comment l'agent travaille » : une section collante pilotée par le défilement.
 * La section fait trois écrans de haut ; son contenu reste fixé pendant qu'on défile,
 * et chaque temps s'anime à son tour. Avec « réduire les animations » (globals.css),
 * la section redevient une simple suite de trois blocs statiques.
 */
export function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const t0 = useTemps(scrollYProgress, 0);
  const t1 = useTemps(scrollYProgress, 1);
  const t2 = useTemps(scrollYProgress, 2);
  // Le texte d'un temps ne disparaît jamais tout à fait : il s'estompe à 35 %.
  const texte0 = useTransform(t0.opacite, [0, 1], [0.35, 1]);
  const texte1 = useTransform(t1.opacite, [0, 1], [0.35, 1]);
  const texte2 = useTransform(t2.opacite, [0, 1], [0.35, 1]);
  const opacitesTexte = [texte0, texte1, texte2];
  const barre = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="agent" ref={ref} aria-labelledby="titre-agent" className="howto relative h-[320vh] scroll-mt-16 border-y border-border bg-surface">
      <div className="howto-sticky sticky top-16 flex h-[calc(100svh-4rem)] items-center">
        <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-4 py-8 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-8">
          <div className="flex flex-col justify-center">
            <h2
              id="titre-agent"
              className="font-display text-[36px] leading-[0.95] font-extrabold tracking-[-0.045em] text-ink md:text-[56px]"
            >
              Comment l&apos;agent travaille
            </h2>
            <div className="mt-6 flex gap-5 md:mt-10">
              {/* Barre de progression de la section */}
              <div aria-hidden className="relative w-[3px] shrink-0 overflow-hidden rounded-full bg-line">
                <motion.div data-scroll style={{ scaleY: barre }} className="absolute inset-0 origin-top bg-ink" />
              </div>
              <ol className="flex flex-col gap-5 md:gap-8">
                {TEMPS.map(({ titre, texte }, i) => (
                  <motion.li key={titre} data-scroll style={{ opacity: opacitesTexte[i] }}>
                    <h3 className="font-display text-[22px] leading-tight font-bold tracking-[-0.03em] text-ink md:text-[28px]">
                      {titre}
                    </h3>
                    <p className="mt-1.5 hidden max-w-[46ch] text-ink-2 md:block">{texte}</p>
                  </motion.li>
                ))}
              </ol>
            </div>
          </div>

          <div aria-hidden className="howto-layers relative min-h-[300px] md:min-h-[380px]">
            <Couche opacite={t0.opacite}>
              <Recherche local={t0.local} />
            </Couche>
            <Couche opacite={t1.opacite}>
              <Verification local={t1.local} />
            </Couche>
            <Couche opacite={t2.opacite}>
              <Itineraire local={t2.local} />
            </Couche>
          </div>
        </div>
      </div>
    </section>
  );
}

function Couche({ opacite, children }: { opacite: MotionValue<number>; children: React.ReactNode }) {
  return (
    <motion.div
      data-scroll
      style={{ opacity: opacite }}
      className="howto-layer absolute inset-0 flex items-center justify-center rounded-panel border border-border bg-bg p-5 md:p-8"
    >
      {children}
    </motion.div>
  );
}

type ApparaitProps = {
  local: MotionValue<number>;
  seuil: number;
  children: React.ReactNode;
  className?: string;
  /** Rendu en élément de liste (dans un <ul> ou un <ol>). */
  li?: boolean;
};

/** Un élément qui apparaît (montée et fondu) quand l'avancement du temps dépasse `seuil`. */
function Apparait({ local, seuil, children, className = "", li = false }: ApparaitProps) {
  const opacity = useTransform(local, [seuil, seuil + 0.12], [0, 1]);
  const y = useTransform(local, [seuil, seuil + 0.12], [14, 0]);
  const Tag = li ? motion.li : motion.div;
  return (
    <Tag data-scroll style={{ opacity, y }} className={className}>
      {children}
    </Tag>
  );
}

const RESULTATS = [
  { nom: "Cascade de Gveleti", type: "Cascade", affluence: "forte" },
  { nom: "Lac Abudelauri", type: "Lac", affluence: "faible" },
  { nom: "Vallée de Truso", type: "Vallée", affluence: "très faible" },
];

function Recherche({ local }: { local: MotionValue<number> }) {
  return (
    <div className="w-full max-w-md">
      <Apparait local={local} seuil={0}>
        <div className="flex h-11 items-center gap-2 rounded-control border border-border bg-surface-raised px-3 text-ink">
          <Search strokeWidth={1.75} className="size-4 text-muted" />
          <span className="truncate">randonnée calme près de Stepantsminda</span>
        </div>
      </Apparait>
      <ul className="mt-3 flex flex-col gap-2">
        {RESULTATS.map((r, i) => (
          <Apparait
            key={r.nom}
            li
            local={local}
            seuil={0.18 + i * 0.16}
            className="flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-3 py-2.5"
          >
            <span>
              <span className="block font-semibold text-ink">{r.nom}</span>
              <span className="text-small text-muted">{r.type}</span>
            </span>
            <CrowdGauge affluence={r.affluence} />
          </Apparait>
        ))}
      </ul>
    </div>
  );
}

function Verification({ local }: { local: MotionValue<number> }) {
  const lignes = [
    { nom: "Cascade de Gveleti", ok: true },
    { nom: "Lac Abudelauri", ok: true },
    { nom: "Grotte de l'Aigle d'or", ok: false },
    { nom: "Vallée de Truso", ok: true },
  ];
  return (
    <ul className="flex w-full max-w-md flex-col gap-2">
      {lignes.map((l, i) => (
        <Ligne key={l.nom} local={local} seuil={0.1 + i * 0.17} {...l} />
      ))}
    </ul>
  );
}

function Ligne({ local, seuil, nom, ok }: { local: MotionValue<number>; seuil: number; nom: string; ok: boolean }) {
  const scale = useTransform(local, [seuil, seuil + 0.1], [0, 1]);
  const opacite = useTransform(local, [seuil + 0.05, seuil + 0.15], [1, ok ? 1 : 0.45]);
  const barre = useTransform(local, [seuil + 0.02, seuil + 0.14], [0, ok ? 0 : 1]);
  return (
    <motion.li data-scroll style={{ opacity: opacite }} className="relative flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-3 py-2.5">
      <span className="relative font-semibold text-ink">
        {nom}
        {!ok && <motion.span data-scroll style={{ scaleX: barre }} className="absolute inset-x-0 top-1/2 h-0.5 origin-left bg-ink" />}
      </span>
      <motion.span
        data-scroll
        style={{ scale }}
        className={`flex items-center gap-1 rounded-badge px-1.5 py-0.5 text-small font-bold ${
          ok ? "bg-accent-yellow text-on-accent" : "bg-warn-bg text-warn-ink"
        }`}
      >
        {ok ? <Check strokeWidth={2.5} className="size-3.5" /> : <X strokeWidth={2.5} className="size-3.5" />}
        {ok ? "Vérifié" : "Retiré"}
      </motion.span>
    </motion.li>
  );
}

function Itineraire({ local }: { local: MotionValue<number> }) {
  const jours = [
    { jour: 1, lieu: "Cascade de Gveleti", affluence: "forte", pepite: false },
    { jour: 2, lieu: "Lac Abudelauri", affluence: "faible", pepite: true },
    { jour: 3, lieu: "Vallée de Truso", affluence: "très faible", pepite: false },
  ];
  return (
    <div className="w-full max-w-md">
      <Apparait local={local} seuil={0}>
        <p className="font-display text-[22px] font-bold tracking-[-0.03em] text-ink">Kazbegi, 3 jours</p>
      </Apparait>
      <ol className="mt-3 flex flex-col gap-2">
        {jours.map((j, i) => (
          <Apparait
            key={j.jour}
            li
            local={local}
            seuil={0.14 + i * 0.16}
            className={`flex items-center gap-3 rounded-control border bg-surface px-3 py-2.5 ${j.pepite ? "border-pepite" : "border-line"}`}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-small font-extrabold text-bg">
              {j.jour}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink">{j.lieu}</span>
              <CrowdGauge affluence={j.affluence} />
            </span>
            {j.pepite && (
              <span className="inline-flex items-center gap-1 rounded-badge bg-pepite-bg px-1.5 py-0.5 text-small font-bold text-pepite">
                <Gem strokeWidth={2} className="size-3" />
                Pépite
              </span>
            )}
          </Apparait>
        ))}
      </ol>
    </div>
  );
}
