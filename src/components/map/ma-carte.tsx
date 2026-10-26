"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { COUNTRY_BY_KEY } from "@/data/countries";
import { exportMapPng } from "@/lib/export-map";
import { computeStats } from "@/lib/map-stats";
import {
  useMapFocus,
  useMapHydrated,
  useMapStore,
  type CountryStatus,
  type DisplayStatus,
} from "@/lib/map-store";
import { plannedCountries } from "@/lib/trip-utils";
import { useTripsStore } from "@/lib/trips-store";
import { useMediaQuery } from "@/lib/use-media-query";
import { CountryPanel } from "./country-panel";
import {
  ContinentsTile,
  CountriesTile,
  LastTripTile,
  LegendTile,
  WishesTile,
  WorldShareTile,
} from "./map-tiles";
import { STATUS_FILL } from "./status-meta";
import { WorldMap, type MapAnchor, type Spread, type WorldMapHandle } from "./world-map";

type Selection = { key: string; anchor: MapAnchor | null };

/** La page « Ma carte », en bento : la carte coloriable, ses stats, la légende et le dernier voyage. */
export function MaCarte() {
  const statuses = useMapStore((state) => state.countryStatuses);
  const setStatus = useMapStore((state) => state.setStatus);
  const clearStatus = useMapStore((state) => state.clearStatus);
  const hydrated = useMapHydrated();
  const mobile = useMediaQuery("(max-width: 767px)");

  const mapRef = useRef<WorldMapHandle>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [animateKey, setAnimateKey] = useState<string | null>(null);
  const [hidden, setHidden] = useState<ReadonlySet<DisplayStatus>>(() => new Set());
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [spread, setSpread] = useState<Spread | null>(null);

  const trips = useTripsStore((state) => state.trips);
  // « Prévu » : pays traversés par un voyage prévu qui n'est pas encore terminé.
  const planned = useMemo(() => plannedCountries(trips), [trips]);
  const stats = useMemo(() => computeStats(statuses, planned), [statuses, planned]);
  const wishKeys = useMemo(
    () => Object.entries(statuses).filter(([, s]) => s === "wish").map(([key]) => key),
    [statuses],
  );
  const homeKey = Object.entries(statuses).find(([, s]) => s === "home")?.[0];
  const homeName = homeKey ? (COUNTRY_BY_KEY.get(homeKey)?.name ?? null) : null;

  // Le remplissage dure le temps de son animation, puis le pays garde sa couleur normale.
  useEffect(() => {
    if (!spread) return;
    const timer = setTimeout(() => setSpread(null), 700);
    return () => clearTimeout(timer);
  }, [spread]);

  // Statut affiché : « Prévu » recouvre tout sauf « J'y vis » et « Visité ».
  const affiche = (key: string, status: CountryStatus | undefined): DisplayStatus | undefined =>
    planned.has(key) && status !== "home" && status !== "visited" ? "planned" : status;

  // Change le statut d'un pays, avec le remplissage façon Been.
  const appliquer = (key: string, next: CountryStatus | null) => {
    const avant = affiche(key, statuses[key]);
    const apres = affiche(key, next ?? undefined);
    if (next) setStatus(key, next);
    else clearStatus(key);
    setAnimateKey(key);
    if (avant !== apres) {
      setSpread({ key, from: STATUS_FILL[avant ?? "none"], to: STATUS_FILL[apres ?? "none"], nonce: Date.now() });
    }
  };

  const open = useCallback((key: string, anchor: MapAnchor | null) => {
    // On retient l'élément qui avait le focus (la recherche, par exemple) pour le lui rendre.
    const active = document.activeElement;
    returnFocus.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
    setSelected({ key, anchor });
  }, []);

  const close = useCallback((restoreFocus: boolean) => {
    setSelected(null);
    const target = returnFocus.current;
    returnFocus.current = null;
    if (restoreFocus && target?.isConnected) requestAnimationFrame(() => target.focus());
  }, []);

  // Sur ordinateur, le panneau suit le clic : on le ferme quand la carte bouge.
  const handleUserZoom = useCallback(() => {
    if (!mobile) setSelected(null);
  }, [mobile]);

  // Demandes venues de la recherche de l'en-tête.
  useEffect(() => {
    const handle = (request: { key: string } | null) => {
      if (!request) return;
      useMapFocus.getState().clearRequest();
      const anchor = mapRef.current?.zoomToCountry(request.key) ?? null;
      open(request.key, anchor ?? mapRef.current?.center() ?? null);
    };
    const frame = requestAnimationFrame(() => handle(useMapFocus.getState().request));
    const unsubscribe = useMapFocus.subscribe((state) => handle(state.request));
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, [open]);

  const toggleFilter = (status: DisplayStatus) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });

  const share = async () => {
    const svg = mapRef.current?.svg();
    if (!svg) return;
    setSharing(true);
    setShareError(false);
    try {
      await exportMapPng(
        svg,
        `${stats.countryCount} pays sur 193   ·   ${stats.continents.length} continents sur 6`,
      );
    } catch (error) {
      console.error(error);
      setShareError(true);
    } finally {
      setSharing(false);
    }
  };

  const country = selected ? COUNTRY_BY_KEY.get(selected.key) : undefined;

  return (
    <div className="bento grid-cols-2 lg:grid-cols-12">
      {/* La carte : la tuile héros */}
      <section
        aria-labelledby="titre-carte"
        className="bento-tile relative col-span-2 aspect-[16/10] lg:col-span-8 lg:row-span-2 lg:aspect-auto lg:min-h-[520px]"
        style={{ "--i": 0 } as CSSProperties}
      >
        <h2 id="titre-carte" className="sr-only">
          Carte du monde
        </h2>
        <WorldMap
          ref={mapRef}
          fill
          statuses={statuses}
          planned={planned}
          hidden={hidden}
          selectedKey={selected?.key ?? null}
          animateKey={animateKey}
          spread={spread}
          showInvite={hydrated && Object.keys(statuses).length === 0 && planned.size === 0}
          onSelect={open}
          onUserZoom={handleUserZoom}
        />
        {country && (
          <CountryPanel
            key={country.key}
            country={country}
            status={statuses[country.key]}
            anchor={selected?.anchor ?? null}
            mobile={mobile}
            onSet={(status: CountryStatus) => appliquer(country.key, status)}
            onClear={() => appliquer(country.key, null)}
            onClose={close}
          />
        )}
      </section>

      <WorldShareTile index={1} stats={stats} className="col-span-2 lg:col-span-4" />
      <CountriesTile index={2} stats={stats} homeName={homeName} className="col-span-1 lg:col-span-2" />
      <ContinentsTile index={3} stats={stats} className="col-span-1 lg:col-span-2" />
      <WishesTile index={4} wishKeys={wishKeys} className="col-span-2 lg:col-span-4" />
      <LegendTile
        index={5}
        stats={stats}
        hidden={hidden}
        onToggle={toggleFilter}
        onShare={share}
        sharing={sharing}
        shareError={shareError}
        className="col-span-2 lg:col-span-4"
      />
      <LastTripTile index={6} className="col-span-2 lg:col-span-4" />
    </div>
  );
}
