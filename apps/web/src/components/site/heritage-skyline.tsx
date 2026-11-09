import { cn } from '@/lib/cn';

/**
 * Heritage skyline.
 *
 * An original, lightweight line-art illustration for the footer: layered
 * silhouettes of Indian heritage architecture (domes, archways, minarets),
 * trees and a small stylised cow. Drawn in-house with primitives, so there is no
 * licensing question and no bitmap payload.
 *
 * It is decorative only: `aria-hidden`, no text, and it never implies that these
 * are photographs or accurate depictions of the organisation's buildings.
 *
 * Colour comes from `currentColor`, so the illustration inherits the palette and
 * adapts to the surface behind it.
 */

export interface HeritageSkylineProps {
  className?: string;
}

export function HeritageSkyline({ className }: HeritageSkylineProps) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none select-none', className)}>
      <svg
        viewBox="0 0 1440 220"
        className="block h-auto w-full"
        fill="none"
        preserveAspectRatio="xMidYMax meet"
        focusable="false"
      >
        {/* Distant skyline — the lightest layer. */}
        <g className="text-cocoa/25" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M176 220v-44a46 46 0 0 1 92 0v44" />
          <path d="M222 132v-12" />
          <circle cx="222" cy="117" r="4" />

          <path d="M622 220v-34a32 32 0 0 1 64 0v34" />
          <path d="M654 152v-10" />

          <path d="M1112 220v-50a50 50 0 0 1 100 0v50" />
          <path d="M1162 120v-14" />
          <circle cx="1162" cy="102" r="5" />

          <path d="M60 220v-58h18v58" />
          <path d="M69 162v-14" />
          <circle cx="69" cy="144" r="5" />

          <path d="M1330 220v-62h18v62" />
          <path d="M1339 158v-14" />
          <circle cx="1339" cy="140" r="5" />
        </g>

        {/* Middle ground — gateway, pavilion and side arches. */}
        <g
          className="text-terracotta/55"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M366 220v-70a46 46 0 0 1 92 0v70" />
          <path d="M392 220v-46a20 20 0 0 1 40 0v46" />
          <path d="M412 96v-12" />
          <circle cx="412" cy="80" r="4" />

          <path d="M872 220v-60a48 48 0 0 1 96 0v60" />
          <path d="M920 106v-14" />
          <circle cx="920" cy="86" r="4" />

          <path d="M1236 220v-44a32 32 0 0 1 64 0v44" />
          <path d="M1268 142v-10" />
        </g>

        {/* Foreground — ground line and trees. */}
        <g className="text-cocoa/65" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M0 219h1440" />

          <path d="M120 219v-38" />
          <circle cx="120" cy="164" r="16" />
          <circle cx="102" cy="175" r="11" />
          <circle cx="138" cy="175" r="11" />

          <path d="M1084 219v-34" />
          <circle cx="1084" cy="170" r="14" />
          <circle cx="1068" cy="180" r="10" />
          <circle cx="1100" cy="180" r="10" />
        </g>

        {/* A small, stylised cow — a quiet nod to the gaushala, not a portrait. */}
        <g className="text-cocoa/55" fill="currentColor" transform="translate(688 128)">
          <rect x="0" y="8" width="84" height="34" rx="17" />
          <path d="M76 12h10a10 10 0 0 1 10 10v6a10 10 0 0 1-10 10H76z" />
          <path d="M86 10c1-8 7-12 13-12-3 4-4 8-4 13z" />
          <ellipse cx="79" cy="21" rx="5.5" ry="3" />
          <rect x="10" y="38" width="9" height="32" rx="4.5" />
          <rect x="26" y="38" width="9" height="32" rx="4.5" />
          <rect x="57" y="38" width="9" height="32" rx="4.5" />
          <rect x="71" y="38" width="9" height="32" rx="4.5" />
          <ellipse cx="44" cy="43" rx="8" ry="3.5" opacity="0.75" />
          <path
            d="M3 16c-7 3-9 10-6 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
