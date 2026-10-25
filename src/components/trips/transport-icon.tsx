import { Car, Footprints, Plane, Ship, TrainFront, type LucideIcon } from "lucide-react";
import type { Transport } from "@/lib/trips-store";

export const TRANSPORT_ICONS: Record<Transport, LucideIcon> = {
  road: Car,
  ferry: Ship,
  flight: Plane,
  train: TrainFront,
  walk: Footprints,
};
