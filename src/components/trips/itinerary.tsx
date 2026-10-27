"use client";

import { ChevronDown, ChevronUp, GripVertical, NotebookPen, Trash2 } from "lucide-react";
import { useState } from "react";
import { COUNTRY_BY_KEY } from "@/data/countries";
import { TRANSPORT_ORDER } from "@/lib/route-geometry";
import { TRANSPORT_NAMES, dayDate, plural } from "@/lib/trip-utils";
import { useTripsStore, type Stop, type Transport, type Trip } from "@/lib/trips-store";
import { TRANSPORT_ICONS } from "./transport-icon";

type Props = {
  trip: Trip;
  dayCount: number;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
};

/** Frise des jours : chaque jour et ses étapes numérotées. */
export function Itinerary({ trip, dayCount, selectedDay, onSelectDay }: Props) {
  const moveStop = useTripsStore((state) => state.moveStop);
  const updateStop = useTripsStore((state) => state.updateStop);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const days = Array.from({ length: dayCount }, (_, i) => i + 1);
  const indexOf = new Map(trip.stops.map((s, i) => [s.id, i]));

  const endDrag = () => {
    setDragId(null);
    setDropIndex(null);
  };

  const dropAt = (index: number) => {
    if (!dragId) return;
    const from = indexOf.get(dragId) ?? 0;
    moveStop(trip.id, dragId, from < index ? index - 1 : index);
    endDrag();
  };

  return (
    <ol className="flex flex-col gap-2" aria-label="Itinéraire jour par jour">
      {days.map((day) => {
        const stops = trip.stops.filter((s) => s.day === day);
        const selected = selectedDay === day;
        const date = dayDate(trip, day);
        return (
          <li
            key={day}
            className={`rounded-panel border p-1.5 transition-[border-color,background-color] duration-200 ${
              selected ? "border-ink bg-surface" : "border-border bg-surface hover:border-line-strong"
            }`}
          >
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectDay(selected ? null : day)}
              onDragOver={(event) => {
                // Déposer sur le titre d'un jour vide y range l'étape.
                if (dragId && stops.length === 0) event.preventDefault();
              }}
              onDrop={() => {
                if (dragId && stops.length === 0) {
                  updateStop(trip.id, dragId, { day });
                  endDrag();
                }
              }}
              className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-control px-2 text-left transition-colors duration-150 hover:bg-surface-2"
            >
              {/* Le jour choisi prend la pastille jaune, comme le lien actif de la navigation. */}
              <span
                className={`rounded-badge border px-2 py-0.5 font-display text-[17px] font-extrabold tracking-[-0.02em] text-ink transition-colors duration-200 ${
                  selected ? "border-ink bg-accent-yellow text-on-accent" : "border-transparent"
                }`}
              >
                Jour {day}
              </span>
              {date && <span className="text-caption text-ink-2">{date}</span>}
              <span className="ml-auto text-small text-muted">
                {stops.length ? plural(stops.length, "étape", "étapes") : "Aucune étape"}
              </span>
            </button>
            {stops.length > 0 && (
              <ol className="mt-1 flex flex-col">
                {stops.map((stop, position) => {
                  const index = indexOf.get(stop.id)!;
                  return (
                    <StopRow
                      key={stop.id}
                      trip={trip}
                      stop={stop}
                      index={index}
                      total={trip.stops.length}
                      linkNext={position < stops.length - 1}
                      dayCount={dayCount}
                      dragging={dragId === stop.id}
                      dropBefore={dropIndex === index}
                      dropAfter={dropIndex === index + 1 && index === trip.stops.length - 1}
                      onDragStart={() => setDragId(stop.id)}
                      onDragEnd={endDrag}
                      onDragOverHalf={(after) => setDropIndex(after ? index + 1 : index)}
                      onDrop={() => dropIndex !== null && dropAt(dropIndex)}
                    />
                  );
                })}
              </ol>
            )}
          </li>
        );
      })}
    </ol>
  );
}

type RowProps = {
  trip: Trip;
  stop: Stop;
  index: number;
  total: number;
  /** Relie cette étape à la suivante du même jour par un trait (la frise). */
  linkNext: boolean;
  dayCount: number;
  dragging: boolean;
  dropBefore: boolean;
  dropAfter: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOverHalf: (after: boolean) => void;
  onDrop: () => void;
};

