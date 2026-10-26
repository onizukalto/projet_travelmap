"use client";

import { useEffect } from "react";
import { useConversationsStore } from "@/lib/conversations-store";
import { useMapStore } from "@/lib/map-store";
import { useTripsStore } from "@/lib/trips-store";

/** Relit les données enregistrées dans le navigateur, une fois la page affichée. */
export function StoreHydration() {
  useEffect(() => {
    useMapStore.persist.rehydrate();
    useTripsStore.persist.rehydrate();
    useConversationsStore.persist.rehydrate();
  }, []);
  return null;
}
