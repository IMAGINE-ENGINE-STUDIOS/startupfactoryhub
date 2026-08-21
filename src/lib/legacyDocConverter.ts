/**
 * Legacy .doc (Word 97-2003 binary / OLE Compound File) → .docx converter.
 *
 * Runs fully client-side:
 *  1. Reads the OLE2 compound file container and extracts the WordDocument +
 *     table streams.
 *  2. Walks the FIB piece table to recover the real text (CP1252 or UTF-16).
 *  3. Rebuilds a clean .docx with the `docx` package so the rest of the
 *     LightPaper pipeline (docx-preview based) can load it unchanged.
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

type StreamMap = Map<string, Uint8Array>;

const SECTOR_END = 0xfffffffe;
const SECTOR_FREE = 0xffffffff;

function readCompoundFile(buffer: ArrayBuffer): StreamMap {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  const sig = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== sig[i]) throw new Error("Not a Word 97-2003 (.doc) file");
  }

  const sectorShift = view.getUint16(30, true);
  const sectorSize = 1 << sectorShift;
  const miniSectorSize = 1 << view.getUint16(32, true);
  const numFatSectors = view.getUint32(44, true);
  const firstDirSector = view.getUint32(48, true);
  const miniStreamCutoff = view.getUint32(56, true) || 4096;
  const firstMiniFatSector = view.getUint32(60, true);
  const firstDifatSector = view.getUint32(68, true);
  const numDifatSectors = view.getUint32(72, true);

  const sectorOffset = (sector: number) => (sector + 1) * sectorSize;

  // --- DIFAT ---
  const fatSectors: number[] = [];
  for (let i = 0; i < 109 && fatSectors.length < numFatSectors; i++) {
    const s = view.getUint32(76 + i * 4, true);
    if (s === SECTOR_FREE || s === SECTOR_END) break;
    fatSectors.push(s);
  }
  let difatSector = firstDifatSector;
  for (let n = 0; n < numDifatSectors && difatSector !== SECTOR_END && difatSector !== SECTOR_FREE; n++) {
    const base = sectorOffset(difatSector);
    const entries = sectorSize / 4 - 1;
    for (let i = 0; i < entries; i++) {
      const s = view.getUint32(base + i * 4, true);
      if (s === SECTOR_FREE || s === SECTOR_END) continue;
      fatSectors.push(s);
    }
    difatSector = view.getUint32(base + entries * 4, true);
  }

  // --- FAT ---
  const fat: number[] = [];
  for (const s of fatSectors) {
    const base = sectorOffset(s);
    for (let i = 0; i < sectorSize / 4; i++) fat.push(view.getUint32(base + i * 4, true));
  }

  const readChain = (start: number, size?: number): Uint8Array => {
    const chunks: Uint8Array[] = [];
    let sector = start;
    let guard = 0;
    while (sector !== SECTOR_END && sector !== SECTOR_FREE && sector < fat.length && guard++ < 1_000_000) {
      const off = sectorOffset(sector);
      chunks.push(bytes.subarray(off, off + sectorSize));
      sector = fat[sector];
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let p = 0;
    chunks.forEach((c) => { out.set(c, p); p += c.length; });
    return size !== undefined ? out.subarray(0, size) : out;
  };

  // --- Directory ---
  const dirBytes = readChain(firstDirSector);
  const dirView = new DataView(dirBytes.buffer, dirBytes.byteOffset, dirBytes.byteLength);
  const entryCount = Math.floor(dirBytes.length / 128);

  type Entry = { name: string; type: number; start: number; size: number };
  const entries: Entry[] = [];
  for (let i = 0; i < entryCount; i++) {
    const base = i * 128;
    const nameLen = dirView.getUint16(base + 64, true);
    let name = "";
    for (let c = 0; c < Math.max(0, nameLen / 2 - 1); c++) {
      name += String.fromCharCode(dirView.getUint16(base + c * 2, true));
    }
    entries.push({
      name,
      type: dirView.getUint8(base + 66),
      start: dirView.getUint32(base + 116, true),
      size: dirView.getUint32(base + 120, true),
    });
  }

  // --- Mini FAT / mini stream (root entry holds the mini stream) ---
  const root = entries[0];
  const miniFatBytes = firstMiniFatSector === SECTOR_END ? new Uint8Array(0) : readChain(firstMiniFatSector);
  const miniFat: number[] = [];
  {
    const mv = new DataView(miniFatBytes.buffer, miniFatBytes.byteOffset, miniFatBytes.byteLength);
    for (let i = 0; i < miniFatBytes.length / 4; i++) miniFat.push(mv.getUint32(i * 4, true));
  }
  const miniStream = root && root.start !== SECTOR_END ? readChain(root.start, root.size) : new Uint8Array(0);

  const readMiniChain = (start: number, size: number): Uint8Array => {
    const out = new Uint8Array(size);
    let sector = start;
    let written = 0;
    let guard = 0;
    while (sector !== SECTOR_END && sector !== SECTOR_FREE && written < size && guard++ < 1_000_000) {
      const off = sector * miniSectorSize;
      const chunk = miniStream.subarray(off, off + Math.min(miniSectorSize, size - written));
      out.set(chunk, written);
      written += chunk.length;
      sector = miniFat[sector] ?? SECTOR_END;
    }
    return out;
  };

  const streams: StreamMap = new Map();
  entries.forEach((e, idx) => {
    if (idx === 0 || e.type !== 2 || e.size === 0) return;
    streams.set(e.name, e.size < miniStreamCutoff ? readMiniChain(e.start, e.size) : readChain(e.start, e.size));
  });

  return streams;
}

const CP1252_HIGH: Record<number, string> = {
  0x80: "€", 0x82: "‚", 0x83: "ƒ", 0x84: "„", 0x85: "…", 0x86: "†", 0x87: "‡",
  0x88: "ˆ", 0x89: "‰", 0x8a: "Š", 0x8b: "‹", 0x8c: "Œ", 0x8e: "Ž", 0x91: "‘",
  0x92: "’", 0x93: "“", 0x94: "”", 0x95: "•", 0x96: "–", 0x97: "—", 0x98: "˜",
  0x99: "™", 0x9a: "š", 0x9b: "›", 0x9c: "œ", 0x9e: "ž", 0x9f: "Ÿ",
};

function decodeCp1252(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b >= 0x80 && b <= 0x9f ? CP1252_HIGH[b] ?? "" : String.fromCharCode(b);
  return out;
}

function decodeUtf16(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i + 1 < bytes.length; i += 2) out += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
  return out;
}

/** Extract the raw text of a Word 97-2003 document using the FIB piece table. */
function extractDocText(streams: StreamMap): string {
  const wd = streams.get("WordDocument");
  if (!wd) throw new Error("Missing WordDocument stream");
  const view = new DataView(wd.buffer, wd.byteOffset, wd.byteLength);

  const flags = view.getUint16(0x0a, true);
  const tableName = flags & 0x0200 ? "1Table" : "0Table";
  const table = streams.get(tableName) ?? streams.get("1Table") ?? streams.get("0Table");

  const fcClx = view.getUint32(0x01a2, true);
  const lcbClx = view.getUint32(0x01a6, true);

  if (table && lcbClx > 0 && fcClx + lcbClx <= table.length) {
    const clx = table.subarray(fcClx, fcClx + lcbClx);
    const clxView = new DataView(clx.buffer, clx.byteOffset, clx.byteLength);
    let pos = 0;
    while (pos < clx.length && clx[pos] === 0x01) {
      const cb = clxView.getUint16(pos + 1, true);
      pos += 3 + cb;
    }
    if (clx[pos] === 0x02) {
      const lcbPieceTable = clxView.getUint32(pos + 1, true);
      const pieceStart = pos + 5;
      const pieceCount = Math.floor((lcbPieceTable - 4) / 12);
      const cpBase = pieceStart;
      const pcdBase = pieceStart + (pieceCount + 1) * 4;
      let text = "";
      for (let i = 0; i < pieceCount; i++) {
        const cpStart = clxView.getUint32(cpBase + i * 4, true);
        const cpEnd = clxView.getUint32(cpBase + (i + 1) * 4, true);
        const fcRaw = clxView.getUint32(pcdBase + i * 8 + 2, true);
        const compressed = (fcRaw & 0x40000000) !== 0;
        const fc = compressed ? (fcRaw & 0x3fffffff) / 2 : fcRaw & 0x3fffffff;
        const len = cpEnd - cpStart;
        if (len <= 0) continue;
        text += compressed
          ? decodeCp1252(wd.subarray(fc, fc + len))
          : decodeUtf16(wd.subarray(fc, fc + len * 2));
      }
      if (text.trim()) return text;
    }
  }

  // Fallback: simple FIB text span (non-complex documents)
  const fcMin = view.getUint32(0x0018, true);
  const fcMac = view.getUint32(0x001c, true);
  if (fcMac > fcMin && fcMac <= wd.length) return decodeCp1252(wd.subarray(fcMin, fcMac));

  throw new Error("Could not read text from this .doc file");
}

