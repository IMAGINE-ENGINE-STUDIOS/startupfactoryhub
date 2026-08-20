import * as pdfjsLib from "pdfjs-dist";
import { renderAsync } from "docx-preview";
import { detectTables, renderTableAsHTML, scaleTableToFit, isTextInTable, type TableStructure, type ShapeData } from './TableDetector';

// Canvas dimensions (US Letter at 96dpi)
const CANVAS_WIDTH_CM = 21.59; // 8.5 inches
const CANVAS_HEIGHT_CM = 27.94; // 11 inches
const CM_TO_PX = 37.795275591;
const CANVAS_WIDTH_PX = CANVAS_WIDTH_CM * CM_TO_PX; // ~816px
const CANVAS_HEIGHT_PX = CANVAS_HEIGHT_CM * CM_TO_PX; // ~1056px
const PADDING_PX = 2 * CM_TO_PX; // 2cm padding = ~75px

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

export function detectPageFormat(widthPx: number, heightPx: number): string {
  // Convert to mm for comparison (assuming 72 DPI for PDF points)
  const widthMm = (widthPx / 72) * 25.4;
  const heightMm = (heightPx / 72) * 25.4;
  
  const tolerance = 10; // mm tolerance
  
  const formats: Record<string, { w: number; h: number }> = {
    // US Standard
    letter: { w: 215.9, h: 279.4 },
    legal: { w: 215.9, h: 355.6 },
    tabloid: { w: 279.4, h: 431.8 },
    ledger: { w: 431.8, h: 279.4 },
    statement: { w: 139.7, h: 215.9 },
    executive: { w: 184.15, h: 266.7 },
    folio: { w: 210, h: 330 },
    quarto: { w: 215.9, h: 275 },
    // ISO A Series
    a3: { w: 297, h: 420 },
    a4: { w: 210, h: 297 },
    a5: { w: 148, h: 210 },
    a6: { w: 105, h: 148 },
    // ISO B Series
    b4: { w: 250, h: 353 },
    b5: { w: 176, h: 250 },
    // JIS B Series
    jisb4: { w: 257, h: 364 },
    jisb5: { w: 182, h: 257 },
    // Google Docs extras
    "10x15": { w: 254, h: 381 },
    "8x13": { w: 203.2, h: 330.2 },
  };
  
  // Check portrait
  for (const [name, dims] of Object.entries(formats)) {
    if (Math.abs(widthMm - dims.w) < tolerance && Math.abs(heightMm - dims.h) < tolerance) {
      return name;
    }
  }
  
  // Check landscape (swap dimensions)
  for (const [name, dims] of Object.entries(formats)) {
    if (Math.abs(widthMm - dims.h) < tolerance && Math.abs(heightMm - dims.w) < tolerance) {
      return name;
    }
  }
  
  return 'letter'; // Default to Letter instead of 'custom'
}

/**
 * Parse document as static images (View Mode)
 * Returns high-resolution page images for viewing only
 */
export async function parseDocumentAsImages(
  file: File,
  onProgress?: (message: string, current?: number, total?: number) => void
): Promise<ParsedContent> {
  const fileType = await detectFileType(file);
  
  if (fileType === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    const images: string[] = [];
    
    // Get first page for format detection
    const firstPage = await pdf.getPage(1);
    const firstViewport = firstPage.getViewport({ scale: 1.0 });
    const detectedFormat = detectPageFormat(firstViewport.width, firstViewport.height);
    
    onProgress?.(`Rendering ${pageCount} pages as images...`, 0, pageCount);
    
    for (let i = 1; i <= pageCount; i++) {
      onProgress?.(`Rendering page ${i}/${pageCount}...`, i, pageCount);
      
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // High resolution for viewing
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      await page.render({
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas
      }).promise;
      
      // Convert to base64 PNG for lossless quality
      images.push(canvas.toDataURL('image/png'));
    }
    
    onProgress?.('View Mode rendering complete!', pageCount, pageCount);
    
    return {
      html: '', // No HTML in view mode
      metadata: {
        pageCount,
        hasEditableText: false,
        hasImages: true,
        fileType: 'pdf',
        detectedFormat,
        dimensions: { width: firstViewport.width, height: firstViewport.height }
      },
      images,
      pages: []
    };
  }
  
  if (fileType === 'docx') {
    return parseDocxAsImages(file, onProgress);
  }
  
  throw new Error('Unsupported file type for View Mode. Please upload a PDF or DOCX file.');
}

/**
 * Parse DOCX as high-resolution page images using docx-preview + html2canvas
 * Provides pixel-perfect rendering identical to the original document
 */
