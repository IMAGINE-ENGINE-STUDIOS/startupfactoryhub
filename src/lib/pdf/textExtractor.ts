import * as pdfjs from 'pdfjs-dist';

export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  page: number;
}

export async function extractTextFromPDF(pdfUrl: string): Promise<TextItem[]> {
  const loadingTask = pdfjs.getDocument(pdfUrl);
  const pdf = await loadingTask.promise;
  const textItems: TextItem[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });

    textContent.items.forEach((item: any) => {
      if (item.str && item.transform) {
        const [scaleX, , , scaleY, x, y] = item.transform;
        const fontSize = Math.abs(scaleY);
        
        textItems.push({
          text: item.str,
          x: x,
          y: viewport.height - y, // Convert to top-left origin
          width: item.width,
          height: item.height,
          fontSize: fontSize,
          fontFamily: item.fontName || 'Helvetica',
          page: pageNum - 1,
        });
      }
    });
  }

  return textItems;
}

export function findTextAtPosition(
  textItems: TextItem[],
  x: number,
  y: number,
  page: number,
  tolerance: number = 5
): TextItem | null {
  return textItems.find(item => 
    item.page === page &&
    x >= item.x - tolerance &&
    x <= item.x + item.width + tolerance &&
    y >= item.y - tolerance &&
    y <= item.y + item.height + tolerance
  ) || null;
}
