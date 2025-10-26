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

/**
 * Detect page format from dimensions (in pixels)
 */
export function detectPageFormat(widthPx: number, heightPx: number): 'letter' | 'legal' | 'a4' | 'a5' | 'custom' {
  // Convert to mm for comparison (assuming 72 DPI)
  const widthMm = (widthPx / 72) * 25.4;
  const heightMm = (heightPx / 72) * 25.4;
  
  const formats = {
    letter: { w: 215.9, h: 279.4 },
    legal: { w: 215.9, h: 355.6 },
    a4: { w: 210, h: 297 },
    a5: { w: 148, h: 210 }
  };
  
  for (const [name, dims] of Object.entries(formats)) {
    if (Math.abs(widthMm - dims.w) < 10 && Math.abs(heightMm - dims.h) < 10) {
      return name as 'letter' | 'legal' | 'a4' | 'a5';
    }
  }
  return 'custom';
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
      
      // Convert to base64 JPEG
      images.push(canvas.toDataURL('image/jpeg', 0.95));
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
  
  throw new Error('View Mode currently only supports PDF files. Please use Edit Mode for DOCX files.');
}

export interface ParsedContent {
  html: string;
  metadata: {
    pageCount?: number;
    hasEditableText: boolean;
    hasImages: boolean;
    fileType: 'pdf' | 'docx';
    detectedFormat?: 'letter' | 'legal' | 'a4' | 'a5' | 'custom';
    dimensions?: { width: number; height: number };
  };
  pages?: string[]; // Multiple page HTML strings
  images?: string[]; // For View Mode - array of page images
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
  container.style.width = `${CANVAS_WIDTH_CM}cm`;
  container.style.maxWidth = `${CANVAS_WIDTH_CM}cm`;
  container.style.minHeight = `${CANVAS_HEIGHT_CM}cm`;
  container.style.padding = '2cm';
  container.style.boxSizing = 'border-box';
  document.body.appendChild(container);

  try {
    // Render DOCX with full formatting preservation
    await renderAsync(file, container, undefined, {
      className: 'docx-content',
      inWrapper: false,
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

    // Measure actual content dimensions
    const contentWidth = container.scrollWidth;
    const contentHeight = container.scrollHeight;
    
    // Calculate scale to fit within canvas (with padding)
    const availableWidth = CANVAS_WIDTH_PX - (2 * PADDING_PX);
    const availableHeight = CANVAS_HEIGHT_PX - (2 * PADDING_PX);
    
    let scale = 1.0;
    if (contentWidth > availableWidth || contentHeight > availableHeight) {
      const scaleX = availableWidth / contentWidth;
      const scaleY = availableHeight / contentHeight;
      scale = Math.min(scaleX, scaleY);
    }
    
    // Extract rendered HTML
    let html = container.innerHTML;
    
    // Always wrap with proper scaling
    html = `
      <div class="docx-page-wrapper" style="
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        overflow: hidden;
        position: relative;
      ">
        <div class="docx-page" style="
          transform: scale(${scale});
          transform-origin: top left;
          width: ${contentWidth}px;
          max-width: 100%;
        ">
          ${html}
        </div>
      </div>
    `;
    
    // Check if content has images
    const hasImages = container.innerHTML.includes('<img') || container.innerHTML.includes('base64');
    
    // Check if content is editable (has text content)
    const textContent = container.textContent || '';
    const isEditable = textContent.trim().length > 0;
    
    // Estimate page count
    const estimatedPages = Math.max(1, Math.ceil(contentHeight / CANVAS_HEIGHT_PX));
    
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
  
  // Process all pages
  const maxPages = totalPages;
  
  onProgress?.(`PDF has ${totalPages} pages. Processing all pages...`);
  
  // Get first page to calculate optimal scale
  const firstPage = await pdf.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1.0 });
  
  // Calculate scale to fit within canvas (with padding)
  const availableWidth = CANVAS_WIDTH_PX - (2 * PADDING_PX);
  const availableHeight = CANVAS_HEIGHT_PX - (2 * PADDING_PX);
  
  // Calculate scale to fit within container (not fixed canvas)
  const scaleX = availableWidth / firstViewport.width;
  const scaleY = availableHeight / firstViewport.height;
  const optimalScale = Math.min(scaleX, scaleY, 2.5); // Reduce from 6.0 to 2.5 for better fit
  
  onProgress?.(`Rendering at scale ${optimalScale.toFixed(2)}...`, 0, maxPages);
  
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
      
      batchPromises.push(renderPDFPageWithText(pdf, pageNum, optimalScale));
    }
    
    const batchResults = await Promise.all(batchPromises);
    htmlPages.push(...batchResults);
    
    // Check if any page has images
    batchResults.forEach(pageHtml => {
      if (pageHtml.includes('<img') || pageHtml.includes('<svg')) {
        hasImages = true;
      }
    });
    
    // No delay needed - modern browsers handle this efficiently
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
    pages: htmlPages, // Individual page HTML strings
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
  
  // Calculate scale to fit US Letter (21.59cm x 27.94cm)
  const targetWidth = CANVAS_WIDTH_PX - (2 * PADDING_PX); // Available width with padding
  const targetHeight = CANVAS_HEIGHT_PX - (2 * PADDING_PX); // Available height with padding
  
  const scaleX = targetWidth / viewport.width;
  const scaleY = targetHeight / viewport.height;
  const contentScale = Math.min(scaleX, scaleY, 1.0); // Don't upscale
  
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
  
  // Return fully reconstructed page scaled to fit Letter size
  return `
    <div class="pdf-page-reconstructed" style="
      position: relative;
      width: 100%;
      height: 100%;
      background: white;
      overflow: hidden;
    ">
      <div style="
        transform: scale(${contentScale});
        transform-origin: top left;
        width: ${viewport.width}px;
        height: ${viewport.height}px;
        position: relative;
      ">
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
