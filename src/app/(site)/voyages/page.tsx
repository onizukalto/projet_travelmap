import type { Metadata } from "next";
import { VoyagesView } from "@/components/trips/voyages-view";

export const metadata: Metadata = { title: "Voyages" };

export default function VoyagesPage() {
  return <VoyagesView />;
}
