"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { StatusSwatch } from "@/components/map-patterns";
import { CONTINENTS, searchCountries, type Country } from "@/data/countries";
import { useMapFocus, useMapStore } from "@/lib/map-store";
import { useDismiss } from "@/lib/use-dismiss";

/**
 * Recherche de pays (⌘K ou Ctrl K) : champ dans l'en-tête sur grand écran,
 * bouton qui ouvre un champ sous l'en-tête sur mobile.
 */
export function SearchField() {
  const desktopInput = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  useDismiss(mobileRef, mobileOpen, closeMobile);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (window.matchMedia("(min-width: 1024px)").matches) desktopInput.current?.focus();
        else setMobileOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="relative hidden lg:block">
        <CountrySearch id="recherche-pays" inputRef={desktopInput} showShortcut />
      </div>
      <div ref={mobileRef} className="lg:hidden">
        <button
          type="button"
          aria-label="Rechercher un pays"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((value) => !value)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-control text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
        >
          <Search aria-hidden strokeWidth={1.8} className="size-5" />
        </button>
        {mobileOpen && (
          <div className="pop-in absolute inset-x-0 top-full z-40 border-b border-border bg-bg p-3 shadow-float">
            <CountrySearch id="recherche-pays-mobile" autoFocus onDone={closeMobile} />
          </div>
        )}
      </div>
    </>
  );
}

function CountrySearch({
  id,
  inputRef,
  autoFocus,
  showShortcut,
  onDone,
}: {
  id: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
  showShortcut?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const statuses = useMapStore((state) => state.countryStatuses);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchCountries(query), [query]);
  const listId = `${id}-liste`;
  const showList = open && query.trim() !== "";

  const choose = (country: Country) => {
    useMapFocus.getState().requestFocus(country.key);
    setQuery("");
    setOpen(false);
    onDone?.();
    if (window.location.pathname !== "/") router.push("/");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const country = results[active];
      if (country) choose(country);
    } else if (event.key === "Escape") {
      if (query) setQuery("");
      else {
        event.currentTarget.blur();
        onDone?.();
      }
    }
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Rechercher un pays
      </label>
      <Search
        aria-hidden
        strokeWidth={1.8}
        className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted"
      />
      <input
        ref={inputRef}
        id={id}
        type="search"
        role="combobox"
        autoComplete="off"
        autoFocus={autoFocus}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${id}-${results[active].key}` : undefined}
        placeholder="Rechercher un pays"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={`h-11 w-full rounded-control border border-line-strong bg-surface-raised pl-10 text-caption text-ink transition-colors duration-150 placeholder:text-muted hover:border-ink-2 focus-visible:border-ink lg:w-64 [&::-webkit-search-cancel-button]:hidden ${
          showShortcut ? "pr-14" : "pr-3"
        }`}
      />
      {showShortcut && !query && (
        <kbd
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-badge border border-line px-1.5 pt-0.5 font-sans text-small font-semibold text-muted"
        >
          ⌘K
        </kbd>
      )}
      {showList && (
        <div className="pop-in absolute top-full right-0 z-40 mt-2 w-full min-w-72 rounded-panel border border-border bg-surface-raised p-1.5 shadow-float">
          {results.length === 0 ? (
            <p role="status" className="px-3 py-2.5 text-caption text-ink-2">
              Aucun pays ne correspond à « {query.trim()} ».
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Pays trouvés">
              {results.map((country, index) => {
                const status = statuses[country.key];
                return (
                  <li
                    key={country.key}
                    id={`${id}-${country.key}`}
                    role="option"
                    aria-selected={index === active}
                    // Garde le focus dans le champ pendant le clic.
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(country)}
                    className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-3 py-2 ${
                      index === active ? "bg-surface-2" : ""
                    }`}
                  >
                    <span className="flex-1 leading-tight">
                      <span className="block font-semibold text-ink">{country.name}</span>
                      <span className="block text-small text-muted">
                        {CONTINENTS[country.continent]}
                      </span>
                    </span>
                    {status && <StatusSwatch status={status} />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
