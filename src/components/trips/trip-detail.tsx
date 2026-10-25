"use client";

import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { COUNTRY_BY_KEY } from "@/data/countries";
import { buttonPrimary, buttonSecondary } from "@/lib/button";
import { countryAt } from "@/lib/locate";
import { useMapStore } from "@/lib/map-store";
import { reversePlace, type Place } from "@/lib/photon";
import { useToast } from "@/lib/toast-store";
import {
  countByTransport,
  countryNames,
  dateRange,
  plural,
  preparation,
  tripDays,
} from "@/lib/trip-utils";
import { useTripsHydrated, useTripsStore, type Trip, type TripFields } from "@/lib/trips-store";
import type { KeyedFeature } from "@/lib/world";
import { AddStopForm } from "./add-stop-form";
import { Itinerary } from "./itinerary";
import { StatusBadge } from "./trip-cards";
import { TripFormDialog } from "./trip-form-dialog";
import { TripMap } from "./trip-map";
import { BudgetTab, ChecklistTab, NotesTab } from "./trip-tabs";

type Tab = "itinerary" | "prep" | "budget" | "notes";
const TABS: { value: Tab; label: string }[] = [
  { value: "itinerary", label: "Itinéraire" },
  { value: "prep", label: "Préparation" },
  { value: "budget", label: "Budget" },
  { value: "notes", label: "Notes" },
];

export function TripDetail({ id }: { id: string }) {
  const trip = useTripsStore((state) => state.trips.find((t) => t.id === id));
  const hydrated = useTripsHydrated();
  // Juste après une suppression, on n'affiche pas « introuvable » le temps de revenir à la liste.
  const [deleted, setDeleted] = useState(false);

  if (!hydrated || (!trip && deleted)) return <TripDetailFallback />;
  if (!trip) {
    return (
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start gap-4 px-4 py-12 md:px-6 lg:px-8">
        <h1 className="text-[32px] leading-tight font-extrabold text-ink">Voyage introuvable</h1>
        <p className="text-ink-2">Ce voyage n&apos;existe pas, ou il a été supprimé de ce navigateur.</p>
        <Link href="/voyages" className={buttonSecondary}>
          <ArrowLeft aria-hidden strokeWidth={1.8} className="size-[18px]" />
          Retour aux voyages
        </Link>
      </div>
    );
  }
  return <TripView trip={trip} onDeleted={() => setDeleted(true)} />;
}

