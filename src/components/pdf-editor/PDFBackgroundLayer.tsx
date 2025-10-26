import { Document, Page } from 'react-pdf';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PDFBackgroundLayerProps {
  pdfUrl: string;
  pageNumber: number;
  zoom: number;
  onLoadSuccess: (numPages: number) => void;
  onPageLoadSuccess: (width: number, height: number) => void;
}

export const PDFBackgroundLayer = ({
  pdfUrl,
  pageNumber,
  zoom,
  onLoadSuccess,
  onPageLoadSuccess,
}: PDFBackgroundLayerProps) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <Document
        file={pdfUrl}
        onLoadSuccess={({ numPages }) => {
          onLoadSuccess(numPages);
          setIsLoading(false);
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
      >
        <Page
          pageNumber={pageNumber}
          scale={zoom}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          onLoadSuccess={(page) => {
            const { width, height } = page;
            onPageLoadSuccess(width * zoom, height * zoom);
          }}
        />
      </Document>
    </div>
  );
};
