"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { buttonPrimary, buttonSecondary } from "@/lib/button";
import { STATUS_NAMES } from "@/lib/trip-utils";
import type { TripFields, TripStatus } from "@/lib/trips-store";

type Props = {
  open: boolean;
  heading: string;
  submitLabel: string;
  initial?: Partial<TripFields>;
  onSubmit: (fields: TripFields) => void;
  onClose: () => void;
};

const STATUSES: TripStatus[] = ["idea", "planned", "done"];

/** Fenêtre pour créer ou modifier un voyage : titre, dates facultatives, statut. */
export function TripFormDialog({ open, heading, submitLabel, initial, onSubmit, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="voyage-form-titre"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Un clic sur le fond (hors du panneau) ferme la fenêtre.
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-panel border border-border bg-surface p-0 text-ink shadow-float backdrop:bg-ink/40"
    >
      {open && (
        <TripForm
          heading={heading}
          submitLabel={submitLabel}
          initial={initial}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      )}
    </dialog>
  );
}

function TripForm({ heading, submitLabel, initial, onSubmit, onClose }: Omit<Props, "open">) {
  const id = useId();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [status, setStatus] = useState<TripStatus>(initial?.status ?? "planned");
  const [submitted, setSubmitted] = useState(false);

  const titleError = submitted && !title.trim() ? "Donne un nom à ton voyage." : null;
  const dateError =
    startDate && endDate && endDate < startDate ? "Le retour doit être après le départ." : null;

  return (
    <form
      noValidate
      className="pop-in p-5 md:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (!title.trim() || dateError) return;
        onSubmit({
          title: title.trim(),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status,
        });
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="voyage-form-titre" className="font-display text-[26px] font-extrabold tracking-[-0.035em] text-ink">
          {heading}
        </h2>
        <button
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className="-mt-2 -mr-2 flex size-11 cursor-pointer items-center justify-center rounded-control text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          <X aria-hidden strokeWidth={1.75} className="size-5" />
        </button>
      </div>

      <label htmlFor={`${id}-titre`} className="mt-5 block font-semibold">
        Nom du voyage
      </label>
      <input
        id={`${id}-titre`}
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Par exemple : Road trip en Islande"
        aria-invalid={Boolean(titleError)}
        aria-describedby={titleError ? `${id}-titre-erreur` : undefined}
        className="mt-2 h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-ink placeholder:text-muted hover:border-ink focus-visible:border-ink aria-invalid:border-warn-ink"
      />
      {titleError && (
        <p id={`${id}-titre-erreur`} className="mt-1.5 text-caption text-warn-ink">
          {titleError}
        </p>
      )}

      <fieldset className="mt-5">
        <legend className="font-semibold">
          Dates <span className="font-normal text-muted">(facultatives)</span>
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <label className="text-caption text-ink-2">
            Départ
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1 h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-body text-ink hover:border-ink focus-visible:border-ink"
            />
          </label>
          <label className="text-caption text-ink-2">
            Retour
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              aria-invalid={Boolean(dateError)}
              aria-describedby={dateError ? `${id}-dates-erreur` : undefined}
              className="mt-1 h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-body text-ink hover:border-ink focus-visible:border-ink aria-invalid:border-warn-ink"
            />
          </label>
        </div>
        {dateError && (
          <p id={`${id}-dates-erreur`} className="mt-1.5 text-caption text-warn-ink">
            {dateError}
          </p>
        )}
      </fieldset>

      <fieldset className="mt-5">
        <legend className="font-semibold">Statut</legend>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {STATUSES.map((value) => (
            <label
              key={value}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-control border px-2 text-caption transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink ${
                status === value
                  ? "border-ink bg-accent-yellow font-bold text-on-accent"
                  : "border-line text-ink-2 hover:border-ink hover:text-ink"
              }`}
            >
              <input
                type="radio"
                name={`${id}-statut`}
                value={value}
                checked={status === value}
                onChange={() => setStatus(value)}
                className="sr-only"
              />
              {STATUS_NAMES[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className={buttonSecondary}>
          Annuler
        </button>
        <button type="submit" className={buttonPrimary}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
