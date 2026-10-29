/**
 * Genius tool icon set — drawn from scratch for Startup Factory Hub.
 * Shared language: 24x24 grid, 1.5 stroke, rounded joins, one filled accent node.
 * No icon library is used here.
 */
import type { SVGProps } from "react";

export type GeniusIcon = (props: SVGProps<SVGSVGElement>) => JSX.Element;

const S = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  xmlns: "http://www.w3.org/2000/svg",
  ...props,
});

/* ── INSTANT ─────────────────────────────────────────────── */
export const BoltIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M13.6 2.6 5.8 13.2h5L9.9 21.4l8.3-11h-5.3l.7-7.8Z" />
    <path d="M13.6 2.6 5.8 13.2h5" fill="currentColor" opacity={0.22} stroke="none" />
  </svg>
);

/* ── CREATE ──────────────────────────────────────────────── */
export const ResearchIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M9.6 3v6.1L5.4 17a3 3 0 0 0 2.6 4.4h8a3 3 0 0 0 2.6-4.4l-4.2-7.9V3" />
    <path d="M8.2 3h7.6" />
    <path d="M7.1 14.6h9.8" opacity={0.7} />
    <circle cx="10.4" cy="17.6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="13.9" cy="19" r="0.8" fill="currentColor" stroke="none" opacity={0.8} />
  </svg>
);

export const SummaryIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <rect x="3.2" y="4.2" width="17.6" height="15.6" rx="3" />
    <path d="M7 15.6v-3.2M11 15.6V9.4M15 15.6v-4.6" />
    <circle cx="15" cy="9.2" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const PitchIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <rect x="2.8" y="4" width="18.4" height="12" rx="2.6" />
    <path d="M12 16v4.2M8.4 20.2h7.2" />
    <path d="M6.6 12.4 10 8.8l2.5 2 4-4.4" opacity={0.9} />
    <circle cx="16.5" cy="6.4" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const PlanIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <rect x="2.8" y="7" width="18.4" height="13" rx="2.6" />
    <path d="M8.6 7V5.4A1.6 1.6 0 0 1 10.2 3.8h3.6A1.6 1.6 0 0 1 15.4 5.4V7" />
    <path d="M2.8 11.8c3 1.4 6 2.1 9.2 2.1s6.2-.7 9.2-2.1" opacity={0.7} />
    <rect x="10.6" y="12.6" width="2.8" height="2.4" rx="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const BookIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M4 4.4h5.6A2.4 2.4 0 0 1 12 6.8v13a2 2 0 0 0-2-2H4V4.4Z" />
    <path d="M20 4.4h-5.6A2.4 2.4 0 0 0 12 6.8v13a2 2 0 0 1 2-2h6V4.4Z" opacity={0.7} />
    <path d="M12 6.8v13" />
    <circle cx="12" cy="20.4" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const QuillIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M20.4 3.6c-7.4.4-12 4-13.4 9.4l-2.6 4.6" />
    <path d="M7 13c4.6.8 8.6-1.6 10.4-5.4" opacity={0.7} />
    <path d="M4.2 20.4c1.6-2.6 4-4.2 7-4.6" />
    <circle cx="20.4" cy="3.6" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const ScriptIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <rect x="2.8" y="6" width="18.4" height="12.6" rx="2.6" />
    <path d="M2.8 10.2h18.4" opacity={0.7} />
    <path d="M6.8 6.2 9 10.2M11.6 6.2l2.2 4M16.4 6.2l2.2 4" opacity={0.6} />
    <path d="M10.2 12.8v4l3.8-2-3.8-2Z" fill="currentColor" stroke="none" />
  </svg>
);

export const LegalIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M12 4v16M6.6 20.4h10.8" />
    <path d="M4.4 8.6h15.2" opacity={0.8} />
    <path d="M4.4 8.6 2.4 13.6a3 3 0 0 0 4 0l-2-5ZM19.6 8.6l-2 5a3 3 0 0 0 4 0l-2-5Z" />
    <circle cx="12" cy="4.2" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

export const BlogIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M19.8 12.4v6.2a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2V6.2a2 2 0 0 1 2-2h6.4" />
    <path d="m13.4 13.2 6.9-6.9a1.9 1.9 0 0 0-2.7-2.7l-6.9 6.9-.7 3.4 3.4-.7Z" />
    <path d="M7 16.4h5.4" opacity={0.6} />
  </svg>
);

