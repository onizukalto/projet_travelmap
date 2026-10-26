import type { Metadata } from "next";
import { Suspense } from "react";
import { Planner } from "@/components/planner/planner";
import { countryByAlpha2 } from "@/data/countries";

export const metadata: Metadata = { title: "Planifier" };

/** « ?pays=JP » préremplit le champ avec « Je veux partir au Japon ». */
function prefill(pays: string | string[] | undefined) {
  const code = typeof pays === "string" ? pays.toUpperCase() : null;
  const country = code ? countryByAlpha2(code) : undefined;
  return country ? `Je veux partir ${country.prep} ${country.name}` : "";
}

// L'adresse (?pays=…) n'est connue qu'à la visite : la page s'affiche dans un Suspense.
export default function PlanifierPage({ searchParams }: PageProps<"/planifier">) {
  return (
    <Suspense fallback={<Planner />}>
      {searchParams.then((params) => (
        <Planner initialText={prefill(params.pays)} />
      ))}
    </Suspense>
  );
}
