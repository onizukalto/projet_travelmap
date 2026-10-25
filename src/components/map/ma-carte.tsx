"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useMediaQuery } from "@/lib/use-media-query";
import { CountryPanel } from "./country-panel";
import { MapLegend } from "./map-legend";
import { WorldMap, type MapAnchor, type WorldMapHandle } from "./world-map";

// « Prévu » viendra des voyages à venir (étape Voyages) : aucun pour l'instant.
const NO_PLANNED: ReadonlySet<string> = new Set();

type Selection = { key: string; anchor: MapAnchor | null };

/** La page « Ma carte » : carte coloriable, panneau du pays, légende et stats. */
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

  const stats = useMemo(() => computeStats(statuses, NO_PLANNED), [statuses]);

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
    <>
      <div className="relative">
        <WorldMap
          ref={mapRef}
          statuses={statuses}
          planned={NO_PLANNED}
          hidden={hidden}
          selectedKey={selected?.key ?? null}
          animateKey={animateKey}
          showInvite={hydrated && Object.keys(statuses).length === 0}
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
            onSet={(status: CountryStatus) => {
              setStatus(country.key, status);
              setAnimateKey(country.key);
            }}
            onClear={() => {
              clearStatus(country.key);
              setAnimateKey(country.key);
            }}
            onClose={close}
          />
        )}
      </div>
      <MapLegend
        stats={stats}
        hidden={hidden}
        onToggle={toggleFilter}
        onShare={share}
        sharing={sharing}
        shareError={shareError}
      />
    </>
  );
}