async function parseDocxAsImages(
  file: File,
  onProgress?: (message: string, current?: number, total?: number) => void
): Promise<ParsedContent> {
  onProgress?.('Rendering DOCX document...', 0, 1);
  
  // US Letter dimensions at 96 DPI
  const PAGE_WIDTH_PX = 816;  // 8.5" * 96dpi
  const PAGE_HEIGHT_PX = 1056; // 11" * 96dpi
  
  // Create hidden container with explicit page width for proper layout
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${PAGE_WIDTH_PX}px`;
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  try {
    // Render DOCX with page breaks enabled
    await renderAsync(file, container, undefined, {
      className: 'docx',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: true,
      debug: false,
    });

    // Wait for fonts and images to fully load
    await new Promise(resolve => setTimeout(resolve, 1000));

    onProgress?.('Detecting pages...', 0, 1);

    // Try to find page sections from docx-preview
    let pageDivs: HTMLElement[] = [];
    
    const sections = container.querySelectorAll('section.docx');
    if (sections.length > 1) {
      pageDivs = Array.from(sections) as HTMLElement[];
      console.log(`[DOCX Parser] Found ${pageDivs.length} section.docx elements`);
    }
    
    if (pageDivs.length <= 1) {
      const wrapperSections = container.querySelectorAll('.docx-wrapper > section');
      if (wrapperSections.length > 1) {
        pageDivs = Array.from(wrapperSections) as HTMLElement[];
        console.log(`[DOCX Parser] Found ${pageDivs.length} wrapper sections`);
      }
    }

    const html2canvasModule = (await import('html2canvas')).default;
    const images: string[] = [];

    if (pageDivs.length > 1) {
      // Multiple sections found - capture each as a page
      const totalPages = pageDivs.length;
      onProgress?.(`Capturing ${totalPages} pages as images...`, 0, totalPages);

      for (let i = 0; i < pageDivs.length; i++) {
        onProgress?.(`Capturing page ${i + 1}/${totalPages}...`, i + 1, totalPages);
        const pageEl = pageDivs[i];
        pageEl.style.display = 'block';
        await new Promise(resolve => setTimeout(resolve, 200));
        
        try {
          const canvas = await html2canvasModule(pageEl, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: pageEl.scrollWidth || PAGE_WIDTH_PX,
            height: pageEl.scrollHeight || PAGE_HEIGHT_PX,
          });
          images.push(canvas.toDataURL('image/png'));
        } catch (err) {
          console.error(`Failed to capture DOCX page ${i + 1}:`, err);
        }
      }
    } else {
      // Single section or no sections - manually slice into page-sized chunks
      const renderTarget = container.querySelector('.docx-wrapper') as HTMLElement || container;
      const totalHeight = renderTarget.scrollHeight;
      const totalWidth = renderTarget.scrollWidth || PAGE_WIDTH_PX;
      const numPages = Math.max(1, Math.ceil(totalHeight / PAGE_HEIGHT_PX));
      
      console.log(`[DOCX Parser] Manual page split: ${totalHeight}px total height -> ${numPages} pages at ${PAGE_HEIGHT_PX}px each`);
      onProgress?.(`Splitting into ${numPages} pages...`, 0, numPages);

      // Capture the full content as one large canvas, then slice it
      const fullCanvas = await html2canvasModule(renderTarget, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: totalWidth,
        height: totalHeight,
        windowWidth: totalWidth,
        windowHeight: totalHeight,
      });

      // Slice the full canvas into page-sized chunks
      const scaleFactor = 2; // matches html2canvas scale
      const sliceWidth = totalWidth * scaleFactor;
      const sliceHeight = PAGE_HEIGHT_PX * scaleFactor;

      for (let i = 0; i < numPages; i++) {
        onProgress?.(`Capturing page ${i + 1}/${numPages}...`, i + 1, numPages);
        
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = sliceWidth;
        const remainingHeight = fullCanvas.height - (i * sliceHeight);
        pageCanvas.height = Math.min(sliceHeight, remainingHeight);
        
        const ctx = pageCanvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          fullCanvas,
          0, i * sliceHeight,
          sliceWidth, pageCanvas.height,
          0, 0,
          pageCanvas.width, pageCanvas.height
        );
        
        images.push(pageCanvas.toDataURL('image/png'));
      }
    }

    // Clean up
    document.body.removeChild(container);

    if (images.length === 0) {
      throw new Error('Failed to render DOCX pages as images');
    }

    onProgress?.('View Mode rendering complete!', images.length, images.length);

    return {
      html: '',
      metadata: {
        pageCount: images.length,
        hasEditableText: false,
        hasImages: true,
        fileType: 'docx',
        detectedFormat: 'letter',
      },
      images,
      pages: []
    };
  } catch (error) {
    document.body.removeChild(container);
    throw error;
  }
}

export interface TextLayerItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
  backgroundColor: string; // Sampled from the page image
  letterSpacing?: number; // Calculated from PDF item width vs measured width
}

export interface ParsedContent {
  html: string;
  metadata: {
    pageCount?: number;
    hasEditableText: boolean;
    hasImages: boolean;
    fileType: 'pdf' | 'docx';
    detectedFormat?: string;
    dimensions?: { width: number; height: number };
  };
  pages?: string[]; // Multiple page HTML strings
  images?: string[]; // For View Mode - array of page images
  textLayers?: TextLayerItem[][]; // Per-page text layer items for hybrid editing
  editablePages?: string[]; // Per-page editable HTML strings (DOCX Edit Mode)
}

/**
 * Parse DOCX with enhanced semantic structure for EDITING
 * Produces clean editable HTML without transforms or absolute positioning
 */
export async function parseDOCX(
  file: File,
  onProgress?: (message: string) => void
): Promise<ParsedContent> {
  onProgress?.('Rendering DOCX document...');
  
  // Create temporary container 
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = `${CANVAS_WIDTH_CM}cm`;
  container.style.maxWidth = `${CANVAS_WIDTH_CM}cm`;
  container.style.minHeight = `${CANVAS_HEIGHT_CM}cm`;
  container.style.padding = '0';
  container.style.boxSizing = 'border-box';
  document.body.appendChild(container);

  try {
    // Render DOCX with formatting preservation but flexible width for editing
    await renderAsync(file, container, undefined, {
      className: 'docx-content',
      inWrapper: false,
      ignoreWidth: true,  // Let content fill the editor width
      ignoreHeight: true, // Let content flow naturally for editing
      ignoreFonts: false,
      breakPages: false,  // Don't break pages - let editor handle pagination
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: true,
      debug: false,
    });

    onProgress?.('Processing document structure...');

    // Extract the rendered HTML - keep it clean and editable
    let html = container.innerHTML;
    
    // Remove any absolute positioning or transforms that would break editing
    html = html.replace(/position:\s*absolute/gi, 'position: relative');
    html = html.replace(/transform:\s*scale\([^)]+\)/gi, '');
    
    // Remove hard-coded widths from layout containers (sections, wrappers) but NOT from images
    // First, protect image tags by temporarily replacing them
    const imgPlaceholders: string[] = [];
    html = html.replace(/<img[^>]*>/gi, (match) => {
      imgPlaceholders.push(match);
      return `__IMG_PLACEHOLDER_${imgPlaceholders.length - 1}__`;
    });
    
    // Now strip widths from non-image elements
    html = html.replace(/width:\s*\d+(\.\d+)?(pt|px|cm|mm|in)\s*;?/gi, '');
    html = html.replace(/min-width:\s*\d+(\.\d+)?(pt|px|cm|mm|in)\s*;?/gi, '');
    html = html.replace(/max-width:\s*\d+(\.\d+)?(pt|px|cm|mm|in)\s*;?/gi, '');
    
    // Restore image tags with their original widths
    html = html.replace(/__IMG_PLACEHOLDER_(\d+)__/g, (_, index) => imgPlaceholders[parseInt(index)]);
    
    // Ensure all text elements are editable
    html = html.replace(/contenteditable="false"/gi, '');
    
    // Check if content has images
    const hasImages = html.includes('<img') || html.includes('base64');
    const textContent = container.textContent || '';
    const isEditable = textContent.trim().length > 0;
    const contentHeight = container.scrollHeight;
    const estimatedPages = Math.max(1, Math.ceil(contentHeight / CANVAS_HEIGHT_PX));
    
    // Detect format from section dimensions before cleanup
    let detectedFormat = 'letter'; // Default for DOCX
    const sections = container.querySelectorAll('section');
    if (sections.length > 0) {
      const firstSection = sections[0] as HTMLElement;
      const sectionWidth = firstSection.offsetWidth;
      const sectionHeight = firstSection.offsetHeight;
      if (sectionWidth > 0 && sectionHeight > 0) {
        const widthMm = (sectionWidth / 96) * 25.4;
        const heightMm = (sectionHeight / 96) * 25.4;
        // Check common formats
        const formatChecks: [string, number, number][] = [
          ['a4', 210, 297], ['letter', 215.9, 279.4], ['legal', 215.9, 355.6],
          ['a3', 297, 420], ['a5', 148, 210], ['tabloid', 279.4, 431.8],
          ['executive', 184.15, 266.7], ['b5', 176, 250],
        ];
        for (const [name, w, h] of formatChecks) {
          if ((Math.abs(widthMm - w) < 15 && Math.abs(heightMm - h) < 20) ||
              (Math.abs(widthMm - h) < 15 && Math.abs(heightMm - w) < 20)) {
            detectedFormat = name;
            break;
          }
        }
      }
    }
    
    // Clean up
    document.body.removeChild(container);
    
    onProgress?.('DOCX processing complete!');
    
    return {
      html,
      metadata: {
        pageCount: estimatedPages,
        hasEditableText: isEditable,
        hasImages,
        fileType: 'docx',
        detectedFormat,
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
  const maxPages = totalPages;
  
  onProgress?.(`PDF has ${totalPages} pages. Processing all pages...`);
  
  // Get first page to detect format and calculate scale
  const firstPage = await pdf.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1.0 });
  
  // Use a fixed render scale for quality, then CSS will fit it to the container
  const renderScale = 1.5;
  
  onProgress?.(`Rendering at scale ${renderScale.toFixed(2)}...`, 0, maxPages);
  
  let htmlPages: string[] = [];
  let hasImages = false;
  let totalText = '';
  
  // Process pages in batches
  const batchSize = 3;
  for (let i = 1; i <= maxPages; i += batchSize) {
    const batch = Math.min(batchSize, maxPages - i + 1);
    const batchPromises: Promise<string>[] = [];
    
    for (let j = 0; j < batch; j++) {
      const pageNum = i + j;
      if (pageNum > maxPages) break;
      
      onProgress?.(`Rendering page ${pageNum}/${maxPages}...`, pageNum, maxPages);
      
      batchPromises.push(renderPDFPageWithText(pdf, pageNum, renderScale));
    }
    
    const batchResults = await Promise.all(batchPromises);
    htmlPages.push(...batchResults);
    
    batchResults.forEach(pageHtml => {
      if (pageHtml.includes('<img') || pageHtml.includes('<svg')) {
        hasImages = true;
      }
    });
  }
  
  // Extract text from all pages for search
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    totalText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
  }
  
  onProgress?.('PDF processing complete!', maxPages, maxPages);
  
  // Detect format from first page
  const detectedFormat = detectPageFormat(firstViewport.width, firstViewport.height);
  
  return {
    html: htmlPages.join('\n\n'),
    metadata: {
      pageCount: maxPages,
      hasEditableText: true,
      hasImages,
      fileType: 'pdf',
      detectedFormat,
      dimensions: { width: firstViewport.width, height: firstViewport.height }
    },
    pages: htmlPages,
  };
}

/**
 * Extract shapes, graphics, and colors from PDF with pixel-perfect rendering
 * Returns both HTML for rendering and structured data for table validation
 */
async function extractShapesFromPage(
  page: pdfjsLib.PDFPageProxy, 
  viewport: pdfjsLib.PageViewport
): Promise<{ html: string; shapes: ShapeData[] }> {
  try {
    const operatorList = await page.getOperatorList();
    const shapesData: ShapeData[] = [];
    
    // Track current graphics state
    let currentPath = '';
    let currentX = 0;
    let currentY = 0;
    let fillColor = 'rgb(0, 0, 0)';
    let strokeColor = 'rgb(0, 0, 0)';
    let lineWidth = 1;
    const svgElements: string[] = [];
    
    for (let i = 0; i < operatorList.fnArray.length; i++) {
      const fn = operatorList.fnArray[i];
      const args = operatorList.argsArray[i];
      
      switch (fn) {
        // Color operations
        case pdfjsLib.OPS.setStrokeRGBColor:
          strokeColor = `rgb(${Math.round(args[0] * 255)}, ${Math.round(args[1] * 255)}, ${Math.round(args[2] * 255)})`;
          break;
          
        case pdfjsLib.OPS.setFillRGBColor:
          fillColor = `rgb(${Math.round(args[0] * 255)}, ${Math.round(args[1] * 255)}, ${Math.round(args[2] * 255)})`;
          break;
          
        case pdfjsLib.OPS.setStrokeGray:
          const grayStroke = Math.round(args[0] * 255);
          strokeColor = `rgb(${grayStroke}, ${grayStroke}, ${grayStroke})`;
          break;
          
        case pdfjsLib.OPS.setFillGray:
          const grayFill = Math.round(args[0] * 255);
          fillColor = `rgb(${grayFill}, ${grayFill}, ${grayFill})`;
          break;
          
        case pdfjsLib.OPS.setLineWidth:
          lineWidth = args[0];
          break;
          
        // Path construction
        case pdfjsLib.OPS.moveTo:
          currentX = args[0];
          currentY = viewport.height - args[1];
          currentPath += `M ${currentX} ${currentY} `;
          break;
          
        case pdfjsLib.OPS.lineTo:
          const lineX = args[0];
          const lineY = viewport.height - args[1];
          currentPath += `L ${lineX} ${lineY} `;
          break;
          
        case pdfjsLib.OPS.curveTo:
          const cp1x = args[0];
          const cp1y = viewport.height - args[1];
          const cp2x = args[2];
          const cp2y = viewport.height - args[3];
          const cx = args[4];
          const cy = viewport.height - args[5];
          currentPath += `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${cx} ${cy} `;
          break;
          
        case pdfjsLib.OPS.rectangle:
          const rectX = args[0];
          const rectY = viewport.height - args[1] - args[3];
          const rectW = args[2];
          const rectH = args[3];
          currentPath += `M ${rectX} ${rectY} L ${rectX + rectW} ${rectY} L ${rectX + rectW} ${rectY + rectH} L ${rectX} ${rectY + rectH} Z `;
          
          // Store for table detection
          shapesData.push({
            type: 'rectangle',
            x: rectX,
            y: rectY,
            width: rectW,
            height: rectH,
          });
          break;
          
        case pdfjsLib.OPS.constructPath:
          const ops = args[0];
          const coords = args[1];
          
          // Simple line detection (moveTo -> lineTo)
          if (ops.length === 2 && ops[0] === pdfjsLib.OPS.moveTo && ops[1] === pdfjsLib.OPS.lineTo) {
            const x1 = coords[0];
            const y1 = viewport.height - coords[1];
            const x2 = coords[2];
            const y2 = viewport.height - coords[3];
            
            shapesData.push({
              type: 'line',
              x: x1,
              y: y1,
              x2: x2,
              y2: y2,
            });
          }
          break;
          
        // Rendering operations
        case pdfjsLib.OPS.fill:
        case pdfjsLib.OPS.eoFill:
          if (currentPath) {
            svgElements.push(`<path d="${currentPath}" fill="${fillColor}" fill-opacity="1" />`);
            currentPath = '';
          }
          break;
          
        case pdfjsLib.OPS.stroke:
          if (currentPath) {
            svgElements.push(`<path d="${currentPath}" fill="none" stroke="${strokeColor}" stroke-width="${lineWidth}" />`);
            currentPath = '';
          }
          break;
          
        case pdfjsLib.OPS.fillStroke:
        case pdfjsLib.OPS.eoFillStroke:
          if (currentPath) {
            svgElements.push(`<path d="${currentPath}" fill="${fillColor}" fill-opacity="1" stroke="${strokeColor}" stroke-width="${lineWidth}" />`);
            currentPath = '';
          }
          break;
          
        case pdfjsLib.OPS.closePath:
          if (currentPath) {
            currentPath += 'Z ';
          }
          break;
      }
    }
    
    // Generate SVG HTML if there are elements
    let html = '';
    if (svgElements.length > 0) {
      html = `
        <svg style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;" 
             viewBox="0 0 ${viewport.width} ${viewport.height}">
          ${svgElements.join('\n')}
        </svg>
      `;
    }
    
    return { html, shapes: shapesData };
  } catch (error) {
    console.warn('Failed to extract shapes:', error);
    return { html: '', shapes: [] };
  }
}

/**
 * Render text blocks with accurate positioning, font matching, and color extraction
 */
function renderTextBlocks(textContent: any, viewport: pdfjsLib.PageViewport, tables: TableStructure[]): string {
  const textItems = textContent.items;
  let textHTML = '';
  
  // Create canvas for text measurements
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  for (const item of textItems) {
    if (!('str' in item) || !item.str || item.str.trim() === '') continue;
    
    // Skip text that's part of a table
    const tx = item.transform;
    const x = tx[4];
    const y = viewport.height - tx[5];
    
    if (isTextInTable(x, y, tables)) continue;
    
    // Calculate positioning
    const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
    const fontSize = fontHeight;
    
    // Enhanced font recognition
    const { fontFamily, fontWeight, fontStyle } = recognizeFont(item.fontName || '');
    
    // Measure text width
    ctx.font = `${fontWeight} ${fontStyle} ${fontSize}px ${fontFamily}`;
    const textWidth = ctx.measureText(item.str).width;
    
    // Extract exact color from PDF
    let color = 'rgb(0, 0, 0)';
    if (item.color && Array.isArray(item.color)) {
      const r = Math.round(item.color[0] * 255);
      const g = Math.round(item.color[1] * 255);
      const b = Math.round(item.color[2] * 255);
      color = `rgb(${r}, ${g}, ${b})`;
    }
    
    textHTML += `
      <span contenteditable="true" class="pdf-text-span" style="
        position: absolute;
        left: ${x}px;
        top: ${y - fontHeight}px;
        width: ${textWidth}px;
        height: ${fontHeight}px;
        font-size: ${fontSize}px;
        font-family: ${fontFamily};
        font-weight: ${fontWeight};
        font-style: ${fontStyle};
        color: ${color};
        line-height: ${fontHeight}px;
        white-space: nowrap;
        cursor: text;
        background: transparent;
        border: none;
        outline: none;
        pointer-events: auto;
      ">${escapeHtml(item.str)}</span>
    `;
  }
  
  return textHTML;
}

/**
 * Render a single PDF page with complete component-based reconstruction
 */
async function renderPDFPageWithText(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number, scale: number = 1.5): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  
  // Extract ALL components in parallel for efficiency
  const [
    textContent,
    { html: shapesHTML, shapes: shapesData },
    imagesHTML
  ] = await Promise.all([
    page.getTextContent(),
    extractShapesFromPage(page, viewport),
    extractImagesFromPage(page, viewport)
  ]);
  
  // Detect tables with strict validation using shape data
  let tables = detectTables(textContent.items, viewport, shapesData);
  
  // Scale tables to fit within page boundaries
  tables = tables.map((table, index) => {
    const scaled = scaleTableToFit(table, viewport.width, viewport.height, 40);
    return scaled;
  });
  
  // Render text blocks (excluding table text)
  const textHTML = renderTextBlocks(textContent, viewport, tables);
  
  // Render tables as HTML with proper z-index stacking
  const tablesHTML = tables.map((table, index) => 
    renderTableAsHTML(table, scale, 10 + index)
  ).join('');
  
  // Return fully reconstructed page using percentage-based scaling
  // The outer div fills the page container, the inner div preserves aspect ratio
  return `
    <div class="pdf-page-reconstructed" contenteditable="false" style="
      position: relative;
      width: 100%;
      height: 100%;
      background: white;
      overflow: hidden;
    ">
      <div class="pdf-inner-content" style="
        width: ${viewport.width}px;
        height: ${viewport.height}px;
        position: relative;
        transform-origin: top left;
      " data-viewport-width="${viewport.width}" data-viewport-height="${viewport.height}">
        <!-- Shapes layer: Vector graphics with colors, fills, strokes -->
        ${shapesHTML}
        
        <!-- Images layer: Embedded images with pixel-perfect positioning -->
        ${imagesHTML}
        
        <!-- Tables layer: Reconstructed HTML tables with exact dimensions -->
        ${tablesHTML}
        
        <!-- Text layer: Individual editable text spans with colors -->
        ${textHTML}
      </div>
    </div>
  `;
}

/**
 * Extract images from PDF page with pixel-perfect positioning
 */
async function extractImagesFromPage(page: pdfjsLib.PDFPageProxy, viewport: pdfjsLib.PageViewport): Promise<string> {
  try {
    const operatorList = await page.getOperatorList();
    const imagesHTML: string[] = [];
    
    for (let i = 0; i < operatorList.fnArray.length; i++) {
      const fn = operatorList.fnArray[i];
      const args = operatorList.argsArray[i];
      
      if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
        try {
          const imgName = args[0];
          
          // Get image with timeout
          const img = await Promise.race([
            new Promise<any>((resolve, reject) => {
              (page as any).objs.get(imgName, (obj: any) => {
                if (obj) resolve(obj);
                else reject(new Error('Image not found'));
              });
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
          ]).catch(() => null);
          
          if (img && img.width && img.height && img.data) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Create ImageData and render - check if data exists
            try {
              const imageData = ctx.createImageData(img.width, img.height);
              if (imageData.data && img.data) {
                imageData.data.set(new Uint8ClampedArray(img.data));
                ctx.putImageData(imageData, 0, 0);
              } else {
                continue; // Skip if data is invalid
              }
            } catch (dataError) {
              console.warn('Failed to set image data:', dataError);
              continue;
            }
            
            const imageDataUrl = canvas.toDataURL('image/png');
            
            // Calculate exact pixel-perfect position from PDF transform matrix
            const transform = args[1] || [1, 0, 0, 1, 0, 0];
            const scaleX = Math.abs(transform[0]);
            const scaleY = Math.abs(transform[3]);
            const x = transform[4];
            const y = viewport.height - transform[5] - (img.height * scaleY);
            const width = img.width * scaleX;
            const height = img.height * scaleY;
            
            // Detect if this is likely a logo (small image at top of page)
            const isLikelyLogo = (y < viewport.height * 0.2) && (width < viewport.width * 0.3) && (height < viewport.height * 0.15);
            
            imagesHTML.push(`
              <div class="pdf-image-wrapper${isLikelyLogo ? ' pdf-logo' : ''}" style="
                position: absolute; 
                left: ${x}px; 
                top: ${y}px; 
                width: ${width}px; 
                height: ${height}px;
                cursor: move;
                border: 2px solid transparent;
                transition: border-color 0.2s;
                z-index: ${isLikelyLogo ? '20' : '5'};
              " 
              onmouseover="this.style.borderColor='rgba(66, 153, 225, 0.5)'"
              onmouseout="this.style.borderColor='transparent'">
                <img src="${imageDataUrl}" 
                     draggable="true" 
                     style="
                       width: 100%; 
                       height: 100%; 
                       object-fit: contain;
                       pointer-events: auto;
                     " 
                     alt="${isLikelyLogo ? 'Logo' : 'PDF Image'}" />
              </div>
            `);
          }
        } catch (imgError) {
          console.warn('Failed to extract individual image:', imgError);
        }
      }
    }
    
    return imagesHTML.join('');
  } catch (error) {
    console.warn('Failed to extract images from page:', error);
    return ''; // Fallback: images will still be visible in background layer
  }
}

/**
 * Create text overlay with proper positioning and spacing
 * Excludes text that's part of detected tables
 */
function renderTextOverlay(textContent: any, viewport: pdfjsLib.PageViewport, tables: TableStructure[] = []): string {
  const textItems = textContent.items;
  let overlayHTML = '';
  
  // Create temporary canvas for text measurement
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  for (const item of textItems) {
    if (!item.str || item.str.trim() === '') continue;
    
    // Calculate position to check if it's in a table
    const tx = item.transform;
    const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
    const fontSize = fontHeight;
    const x = tx[4];
    const y = viewport.height - tx[5] - fontHeight;
    
    // Skip text that's part of a table (it will be rendered by table HTML)
    if (isTextInTable(x, y, tables)) continue;
    
    // Enhanced font recognition - map PDF fonts to web-safe/Google fonts
    const rawFontName = item.fontName || 'sans-serif';
    const { fontFamily, fontWeight, fontStyle } = recognizeFont(rawFontName);
    
    const font = `${fontWeight} ${fontStyle} ${fontSize}px ${fontFamily}`;
    ctx.font = font;
    
    // Measure actual text width
    const textWidth = ctx.measureText(item.str).width;
    
    // Extract exact text color from PDF (full opacity for perfect match)
    let color = 'rgb(0, 0, 0)';
    if (item.color && Array.isArray(item.color)) {
      const r = Math.round(item.color[0] * 255);
      const g = Math.round(item.color[1] * 255);
      const b = Math.round(item.color[2] * 255);
      color = `rgb(${r}, ${g}, ${b})`;
    }
    
    // Create properly positioned and sized text span with exact styling
    overlayHTML += `<span contenteditable="true" class="pdf-text-span" style="
      position: absolute; 
      left: ${x}px; 
      top: ${y}px; 
      width: ${textWidth}px;
      font-size: ${fontSize}px; 
      font-family: ${fontFamily};
      font-weight: ${fontWeight};
      font-style: ${fontStyle};
      color: ${color};
      white-space: nowrap;
      line-height: ${fontHeight}px;
      cursor: text;
      display: inline-block;
      pointer-events: auto;
      background: transparent;
    ">${escapeHtml(item.str)}</span>`;
  }
  
  return overlayHTML;
}

