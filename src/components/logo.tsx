import Link from "next/link";

/** Le logo : un carré jaune bordé d'encre et le mot « TravelMap » en Inter Tight. */
export function Logo() {
  return (
    <Link href="/" className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control text-ink">
      <span
        aria-hidden
        className="size-[18px] rounded-[4px] border-[1.5px] border-ink bg-accent-yellow transition-transform duration-300 ease-[var(--ease-spring)] group-hover:rotate-45"
      />
      <span className="font-display text-[21px] leading-none font-extrabold tracking-[-0.045em]">TravelMap</span>
    </Link>
  );
}
