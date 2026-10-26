"use client";

import { Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { buttonSecondary } from "@/lib/button";
import { newId, useTripsStore, type Trip } from "@/lib/trips-store";
import { PrepBar } from "./trip-cards";

const SUGGESTIONS = ["Passeport", "Assurance voyage", "Réserver les ferries", "Permis international", "Adaptateur électrique"];

const iconButton =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-warn-ink";

/** Onglet Préparation : une checklist. */
export function ChecklistTab({ trip }: { trip: Trip }) {
  const updateTrip = useTripsStore((state) => state.updateTrip);
  const [label, setLabel] = useState("");
  const id = useId();
  const items = trip.checklist;
  const save = (checklist: Trip["checklist"]) => updateTrip(trip.id, { checklist });
  const add = (text: string) => {
    if (!text.trim()) return;
    save([...items, { id: newId(), label: text.trim(), done: false }]);
  };
  const missing = SUGGESTIONS.filter((s) => !items.some((item) => item.label === s));

  return (
    <div className="flex flex-col gap-5">
      <PrepBar trip={trip} />
      {items.length === 0 && (
        <p className="text-ink-2">Note tout ce qu&apos;il reste à préparer : la barre avance à chaque case cochée.</p>
      )}
      {items.length > 0 && (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-1 rounded-control hover:bg-surface-2">
              <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 px-2">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => save(items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))}
                  className="size-5 cursor-pointer accent-ink"
                />
                <span className={item.done ? "text-muted line-through" : "text-ink"}>{item.label}</span>
              </label>
              <button
                type="button"
                aria-label={`Supprimer « ${item.label} »`}
                onClick={() => save(items.filter((i) => i.id !== item.id))}
                className={iconButton}
              >
                <Trash2 aria-hidden strokeWidth={1.75} className="size-[18px]" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          add(label);
          setLabel("");
        }}
      >
        <label htmlFor={`${id}-tache`} className="sr-only">
          Nouvelle chose à préparer
        </label>
        <input
          id={`${id}-tache`}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Réserver la voiture…"
          className="h-11 min-w-0 flex-1 rounded-control border border-line-strong bg-surface px-3 text-ink placeholder:text-muted hover:border-ink focus-visible:border-ink"
        />
        <button type="submit" className={buttonSecondary}>
          <Plus aria-hidden strokeWidth={1.75} className="size-[18px]" />
          Ajouter
        </button>
      </form>
      {missing.length > 0 && (
        <div>
          <p className="text-caption font-semibold text-ink-2">Idées</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {missing.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => add(suggestion)}
                className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-control border border-dashed border-line-strong px-3 text-caption text-ink-2 hover:border-ink hover:text-ink"
              >
                <Plus aria-hidden strokeWidth={1.75} className="size-4" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

/** Onglet Budget : des lignes libellé et montant, avec le total. */
export function BudgetTab({ trip }: { trip: Trip }) {
  const updateTrip = useTripsStore((state) => state.updateTrip);
  const lines = trip.budget;
  const save = (budget: Trip["budget"]) => updateTrip(trip.id, { budget });
  const total = lines.reduce((sum, line) => sum + (Number.isFinite(line.amount) ? line.amount : 0), 0);

  return (
    <div className="flex flex-col gap-4">
      {lines.length === 0 ? (
        <p className="text-ink-2">Ajoute les grosses dépenses (transport, logement, activités) pour voir le total.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lines.map((line) => (
            <li key={line.id} className="flex items-center gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Libellé</span>
                <input
                  value={line.label}
                  onChange={(event) =>
                    save(lines.map((l) => (l.id === line.id ? { ...l, label: event.target.value } : l)))
                  }
                  placeholder="Libellé"
                  className="h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-ink placeholder:text-muted hover:border-ink focus-visible:border-ink"
                />
              </label>
              <label className="relative w-32 shrink-0">
                <span className="sr-only">Montant en euros pour {line.label || "cette ligne"}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={Number.isFinite(line.amount) ? line.amount : ""}
                  onChange={(event) =>
                    save(
                      lines.map((l) =>
                        l.id === line.id ? { ...l, amount: event.target.valueAsNumber || 0 } : l,
                      ),
                    )
                  }
                  className="h-11 w-full rounded-control border border-line-strong bg-surface pr-8 pl-3 text-right text-ink tabular-nums hover:border-ink focus-visible:border-ink"
                />
                <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-2">
                  €
                </span>
              </label>
              <button
                type="button"
                aria-label={`Supprimer la ligne ${line.label || "sans libellé"}`}
                onClick={() => save(lines.filter((l) => l.id !== line.id))}
                className={iconButton}
              >
                <Trash2 aria-hidden strokeWidth={1.75} className="size-[18px]" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => save([...lines, { id: newId(), label: "", amount: 0 }])}
        className={`${buttonSecondary} self-start`}
      >
        <Plus aria-hidden strokeWidth={1.75} className="size-[18px]" />
        Ajouter une ligne
      </button>
      <p className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="font-semibold text-ink">Total</span>
        <span className="font-display text-[28px] font-extrabold tracking-[-0.03em] text-ink tabular-nums">{euros.format(total)}</span>
      </p>
    </div>
  );
}

/** Onglet Notes : du texte libre, enregistré à chaque frappe. */
export function NotesTab({ trip }: { trip: Trip }) {
  const updateTrip = useTripsStore((state) => state.updateTrip);
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        Notes du voyage
      </label>
      <textarea
        id={id}
        rows={12}
        value={trip.notes}
        onChange={(event) => updateTrip(trip.id, { notes: event.target.value })}
        placeholder="Ce qu'il ne faut pas oublier, les adresses glanées, les souvenirs…"
        className="block w-full resize-y rounded-control border border-line-strong bg-surface px-4 py-3 text-ink placeholder:text-muted hover:border-ink focus-visible:border-ink"
      />
      <p className="mt-2 text-small text-muted">Enregistré automatiquement dans ce navigateur.</p>
    </div>
  );
}