export const ReportIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <rect x="4.4" y="3.6" width="15.2" height="17" rx="2.6" />
    <path d="M8.8 3.6V2M15.2 3.6V2" opacity={0.7} />
    <path d="M8.4 9h7.2M8.4 12.6h7.2M8.4 16.2h4" opacity={0.75} />
    <circle cx="16.6" cy="16.2" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const LetterIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <rect x="2.8" y="5.2" width="18.4" height="13.6" rx="2.6" />
    <path d="m3.6 7 7.3 5.2a2 2 0 0 0 2.2 0L20.4 7" />
    <circle cx="12" cy="12.4" r="1.2" fill="currentColor" stroke="none" opacity={0.9} />
  </svg>
);

export const FreeWriteIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M9.6 3.4c.7 3.7 2.6 5.6 6.3 6.3-3.7.7-5.6 2.6-6.3 6.3-.7-3.7-2.6-5.6-6.3-6.3 3.7-.7 5.6-2.6 6.3-6.3Z" />
    <path d="M17.4 14.2c.4 1.9 1.4 2.9 3.3 3.3-1.9.4-2.9 1.4-3.3 3.3-.4-1.9-1.4-2.9-3.3-3.3 1.9-.4 2.9-1.4 3.3-3.3Z" fill="currentColor" stroke="none" opacity={0.9} />
  </svg>
);

/* ── ANALYZE ─────────────────────────────────────────────── */
export const AnalyticsIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M3.4 20.4h17.2" />
    <path d="M4.6 16.2 9.4 11l3.2 2.8 6.6-7.4" />
    <path d="M15.6 6.4h4v4" opacity={0.8} />
    <circle cx="9.4" cy="11" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const IntelIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M12 3.6a4.6 4.6 0 0 0-4.6 4.6v.4A3.6 3.6 0 0 0 6 12a3.6 3.6 0 0 0 2.2 3.3v.5A3.4 3.4 0 0 0 12 19.6" />
    <path d="M12 3.6a4.6 4.6 0 0 1 4.6 4.6v.4A3.6 3.6 0 0 1 18 12a3.6 3.6 0 0 1-2.2 3.3v.5A3.4 3.4 0 0 1 12 19.6" opacity={0.7} />
    <path d="M12 3.6v16" opacity={0.5} />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export const ScanIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M3.4 8.2V6a2.6 2.6 0 0 1 2.6-2.6h2.2M20.6 8.2V6A2.6 2.6 0 0 0 18 3.4h-2.2M3.4 15.8V18A2.6 2.6 0 0 0 6 20.6h2.2M20.6 15.8V18A2.6 2.6 0 0 1 18 20.6h-2.2" />
    <path d="M3.4 12h17.2" opacity={0.95} />
    <path d="M8 8.6h8M8 15.4h5" opacity={0.5} />
  </svg>
);

export const SentimentIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M8.4 14.2c.9 1.5 2.1 2.2 3.6 2.2s2.7-.7 3.6-2.2" />
    <circle cx="9.2" cy="9.8" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="14.8" cy="9.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const DocScanIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M6 3.4h7L18.4 8.8V18a2.6 2.6 0 0 1-2.6 2.6H6A2.6 2.6 0 0 1 3.4 18V6A2.6 2.6 0 0 1 6 3.4Z" />
    <path d="M12.8 3.6v5.4h5.4" opacity={0.7} />
    <circle cx="10.4" cy="14.2" r="2.8" />
    <path d="m12.6 16.4 2.4 2.4" />
  </svg>
);

/* ── EXECUTE ─────────────────────────────────────────────── */
export const BroadcastIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M4 10.2v3.6a1.8 1.8 0 0 0 1.8 1.8h2L16 20V4l-8.2 4.4h-2A1.8 1.8 0 0 0 4 10.2Z" />
    <path d="M7.8 15.6v3.6a1.4 1.4 0 0 0 2.8 0v-2.4" opacity={0.75} />
    <path d="M19 9.2a4 4 0 0 1 0 5.6" />
    <circle cx="16" cy="12" r="1.2" fill="currentColor" stroke="none" opacity={0.9} />
  </svg>
);

export const MeetingIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <rect x="3.2" y="5.4" width="17.6" height="15" rx="3" />
    <path d="M3.2 10h17.6M8 3.4v3.4M16 3.4v3.4" />
    <path d="M12 13v4.4M9.8 15.2h4.4" />
    <circle cx="12" cy="15.2" r="3.2" opacity={0.4} />
  </svg>
);

