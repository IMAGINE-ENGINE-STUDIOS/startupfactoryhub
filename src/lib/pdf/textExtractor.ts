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
  baseTolerance: number = 15
): TextItem | null {
  // Sort by proximity to click point
  const itemsWithDistance = textItems
    .filter(item => item.page === page)
    .map(item => {
      // Dynamic tolerance based on text size (smaller text = bigger tolerance)
      const dynamicTolerance = Math.max(baseTolerance, item.height * 0.5);
      
      const isInBounds = 
        x >= item.x - dynamicTolerance &&
        x <= item.x + item.width + dynamicTolerance &&
        y >= item.y - dynamicTolerance &&
        y <= item.y + item.height + dynamicTolerance;
      
      if (!isInBounds) return null;
      
      // Calculate distance to center of text box
      const centerX = item.x + item.width / 2;
      const centerY = item.y + item.height / 2;
      const distance = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );
      
      return { item, distance };
    })
    .filter(Boolean) as { item: TextItem; distance: number }[];
  
  // Return closest item
  if (itemsWithDistance.length === 0) return null;
  
  itemsWithDistance.sort((a, b) => a.distance - b.distance);
  return itemsWithDistance[0].item;
}
