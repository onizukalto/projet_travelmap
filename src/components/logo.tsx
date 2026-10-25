import Link from "next/link";

/** Le nom du site dans un cadre double, comme le cartouche d'une carte. */
export function Logo() {
  return (
    <Link
      href="/"
      className="inline-flex min-h-11 items-center rounded-[2px] border-[3px] border-double border-ink px-2.5 pt-1 pb-0.5 text-lg leading-none font-extrabold tracking-[-0.01em] text-ink"
    >
      TravelMap
    </Link>
  );
}
