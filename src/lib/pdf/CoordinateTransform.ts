/**
 * Coordinate transformation utilities for PDF editing
 * Fabric.js uses top-left origin, PDF uses bottom-left origin
 */

export class CoordinateTransform {
  /**
   * Convert Fabric.js coordinates to PDF coordinates
   * @param fabricY Y coordinate in Fabric.js (top-left origin)
   * @param pageHeight Height of the PDF page
   * @param zoom Current zoom level
   * @returns Y coordinate in PDF space (bottom-left origin)
   */
  static fabricToPDF(fabricY: number, pageHeight: number, zoom: number = 1): number {
    // PDF origin is bottom-left, Fabric origin is top-left
    const adjustedY = fabricY / zoom;
    return pageHeight - adjustedY;
  }

  /**
   * Convert PDF coordinates to Fabric.js coordinates
   * @param pdfY Y coordinate in PDF space (bottom-left origin)
   * @param pageHeight Height of the PDF page
   * @param zoom Current zoom level
   * @returns Y coordinate in Fabric.js space (top-left origin)
   */
  static pdfToFabric(pdfY: number, pageHeight: number, zoom: number = 1): number {
    const fabricY = pageHeight - pdfY;
    return fabricY * zoom;
  }

  /**
   * Scale coordinate from Fabric to PDF (accounting for zoom)
   */
  static scaleToPDF(fabricValue: number, zoom: number = 1): number {
    return fabricValue / zoom;
  }

  /**
   * Scale coordinate from PDF to Fabric (accounting for zoom)
   */
  static scaleToFabric(pdfValue: number, zoom: number = 1): number {
    return pdfValue * zoom;
  }
}
