"use client";

import { motion } from "motion/react";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  /** Icône ou pastille affichée avant le libellé. */
  icon?: ReactNode;
  /** Masque le libellé (il reste lu par les lecteurs d'écran). */
  iconOnly?: boolean;
};

type Props<T extends string> = {
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
};

/**
 * Sélecteur à segments (groupe de boutons radio). Le segment choisi est une pastille
 * jaune qui glisse d'un segment à l'autre. Flèches gauche et droite au clavier.
 */
export function Segmented<T extends string>({ options, value, onChange, ariaLabel, className = "" }: Props<T>) {
  const layoutId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (event: KeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  const focusable = value === null ? 0 : options.findIndex((o) => o.value === value);

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`flex rounded-control border border-border bg-surface p-0.5 ${className}`}>
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.iconOnly ? option.label : undefined}
            title={option.iconOnly ? option.label : undefined}
            tabIndex={index === focusable ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKey(event, index)}
            className={`relative flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[4px] px-3 text-caption transition-colors duration-150 ${
              checked ? "font-bold text-on-accent" : "font-medium text-ink-2 hover:text-ink"
            } ${option.iconOnly ? "min-w-11 px-0" : ""}`}
          >
            {checked && (
              <motion.span
                layoutId={layoutId}
                aria-hidden
                className="absolute inset-0 rounded-[4px] border border-border bg-accent-yellow"
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {option.icon}
              {!option.iconOnly && option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
