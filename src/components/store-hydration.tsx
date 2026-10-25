"use client";

import { useEffect } from "react";
import { useMapStore } from "@/lib/map-store";

/** Relit les données enregistrées dans le navigateur, une fois la page affichée. */
export function StoreHydration() {
  useEffect(() => {
    useMapStore.persist.rehydrate();
  }, []);
  return null;
}
