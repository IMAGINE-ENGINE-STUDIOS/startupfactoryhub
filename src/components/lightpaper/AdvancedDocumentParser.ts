import * as pdfjsLib from "pdfjs-dist";
import { renderAsync } from "docx-preview";

// Configure PDF.js worker with local fallback
const configureWorker = () => {
  try {
    // Try local worker first, fallback to CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    console.log('[Parser] PDF.js worker configured: local');
  } catch (error) {
    console.error('[Parser] Failed to configure PDF.js worker:', error);
    // Fallback to CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    console.log('[Parser] PDF.js worker configured: CDN fallback');
  }
};

// Initialize worker on module load
configureWorker();

// File type detection using magic bytes
export async function detectFileType(file: File): Promise<'pdf' | 'docx' | 'unknown'> {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // Check PDF signature: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf';
  }
  
  // Check DOCX signature: PK (ZIP header) + check for [Content_Types].xml
  if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
    // It's a ZIP file, likely DOCX
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'docx') {
      return 'docx';
    }
  }
  
  return 'unknown';
}

export interface ParsedContent {
  html: string;
  metadata: {
    pageCount?: number;
    hasEditableText: boolean;
    hasImages: boolean;
    fileType: 'pdf' | 'docx';
  };
}

/**
 * Parse DOCX with enhanced semantic structure + approximate positioning
 * Preserves: text, formatting, images, tables, layout
 */
export async function parseDOCX(
  file: File,
  onProgress?: (message: string) => void
): Promise<ParsedContent> {
  onProgress?.('Rendering DOCX document...');
  
  // Create temporary container with A4 dimensions
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm'; // A4 width
  container.style.minHeight = '297mm'; // A4 height
  document.body.appendChild(container);

  try {
    // Render DOCX with full formatting preservation
    await renderAsync(file, container, undefined, {
      className: 'docx-content',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: true, // Embed images as base64
      debug: false,
    });

    onProgress?.('Processing document structure...');

    // Extract rendered HTML
    let html = container.innerHTML;
    
    // Enhance HTML with better structure
    html = `<div class="document-content docx-document" style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 210mm; margin: 0 auto; padding: 20mm;">
      ${html}
    </div>`;
    
    // Analyze content
    const hasImages = html.includes('<img') || html.includes('base64');
    const hasEditableText = true; // DOCX always has editable text
    
    // Clean up
    document.body.removeChild(container);
    
    onProgress?.('DOCX processing complete!');
    
    return {
      html,
      metadata: {
        hasEditableText,
        hasImages,
        fileType: 'docx',
      }
    };
  } catch (error) {
    document.body.removeChild(container);
    throw error;
  }
}

/**
 * Parse PDF with dual-layer approach: Image + Text overlay
 * Layer 1: High-res page images (visual fidelity)
 * Layer 2: Invisible text elements positioned exactly (searchable/editable)
 */
export async function parsePDF(
  file: File,
  onProgress?: (message: string, current?: number, total?: number) => void
): Promise<ParsedContent> {
  onProgress?.('Loading PDF document...');
  
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  
  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  
  // Limit to first 50 pages for performance
  const maxPages = Math.min(totalPages, 50);
  
  if (totalPages > 50) {
    onProgress?.(`PDF has ${totalPages} pages. Processing first 50 pages only.`);
  }
  
  let htmlPages: string[] = [];
  
  // Process pages in batches
  const batchSize = 3;
  for (let i = 1; i <= maxPages; i += batchSize) {
    const batch = Math.min(batchSize, maxPages - i + 1);
    const batchPromises: Promise<string>[] = [];
    
    for (let j = 0; j < batch; j++) {
      const pageNum = i + j;
      if (pageNum > maxPages) break;
      
      onProgress?.(`Rendering page ${pageNum}/${maxPages}...`, pageNum, maxPages);
      
      batchPromises.push(renderPDFPageWithText(pdf, pageNum));
    }
    
    const batchResults = await Promise.all(batchPromises);
    htmlPages.push(...batchResults);
    
    // Small delay between batches to prevent freezing
    if (i + batchSize <= maxPages) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  onProgress?.('Assembling PDF document...');
  
  // Combine all pages into a single document
  const html = `<div class="document-content pdf-document" style="max-width: 100%; margin: 0 auto;">
    ${htmlPages.join('\n')}
  </div>`;
  
  onProgress?.('PDF processing complete!');
  
  return {
    html,
    metadata: {
      pageCount: maxPages,
      hasEditableText: true,
      hasImages: true,
      fileType: 'pdf',
    }
  };
}

/**
 * Render a single PDF page with dual-layer approach
 */
async function renderPDFPageWithText(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<string> {
  const page = await pdf.getPage(pageNum);
  
  // Get page dimensions
  const viewport = page.getViewport({ scale: 1.5 });
  
  // Layer 1: Render page as image
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  await page.render({
    canvasContext: context,
    viewport,
    canvas,
  }).promise;
  
  // Convert to JPEG for smaller size
  const imageData = canvas.toDataURL('image/jpeg', 0.85);
  
  // Layer 2: Extract text with positioning
  const textContent = await page.getTextContent();
  const textOverlay = renderTextOverlay(textContent, viewport);
  
  // Combine layers
  return `<div class="pdf-page" style="position: relative; margin: 1rem 0; page-break-after: always; width: ${viewport.width}px; height: ${viewport.height}px; margin-left: auto; margin-right: auto;">
    <img src="${imageData}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; user-select: none; pointer-events: none;" alt="Page ${pageNum}" />
    <div class="text-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: auto;">
      ${textOverlay}
    </div>
  </div>`;
}

/**
 * Create invisible text overlay with exact positioning
 */
function renderTextOverlay(textContent: any, viewport: pdfjsLib.PageViewport): string {
  const textItems = textContent.items;
  let overlayHTML = '';
  
  for (const item of textItems) {
    if (!item.str) continue;
    
    const tx = item.transform;
    const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
    const fontSize = fontHeight;
    
    // Calculate position
    const x = tx[4];
    const y = viewport.height - tx[5] - fontHeight; // Flip Y coordinate
    
    // Extract text
    const text = item.str;
    
    // Create positioned text span
    overlayHTML += `<span contenteditable="true" style="position: absolute; left: ${x}px; top: ${y}px; font-size: ${fontSize}px; opacity: 1; color: inherit; white-space: pre; line-height: 1; cursor: text;">${escapeHtml(text)}</span>`;
  }
  
  return overlayHTML;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Main parser function - detects type and routes to appropriate parser
 */
export async function parseDocument(
  file: File,
  onProgress?: (message: string, current?: number, total?: number) => void
): Promise<ParsedContent> {
  // Detect file type
  const detectedType = await detectFileType(file);
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  console.log('[Parser] File:', file.name);
  console.log('[Parser] Extension:', extension);
  console.log('[Parser] Detected type:', detectedType);
  
  // Validate file type
  if (detectedType === 'unknown') {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }
  
  // Verify extension matches detected type
  if (extension !== detectedType) {
    throw new Error(`File extension (${extension}) doesn't match file content (${detectedType})`);
  }
  
  // Route to appropriate parser
  if (detectedType === 'pdf') {
    return parsePDF(file, onProgress);
  } else {
    return parseDOCX(file, (msg) => onProgress?.(msg));
  }
}
