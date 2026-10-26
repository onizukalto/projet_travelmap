"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/use-media-query";
import { WORLD } from "@/lib/world";

export type ColoringStep = { key: string; status: "home" | "visited" | "wish" | "planned" };

type Props = {
  steps: ColoringStep[];
  /** Boucle discrète (héros) ou une seule fois à l'entrée dans l'écran (tuile). */
  loop?: boolean;
  /** Pays sur lesquels cadrer la carte ; toute la carte si absent. */
  focus?: string[];
  /** Délai entre deux pays, en millisecondes. */
  interval?: number;
  className?: string;
};

const FADE_MS = 520;

/** Cadre (viewBox) autour de quelques pays, avec une marge. */
function cadrer(keys: string[] | undefined) {
  if (!keys?.length) return { x: 0, y: 0, w: WORLD.width, h: WORLD.height };
  const shapes = keys.map((k) => WORLD.shapeByKey.get(k)).filter((s) => s !== undefined);
  const x0 = Math.min(...shapes.map((s) => s.bounds[0][0]));
  const y0 = Math.min(...shapes.map((s) => s.bounds[0][1]));
  const x1 = Math.max(...shapes.map((s) => s.bounds[1][0]));
  const y1 = Math.max(...shapes.map((s) => s.bounds[1][1]));
  const marge = Math.max(x1 - x0, y1 - y0) * 0.12;
  return { x: x0 - marge, y: y0 - marge, w: x1 - x0 + marge * 2, h: y1 - y0 + marge * 2 };
}

/**
 * Carte décorative qui se colorie toute seule, pays après pays, avec le remplissage façon Been.
 * Rendue déjà coloriée (lisible sans JavaScript et avec « réduire les animations »),
 * puis animée dans le navigateur : la couleur se diffuse depuis le centre de chaque pays.
 * Elle se met en pause hors de l'écran.
 */
export function ColoringMap({ steps, loop = false, focus, interval = 820, className = "" }: Props) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const [count, setCount] = useState(steps.length);
  const [fading, setFading] = useState(false);
  const box = useMemo(() => cadrer(focus), [focus]);
  // Hachures à l'échelle du cadre : même finesse sur la grande carte et sur une carte recadrée.
  const pas = box.w / 190;

  useEffect(() => {
    const svg = ref.current;
    if (!svg || prefersReducedMotion()) return;
    let visible = false;
    let started = false;
    let t = -1; // -1 : effacer d'abord la carte du rendu serveur, puis remplir
    let timer: ReturnType<typeof setTimeout> | undefined;
    const n = steps.length;

    const tick = () => {
      if (!visible) return;
      if (t === -1) {
        setFading(true);
        timer = setTimeout(() => {
          setCount(0);
          setFading(false);
          t = 0;
          timer = setTimeout(tick, interval * 0.6);
        }, FADE_MS);
        return;
      }
      if (t < n) {
        t += 1;
        setCount(t);
        timer = setTimeout(tick, interval);
        return;
      }
      if (loop) {
        // Pause sur la carte pleine, puis on recommence.
        t = -1;
        timer = setTimeout(tick, interval * 3);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && (!started || loop)) {
          started = true;
          clearTimeout(timer);
          timer = setTimeout(tick, 250);
        } else if (!visible) {
          clearTimeout(timer);
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(svg);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [steps.length, loop, interval]);

  const fills: Record<ColoringStep["status"], string> = {
    home: "var(--home)",
    visited: "var(--visited)",
    wish: `url(#${id}-envie)`,
    planned: `url(#${id}-prevu)`,
  };

  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      <defs>
        {(["envie", "prevu"] as const).map((nom) => (
          <pattern
            key={nom}
            id={`${id}-${nom}`}
            width={pas * 5}
            height={pas * 5}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width={pas * 5} height={pas * 5} className="fill-land" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={pas * 5}
              strokeWidth={pas * 1.6}
              className={nom === "envie" ? "stroke-wish-hatch" : "stroke-planned-hatch"}
            />
          </pattern>
        ))}
      </defs>
      <g strokeWidth="0.7" vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="fill-land stroke-map-border">
        {WORLD.shapes.map(({ key, d }) => (
          <path key={key} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      <g style={{ opacity: fading ? 0 : 1, transition: `opacity ${FADE_MS}ms ease-out` }}>
        {steps.slice(0, count).map(({ key, status }) => {
          const shape = WORLD.shapeByKey.get(key);
          if (!shape) return null;
          const [cx, cy] = shape.centroid;
          const [[x0, y0], [x1, y1]] = shape.bounds;
          const r = Math.max(...[x0, x1].flatMap((x) => [y0, y1].map((y) => Math.hypot(x - cx, y - cy)))) + 2;
          return (
            <g key={key}>
              <clipPath id={`${id}-c${key}`}>
                <circle className="spread-circle" cx={cx} cy={cy} r={r} />
              </clipPath>
              <path
                d={shape.d}
                clipPath={`url(#${id}-c${key})`}
                strokeWidth="0.7"
                vectorEffect="non-scaling-stroke"
                className="stroke-map-border"
                style={{ fill: fills[status] }}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
