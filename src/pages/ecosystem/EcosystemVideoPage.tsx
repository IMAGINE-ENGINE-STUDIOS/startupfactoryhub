/**
 * Ecosystem Partners brochure — Online Video Meetings feature page.
 * Partner-directed copy of the APEX brochure's video meetings page:
 * same teal-blue capability design (TechFeaturePage), placed after the
 * Journey Mapping pages. Copy is kept short so nothing overlaps.
 * Credits: Imagine Engine Studios Corp.
 */
import React from 'react';
import { Video } from 'lucide-react';
import { TechFeaturePage, type Theme, type FeatureBrand } from '../apex/TechFeaturePage';
import type { Feature } from '../apex/ApexEditorial';

const VIDEO_FEATURE: Feature = {
  no: '15',
  section: 'Online Video Meetings',
  title: 'Online Video Meetings',
  headline: 'live-video://partner-counseling',
  deck: 'Your team and your members meet face to face inside the platform — no Zoom, no Teams, nothing to install.',
  lead: 'Every meeting runs on the platform’s own live video — booked from the calendar, joined from the dashboard, kept on the member’s record.',
  body: [
    'Start a room instantly or book ahead from the calendar. The member joins from their dashboard or a meeting link. Sessions run up to eight hours, and a dropped connection lets you straight back in.',
    'Share your screen to walk a member through a registration, a certification form or a proposal draft. Live chat, raise hand and reactions, virtual backgrounds and blur, host controls — and recording, with the transcript and notes saved to the member’s record.',
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
  cmd: 'sfh live --meet --partner',
  url: 'live_video://partner-rooms',
  status: 'IN-PLATFORM · RECORDED · TRANSCRIBED',
};

export const EcosystemVideoMeetingsPage = ({ total, brand }: { total: string; brand: FeatureBrand }) => (
  <TechFeaturePage
    f={VIDEO_FEATURE}
    index={2}
    total={total}
    theme={VIDEO_THEME}
    capLabel="PLATFORM FEATURE // ONLINE VIDEO MEETINGS"
    brand={brand}
  />
);
