import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  filename?: string;
  quality?: number;
}

export class PDFExporter {
  /**
   * Export PDF with Fabric.js canvas overlays
   * @param pdfPages - Array of HTMLDivElement containing PDF pages
   * @param canvases - Array of HTMLCanvasElement with Fabric.js annotations
   * @param options - Export options
   */
  async exportPDF(
    pdfPages: HTMLDivElement[],
    canvases: HTMLCanvasElement[],
    options: ExportOptions = {}
  ): Promise<Blob> {
    const { filename = 'edited-document.pdf', quality = 0.95 } = options;

    if (pdfPages.length === 0) {
      throw new Error('No PDF pages to export');
    }

    // Get dimensions from first page
    const firstPage = pdfPages[0];
    const pageWidth = firstPage.offsetWidth;
    const pageHeight = firstPage.offsetHeight;

    // Create jsPDF instance
    const pdf = new jsPDF({
      orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
      unit: 'px',
      format: [pageWidth, pageHeight],
      compress: true,
    });

    // Process each page
    for (let i = 0; i < pdfPages.length; i++) {
      const pageDiv = pdfPages[i];
      const fabricCanvas = canvases[i];

      if (i > 0) {
        pdf.addPage([pageWidth, pageHeight], pageWidth > pageHeight ? 'landscape' : 'portrait');
      }

      // Step 1: Render the PDF page itself using html2canvas
      const pageCanvas = await html2canvas(pageDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Step 2: Create a composite canvas
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = pageCanvas.width;
      compositeCanvas.height = pageCanvas.height;
      const ctx = compositeCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Draw PDF page
      ctx.drawImage(pageCanvas, 0, 0);

      // Draw Fabric.js annotations on top if they exist
      if (fabricCanvas) {
        // Scale fabric canvas to match the rendered size
        const scaleX = pageCanvas.width / fabricCanvas.width;
        const scaleY = pageCanvas.height / fabricCanvas.height;
        ctx.save();
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(fabricCanvas, 0, 0);
        ctx.restore();
      }

      // Add composite image to PDF
      const imgData = compositeCanvas.toDataURL('image/jpeg', quality);
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
    }

    // Return as blob
    return pdf.output('blob');
  }

  /**
   * Export and trigger download
   */
  async exportAndDownload(
    pdfPages: HTMLDivElement[],
    canvases: HTMLCanvasElement[],
    options: ExportOptions = {}
  ): Promise<void> {
    const { filename = 'edited-document.pdf' } = options;
    const blob = await this.exportPDF(pdfPages, canvases, options);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export to Supabase Storage (optional cloud save)
   */
  async exportToStorage(
    pdfPages: HTMLDivElement[],
    canvases: HTMLCanvasElement[],
    uploadCallback: (blob: Blob) => Promise<string>
  ): Promise<string> {
    const blob = await this.exportPDF(pdfPages, canvases);
    return await uploadCallback(blob);
  }
}