function StopRow({
  trip,
  stop,
  index,
  total,
  linkNext,
  dayCount,
  dragging,
  dropBefore,
  dropAfter,
  onDragStart,
  onDragEnd,
  onDragOverHalf,
  onDrop,
}: RowProps) {
  const moveStop = useTripsStore((state) => state.moveStop);
  const updateStop = useTripsStore((state) => state.updateStop);
  const removeStop = useTripsStore((state) => state.removeStop);
  const [noteOpen, setNoteOpen] = useState(stop.note !== "");
  const Icon = TRANSPORT_ICONS[stop.transport];
  const country = stop.country ? COUNTRY_BY_KEY.get(stop.country)?.name : null;
  const iconButton =
    "flex size-11 cursor-pointer items-center justify-center rounded-control text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent";

  return (
    <li
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", stop.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        onDragOverHalf(event.clientY > rect.top + rect.height / 2);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      className={`relative rounded-control py-2 pr-1 pl-1 transition-opacity duration-150 ${dragging ? "opacity-40" : ""}`}
    >
      {/* Trait de la frise : du centre de cette pastille au centre de la suivante. */}
      {linkNext && <span aria-hidden className="absolute top-[30px] -bottom-[30px] left-[47.5px] w-px bg-line-strong" />}
      {dropBefore && <span aria-hidden className="absolute inset-x-2 -top-px h-0.5 rounded-full bg-ink" />}
      {dropAfter && <span aria-hidden className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink" />}
      <div className="flex items-start gap-1.5">
        <span
          aria-hidden
          title="Glisser pour réordonner"
          className="flex h-11 w-6 shrink-0 cursor-grab items-center justify-center text-muted active:cursor-grabbing"
        >
          <GripVertical strokeWidth={1.75} className="size-4" />
        </span>
        <span
          aria-hidden
          className="relative mt-2 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-surface bg-ink text-small font-extrabold text-bg tabular-nums"
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 pl-1">
          <label>
            <span className="sr-only">Nom de l&apos;étape {index + 1}</span>
            <input
              value={stop.name}
              onChange={(event) => updateStop(trip.id, stop.id, { name: event.target.value })}
              onBlur={(event) => {
                if (!event.target.value.trim()) updateStop(trip.id, stop.id, { name: `Étape ${index + 1}` });
              }}
              className="-mx-1.5 min-h-11 w-full truncate rounded-badge border border-transparent bg-transparent px-1.5 font-semibold text-ink hover:border-line focus-visible:border-ink focus-visible:bg-surface-raised"
            />
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-2">
            {index > 0 && (
              <label className="flex items-center gap-1.5">
                <Icon aria-hidden strokeWidth={1.75} className="size-4" />
                <span className="sr-only">Arrivée depuis l&apos;étape précédente</span>
                <select
                  value={stop.transport}
                  onChange={(event) => updateStop(trip.id, stop.id, { transport: event.target.value as Transport })}
                  className="min-h-8 cursor-pointer rounded-badge border border-line bg-surface px-1.5 text-small text-ink hover:border-ink"
                >
                  {TRANSPORT_ORDER.map((t) => (
                    <option key={t} value={t}>
                      {TRANSPORT_NAMES[t]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex items-center gap-1.5">
              <span className="sr-only">Jour de l&apos;étape {stop.name}</span>
              <select
                value={stop.day}
                onChange={(event) => updateStop(trip.id, stop.id, { day: Number(event.target.value) })}
                className="min-h-8 cursor-pointer rounded-badge border border-line bg-surface px-1.5 text-small text-ink hover:border-ink"
              >
                {Array.from({ length: dayCount + 1 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Jour {i + 1}
                  </option>
                ))}
              </select>
            </label>
            {country && <span>{country}</span>}
          </div>
          {noteOpen && (
            <label className="mt-2 block">
              <span className="sr-only">Note pour {stop.name}</span>
              <textarea
                rows={2}
                autoFocus={stop.note === ""}
                value={stop.note}
                onChange={(event) => updateStop(trip.id, stop.id, { note: event.target.value })}
                placeholder="Une adresse, une réservation, une idée…"
                className="block w-full resize-y rounded-control border border-line-strong bg-surface px-3 py-2 text-caption text-ink placeholder:text-muted hover:border-ink focus-visible:border-ink"
              />
            </label>
          )}
        </div>
        {/* En carré 2 × 2 sur mobile : le nom de l'étape garde de la place. */}
        <div className="grid shrink-0 grid-cols-2 sm:flex">
          <button
            type="button"
            aria-label={`Monter ${stop.name}`}
            disabled={index === 0}
            onClick={() => moveStop(trip.id, stop.id, index - 1)}
            className={iconButton}
          >
            <ChevronUp aria-hidden strokeWidth={1.75} className="size-[18px]" />
          </button>
          <button
            type="button"
            aria-label={`Descendre ${stop.name}`}
            disabled={index === total - 1}
            onClick={() => moveStop(trip.id, stop.id, index + 1)}
            className={iconButton}
          >
            <ChevronDown aria-hidden strokeWidth={1.75} className="size-[18px]" />
          </button>
          <button
            type="button"
            aria-label={`Note pour ${stop.name}`}
            aria-expanded={noteOpen}
            onClick={() => setNoteOpen((value) => !value)}
            className={`${iconButton} ${noteOpen ? "text-ink" : ""}`}
          >
            <NotebookPen aria-hidden strokeWidth={1.75} className="size-[18px]" />
          </button>
          <button
            type="button"
            aria-label={`Supprimer ${stop.name}`}
            onClick={() => removeStop(trip.id, stop.id)}
            className={`${iconButton} hover:text-warn-ink`}
          >
            <Trash2 aria-hidden strokeWidth={1.75} className="size-[18px]" />
          </button>
        </div>
      </div>
    </li>
  );
}