function TripView({ trip, onDeleted }: { trip: Trip; onDeleted: () => void }) {
  const router = useRouter();
  const updateTrip = useTripsStore((state) => state.updateTrip);
  const addStop = useTripsStore((state) => state.addStop);
  const deleteTrip = useTripsStore((state) => state.deleteTrip);
  const restoreTrip = useTripsStore((state) => state.restoreTrip);
  const statuses = useMapStore((state) => state.countryStatuses);
  const setStatus = useMapStore((state) => state.setStatus);
  const showToast = useToast((state) => state.show);

  const [tab, setTab] = useState<Tab>("itinerary");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [proposal, setProposal] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [pendingPoint, setPendingPoint] = useState<{ lon: number; lat: number } | null>(null);
  const detailed = useRef<KeyedFeature[]>([]);
  const reverseRequest = useRef(0);
  const addFormRef = useRef<HTMLDivElement>(null);

  const dayCount = Math.max(tripDays(trip), ...trip.stops.map((s) => s.day));
  const lastDay = trip.stops.at(-1)?.day ?? 1;
  const toMark = trip.countries.filter((k) => statuses[k] !== "home" && statuses[k] !== "visited");
  const prep = preparation(trip);
  const countries = countryNames(trip);

  const onDetailedReady = useCallback((features: KeyedFeature[]) => {
    detailed.current = features;
  }, []);

  // Clic sur la carte : on pose un point, puis on cherche le nom du lieu.
  const placeOnMap = async (lon: number, lat: number) => {
    const request = ++reverseRequest.current;
    setTab("itinerary");
    setPlace(null);
    setPendingPoint({ lon, lat });
    requestAnimationFrame(() => addFormRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    const found = await reversePlace(lon, lat).catch(() => null);
    if (request !== reverseRequest.current) return;
    const fallback = `Point ${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    setPlace(found ?? { name: fallback, label: fallback, lat, lon });
    setPendingPoint(null);
  };

  const changePlace = (next: Place | null) => {
    reverseRequest.current += 1;
    setPendingPoint(null);
    setPlace(next);
  };

  const saveFields = (fields: TripFields) => {
    const becomesDone = fields.status === "done" && trip.status !== "done";
    updateTrip(trip.id, fields);
    setEditing(false);
    if (becomesDone && toMark.length > 0) setProposal(true);
    if (fields.status !== "done") setProposal(false);
  };

  const remove = () => {
    onDeleted();
    const removed = deleteTrip(trip.id);
    router.push("/voyages");
    if (removed) {
      showToast("Voyage supprimé", {
        label: "Annuler",
        run: () => {
          restoreTrip(removed.trip, removed.index);
          router.push(`/voyages/${removed.trip.id}`);
        },
      });
    }
  };

  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((t) => t.value === tab);
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = TABS[(index + step + TABS.length) % TABS.length].value;
    setTab(next);
    document.getElementById(`onglet-${next}`)?.focus();
  };

  return (
    <div className="mx-auto grid w-full max-w-[1600px] flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <title>{`${trip.title} · TravelMap`}</title>

      <div className="order-2 min-w-0 px-4 pt-5 pb-10 md:px-6 lg:order-1 lg:px-8 lg:pt-8">
        <Link
          href="/voyages"
          className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 text-caption font-semibold text-ink-2 hover:text-ink"
        >
          <ArrowLeft aria-hidden strokeWidth={1.8} className="size-4" />
          Voyages
        </Link>

        <div className="mt-2 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={trip.status} />
              <span className="text-caption text-ink-2">{dateRange(trip) ?? "Dates à fixer"}</span>
            </div>
            <h1 className="mt-2 text-[32px] leading-[1.1] font-extrabold tracking-[-0.02em] break-words text-ink md:text-page-title">
              {trip.title}
            </h1>
            {countries.length > 0 && <p className="mt-2 text-ink-2">{countries.join(", ")}</p>}
          </div>
          <button type="button" onClick={() => setEditing(true)} className={`${buttonSecondary} shrink-0`}>
            <Pencil aria-hidden strokeWidth={1.8} className="size-4" />
            Modifier
          </button>
        </div>

        {proposal && toMark.length > 0 && (
          <div role="status" className="pop-in mt-5 rounded-panel bg-warn-bg p-4 text-warn-ink">
            <p className="font-semibold">
              Voyage terminé.{" "}
              {toMark.length > 1
                ? `Marquer ses ${toMark.length} pays comme visités sur ta carte ?`
                : "Marquer son pays comme visité sur ta carte ?"}
            </p>
            <p className="mt-0.5 text-caption">
              {toMark.map((k) => COUNTRY_BY_KEY.get(k)?.name).join(", ")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  toMark.forEach((k) => setStatus(k, "visited"));
                  setProposal(false);
                  showToast(
                    toMark.length > 1
                      ? `${toMark.length} pays marqués comme visités`
                      : "Pays marqué comme visité",
                  );
                }}
                className={buttonPrimary}
              >
                {toMark.length > 1 ? "Marquer comme visités" : "Marquer comme visité"}
              </button>
              <button
                type="button"
                onClick={() => setProposal(false)}
                className="min-h-11 cursor-pointer rounded-control px-4 font-semibold hover:underline"
              >
                Non merci
              </button>
            </div>
          </div>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-3 rounded-panel border border-line bg-surface p-4 sm:grid-cols-4">
          <KeyFigure label="Durée" value={plural(dayCount, "jour", "jours")} />
          <KeyFigure label="Étapes" value={trip.stops.length} />
          <KeyFigure label="Ferries" value={countByTransport(trip, "ferry")} />
          <KeyFigure label="Préparation" value={prep.total ? `${Math.round(prep.ratio * 100)} %` : "–"} />
        </dl>

        <div
          role="tablist"
          aria-label="Sections du voyage"
          onKeyDown={onTabKey}
          className="mt-6 flex gap-1 overflow-x-auto border-b border-line"
        >
          {TABS.map(({ value, label }) => {
            const selected = tab === value;
            return (
              <button
                key={value}
                id={`onglet-${value}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`panneau-${value}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(value)}
                className={`-mb-px min-h-11 shrink-0 cursor-pointer border-b-[3px] px-3 transition-colors duration-150 ${
                  selected
                    ? "border-visited font-bold text-ink"
                    : "border-transparent font-semibold text-ink-2 hover:text-ink"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div
          id={`panneau-${tab}`}
          role="tabpanel"
          aria-labelledby={`onglet-${tab}`}
          tabIndex={0}
          className="pt-5 focus-visible:outline-offset-4"
        >
          {tab === "itinerary" && (
            <div className="flex flex-col gap-5">
              {trip.stops.length === 0 ? (
                <p className="text-ink-2">
                  Pas encore d&apos;étape. Cherche un premier lieu ci-dessous, ou clique sur la carte.
                </p>
              ) : (
                <Itinerary
                  trip={trip}
                  dayCount={dayCount}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                />
              )}
              <div ref={addFormRef}>
                <AddStopForm
                  key={trip.stops.length}
                  place={place}
                  placeLoading={pendingPoint !== null}
                  onPlaceChange={changePlace}
                  dayCount={dayCount}
                  defaultDay={selectedDay ?? lastDay}
                  isFirst={trip.stops.length === 0}
                  onAdd={(chosen, day, transport) => {
                    addStop(trip.id, {
                      day,
                      name: chosen.name,
                      lat: chosen.lat,
                      lon: chosen.lon,
                      note: "",
                      transport: trip.stops.length === 0 ? "road" : transport,
                      country: countryAt(chosen.lon, chosen.lat, {
                        detailed: detailed.current,
                        alpha2: chosen.countryCode,
                      }),
                    });
                    setPlace(null);
                  }}
                />
              </div>
            </div>
          )}
          {tab === "prep" && <ChecklistTab trip={trip} />}
          {tab === "budget" && <BudgetTab trip={trip} />}
          {tab === "notes" && <NotesTab trip={trip} />}
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <button
            type="button"
            onClick={remove}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-3 font-semibold text-warn-ink hover:bg-warn-bg"
          >
            <Trash2 aria-hidden strokeWidth={1.8} className="size-[18px]" />
            Supprimer le voyage
          </button>
        </div>
      </div>

      <div className="order-1 h-[46svh] p-3 md:p-4 lg:sticky lg:top-16 lg:order-2 lg:h-[calc(100svh-4rem)] lg:pl-0">
        <TripMap
          stops={trip.stops}
          selectedDay={selectedDay}
          onSelectDay={(day) => {
            setSelectedDay(day);
            setTab("itinerary");
          }}
          pending={pendingPoint ?? (place ? { lon: place.lon, lat: place.lat } : null)}
          onPlace={placeOnMap}
          onDetailedReady={onDetailedReady}
        />
      </div>

      <TripFormDialog
        open={editing}
        heading="Modifier le voyage"
        submitLabel="Enregistrer"
        initial={trip}
        onClose={() => setEditing(false)}
        onSubmit={saveFields}
      />
    </div>
  );
}

function KeyFigure({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0">
      <dt className="text-small text-muted">{label}</dt>
      <dd className="truncate text-[20px] leading-tight font-extrabold text-ink tabular-nums md:text-[22px]">
        {value}
      </dd>
    </div>
  );
}

export function TripDetailFallback() {
  return (
    <div aria-hidden className="mx-auto grid w-full max-w-[1600px] flex-1 gap-6 p-4 md:p-6 lg:grid-cols-2 lg:p-8">
      <div className="flex flex-col gap-4">
        <div className="h-10 w-2/3 animate-pulse rounded-control bg-surface motion-reduce:animate-none" />
        <div className="h-20 animate-pulse rounded-panel bg-surface motion-reduce:animate-none" />
        <div className="h-64 animate-pulse rounded-panel bg-surface motion-reduce:animate-none" />
      </div>
      <div className="h-[46svh] animate-pulse rounded-panel bg-surface motion-reduce:animate-none lg:h-[70svh]" />
    </div>
  );
}