/**
 * Enhanced font recognition - maps PDF font names to web-safe or Google fonts
 */
function recognizeFont(pdfFontName: string): { fontFamily: string; fontWeight: string; fontStyle: string } {
  const fontLower = pdfFontName.toLowerCase();
  
  // Default values
  let fontFamily = 'Arial, sans-serif';
  let fontWeight = 'normal';
  let fontStyle = 'normal';
  
  // Detect weight
  if (fontLower.includes('bold')) fontWeight = 'bold';
  if (fontLower.includes('light')) fontWeight = '300';
  if (fontLower.includes('medium')) fontWeight = '500';
  if (fontLower.includes('semibold')) fontWeight = '600';
  if (fontLower.includes('heavy') || fontLower.includes('black')) fontWeight = '900';
  
  // Detect style
  if (fontLower.includes('italic') || fontLower.includes('oblique')) fontStyle = 'italic';
  
  // Map common PDF fonts to web fonts
  if (fontLower.includes('times') || fontLower.includes('roman')) {
    fontFamily = '"Times New Roman", Times, serif';
  } else if (fontLower.includes('courier')) {
    fontFamily = '"Courier New", Courier, monospace';
  } else if (fontLower.includes('helvetica') || fontLower.includes('arial')) {
    fontFamily = 'Arial, Helvetica, sans-serif';
  } else if (fontLower.includes('verdana')) {
    fontFamily = 'Verdana, sans-serif';
  } else if (fontLower.includes('georgia')) {
    fontFamily = 'Georgia, serif';
  } else if (fontLower.includes('tahoma')) {
    fontFamily = 'Tahoma, sans-serif';
  } else if (fontLower.includes('trebuchet')) {
    fontFamily = '"Trebuchet MS", sans-serif';
  } else if (fontLower.includes('garamond')) {
    fontFamily = 'Garamond, serif';
  } else if (fontLower.includes('palatino')) {
    fontFamily = '"Palatino Linotype", Palatino, serif';
  } else if (fontLower.includes('calibri')) {
    fontFamily = 'Calibri, sans-serif';
  } else if (fontLower.includes('cambria')) {
    fontFamily = 'Cambria, serif';
  } else if (fontLower.includes('consolas')) {
    fontFamily = 'Consolas, monospace';
  }
  
  return { fontFamily, fontWeight, fontStyle };
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
 * Sample a color from a canvas region using mode (most frequent) instead of average.
 * This produces more accurate results for text on colored backgrounds.
 */
function sampleColorFromRegion(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  canvasWidth: number,
  canvasHeight: number
): string | null {
  const clampedSx = Math.max(0, Math.floor(sx));
  const clampedSy = Math.max(0, Math.floor(sy));
  const clampedSw = Math.min(canvasWidth - clampedSx, Math.ceil(sw));
  const clampedSh = Math.min(canvasHeight - clampedSy, Math.ceil(sh));

  if (clampedSw <= 0 || clampedSh <= 0) return null;

  try {
    const imageData = ctx.getImageData(clampedSx, clampedSy, clampedSw, clampedSh);
    const data = imageData.data;
    const colorCounts = new Map<string, number>();

    // Sample every 2nd pixel for speed
    for (let py = 0; py < clampedSh; py += 2) {
      for (let px = 0; px < clampedSw; px += 2) {
        const idx = (py * clampedSw + px) * 4;
        if (idx + 2 >= data.length) continue;
        // Quantize to reduce noise (group similar colors)
        const r = Math.round(data[idx] / 4) * 4;
        const g = Math.round(data[idx + 1] / 4) * 4;
        const b = Math.round(data[idx + 2] / 4) * 4;
        const key = `${r},${g},${b}`;
        colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
      }
    }

    if (colorCounts.size === 0) return null;

    // Find the most frequent color (mode)
    let maxCount = 0;
    let modeColor = '255,255,255';
    for (const [color, count] of colorCounts) {
      if (count > maxCount) {
        maxCount = count;
        modeColor = color;
      }
    }

    const [r, g, b] = modeColor.split(',').map(Number);
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return null;
  }
}

/**
 * Sample background color from the edges/corners around a text region.
 */
function sampleBackgroundColor(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number
): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'rgb(255, 255, 255)';

  // Sample a thin strip above the text region (pure background, no text)
  const stripHeight = Math.max(2, Math.ceil(height * scale * 0.15));
  const aboveResult = sampleColorFromRegion(
    ctx,
    Math.floor(x * scale),
    Math.max(0, Math.floor(y * scale) - stripHeight),
    Math.ceil(width * scale),
    stripHeight,
    canvas.width,
    canvas.height
  );
  if (aboveResult) return aboveResult;

  // Fallback: sample corners
  const sx = Math.max(0, Math.floor((x - 2) * scale));
  const sy = Math.max(0, Math.floor((y - 2) * scale));
  const sw = Math.min(canvas.width - sx, Math.ceil((width + 4) * scale));
  const sh = Math.min(canvas.height - sy, Math.ceil((height + 4) * scale));
  
  const fallback = sampleColorFromRegion(ctx, sx, sy, sw, sh, canvas.width, canvas.height);
  return fallback || 'rgb(255, 255, 255)';
}

