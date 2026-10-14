/**
 * Font chooser for Brochure Studio: 50+ Google Font pairings grouped by style,
 * each loaded only when previewed or used. Credits: Imagine Engine Studios Corp.
 */
import React, { useEffect } from 'react';
import { FLIP_FONT_STYLES, loadFlipFonts } from './fonts';

const GROUPS = Array.from(new Set(FLIP_FONT_STYLES.map((f) => f.group)));

export function FontPicker({ value, onChange }: { value?: string; onChange: (id: string | undefined) => void }) {
  const cur = FLIP_FONT_STYLES.find((f) => f.id === value);
  useEffect(() => { if (cur) loadFlipFonts(cur.google); }, [cur]);
  return (
    <select className="rounded-md p-1.5 text-[12px]" value={value || ''}
      onFocus={() => loadFlipFonts(FLIP_FONT_STYLES.flatMap((f) => f.google.slice(0, 1)))}
      onChange={(e) => onChange(e.target.value || undefined)}
      style={{ background: 'rgba(255,255,255,0.06)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.15)', fontFamily: cur?.display }}>
      <option value="" style={{ background: '#0f172a' }}>Original font</option>
      {GROUPS.map((g) => (
        <optgroup key={g} label={g} style={{ background: '#0f172a' }}>
          {FLIP_FONT_STYLES.filter((f) => f.group === g).map((f) => (
            <option key={f.id} value={f.id} style={{ background: '#0f172a', fontFamily: f.display }}>{f.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
