import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CoordinateTransform } from '@/lib/pdf/CoordinateTransform';
import { toast } from 'sonner';
import { FabricObject } from 'fabric';

interface PDFOperation {
  type: string;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
}

export const usePDFExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const convertFabricObjectToPDFOperation = (
    obj: FabricObject,
    pageNumber: number,
    pageHeight: number
  ): PDFOperation | null => {
    const left = obj.left || 0;
    const top = obj.top || 0;
    const fill = obj.fill?.toString() || '#000000';
    const opacity = obj.opacity || 1;

    // Convert Y coordinate from Fabric to PDF
    const pdfY = CoordinateTransform.fabricToPDF(top, pageHeight);

    switch (obj.type) {
      case 'i-text':
      case 'text': {
        const textObj = obj as any;
        return {
          type: 'add_text',
          page: pageNumber,
          x: left,
          y: pdfY,
          text: textObj.text || '',
          fontSize: textObj.fontSize || 20,
          fontFamily: textObj.fontFamily || 'Arial',
          fontWeight: textObj.fontWeight || 'normal',
          fontStyle: textObj.fontStyle || 'normal',
          fill,
          opacity,
        };
      }

      case 'rect': {
        const width = (obj.width || 100) * (obj.scaleX || 1);
        const height = (obj.height || 100) * (obj.scaleY || 1);
        return {
          type: 'add_rectangle',
          page: pageNumber,
          x: left,
          y: pdfY,
          width,
          height,
          fill,
          stroke: obj.stroke?.toString() || '#000000',
          strokeWidth: obj.strokeWidth || 0,
          opacity,
        };
      }

      case 'circle': {
        const circleObj = obj as any;
        const radius = (circleObj.radius || 50) * (obj.scaleX || 1);
        return {
          type: 'add_circle',
          page: pageNumber,
          x: left,
          y: pdfY,
          radius,
          fill,
          stroke: obj.stroke?.toString() || '#000000',
          strokeWidth: obj.strokeWidth || 0,
          opacity,
        };
      }

      case 'path': {
        // For now, we'll skip path objects as they require more complex handling
        // In a full implementation, you'd serialize the path data
        console.warn('Path objects not yet supported for export');
        return null;
      }

      default:
        console.warn(`Unknown object type: ${obj.type}`);
        return null;
    }
  };

  const exportPDF = async (
    sessionId: string,
    pdfUrl: string,
    fabricObjects: FabricObject[],
    pageHeight: number,
    currentPage: number = 1
  ) => {
    setIsExporting(true);
    setExportUrl(null);

    try {
      // Convert Fabric objects to PDF operations
      const operations = fabricObjects
        .map((obj) => convertFabricObjectToPDFOperation(obj, currentPage, pageHeight))
        .filter((op): op is PDFOperation => op !== null);

      if (operations.length === 0) {
        toast.error('No objects to export');
        return null;
      }

      toast.loading('Exporting PDF...');

      // Call edge function
      const { data, error } = await supabase.functions.invoke('pdf-manipulation', {
        body: {
          sessionId,
          pdfUrl,
          operations,
        },
      });

      if (error) {
        console.error('Export error:', error);
        toast.error('Failed to export PDF: ' + error.message);
        return null;
      }

      if (data?.success && data?.url) {
        setExportUrl(data.url);
        toast.success('PDF exported successfully!');
        return data.url;
      } else {
        toast.error('Export failed');
        return null;
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF: ' + error.message);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportPDF,
    isExporting,
    exportUrl,
  };
};