export const ContactsIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <circle cx="9.4" cy="8.6" r="3.2" />
    <path d="M3.6 19.8c.6-3.2 3-5 5.8-5s5.2 1.8 5.8 5" />
    <path d="M16.4 6.6a3 3 0 0 1 0 5.6" opacity={0.8} />
    <path d="M17.4 14.8c1.6.7 2.7 2.3 3 5" opacity={0.6} />
    <circle cx="9.4" cy="8.6" r="1.2" fill="currentColor" stroke="none" opacity={0.85} />
  </svg>
);

export const JobsIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <rect x="3.2" y="7.4" width="17.6" height="12.8" rx="2.6" />
    <path d="M8.8 7.4V5.8A2 2 0 0 1 10.8 3.8h2.4a2 2 0 0 1 2 2v1.6" />
    <path d="m3.2 11.8 8.8 2.6 8.8-2.6" opacity={0.7} />
    <circle cx="12" cy="14.6" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const ResourcesIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <circle cx="12" cy="12" r="8.6" />
    <ellipse cx="12" cy="12" rx="3.7" ry="8.6" opacity={0.6} />
    <path d="M3.7 9.2h16.6M3.7 14.8h16.6" opacity={0.6} />
    <circle cx="16.2" cy="8.2" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

/* ── CODE ────────────────────────────────────────────────── */
export const CodeIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="m8.2 6.5-4.7 5.5 4.7 5.5" />
    <path d="m15.8 6.5 4.7 5.5-4.7 5.5" />
    <path d="M13.4 4.2 10.6 19.8" opacity={0.7} />
  </svg>
);

export const DebugIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <ellipse cx="12" cy="13.5" rx="4.4" ry="5.8" />
    <path d="M12 7.7V19.3" opacity={0.7} />
    <path d="M9.2 5.2 7.4 3.4M14.8 5.2l1.8-1.8" />
    <path d="M10.2 4.4h3.6l-.9 3.3H11l-.8-3.3Z" />
    <path d="M7.6 10.6 4 8.8M7.4 13.5H3.4M7.6 16.4l-3.6 1.8M16.4 10.6 20 8.8M16.6 13.5h4M16.4 16.4l3.6 1.8" />
  </svg>
);

export const ExplainCodeIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <circle cx="10.5" cy="10.5" r="6.8" />
    <path d="m15.6 15.6 5 5" />
    <path d="m8.4 8.3-1.7 2.2 1.7 2.2M12.6 8.3l1.7 2.2-1.7 2.2" />
  </svg>
);

export const ReviewIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <rect x="5" y="4.5" width="14" height="16.5" rx="2" />
    <path d="M9.5 4.5V2.8h5v1.7" />
    <path d="m8.8 13.6 2.1 2.1 4.3-4.7" />
  </svg>
);

export const ConvertIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M3.8 7h13.4" />
    <path d="m14.2 3.8 3.2 3.2-3.2 3.2" />
    <path d="M20.2 17H6.8" />
    <path d="m9.8 20.2-3.2-3.2 3.2-3.2" />
  </svg>
);

export const SqlIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <ellipse cx="12" cy="5.4" rx="7.6" ry="2.9" />
    <path d="M4.4 5.4v13.2c0 1.6 3.4 2.9 7.6 2.9s7.6-1.3 7.6-2.9V5.4" />
    <path d="M4.4 12c0 1.6 3.4 2.9 7.6 2.9s7.6-1.3 7.6-2.9" opacity={0.7} />
  </svg>
);

/* ── ANALYZE extras ──────────────────────────────────────── */
export const TranslateIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <circle cx="12" cy="12" r="8.6" />
    <ellipse cx="12" cy="12" rx="3.7" ry="8.6" opacity={0.6} />
    <path d="M3.4 12h17.2" opacity={0.6} />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const NotesIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <rect x="5" y="3.4" width="14" height="17.2" rx="2" />
    <path d="m8.4 8.8 1.1 1.1 2-2.2" />
    <path d="M14.3 8.6h2.3" />
    <path d="m8.4 13.8 1.1 1.1 2-2.2" />
    <path d="M14.3 13.6h2.3" />
    <path d="M8.4 18.4h8.2" opacity={0.7} />
  </svg>
);

/* ── Utility marks used in the deck chrome ───────────────── */
export const DeckSparkIcon: GeniusIcon = (p) => (
  <svg {...S(p)}>
    <path d="M12 2.8c.9 4.9 3.5 7.5 8.4 8.4-4.9.9-7.5 3.5-8.4 8.4-.9-4.9-3.5-7.5-8.4-8.4 4.9-.9 7.5-3.5 8.4-8.4Z" />
  </svg>
);
