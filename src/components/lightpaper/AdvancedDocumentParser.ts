import * as pdfjsLib from "pdfjs-dist";
import { renderAsync } from "docx-preview";

// Canvas dimensions (A4 at 96dpi)
const CANVAS_WIDTH_CM = 21;
const CANVAS_HEIGHT_CM = 29.7;
const CM_TO_PX = 37.795275591;
const CANVAS_WIDTH_PX = CANVAS_WIDTH_CM * CM_TO_PX; // ~793px
const CANVAS_HEIGHT_PX = CANVAS_HEIGHT_CM * CM_TO_PX; // ~1122px
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

export interface ParsedContent {
  html: string;
  metadata: {
    pageCount?: number;
    hasEditableText: boolean;
    hasImages: boolean;
    fileType: 'pdf' | 'docx';
  };
  pages?: string[]; // Multiple page HTML strings
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
    
    // Wrap content with scaling container
    if (scale < 1.0) {
      html = `
        <div class="docx-page-wrapper" style="
          width: ${CANVAS_WIDTH_PX}px;
          height: ${CANVAS_HEIGHT_PX}px;
          overflow: hidden;
          position: relative;
        ">
          <div class="docx-page" style="
            transform: scale(${scale});
            transform-origin: top left;
            width: ${contentWidth}px;
            height: ${contentHeight}px;
          ">
            ${html}
          </div>
        </div>
      `;
    } else {
      html = `
        <div class="docx-page-wrapper" style="
          width: 100%;
          max-width: ${CANVAS_WIDTH_CM}cm;
          margin: 0 auto;
        ">
          ${html}
        </div>
      `;
    }
    
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
  
  // Limit to first 50 pages for performance
  const maxPages = Math.min(totalPages, 50);
  
  if (totalPages > 50) {
    onProgress?.(`PDF has ${totalPages} pages. Processing first 50 pages only.`);
  }
  
  // Get first page to calculate optimal scale
  const firstPage = await pdf.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1.0 });
  
  // Calculate scale to fit within canvas (with padding)
  const availableWidth = CANVAS_WIDTH_PX - (2 * PADDING_PX);
  const availableHeight = CANVAS_HEIGHT_PX - (2 * PADDING_PX);
  
  const scaleX = availableWidth / firstViewport.width;
  const scaleY = availableHeight / firstViewport.height;
  const optimalScale = Math.min(scaleX, scaleY, 2.0); // Cap at 2.0 for quality
  
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
    
    // Small delay between batches to prevent freezing
    if (i + batchSize <= maxPages) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Extract text from all pages for search
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    totalText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
  }
  
  onProgress?.('PDF processing complete!', maxPages, maxPages);
  
  return {
    html: htmlPages.join('\n\n'),
    metadata: {
      pageCount: maxPages,
      hasEditableText: true,
      hasImages,
      fileType: 'pdf',
    },
    pages: htmlPages, // Individual page HTML strings
  };
}

/**
 * Render a single PDF page with reconstructed objects (images, text, etc.)
 * Instead of background image, we extract and position actual elements
 */
async function renderPDFPageWithText(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number, scale: number = 2.0): Promise<string> {
  const page = await pdf.getPage(pageNum);
  
  // Get page dimensions at specified scale
  const viewport = page.getViewport({ scale });
  
  // Extract images from PDF
  const images = await extractImagesFromPage(page, viewport);
  
  // Extract text with positioning
  const textContent = await page.getTextContent();
  const textOverlay = renderTextOverlay(textContent, viewport);
  
  // Extract vector graphics and shapes as SVG
  const graphics = await extractGraphicsFromPage(page, viewport);
  
  // Calculate if page needs additional scaling to fit canvas
  const pageScale = Math.min(
    (CANVAS_WIDTH_PX - 2 * PADDING_PX) / viewport.width,
    (CANVAS_HEIGHT_PX - 2 * PADDING_PX) / viewport.height,
    1.0
  );
  
  // Combine layers into final HTML with proper containment
  return `
    <div class="pdf-page-wrapper" style="
      width: ${CANVAS_WIDTH_PX}px;
      height: ${CANVAS_HEIGHT_PX}px;
      overflow: hidden;
      position: relative;
      margin: 1rem auto;
    ">
      <div class="pdf-page" style="
        position: relative;
        width: ${viewport.width}px;
        height: ${viewport.height}px;
        background: white;
        transform: scale(${pageScale});
        transform-origin: top left;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      ">
        ${graphics}
        ${images}
        <div class="text-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: auto;">
          ${textOverlay}
        </div>
      </div>
    </div>
  `;
}

/**
 * Extract images from PDF page
 */
