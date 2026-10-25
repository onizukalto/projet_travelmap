"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CountryStatus = "home" | "visited" | "wish";

/** Statut affiché : « prévu » se déduit d'un voyage à venir (étape Voyages). */
export type DisplayStatus = CountryStatus | "planned";

type MapState = {
  countryStatuses: Record<string, CountryStatus>;
  setStatus: (key: string, status: CountryStatus) => void;
  clearStatus: (key: string) => void;
};

/** Statuts des pays, enregistrés dans le navigateur (localStorage). */
export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      countryStatuses: {},
      setStatus: (key, status) =>
        set(({ countryStatuses }) => {
          const next = { ...countryStatuses };
          // Un seul pays « j'y vis » : l'ancien devient « visité ».
          if (status === "home") {
            for (const [other, value] of Object.entries(next)) {
              if (value === "home" && other !== key) next[other] = "visited";
            }
          }
          next[key] = status;
          return { countryStatuses: next };
        }),
      clearStatus: (key) =>
        set(({ countryStatuses }) => {
          const next = { ...countryStatuses };
          delete next[key];
          return { countryStatuses: next };
        }),
    }),
    {
      name: "travelmap-carte",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ countryStatuses }) => ({ countryStatuses }),
      // La lecture se fait après le premier rendu, pour que serveur et navigateur affichent la même chose.
      skipHydration: true,
    },
  ),
);

/** Vrai une fois les statuts relus depuis le navigateur. */
export function useMapHydrated() {
  return useSyncExternalStore(
    (onChange) => useMapStore.persist.onFinishHydration(onChange),
    () => useMapStore.persist.hasHydrated(),
    () => false,
  );
}

type FocusState = {
  request: { key: string; nonce: number } | null;
  requestFocus: (key: string) => void;
  clearRequest: () => void;
};

/** Demande venue de la recherche : centrer la carte sur un pays et ouvrir son panneau. */
export const useMapFocus = create<FocusState>()((set) => ({
  request: null,
  requestFocus: (key) => set({ request: { key, nonce: Date.now() } }),
  clearRequest: () => set({ request: null }),
}));
