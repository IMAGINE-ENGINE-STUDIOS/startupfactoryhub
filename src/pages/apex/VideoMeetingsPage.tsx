/**
 * APEX brochure — Online Video Meetings page.
 * A platform feature page placed right after the Journey Mapping feature
 * pages (founder, 2026-11-03), reusing the capability-page design
 * (TechFeaturePage) with its own teal-blue theme.
 * Capabilities listed are the platform's real live-video features:
 * in-platform rooms (no Zoom/Teams), instant or calendar-booked meetings,
 * screen share, chat, reactions, raise hand, backgrounds, host controls,
 * recording, transcripts and session notes saved to the client record.
 * Copy is kept short on purpose — the first version overflowed the fixed
 * page and the quote band overlapped the module cards.
 * Credits: Imagine Engine Studios Corp.
 */
import React from 'react';
import { Video } from 'lucide-react';
import { TechFeaturePage, type Theme } from './TechFeaturePage';
import type { Feature } from './ApexEditorial';

const VIDEO_FEATURE: Feature = {
  no: '15',
  section: 'Online Video Meetings',
  title: 'Online Video Meetings',
  headline: 'live-video://apex-counseling',
  deck: 'Counselors and clients meet face to face inside the platform — no Zoom, no Teams, nothing to install.',
  lead: 'Every APEX meeting runs on the platform’s own live video — booked from the calendar, joined from the dashboard, kept on the client’s record.',
  body: [
    'Start a room instantly or book ahead from the calendar. The client joins from their dashboard or a meeting link. Sessions run up to eight hours, and a dropped connection lets you straight back in.',
    'Share your screen to walk a client through a SAM.gov registration or a proposal draft. Live chat, raise hand and reactions, virtual backgrounds and blur, host controls — and recording, with the transcript and notes saved to the client’s record.',
  ],
  quote: '',
  facts: [
    ['8 HRS', 'Session length'],
    ['1 CLICK', 'Join from the dashboard'],
    ['ZERO', 'Outside tools needed'],
  ],
};

const VIDEO_THEME: Theme = {
  bg: 'radial-gradient(ellipse at 85% 0%, rgba(45,212,191,0.20) 0%, transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(56,189,248,0.14) 0%, transparent 50%), linear-gradient(180deg,#03202b 0%,#02121c 100%)',
  panel: 'rgba(8,47,73,0.72)',
  a: '#2dd4bf',
  b: '#38bdf8',
  c: '#67e8f9',
  pattern: 'rings',
  title: 'glow',
  icon: Video,
  cmd: 'sfh live --meet --apex',
  url: 'live_video://apex-rooms',
  status: 'IN-PLATFORM · RECORDED · TRANSCRIBED',
};

export const VideoMeetingsPage = ({ total }: { total: string }) => (
  <TechFeaturePage
    f={VIDEO_FEATURE}
    index={2}
    total={total}
    theme={VIDEO_THEME}
    capLabel="PLATFORM FEATURE // ONLINE VIDEO MEETINGS"
  />
);
