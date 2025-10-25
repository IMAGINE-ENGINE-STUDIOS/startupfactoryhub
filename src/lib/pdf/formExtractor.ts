import * as pdfjs from 'pdfjs-dist';

export interface FormField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'select';
  value: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export async function extractFormFields(pdfUrl: string): Promise<FormField[]> {
  const loadingTask = pdfjs.getDocument(pdfUrl);
  const pdf = await loadingTask.promise;
  const fields: FormField[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const annotations = await page.getAnnotations();
    const viewport = page.getViewport({ scale: 1 });

    annotations.forEach((annotation: any) => {
      if (annotation.fieldType) {
        const rect = annotation.rect;
        
        fields.push({
          name: annotation.fieldName || `field_${fields.length}`,
          type: mapFieldType(annotation.fieldType),
          value: annotation.fieldValue || '',
          x: rect[0],
          y: viewport.height - rect[3], // Convert to top-left origin
          width: rect[2] - rect[0],
          height: rect[3] - rect[1],
          page: pageNum - 1,
        });
      }
    });
  }

  return fields;
}

function mapFieldType(pdfFieldType: string): 'text' | 'checkbox' | 'radio' | 'select' {
  switch (pdfFieldType.toLowerCase()) {
    case 'tx':
      return 'text';
    case 'btn':
      return 'checkbox';
    case 'ch':
      return 'select';
    default:
      return 'text';
  }
}
