/**
 * Universal file classification helpers.
 * Used by the file uploader + attachment renderers so any file type
 * (images, video, audio, 3D models, documents, data files, archives, code)
 * gets a sensible preview, icon and label.
 */

export type FileKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'model3d'
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'data'
  | 'code'
  | 'archive'
  | 'font'
  | 'other';

/** Extensions readable by Google <model-viewer> / Scene Viewer / AR Quick Look */
export const AR_MODEL_EXTENSIONS = ['glb', 'gltf', 'usdz'] as const;
/** Other 3D formats we accept (previewed as file cards, downloadable) */
export const OTHER_MODEL_EXTENSIONS = ['usd', 'usda', 'usdc', 'obj', 'fbx', 'stl', 'ply', '3ds', 'dae', 'blend'] as const;

const EXT_MAP: Record<string, FileKind> = {
  // images
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', avif: 'image',
  bmp: 'image', tif: 'image', tiff: 'image', svg: 'image', ico: 'image', heic: 'image', heif: 'image',
  // video
  mp4: 'video', webm: 'video', mov: 'video', m4v: 'video', avi: 'video', mkv: 'video', mpeg: 'video', mpg: 'video', ogv: 'video',
  // audio
  mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio', aac: 'audio', flac: 'audio', opus: 'audio',
  // 3D
  glb: 'model3d', gltf: 'model3d', usdz: 'model3d', usd: 'model3d', usda: 'model3d', usdc: 'model3d',
  obj: 'model3d', fbx: 'model3d', stl: 'model3d', ply: 'model3d', '3ds': 'model3d', dae: 'model3d', blend: 'model3d',
  // docs
  pdf: 'pdf',
  doc: 'document', docx: 'document', rtf: 'document', odt: 'document', txt: 'document', md: 'document', pages: 'document',
  xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet', tsv: 'spreadsheet', ods: 'spreadsheet', numbers: 'spreadsheet',
  ppt: 'presentation', pptx: 'presentation', odp: 'presentation', key: 'presentation',
  // data
  json: 'data', geojson: 'data', xml: 'data', yaml: 'data', yml: 'data', toml: 'data',
  parquet: 'data', db: 'data', sqlite: 'data', ndjson: 'data', kml: 'data', kmz: 'data', gpx: 'data',
  // code
  js: 'code', ts: 'code', tsx: 'code', jsx: 'code', py: 'code', rb: 'code', go: 'code', rs: 'code',
  java: 'code', c: 'code', cpp: 'code', h: 'code', cs: 'code', php: 'code', sh: 'code', sql: 'code',
  html: 'code', css: 'code', ipynb: 'code',
  // archives
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive', bz2: 'archive', xz: 'archive',
  // fonts
  ttf: 'font', otf: 'font', woff: 'font', woff2: 'font',
};

export function getExtension(nameOrUrl: string): string {
  const clean = nameOrUrl.split('?')[0].split('#')[0];
  const parts = clean.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function getFileKind(nameOrUrl: string, mimeType?: string): FileKind {
  const ext = getExtension(nameOrUrl);
  if (EXT_MAP[ext]) return EXT_MAP[ext];
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('font/')) return 'font';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('json') || mimeType.includes('xml')) return 'data';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
    if (mimeType.startsWith('text/')) return 'document';
  }
  return 'other';
}

/** True when the file can be shown in Google <model-viewer> (AR capable). */
export function isARModel(nameOrUrl: string): boolean {
  return (AR_MODEL_EXTENSIONS as readonly string[]).includes(getExtension(nameOrUrl));
}

export const KIND_LABEL: Record<FileKind, string> = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  model3d: '3D Model',
  pdf: 'PDF',
  document: 'Document',
  spreadsheet: 'Spreadsheet',
  presentation: 'Presentation',
  data: 'Data',
  code: 'Code',
  archive: 'Archive',
  font: 'Font',
  other: 'File',
};

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Best-effort content type when the browser reports an empty type (usda, glb, etc.). */
export function resolveContentType(file: File): string {
  if (file.type) return file.type;
  const ext = getExtension(file.name);
  const map: Record<string, string> = {
    glb: 'model/gltf-binary',
    gltf: 'model/gltf+json',
    usdz: 'model/vnd.usdz+zip',
    usd: 'model/vnd.usd',
    usda: 'model/vnd.usda',
    usdc: 'model/vnd.usdc',
    obj: 'model/obj',
    stl: 'model/stl',
    fbx: 'application/octet-stream',
    csv: 'text/csv',
    json: 'application/json',
    md: 'text/markdown',
  };
  return map[ext] || 'application/octet-stream';
}
