import type { Metadata } from "next";
import { MaCarte } from "@/components/map/ma-carte";

export const metadata: Metadata = { title: "Ma carte" };

export default function MaCartePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <h1 className="sr-only">Ma carte</h1>
      <MaCarte />
    </div>
  );
}
