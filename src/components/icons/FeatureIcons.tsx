/**
 * Bespoke feature icon set — hand-drawn SVG geometry, no icon library.
 * Shared language: 24x24 grid, 1.4 stroke, rounded caps, one solid accent node.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  xmlns: "http://www.w3.org/2000/svg",
  ...props,
});

/** Journey — ascending waypoint path with a summit node */
export const JourneyIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 19c3.2 0 3.6-4.5 6.8-4.5S13 18 16 18" opacity={0.55} />
    <path d="M4.5 14.2 9 9.4l3.2 2.4L19 4.5" />
    <circle cx="9" cy="9.4" r="1.5" />
    <path d="M19 4.5v4M19 4.5h-4" />
    <circle cx="19" cy="4.5" r="2.4" fill="currentColor" opacity={0.18} stroke="none" />
  </svg>
);

/** Calendar — time grid with a highlighted slot */
export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.2" y="5.4" width="17.6" height="15" rx="3" />
    <path d="M3.2 10h17.6" opacity={0.7} />
    <path d="M8 3.4v3.4M16 3.4v3.4" />
    <rect x="6.6" y="12.4" width="4.4" height="3.6" rx="1.2" fill="currentColor" stroke="none" opacity={0.85} />
    <path d="M13.4 14.2h4M13.4 17.6h4M6.6 17.6h3.4" opacity={0.6} />
  </svg>
);

/** Job Posting — pinned role card with a talent marker */
export const JobIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 8.5h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-10Z" />
    <path d="M9 8.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2.5" />
    <path d="M4 12.6c2.7 1.3 5.3 2 8 2s5.3-.7 8-2" opacity={0.7} />
    <circle cx="12" cy="14.4" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

/** Smart Matching — two orbits locking into one node */
export const MatchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="8.6" cy="12" r="5.2" opacity={0.75} />
    <circle cx="15.4" cy="12" r="5.2" opacity={0.75} />
    <path d="M12 7.6v8.8" opacity={0.5} />
    <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
  </svg>
);

/** Market Intelligence — signal bars scanned by a radar sweep */
export const MarketIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 20.2h17" />
    <path d="M6.6 20.2v-4.6M10.8 20.2v-7.8M15 20.2v-3.2M19.2 20.2v-10" />
    <path d="M5 10.2c3-4.4 8.4-6.4 14-5.2" opacity={0.55} />
    <circle cx="19.2" cy="6.4" r="1.7" fill="currentColor" stroke="none" />
  </svg>
);

/** LightPaper — folded sheet emitting a light beam */
export const PaperIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 3.4h7.4L19 9v11.6H6a1.6 1.6 0 0 1-1.6-1.6V5a1.6 1.6 0 0 1 1.6-1.6Z" />
    <path d="M13.2 3.6V9H19" opacity={0.7} />
    <path d="M7.8 13.4h6.4M7.8 16.6h4.2" opacity={0.65} />
    <circle cx="16.4" cy="16.6" r="1.6" fill="currentColor" stroke="none" opacity={0.9} />
  </svg>
);

/** Video Calls — frame with live broadcast wedge */
export const VideoIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.8" y="6.2" width="12.6" height="11.6" rx="3" />
    <path d="M15.4 11.2 21 8v8l-5.6-3.2Z" />
    <circle cx="6.6" cy="9.8" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

/** Portfolio — segmented allocation ring */
export const PortfolioIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.4" opacity={0.75} />
    <path d="M12 3.6A8.4 8.4 0 0 1 20.4 12H12V3.6Z" fill="currentColor" stroke="none" opacity={0.9} />
    <path d="M12 12l-5.9 5.9" opacity={0.6} />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

/** Global Resources — meridian sphere with an active hub */
export const GlobalIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.4" />
    <ellipse cx="12" cy="12" rx="3.6" ry="8.4" opacity={0.6} />
    <path d="M3.9 9.2h16.2M3.9 14.8h16.2" opacity={0.6} />
    <circle cx="16.2" cy="8.2" r="1.7" fill="currentColor" stroke="none" />
  </svg>
);

/** AI Tools — neural core with three synapse arms */
export const AIIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.1" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <path d="M12 8.9V4.6M9.3 13.6 5.6 15.8M14.7 13.6l3.7 2.2" opacity={0.75} />
    <circle cx="12" cy="3.6" r="1.5" fill="currentColor" stroke="none" opacity={0.9} />
    <circle cx="4.7" cy="16.4" r="1.5" />
    <circle cx="19.3" cy="16.4" r="1.5" />
  </svg>
);

/** Section badge mark — four-point spark, used in place of a library sparkle */
export const SparkMark = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2.8c.9 4.9 3.5 7.5 8.4 8.4-4.9.9-7.5 3.5-8.4 8.4-.9-4.9-3.5-7.5-8.4-8.4 4.9-.9 7.5-3.5 8.4-8.4Z" />
  </svg>
);
