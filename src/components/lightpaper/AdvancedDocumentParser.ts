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
 * Sample background color from a canvas at a specific region around a text item.
 * Returns the dominant background color behind the text.
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

  // Sample a small region around the text (slightly expanded)
  const sx = Math.max(0, Math.floor((x - 2) * scale));
  const sy = Math.max(0, Math.floor((y - 2) * scale));
  const sw = Math.min(canvas.width - sx, Math.ceil((width + 4) * scale));
  const sh = Math.min(canvas.height - sy, Math.ceil((height + 4) * scale));

  if (sw <= 0 || sh <= 0) return 'rgb(255, 255, 255)';

  try {
    const imageData = ctx.getImageData(sx, sy, sw, sh);
    const data = imageData.data;

    // Sample edges of the region (not center where text is)
    // Take pixels from top-left corner, top-right corner, and left edge
    const samplePixels: number[][] = [];
    const addSample = (px: number, py: number) => {
      const idx = (py * sw + px) * 4;
      if (idx >= 0 && idx + 2 < data.length) {
        samplePixels.push([data[idx], data[idx + 1], data[idx + 2]]);
      }
    };

    // Sample corners and edges (where background is likely visible)
    addSample(0, 0);
    addSample(sw - 1, 0);
    addSample(0, sh - 1);
    addSample(sw - 1, sh - 1);
    addSample(Math.floor(sw / 2), 0);
    addSample(0, Math.floor(sh / 2));

    if (samplePixels.length === 0) return 'rgb(255, 255, 255)';

    // Average the sampled colors
    let r = 0, g = 0, b = 0;
    for (const [pr, pg, pb] of samplePixels) {
      r += pr; g += pg; b += pb;
    }
    r = Math.round(r / samplePixels.length);
    g = Math.round(g / samplePixels.length);
    b = Math.round(b / samplePixels.length);

    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return 'rgb(255, 255, 255)';
  }
}

/**
 * Parse document for hybrid editing: returns both page images AND positioned text layers
 * with background color sampling for seamless text editing.
 */
export async function parseDocumentForEditing(
  file: File,
  onProgress?: (message: string, current?: number, total?: number) => void
): Promise<ParsedContent> {
  const fileType = await detectFileType(file);

  if (fileType === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;
    const images: string[] = [];
    const textLayers: TextLayerItem[][] = [];
    const renderScale = 2.0;

    const firstPage = await pdf.getPage(1);
    const firstViewport = firstPage.getViewport({ scale: 1.0 });
    const detectedFormat = detectPageFormat(firstViewport.width, firstViewport.height);

    onProgress?.(`Preparing ${pageCount} pages for editing...`, 0, pageCount);

    for (let i = 1; i <= pageCount; i++) {
      onProgress?.(`Processing page ${i}/${pageCount}...`, i, pageCount);

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      const renderViewport = page.getViewport({ scale: renderScale });

      // 1. Render page image
      const canvas = document.createElement('canvas');
      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport: renderViewport,
        canvas: canvas
      }).promise;

      images.push(canvas.toDataURL('image/png'));

      // 2. Extract text items with positions at scale=1
      const textContent = await page.getTextContent();
      const pageTextLayer: TextLayerItem[] = [];

      const measureCanvas = document.createElement('canvas');
      const measureCtx = measureCanvas.getContext('2d')!;

      for (const item of textContent.items as any[]) {
        if (!item.str || item.str.trim() === '') continue;

        const tx = item.transform;
        const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
        const x = tx[4];
        const y = viewport.height - tx[5];

        const { fontFamily, fontWeight, fontStyle } = recognizeFont(item.fontName || '');
        measureCtx.font = `${fontWeight} ${fontStyle} ${fontHeight}px ${fontFamily}`;
        const textWidth = measureCtx.measureText(item.str).width;

        let color = 'rgb(0, 0, 0)';
        if (item.color && Array.isArray(item.color)) {
          const r = Math.round(item.color[0] * 255);
          const g = Math.round(item.color[1] * 255);
          const b = Math.round(item.color[2] * 255);
          color = `rgb(${r}, ${g}, ${b})`;
        }

        // 3. Sample background color from the rendered canvas
        const bgColor = sampleBackgroundColor(
          canvas,
          x, y - fontHeight,
          textWidth, fontHeight,
          renderScale
        );

        pageTextLayer.push({
          text: item.str,
          x,
          y: y - fontHeight,
          width: textWidth,
          height: fontHeight,
          fontSize: fontHeight,
          fontFamily,
          fontWeight,
          fontStyle,
          color,
          backgroundColor: bgColor,
        });
      }

      textLayers.push(pageTextLayer);
    }

    onProgress?.('Hybrid editing ready!', pageCount, pageCount);

    return {
      html: '',
      metadata: {
        pageCount,
        hasEditableText: true,
        hasImages: true,
        fileType: 'pdf',
        detectedFormat,
        dimensions: { width: firstViewport.width, height: firstViewport.height },
      },
      images,
      textLayers,
    };
  }

  // For DOCX, use the editable HTML parser (returns clean HTML without images)
  return parseDOCX(file, (msg) => onProgress?.(msg));
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