async function extractImagesFromPage(page: pdfjsLib.PDFPageProxy, viewport: pdfjsLib.PageViewport): Promise<string> {
  try {
    const operatorList = await page.getOperatorList();
    let imagesHTML = '';
    
    // Canvas to render individual images
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    for (let i = 0; i < operatorList.fnArray.length; i++) {
      const fn = operatorList.fnArray[i];
      const args = operatorList.argsArray[i];
      
      // Check for image painting operations
      if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
        try {
          const imgName = args[0];
          
          // Get image from resources
          const resources = await (page as any).objs.get(imgName);
          
          if (resources && resources.width && resources.height) {
            // Create canvas for this image
            canvas.width = resources.width;
            canvas.height = resources.height;
            
            // Draw image data
            const imgData = ctx.createImageData(resources.width, resources.height);
            
            if (resources.data) {
              // Copy image data
              const data = resources.data;
              for (let j = 0; j < data.length; j++) {
                imgData.data[j] = data[j];
              }
              
              ctx.putImageData(imgData, 0, 0);
              const imageDataUrl = canvas.toDataURL('image/png');
              
              // Get transform matrix to calculate position
              const transform = args[1] || [1, 0, 0, 1, 0, 0];
              const x = transform[4];
              const y = viewport.height - transform[5] - (resources.height * transform[3]);
              const width = resources.width * transform[0];
              const height = resources.height * transform[3];
              
              imagesHTML += `<img src="${imageDataUrl}" style="position: absolute; left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px; object-fit: contain;" draggable="true" />`;
            }
          }
        } catch (imgError) {
          console.warn('Failed to extract image:', imgError);
        }
      }
    }
    
    return imagesHTML;
  } catch (error) {
    console.warn('Failed to extract images from page:', error);
    return '';
  }
}

/**
 * Extract vector graphics and shapes from PDF page
 */
async function extractGraphicsFromPage(page: pdfjsLib.PDFPageProxy, viewport: pdfjsLib.PageViewport): Promise<string> {
  try {
    const operatorList = await page.getOperatorList();
    let svgPaths = '';
    let currentPath = '';
    let currentX = 0;
    let currentY = 0;
    let fillColor = 'black';
    let strokeColor = 'black';
    let lineWidth = 1;
    
    for (let i = 0; i < operatorList.fnArray.length; i++) {
      const fn = operatorList.fnArray[i];
      const args = operatorList.argsArray[i];
      
      switch (fn) {
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
          const x = args[4];
          const y = viewport.height - args[5];
          currentPath += `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y} `;
          break;
          
        case pdfjsLib.OPS.rectangle:
          const rectX = args[0];
          const rectY = viewport.height - args[1] - args[3];
          const rectW = args[2];
          const rectH = args[3];
          currentPath += `M ${rectX} ${rectY} L ${rectX + rectW} ${rectY} L ${rectX + rectW} ${rectY + rectH} L ${rectX} ${rectY + rectH} Z `;
          break;
          
        case pdfjsLib.OPS.setStrokeRGBColor:
          strokeColor = `rgb(${args[0] * 255}, ${args[1] * 255}, ${args[2] * 255})`;
          break;
          
        case pdfjsLib.OPS.setFillRGBColor:
          fillColor = `rgb(${args[0] * 255}, ${args[1] * 255}, ${args[2] * 255})`;
          break;
          
        case pdfjsLib.OPS.setLineWidth:
          lineWidth = args[0];
          break;
          
        case pdfjsLib.OPS.fill:
        case pdfjsLib.OPS.eoFill:
          if (currentPath) {
            svgPaths += `<path d="${currentPath}" fill="${fillColor}" fill-opacity="0.8" />`;
            currentPath = '';
          }
          break;
          
        case pdfjsLib.OPS.stroke:
          if (currentPath) {
            svgPaths += `<path d="${currentPath}" fill="none" stroke="${strokeColor}" stroke-width="${lineWidth}" />`;
            currentPath = '';
          }
          break;
          
        case pdfjsLib.OPS.fillStroke:
        case pdfjsLib.OPS.eoFillStroke:
          if (currentPath) {
            svgPaths += `<path d="${currentPath}" fill="${fillColor}" fill-opacity="0.8" stroke="${strokeColor}" stroke-width="${lineWidth}" />`;
            currentPath = '';
          }
          break;
      }
    }
    
    if (svgPaths) {
      return `<svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;" viewBox="0 0 ${viewport.width} ${viewport.height}">
        ${svgPaths}
      </svg>`;
    }
    
    return '';
  } catch (error) {
    console.warn('Failed to extract graphics from page:', error);
    return '';
  }
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