/**
 * Sample text color by looking at the center of the text region on the canvas.
 * Uses the darkest/most saturated color found in the text area center strip.
 */
function sampleTextColor(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
  bgColor: string
): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'rgb(0, 0, 0)';

  // Sample the center horizontal strip of the text (where glyph strokes are densest)
  const centerY = Math.floor((y + height * 0.3) * scale);
  const stripH = Math.max(2, Math.ceil(height * scale * 0.4));
  const sx = Math.max(0, Math.floor(x * scale) + 2);
  const sy = Math.max(0, centerY);
  const sw = Math.min(canvas.width - sx, Math.ceil(width * scale) - 4);
  const sh = Math.min(canvas.height - sy, stripH);

  if (sw <= 0 || sh <= 0) return 'rgb(0, 0, 0)';

  try {
    const imageData = ctx.getImageData(sx, sy, sw, sh);
    const data = imageData.data;

    // Parse background color for comparison
    const bgMatch = bgColor.match(/(\d+)/g);
    const bgR = bgMatch ? parseInt(bgMatch[0]) : 255;
    const bgG = bgMatch ? parseInt(bgMatch[1]) : 255;
    const bgB = bgMatch ? parseInt(bgMatch[2]) : 255;

    // Collect non-background pixels (text pixels)
    const colorCounts = new Map<string, number>();
    const threshold = 30; // Color distance threshold from background

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const dist = Math.sqrt(
        (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
      );
      if (dist > threshold) {
        // Quantize
        const qr = Math.round(r / 8) * 8;
        const qg = Math.round(g / 8) * 8;
        const qb = Math.round(b / 8) * 8;
        const key = `${qr},${qg},${qb}`;
        colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
      }
    }

    if (colorCounts.size === 0) return 'rgb(0, 0, 0)';

    // Most frequent non-background color = text color
    let maxCount = 0;
    let textColor = '0,0,0';
    for (const [color, count] of colorCounts) {
      if (count > maxCount) {
        maxCount = count;
        textColor = color;
      }
    }

    const [r, g, b] = textColor.split(',').map(Number);
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return 'rgb(0, 0, 0)';
  }
}

