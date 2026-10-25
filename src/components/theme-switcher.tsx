"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useRef, useState } from "react";
import { useDismiss, useMounted } from "@/lib/use-dismiss";

type ThemeChoice = "light" | "dark" | "system";

const CHOICES: { value: ThemeChoice; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Automatique", icon: Monitor },
];

/**
 * Sélecteur de thème : trois segments sur grand écran,
 * un bouton qui ouvre un petit menu sur mobile.
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  // Avant le montage, le thème réel n'est pas connu : on n'en coche aucun.
  const current = mounted ? ((theme as ThemeChoice | undefined) ?? "system") : null;

  return (
    <>
      <div
        role="radiogroup"
        aria-label="Thème"
        className="hidden overflow-hidden rounded-control border border-line md:flex"
      >
        {CHOICES.map(({ value, label, icon: Icon }) => {
          const checked = current === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={label}
              title={label}
              onClick={() => setTheme(value)}
              className={`flex size-11 cursor-pointer items-center justify-center transition-colors duration-150 ${
                checked ? "bg-ink text-surface" : "text-ink-2 hover:bg-bg hover:text-ink"
              }`}
            >
              <Icon aria-hidden strokeWidth={1.8} className="size-[18px]" />
            </button>
          );
        })}
      </div>
      <ThemeMenu current={current} onChange={setTheme} />
    </>
  );
}

function ThemeMenu({
  current,
  onChange,
}: {
  current: ThemeChoice | null;
  onChange: (value: ThemeChoice) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const active = CHOICES.find((choice) => choice.value === current) ?? CHOICES[2];
  const TriggerIcon = active.icon;

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        type="button"
        aria-label={`Thème : ${active.label}`}
        aria-expanded={open}
        aria-controls="menu-theme"
        onClick={() => setOpen((value) => !value)}
        className="flex size-11 cursor-pointer items-center justify-center rounded-control text-ink-2 transition-colors duration-150 hover:bg-bg hover:text-ink"
      >
        <TriggerIcon aria-hidden strokeWidth={1.8} className="size-5" />
      </button>
      {open && (
        <div
          id="menu-theme"
          role="radiogroup"
          aria-label="Thème"
          className="pop-in absolute top-full right-0 z-40 mt-2 w-52 rounded-panel border border-line bg-surface-raised p-1.5 shadow-float"
        >
          {CHOICES.map(({ value, label, icon: Icon }) => {
            const checked = current === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => {
                  onChange(value);
                  close();
                }}
                className={`flex h-11 w-full cursor-pointer items-center gap-3 rounded-control px-3 text-left transition-colors duration-150 hover:bg-bg ${
                  checked ? "font-bold text-ink" : "text-ink-2"
                }`}
              >
                <Icon aria-hidden strokeWidth={1.8} className="size-[18px]" />
                <span className="flex-1">{label}</span>
                {checked && <span aria-hidden className="size-2 rounded-full bg-visited-edge" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