function cleanParagraphs(raw: string): string[] {
  return raw
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/\u0007/g, "\t")
    .replace(/\u2018|\u2019/g, (m) => m)
    .split(/[\r\n\u000b]/)
    .map((line) => line.replace(/[\u0013-\u0015]/g, "").trim())
    .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0));
}

/** Build a real .docx File from plain paragraphs. */
async function buildDocx(paragraphs: string[], fileName: string): Promise<File> {
  const children = paragraphs.map((line) => {
    if (!line) return new Paragraph({ children: [new TextRun("")] });
    const isHeading = line.length < 80 && /^[^a-z]*$/.test(line.replace(/[^A-Za-z]/g, "")) && /[A-Z]/.test(line);
    return isHeading
      ? new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: line, bold: true })] })
      : new Paragraph({ children: [new TextRun(line)] });
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Times New Roman", size: 24 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: children.length ? children : [new Paragraph({ children: [new TextRun("")] })],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return new File([blob], fileName.replace(/\.doc$/i, "") + ".docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export function isLegacyDoc(file: File): boolean {
  return /\.doc$/i.test(file.name);
}

/**
 * Converts a legacy .doc File into a .docx File in the browser.
 * Throws a user-friendly error when the binary cannot be decoded.
 */
export async function convertLegacyDocToDocx(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();
  const streams = readCompoundFile(buffer);
  const raw = extractDocText(streams);
  const paragraphs = cleanParagraphs(raw);
  if (!paragraphs.some((p) => p.length)) {
    throw new Error("This .doc file has no readable text. Please save it as .docx and retry.");
  }
  return buildDocx(paragraphs, file.name);
}