/**
 * Parse document for hybrid editing: returns both page images AND positioned text layers
 * with background color sampling for seamless text editing.
 */
/**
 * Convert a PDF into clean, flowing, Word-compatible HTML.
 * Produces real paragraphs/headings/lists (no absolutely positioned overlays),
 * using only markup and styles that survive a round-trip to .docx.
 */
export async function parsePDFAsWordFlow(
  file: File,
  onProgress?: (message: string, current?: number, total?: number) => void
): Promise<ParsedContent> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;

  const firstPage = await pdf.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1.0 });
  const detectedFormat = detectPageFormat(firstViewport.width, firstViewport.height);

  type Word = { text: string; x: number; y: number; size: number; bold: boolean; italic: boolean; font: string };
  type Line = { text: string; x: number; right: number; y: number; size: number; bold: boolean; italic: boolean; font: string };

  const allLines: Line[] = [];
  const sizeTally: number[] = [];

  onProgress?.(`Extracting text from ${pageCount} pages...`, 0, pageCount);

  for (let p = 1; p <= pageCount; p++) {
    onProgress?.(`Reading page ${p}/${pageCount}...`, p, pageCount);
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const words: Word[] = [];
    for (const item of textContent.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const tx = item.transform;
      const size = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
      if (size <= 0) continue;
      const meta = recognizeFont(item.fontName || '');
      words.push({
        text: item.str,
        x: tx[4],
        y: viewport.height - tx[5],
        size,
        bold: meta.fontWeight === 'bold' || Number(meta.fontWeight) >= 600,
        italic: meta.fontStyle === 'italic',
        font: meta.fontFamily,
      });
    }

    // Group words into visual lines by baseline proximity.
    words.sort((a, b) => (Math.abs(a.y - b.y) > 2 ? a.y - b.y : a.x - b.x));
    let current: Word[] = [];
    const flushLine = () => {
      if (!current.length) return;
      current.sort((a, b) => a.x - b.x);
      const size = current.reduce((m, w) => Math.max(m, w.size), 0);
      let text = '';
      let right = current[0].x;
      current.forEach((w, idx) => {
        if (idx > 0) {
          const gap = w.x - right;
          if (gap > size * 0.18 && !/\s$/.test(text) && !/^\s/.test(w.text)) text += ' ';
        }
        text += w.text;
        right = w.x + (w.text.length * size * 0.5);
      });
      text = text.replace(/\s+/g, ' ').trim();
      if (text) {
        const boldCount = current.filter((w) => w.bold).length;
        allLines.push({
          text,
          x: current[0].x,
          right,
          y: current[0].y,
          size,
          bold: boldCount > current.length / 2,
          italic: current.every((w) => w.italic),
          font: current[0].font,
        });
        sizeTally.push(Math.round(size));
      }
      current = [];
    };

    for (const w of words) {
      if (current.length && Math.abs(w.y - current[0].y) > Math.max(2, current[0].size * 0.5)) flushLine();
      current.push(w);
    }
    flushLine();
    // Page separator marker
    allLines.push({ text: '\u0000PAGE', x: 0, right: 0, y: 0, size: 0, bold: false, italic: false, font: '' });
  }

  // Body font size = most common line size
  const counts = new Map<number, number>();
  sizeTally.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1));
  let bodySize = 12;
  let best = 0;
  counts.forEach((c, s) => {
    if (c > best) { best = c; bodySize = s; }
  });
  const bodyFont = allLines.find((l) => Math.round(l.size) === bodySize)?.font || '"Times New Roman", Times, serif';
  const leftMargins = allLines.filter((l) => l.text !== '\u0000PAGE').map((l) => l.x);
  const bodyLeft = leftMargins.length ? Math.min(...leftMargins) : 0;
  const pageWidth = firstViewport.width;

  const P_STYLE = (extra = '') =>
    `margin:0 0 10pt 0; font-family:${bodyFont}; font-size:${bodySize}pt; line-height:1.5;${extra}`;

  const blocks: string[] = [];
  let buffer: Line[] = [];
  let bufferIsList = false;

  const isBullet = (t: string) => /^([•·▪\-–*]|\(?\d{1,2}[.)]|[a-z]\))\s+/i.test(t);

  const flushParagraph = () => {
    if (!buffer.length) return;
    const first = buffer[0];
    const text = buffer.map((l) => l.text).join(' ').replace(/\s+/g, ' ').trim();
    if (!text) { buffer = []; return; }

    const center = (first.x + first.right) / 2;
    const centered = Math.abs(center - pageWidth / 2) < pageWidth * 0.08 && first.x > bodyLeft + 40;
    const isHeading = first.size >= bodySize * 1.18 || (first.bold && buffer.length === 1 && text.length < 90);

    if (bufferIsList) {
      const items = buffer
        .map((l) => l.text.replace(/^([•·▪\-–*]|\(?\d{1,2}[.)]|[a-z]\))\s+/i, '').trim())
        .filter(Boolean);
      blocks.push(
        `<ul style="margin:0 0 10pt 0; padding-left:24pt; font-family:${bodyFont}; font-size:${bodySize}pt; line-height:1.5;">` +
          items.map((i) => `<li style="margin:0 0 4pt 0;">${escapeHtml(i)}</li>`).join('') +
          `</ul>`
      );
    } else if (isHeading) {
      const level = first.size >= bodySize * 1.5 ? 1 : first.size >= bodySize * 1.25 ? 2 : 3;
      const hSize = Math.max(bodySize + 2, Math.round(first.size));
      blocks.push(
        `<h${level} style="margin:14pt 0 8pt 0; font-family:${bodyFont}; font-size:${hSize}pt; font-weight:bold; line-height:1.3; text-align:${centered ? 'center' : 'left'};">${escapeHtml(text)}</h${level}>`
      );
    } else {
      const align = centered ? 'center' : buffer.length > 1 ? 'justify' : 'left';
      const inner = first.italic ? `<em>${escapeHtml(text)}</em>` : escapeHtml(text);
      const body = first.bold ? `<strong>${inner}</strong>` : inner;
      blocks.push(`<p style="${P_STYLE(` text-align:${align};`)}">${body}</p>`);
    }
    buffer = [];
    bufferIsList = false;
  };

  let prev: Line | null = null;
  for (const line of allLines) {
    if (line.text === '\u0000PAGE') {
      flushParagraph();
      prev = null;
      continue;
    }
    const bullet = isBullet(line.text);
    if (prev) {
      const gap = line.y - prev.y;
      const newBlock =
        gap > prev.size * 1.75 ||
        bullet !== bufferIsList ||
        Math.round(line.size) !== Math.round(prev.size) ||
        /[.:;!?]$/.test(prev.text) && line.x <= bodyLeft + 2 && gap > prev.size * 1.4;
      if (newBlock) flushParagraph();
    }
    if (!buffer.length) bufferIsList = bullet;
    buffer.push(line);
    prev = line;
  }
  flushParagraph();

  onProgress?.('Document ready for editing', pageCount, pageCount);

  const html = blocks.join('\n');
  return {
    html,
    metadata: {
      pageCount,
      hasEditableText: true,
      hasImages: false,
      fileType: 'pdf',
      detectedFormat,
      dimensions: { width: firstViewport.width, height: firstViewport.height },
    },
  };
}

