/*
 * A curved edge between a coloured section and the beige page.
 * The wave is filled with the page colour (beige), so it looks like the section
 * itself ends (or starts) in a curve. Put it inside a `relative` section.
 *   position="bottom"  the section ends in a wave   (e.g. the hero)
 *   position="top"     the section starts with one  (e.g. a band after a beige section)
 */
export function WaveDivider({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 overflow-hidden leading-none ${
        position === "bottom" ? "bottom-0 rotate-180" : "top-0"
      }`}
    >
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="relative block h-14 w-[calc(100%+1.3px)] fill-paper md:h-20"
      >
        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
      </svg>
    </div>
  );
}
