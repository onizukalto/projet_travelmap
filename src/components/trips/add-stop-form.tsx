"use client";

import { LoaderCircle, MapPin, Plus, Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { buttonPrimary } from "@/lib/button";
import { searchPlaces, type Place } from "@/lib/photon";
import { TRANSPORT_ORDER } from "@/lib/route-geometry";
import { TRANSPORT_NAMES } from "@/lib/trip-utils";
import type { Transport } from "@/lib/trips-store";
import { TRANSPORT_ICONS } from "./transport-icon";

type Props = {
  /** Lieu choisi (recherche ou clic sur la carte). */
  place: Place | null;
  placeLoading: boolean;
  onPlaceChange: (place: Place | null) => void;
  dayCount: number;
  defaultDay: number;
  isFirst: boolean;
  onAdd: (place: Place, day: number, transport: Transport) => void;
};

/** Ajouter une étape : un lieu, un jour, et le moyen de transport depuis l'étape précédente. */
export function AddStopForm({ place, placeLoading, onPlaceChange, dayCount, defaultDay, isFirst, onAdd }: Props) {
  const id = useId();
  const [day, setDay] = useState(defaultDay);
  const [transport, setTransport] = useState<Transport>("road");

  return (
    <section aria-labelledby={`${id}-titre`} className="rounded-panel border border-border bg-surface p-4 md:p-5">
      <h3 id={`${id}-titre`} className="font-display text-[19px] font-extrabold tracking-[-0.02em] text-ink">
        Ajouter une étape
      </h3>
      <p className="mt-0.5 text-caption text-ink-2">Cherche un lieu, ou clique sur la carte.</p>

      <div className="mt-3">
        {place || placeLoading ? (
          <div className="flex min-h-11 items-center gap-2 rounded-control border border-ink bg-surface py-1 pr-1 pl-3">
            {placeLoading ? (
              <LoaderCircle aria-hidden strokeWidth={1.75} className="size-[18px] animate-spin text-ink-2 motion-reduce:animate-none" />
            ) : (
              <MapPin aria-hidden strokeWidth={1.75} className="size-[18px] text-ink" />
            )}
            <span className="flex-1 truncate font-semibold text-ink">
              {placeLoading ? "Recherche du lieu…" : place?.label}
            </span>
            <button
              type="button"
              aria-label="Changer de lieu"
              onClick={() => onPlaceChange(null)}
              className="flex size-10 cursor-pointer items-center justify-center rounded-control text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              <X aria-hidden strokeWidth={1.75} className="size-[18px]" />
            </button>
          </div>
        ) : (
          <PlaceSearch id={`${id}-lieu`} onChoose={onPlaceChange} />
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
        <label className="text-caption font-semibold text-ink">
          Jour
          <select
            value={Math.min(day, dayCount + 1)}
            onChange={(event) => setDay(Number(event.target.value))}
            className="mt-1 block h-11 w-full cursor-pointer rounded-control border border-line-strong bg-surface px-3 text-body font-normal text-ink hover:border-ink sm:w-32"
          >
            {Array.from({ length: dayCount + 1 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Jour {i + 1}
              </option>
            ))}
          </select>
        </label>
        <fieldset disabled={isFirst} className="min-w-0 disabled:opacity-55">
          <legend className="text-caption font-semibold text-ink">
            {isFirst ? "Départ du voyage" : "Depuis l'étape précédente"}
          </legend>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {TRANSPORT_ORDER.map((value) => {
              const Icon = TRANSPORT_ICONS[value];
              const checked = transport === value;
              return (
                <label
                  key={value}
                  className={`flex min-h-11 cursor-pointer items-center gap-1.5 rounded-control border px-2.5 text-caption transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink ${
                    checked ? "border-ink bg-accent-yellow font-bold text-on-accent" : "border-line text-ink-2 hover:border-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${id}-transport`}
                    value={value}
                    checked={checked}
                    onChange={() => setTransport(value)}
                    className="sr-only"
                  />
                  <Icon aria-hidden strokeWidth={1.75} className="size-4" />
                  {TRANSPORT_NAMES[value]}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      <button
        type="button"
        disabled={!place}
        onClick={() => place && onAdd(place, Math.min(day, dayCount + 1), transport)}
        className={`${buttonPrimary} mt-4 w-full sm:w-auto`}
      >
        <Plus aria-hidden strokeWidth={1.75} className="size-[18px]" />
        Ajouter au voyage
      </button>
    </section>
  );
}

type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; results: Place[] }
  | { kind: "error" };

/** Champ de recherche de lieu : la requête part 300 ms après la dernière frappe. */
function PlaceSearch({ id, onChoose }: { id: string; onChoose: (place: Place) => void }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const [active, setActive] = useState(0);
  const listId = `${id}-liste`;
  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState({ kind: "loading" });
      searchPlaces(q, controller.signal)
        .then((results) => {
          setActive(0);
          setState({ kind: "done", results });
        })
        .catch((error: unknown) => {
          if ((error as Error).name !== "AbortError") setState({ kind: "error" });
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const results = q.length >= 2 && state.kind === "done" ? state.results : [];
  const open = q.length >= 2 && state.kind !== "idle";

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Chercher un lieu
      </label>
      <Search
        aria-hidden
        strokeWidth={1.75}
        className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted"
      />
      <input
        id={id}
        type="search"
        role="combobox"
        autoComplete="off"
        aria-expanded={results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={results[active] ? `${id}-${active}` : undefined}
        placeholder="Ville, village, site…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (results[active]) onChoose(results[active]);
          } else if (event.key === "Escape") {
            setQuery("");
          }
        }}
        className="h-11 w-full rounded-control border border-line-strong bg-surface pr-3 pl-10 text-ink placeholder:text-muted hover:border-ink focus-visible:border-ink [&::-webkit-search-cancel-button]:hidden"
      />
      {open && (
        <div className="pop-in absolute top-full right-0 left-0 z-30 mt-2 rounded-panel border border-border bg-surface p-1.5 shadow-float">
          {state.kind === "loading" && (
            <p role="status" className="flex items-center gap-2 px-3 py-2.5 text-caption text-ink-2">
              <LoaderCircle aria-hidden strokeWidth={1.75} className="size-4 animate-spin motion-reduce:animate-none" />
              Recherche…
            </p>
          )}
          {state.kind === "error" && (
            <p role="status" className="px-3 py-2.5 text-caption text-warn-ink">
              La recherche ne répond pas. Vérifie ta connexion, ou clique sur la carte.
            </p>
          )}
          {state.kind === "done" && results.length === 0 && (
            <p role="status" className="px-3 py-2.5 text-caption text-ink-2">
              Aucun lieu trouvé pour « {q} ».
            </p>
          )}
          {results.length > 0 && (
            <ul id={listId} role="listbox" aria-label="Lieux trouvés">
              {results.map((place, index) => (
                <li
                  key={place.label}
                  id={`${id}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => onChoose(place)}
                  className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-control px-3 py-2 text-ink ${
                    index === active ? "bg-surface-2" : ""
                  }`}
                >
                  <MapPin aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-ink-2" />
                  <span className="leading-tight">
                    <span className="font-semibold">{place.name}</span>
                    <span className="text-caption text-ink-2">
                      {place.label.slice(place.name.length)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
