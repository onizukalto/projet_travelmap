import { geoDistance } from "d3-geo";
import { COUNTRY_BY_KEY } from "@/data/countries";
import type { Transport, Trip, TripStatus } from "@/lib/trips-store";

const DAY = 86_400_000;
const EARTH_KM = 6371;

/** "2026-05-14" → date locale (sans décalage de fuseau). */
export function parseDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const dayMonth = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
const full = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const monthYear = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" });

export function plural(count: number, one: string, many: string) {
  return `${count} ${count > 1 ? many : one}`;
}

/** Nombre de jours : d'après les dates, sinon d'après les étapes. */
export function tripDays(trip: Trip) {
  if (trip.startDate && trip.endDate) {
    return Math.max(1, Math.round((+parseDate(trip.endDate) - +parseDate(trip.startDate)) / DAY) + 1);
  }
  return Math.max(1, ...trip.stops.map((s) => s.day));
}

export function dateRange(trip: Trip) {
  if (!trip.startDate) return null;
  const start = parseDate(trip.startDate);
  if (!trip.endDate || trip.endDate === trip.startDate) return full.format(start);
  const end = parseDate(trip.endDate);
  if (start.getFullYear() === end.getFullYear()) {
    return `${dayMonth.format(start)} – ${full.format(end)}`;
  }
  return `${full.format(start)} – ${full.format(end)}`;
}

/** « mai 2025 », pour les souvenirs. */
export function tripMonth(trip: Trip) {
  const date = trip.startDate ?? trip.endDate;
  return date ? monthYear.format(parseDate(date)) : null;
}

/** Date du jour N du voyage, si la date de départ est connue. */
export function dayDate(trip: Trip, day: number) {
  if (!trip.startDate) return null;
  const date = parseDate(trip.startDate);
  date.setDate(date.getDate() + day - 1);
  return weekday.format(date);
}

/** « Départ dans 12 jours », « Départ demain », « En cours »… */
export function departure(trip: Trip) {
  if (!trip.startDate) return "Dates à fixer";
  const days = Math.round((+parseDate(trip.startDate) - +today()) / DAY);
  if (days > 1) return `Départ dans ${days} jours`;
  if (days === 1) return "Départ demain";
  if (days === 0) return "Départ aujourd'hui";
  if (trip.endDate && parseDate(trip.endDate) >= today()) return "En cours";
  return "Dates passées";
}

export function preparation(trip: Trip) {
  const total = trip.checklist.length;
  const done = trip.checklist.filter((item) => item.done).length;
  return { done, total, ratio: total ? done / total : 0 };
}

export function tripKm(trip: Trip) {
  let km = 0;
  for (let i = 1; i < trip.stops.length; i++) {
    const a = trip.stops[i - 1];
    const b = trip.stops[i];
    km += geoDistance([a.lon, a.lat], [b.lon, b.lat]) * EARTH_KM;
  }
  return Math.round(km);
}

export function countByTransport(trip: Trip, transport: Transport) {
  return trip.stops.filter((s, i) => i > 0 && s.transport === transport).length;
}

export function countryNames(trip: Trip) {
  return trip.countries.map((key) => COUNTRY_BY_KEY.get(key)?.name).filter(Boolean) as string[];
}

/** Un voyage prévu qui n'est pas encore terminé. */
export function isUpcoming(trip: Trip) {
  if (trip.status !== "planned") return false;
  return !trip.endDate || parseDate(trip.endDate) >= today();
}

/** Pays traversés par un voyage prévu non terminé : ils deviennent « prévus » sur la carte. */
export function plannedCountries(trips: Trip[]) {
  const keys = new Set<string>();
  for (const trip of trips) if (isUpcoming(trip)) trip.countries.forEach((k) => keys.add(k));
  return keys;
}

export const STATUS_NAMES: Record<TripStatus, string> = {
  idea: "Idée",
  planned: "Prévu",
  done: "Terminé",
};

export const TRANSPORT_NAMES: Record<Transport, string> = {
  road: "Route",
  ferry: "Ferry",
  flight: "Vol",
  train: "Train",
  walk: "À pied",
};

export const km = new Intl.NumberFormat("fr-FR");
