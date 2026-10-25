"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type TripStatus = "idea" | "planned" | "done";
export type Transport = "road" | "ferry" | "flight" | "train" | "walk";

export type Stop = {
  id: string;
  day: number;
  order: number;
  name: string;
  lat: number;
  lon: number;
  note: string;
  /** Comment on arrive depuis l'étape précédente. */
  transport: Transport;
  /** Clé du pays (code ISO numérique), calculée à l'ajout. */
  country: string | null;
};

export type ChecklistItem = { id: string; label: string; done: boolean };
export type BudgetLine = { id: string; label: string; amount: number };

export type Trip = {
  id: string;
  title: string;
  /** Pays traversés, déduits des étapes, dans l'ordre du voyage. */
  countries: string[];
  startDate?: string;
  endDate?: string;
  status: TripStatus;
  stops: Stop[];
  notes: string;
  checklist: ChecklistItem[];
  budget: BudgetLine[];
};

export type TripFields = Pick<Trip, "title" | "startDate" | "endDate" | "status">;
export type NewStop = Omit<Stop, "id" | "order">;

export const newId = () => crypto.randomUUID().slice(0, 8);

/** Trie les étapes par jour puis par ordre, renumérote, et recalcule les pays du voyage. */
function normalize(trip: Trip, stops: Stop[]): Trip {
  const sorted = stops
    .map((stop, index) => ({ stop, index }))
    .sort((a, b) => a.stop.day - b.stop.day || a.index - b.index)
    .map(({ stop }, order) => ({ ...stop, order }));
  const countries: string[] = [];
  for (const stop of sorted) {
    if (stop.country && !countries.includes(stop.country)) countries.push(stop.country);
  }
  return { ...trip, stops: sorted, countries };
}

type TripsState = {
  trips: Trip[];
  createTrip: (fields: TripFields) => string;
  updateTrip: (id: string, patch: Partial<Omit<Trip, "id" | "stops" | "countries">>) => void;
  deleteTrip: (id: string) => { trip: Trip; index: number } | null;
  restoreTrip: (trip: Trip, index: number) => void;
  addStop: (tripId: string, stop: NewStop) => void;
  updateStop: (tripId: string, stopId: string, patch: Partial<Omit<Stop, "id">>) => void;
  removeStop: (tripId: string, stopId: string) => void;
  /** Déplace une étape à une nouvelle position ; elle prend le jour de sa nouvelle voisine. */
  moveStop: (tripId: string, stopId: string, toIndex: number) => void;
};

export const useTripsStore = create<TripsState>()(
  persist(
    (set, get) => {
      const edit = (tripId: string, change: (trip: Trip) => Trip) =>
        set(({ trips }) => ({ trips: trips.map((t) => (t.id === tripId ? change(t) : t)) }));

      return {
        trips: [],
        createTrip: (fields) => {
          const id = newId();
          const trip: Trip = {
            id,
            countries: [],
            stops: [],
            notes: "",
            checklist: [],
            budget: [],
            ...fields,
          };
          set(({ trips }) => ({ trips: [trip, ...trips] }));
          return id;
        },
        updateTrip: (id, patch) => edit(id, (trip) => ({ ...trip, ...patch })),
        deleteTrip: (id) => {
          const trips = get().trips;
          const index = trips.findIndex((t) => t.id === id);
          if (index === -1) return null;
          set({ trips: trips.filter((t) => t.id !== id) });
          return { trip: trips[index], index };
        },
        restoreTrip: (trip, index) =>
          set(({ trips }) => {
            const next = [...trips];
            next.splice(Math.min(index, next.length), 0, trip);
            return { trips: next };
          }),
        addStop: (tripId, stop) =>
          edit(tripId, (trip) => {
            // La nouvelle étape se place à la fin de son jour.
            const stops = [...trip.stops];
            const at = stops.filter((s) => s.day <= stop.day).length;
            stops.splice(at, 0, { ...stop, id: newId(), order: at });
            return normalize(trip, stops);
          }),
        updateStop: (tripId, stopId, patch) =>
          edit(tripId, (trip) =>
            normalize(
              trip,
              trip.stops.map((s) => (s.id === stopId ? { ...s, ...patch } : s)),
            ),
          ),
        removeStop: (tripId, stopId) =>
          edit(tripId, (trip) =>
            normalize(
              trip,
              trip.stops.filter((s) => s.id !== stopId),
            ),
          ),
        moveStop: (tripId, stopId, toIndex) =>
          edit(tripId, (trip) => {
            const stops = [...trip.stops];
            const from = stops.findIndex((s) => s.id === stopId);
            if (from === -1) return trip;
            const [moved] = stops.splice(from, 1);
            const to = Math.max(0, Math.min(toIndex, stops.length));
            const neighbour = stops[to - 1] ?? stops[to];
            stops.splice(to, 0, { ...moved, day: neighbour?.day ?? moved.day });
            return normalize(trip, stops);
          }),
      };
    },
    {
      name: "travelmap-voyages",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ trips }) => ({ trips }),
      skipHydration: true,
    },
  ),
);

/** Vrai une fois les voyages relus depuis le navigateur. */
export function useTripsHydrated() {
  return useSyncExternalStore(
    (onChange) => useTripsStore.persist.onFinishHydration(onChange),
    () => useTripsStore.persist.hasHydrated(),
    () => false,
  );
}
