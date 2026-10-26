import type { Metadata } from "next";
import { Suspense } from "react";
import { TripDetail, TripDetailFallback } from "@/components/trips/trip-detail";

export const metadata: Metadata = { title: "Voyage" };

// L'identifiant n'est connu qu'à la visite : la page s'affiche dans un Suspense.
export default function VoyagePage({ params }: PageProps<"/voyages/[id]">) {
  return (
    <Suspense fallback={<TripDetailFallback />}>
      {params.then(({ id }) => (
        <TripDetail id={id} />
      ))}
    </Suspense>
  );
}
