/**
 * Page layout templates for Brochure Studio: ready arrangements of text,
 * cards and icons placed onto a page in one move (adapted from Flip Builder V3's
 * layout gallery). Positions are percent of the page. Credits: Imagine Engine Studios Corp.
 */
import type { Item } from './types';

export type LayoutPiece = Omit<Item, 'id' | 'page'>;
export type Layout = { id: string; name: string; group: 'Covers' | 'Editorial' | 'Data' | 'Spreads' | 'Closing'; pieces: LayoutPiece[] };

const t = (x: number, y: number, w: number, text: string, size: number, extra: Partial<LayoutPiece> = {}): LayoutPiece =>
  ({ type: 'text', x, y, w, text, size, weight: size > 30 ? 800 : size > 18 ? 700 : 400, color: '#f1f5f9', ...extra });
const card = (x: number, y: number, w: number, extra: Partial<LayoutPiece> = {}): LayoutPiece => ({ type: 'shape', x, y, w, z: 0, ...extra });
const icon = (x: number, y: number, w: number, name: string): LayoutPiece => ({ type: 'icon', x, y, w, icon: name });
const eyebrow = (text: string, y = 8): LayoutPiece => t(8, y, 84, text, 12, { color: '#c4b5fd', weight: 700, font: 'f-jetbrains' });

export const LAYOUTS: Layout[] = [
  { id: 'cover-center', name: 'Centered cover', group: 'Covers', pieces: [
    icon(40, 22, 20, 'Rocket'),
    t(10, 44, 80, 'Brochure title', 46, { metal: true }),
    t(15, 62, 70, 'A short line that says what this brochure is about', 18, { color: '#cbd5e1', weight: 400 }),
    t(30, 86, 40, 'Powered by Startup Factory Hub', 12, { color: '#94a3b8' }),
  ] },
  { id: 'cover-left', name: 'Editorial cover', group: 'Covers', pieces: [
    eyebrow('SEC // 00 — EDITION'),
    t(8, 30, 80, 'Big editorial headline', 52, { metal: true, font: 'f-dmserif' }),
    t(8, 62, 60, 'Introduce the reader to the story in one or two sentences.', 17, { color: '#cbd5e1' }),
  ] },
  { id: 'title-text', name: 'Title + text', group: 'Editorial', pieces: [
    eyebrow('SEC // 01'),
    t(8, 14, 84, 'Section title', 34, { metal: true }),
    t(8, 30, 84, 'Write the main text of this page here. Keep it short and easy to read on any screen.', 17, { color: '#e2e8f0' }),
  ] },
  { id: 'two-col', name: 'Two columns', group: 'Editorial', pieces: [
    eyebrow('SEC // 02'),
    t(8, 14, 84, 'Two ideas side by side', 30, { metal: true }),
    card(6, 32, 42), card(52, 32, 42),
    t(10, 36, 34, 'First idea\nExplain it in a few words.', 16),
    t(56, 36, 34, 'Second idea\nExplain it in a few words.', 16),
  ] },
  { id: 'features', name: 'Three features', group: 'Editorial', pieces: [
    eyebrow('SEC // 03'),
    t(8, 14, 84, 'What we offer', 32, { metal: true }),
    icon(10, 34, 12, 'Lightbulb'), t(26, 35, 64, 'Feature one — a short description', 17),
    icon(10, 52, 12, 'Network'), t(26, 53, 64, 'Feature two — a short description', 17),
    icon(10, 70, 12, 'TrendingUp'), t(26, 71, 64, 'Feature three — a short description', 17),
  ] },
  { id: 'stats', name: 'Numbers grid', group: 'Data', pieces: [
    eyebrow('SEC // 04 — IMPACT'),
    t(8, 14, 84, 'Results in numbers', 32, { metal: true }),
    card(6, 32, 42), card(52, 32, 42), card(6, 60, 42), card(52, 60, 42),
    t(10, 38, 34, '00\nYour metric', 26), t(56, 38, 34, '00\nYour metric', 26),
    t(10, 66, 34, '00\nYour metric', 26), t(56, 66, 34, '00\nYour metric', 26),
  ] },
  { id: 'steps', name: 'Four steps', group: 'Data', pieces: [
    eyebrow('SEC // 05 — ROADMAP'),
    t(8, 14, 84, 'How it works', 32, { metal: true }),
    ...[0, 1, 2, 3].flatMap((i) => [
      t(8, 32 + i * 15, 10, `0${i + 1}`, 28, { color: '#22d3ee', font: 'f-jetbrains' }),
      t(22, 33 + i * 15, 70, `Step ${i + 1} — what happens here`, 17),
    ]),
  ] },
  { id: 'quote', name: 'Big quote', group: 'Spreads', pieces: [
    card(8, 26, 84, { bg: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(14,116,144,0.25))' }),
    t(14, 34, 72, '“A quote that captures the spirit of this brochure.”', 30, { font: 'f-dmserif' }),
    t(14, 68, 72, 'Name, role', 14, { color: '#c4b5fd' }),
  ] },
  { id: 'team', name: 'Team grid', group: 'Spreads', pieces: [
    eyebrow('SEC // 06 — TEAM'),
    t(8, 14, 84, 'The team', 32, { metal: true }),
    ...[0, 1, 2, 3].flatMap((i) => [
      icon(10 + (i % 2) * 44, 32 + Math.floor(i / 2) * 30, 14, 'Users'),
      t(28 + (i % 2) * 44, 34 + Math.floor(i / 2) * 30, 24, 'Name\nRole', 15),
    ]),
  ] },
  { id: 'cta', name: 'Call to action', group: 'Closing', pieces: [
    icon(40, 20, 20, 'Handshake'),
    t(10, 44, 80, 'Let’s build together', 40, { metal: true }),
    t(15, 60, 70, 'Tell the reader the next step and how to reach you.', 17, { color: '#cbd5e1' }),
    card(25, 74, 50, { bg: 'linear-gradient(135deg,#7c3aed,#0e7490)' }),
    t(30, 78, 40, 'startupfactoryhub.com', 16),
  ] },
];

export const LAYOUT_GROUPS = Array.from(new Set(LAYOUTS.map((l) => l.group)));
export const LAYOUT_MIME = 'application/x-bs-layout';
