"use client";

import { create } from "zustand";

export type Toast = {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
};

type ToastState = {
  toast: Toast | null;
  show: (message: string, action?: Toast["action"]) => void;
  dismiss: () => void;
};

/** Un seul message à la fois, en bas de l'écran (ex. « Voyage supprimé · Annuler »). */
export const useToast = create<ToastState>()((set) => ({
  toast: null,
  show: (message, action) => set({ toast: { id: Date.now(), message, action } }),
  dismiss: () => set({ toast: null }),
}));