export async function parseDocumentForEditing(
  file: File,
  onProgress?: (message: string, current?: number, total?: number) => void
): Promise<ParsedContent> {
  const fileType = await detectFileType(file);

  if (fileType === 'pdf') {
    // Word-compatible flowing layout (no absolute overlays, no auto-translation).
    return parsePDFAsWordFlow(file, onProgress);
  }


  // For DOCX, use layout-preserving editable HTML
  return parseDOCXEditable(file, onProgress);
}

/**
 * Parse DOCX for true editing: renders with layout-preserving settings (same as View Mode)
 * but extracts real editable HTML per page instead of capturing images.
 * This allows real text editing while maintaining the original document layout.
 */
async function parseDOCXEditable(
  file: File,
  onProgress?: (message: string, current?: number, total?: number) => void
): Promise<ParsedContent> {
  onProgress?.('Preparing DOCX for editing...', 0, 1);

  const PAGE_WIDTH_PX = 816;
  const PAGE_HEIGHT_PX = 1056;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${PAGE_WIDTH_PX}px`;
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  try {
    // Render with SAME settings as View Mode for layout fidelity
    await renderAsync(file, container, undefined, {
      className: 'docx',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: true,
      debug: false,
    });

    // Wait for fonts/images to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    onProgress?.('Extracting editable pages...', 0, 1);

    // Collect all styles from the rendered container (docx-preview injects <style> tags)
    const styleElements = container.querySelectorAll('style');
    let collectedStyles = '';
    styleElements.forEach(styleEl => {
      collectedStyles += styleEl.outerHTML + '\n';
    });

    // Find page sections - try multiple selectors
    let pageDivs: HTMLElement[] = [];
    
    // Strategy 1: section.docx elements (most common)
    const sections = container.querySelectorAll('section.docx');
    if (sections.length >= 1) {
      pageDivs = Array.from(sections) as HTMLElement[];
      console.log(`[DOCX Editable] Found ${pageDivs.length} section.docx elements`);
    }
    
    // Strategy 2: wrapper > section elements
    if (pageDivs.length === 0) {
      const wrapperSections = container.querySelectorAll('.docx-wrapper > section');
      if (wrapperSections.length >= 1) {
        pageDivs = Array.from(wrapperSections) as HTMLElement[];
        console.log(`[DOCX Editable] Found ${pageDivs.length} wrapper sections`);
      }
    }

    // Strategy 3: any section elements
    if (pageDivs.length === 0) {
      const anySections = container.querySelectorAll('section');
      if (anySections.length >= 1) {
        pageDivs = Array.from(anySections) as HTMLElement[];
        console.log(`[DOCX Editable] Found ${pageDivs.length} generic section elements`);
      }
    }

    const editablePages: string[] = [];

    if (pageDivs.length >= 1) {
      const totalPages = pageDivs.length;
      onProgress?.(`Processing ${totalPages} editable pages...`, 0, totalPages);

      for (let i = 0; i < pageDivs.length; i++) {
        onProgress?.(`Extracting page ${i + 1}/${totalPages}...`, i + 1, totalPages);
        const pageEl = pageDivs[i];

        // Get the section's outerHTML, preserving all inline styles
        let pageHtml = pageEl.outerHTML;

        // Remove contenteditable="false" attributes to allow editing
        pageHtml = pageHtml.replace(/contenteditable\s*=\s*"false"/gi, '');

        editablePages.push(pageHtml);
      }
    } else {
      // No sections found at all - use the full wrapper content as single page
      console.log('[DOCX Editable] No sections found - using full wrapper content');
      const wrapper = container.querySelector('.docx-wrapper') as HTMLElement;
      const target = wrapper || container;

      let fullHtml = target.innerHTML;
      console.log(`[DOCX Editable] Wrapper innerHTML length: ${fullHtml.length}`);
      // Remove style tags from the content (we'll prepend them separately)
      fullHtml = fullHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      // Remove contenteditable="false"
      fullHtml = fullHtml.replace(/contenteditable\s*=\s*"false"/gi, '');

      if (fullHtml.trim().length > 0) {
        editablePages.push(fullHtml);
      }
    }

    document.body.removeChild(container);

    if (editablePages.length === 0) {
      throw new Error('Failed to extract editable DOCX pages');
    }

    onProgress?.('Editable document ready!', editablePages.length, editablePages.length);

    return {
      html: '',
      metadata: {
        pageCount: editablePages.length,
        hasEditableText: true,
        hasImages: false,
        fileType: 'docx',
        detectedFormat: 'letter',
        dimensions: { width: PAGE_WIDTH_PX, height: PAGE_HEIGHT_PX },
      },
      editablePages,
      // Prepend collected styles so the editor can inject them
      pages: [collectedStyles],
    };
  } catch (error) {
    document.body.removeChild(container);
    throw error;
  }
}

/**
 * Parse DOCX for hybrid editing: renders pages as images AND extracts text layers.
 * Uses docx-preview with breakPages:true + html2canvas, same output format as PDF hybrid.
 */
async function parseDocxForEditing(
  file: File,
  onProgress?: (message: string, current?: number, total?: number) => void
): Promise<ParsedContent> {
  onProgress?.('Preparing DOCX for editing...', 0, 1);

  const PAGE_WIDTH_PX = 816;
  const PAGE_HEIGHT_PX = 1056;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${PAGE_WIDTH_PX}px`;
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  try {
    await renderAsync(file, container, undefined, {
      className: 'docx',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreFonts: false,
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: true,
      debug: false,
    });

    // Wait for fonts/images to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    onProgress?.('Detecting pages...', 0, 1);

    // Find page sections
    let pageDivs: HTMLElement[] = [];
    const sections = container.querySelectorAll('section.docx');
    if (sections.length > 1) {
      pageDivs = Array.from(sections) as HTMLElement[];
    }
    if (pageDivs.length <= 1) {
      const wrapperSections = container.querySelectorAll('.docx-wrapper > section');
      if (wrapperSections.length > 1) {
        pageDivs = Array.from(wrapperSections) as HTMLElement[];
      }
    }

    const html2canvasModule = (await import('html2canvas')).default;
    const images: string[] = [];
    const textLayers: TextLayerItem[][] = [];

    const extractTextFromElement = (element: HTMLElement, offsetX: number, offsetY: number): TextLayerItem[] => {
      const items: TextLayerItem[] = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
      let node: Text | null;

      while ((node = walker.nextNode() as Text | null)) {
        const text = node.textContent?.trim();
        if (!text) continue;

        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = range.getClientRects();
        if (rects.length === 0) continue;

        const rect = rects[0];
        const parentEl = node.parentElement;
        if (!parentEl) continue;

        const computedStyle = window.getComputedStyle(parentEl);
        const fontSize = parseFloat(computedStyle.fontSize) || 12;
        const { fontFamily, fontWeight, fontStyle } = recognizeFont(computedStyle.fontFamily);

        items.push({
          text,
          x: rect.left - offsetX,
          y: rect.top - offsetY,
          width: rect.width,
          height: rect.height,
          fontSize,
          fontFamily,
          fontWeight,
          fontStyle,
          color: computedStyle.color || 'rgb(0, 0, 0)',
          backgroundColor: 'rgb(255, 255, 255)', // Will be sampled from canvas
        });
      }

      return items;
    };

    if (pageDivs.length > 1) {
      const totalPages = pageDivs.length;
      onProgress?.(`Processing ${totalPages} pages...`, 0, totalPages);

      for (let i = 0; i < pageDivs.length; i++) {
        onProgress?.(`Processing page ${i + 1}/${totalPages}...`, i + 1, totalPages);
        const pageEl = pageDivs[i];
        pageEl.style.display = 'block';
        await new Promise(resolve => setTimeout(resolve, 200));

        // Extract text positions BEFORE capturing image
        const pageRect = pageEl.getBoundingClientRect();
        const pageTextItems = extractTextFromElement(pageEl, pageRect.left, pageRect.top);

        try {
          const canvas = await html2canvasModule(pageEl, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: pageEl.scrollWidth || PAGE_WIDTH_PX,
            height: pageEl.scrollHeight || PAGE_HEIGHT_PX,
          });
          images.push(canvas.toDataURL('image/png'));

          // Sample background colors from the canvas for each text item
          for (const item of pageTextItems) {
            item.backgroundColor = sampleBackgroundColor(
              canvas, item.x, item.y, item.width, item.height, 2
            );
          }
          textLayers.push(pageTextItems);
        } catch (err) {
          console.error(`Failed to capture DOCX page ${i + 1}:`, err);
          textLayers.push([]);
        }
      }
    } else {
      // Single section — slice into pages
      const renderTarget = container.querySelector('.docx-wrapper') as HTMLElement || container;
      const totalHeight = renderTarget.scrollHeight;
      const totalWidth = renderTarget.scrollWidth || PAGE_WIDTH_PX;
      const numPages = Math.max(1, Math.ceil(totalHeight / PAGE_HEIGHT_PX));

      onProgress?.(`Splitting into ${numPages} pages...`, 0, numPages);

      // Extract all text items relative to the render target
      const targetRect = renderTarget.getBoundingClientRect();
      const allTextItems = extractTextFromElement(renderTarget, targetRect.left, targetRect.top);

      const fullCanvas = await html2canvasModule(renderTarget, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: totalWidth,
        height: totalHeight,
        windowWidth: totalWidth,
        windowHeight: totalHeight,
      });

      const scaleFactor = 2;
      const sliceWidth = totalWidth * scaleFactor;
      const sliceHeight = PAGE_HEIGHT_PX * scaleFactor;

      for (let i = 0; i < numPages; i++) {
        onProgress?.(`Processing page ${i + 1}/${numPages}...`, i + 1, numPages);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = sliceWidth;
        const remainingHeight = fullCanvas.height - (i * sliceHeight);
        pageCanvas.height = Math.min(sliceHeight, remainingHeight);

        const ctx = pageCanvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          fullCanvas,
          0, i * sliceHeight,
          sliceWidth, pageCanvas.height,
          0, 0,
          pageCanvas.width, pageCanvas.height
        );

        images.push(pageCanvas.toDataURL('image/png'));

        // Filter text items for this page slice
        const pageTop = i * PAGE_HEIGHT_PX;
        const pageBottom = pageTop + PAGE_HEIGHT_PX;
        const pageItems = allTextItems
          .filter(item => item.y >= pageTop && item.y < pageBottom)
          .map(item => ({
            ...item,
            y: item.y - pageTop, // Adjust Y relative to page
            backgroundColor: sampleBackgroundColor(
              pageCanvas, item.x, item.y - pageTop, item.width, item.height, 2
            ),
          }));
        textLayers.push(pageItems);
      }
    }

    document.body.removeChild(container);

    if (images.length === 0) {
      throw new Error('Failed to render DOCX pages');
    }

    const viewportWidth = pageDivs.length > 1 
      ? (pageDivs[0]?.scrollWidth || PAGE_WIDTH_PX) 
      : PAGE_WIDTH_PX;
    const viewportHeight = pageDivs.length > 1 
      ? (pageDivs[0]?.scrollHeight || PAGE_HEIGHT_PX) 
      : PAGE_HEIGHT_PX;

    onProgress?.('Hybrid editing ready!', images.length, images.length);

    return {
      html: '',
      metadata: {
        pageCount: images.length,
        hasEditableText: true,
        hasImages: true,
        fileType: 'docx',
        detectedFormat: 'letter',
        dimensions: { width: viewportWidth, height: viewportHeight },
      },
      images,
      textLayers,
    };
  } catch (error) {
    document.body.removeChild(container);
    throw error;
  }
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
    // For PDFs, always use image-based rendering for reliability
    return parseDocumentAsImages(file, onProgress);
  } else {
    return parseDOCX(file, (msg) => onProgress?.(msg));
  }
}
