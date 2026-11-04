/**
 * APEX proposal — Online Video Meetings page.
 * Sits inside the proposal (after the seven capabilities, before pricing)
 * and reuses the capability-page design (TechFeaturePage) with its own
 * teal-blue theme, per the founder's direction 2026-11-03.
 * Capabilities listed are the platform's real live-video features:
 * in-platform rooms (no Zoom/Teams), instant or calendar-booked meetings,
 * screen share, chat, reactions, raise hand, backgrounds, host controls,
 * recording, transcripts and session notes saved to the client record.
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
  deck: 'Counselors and clients meet face to face inside the platform — no Zoom links, no Teams, no outside tools, nothing to install.',
  lead: 'Every APEX meeting runs on the platform’s own live video: booked from the calendar, joined from the dashboard, and kept on the client’s record.',
  body: [
    'Meet anywhere, inside the platform. Start a room instantly or book ahead from the calendar — the meeting opens on Startup Factory Hub’s own live video page, and the client joins from their dashboard or a meeting link. Sessions run up to eight hours, and if a connection drops, the meeting lets you straight back in.',
    'Everything a working session needs. Share your screen to walk a client through a SAM.gov registration, a certification form or a proposal draft. Live chat, raise hand and reactions, virtual backgrounds and blur, and host controls that let the counselor admit guests and manage the room.',
  ],
  quote: 'Record the session and the transcript and notes are saved to the client’s record — so what was agreed on the call becomes progress the whole program can see.',
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
    capLabel="PROPOSAL HIGHLIGHT // ONLINE VIDEO MEETINGS"
  />
);
