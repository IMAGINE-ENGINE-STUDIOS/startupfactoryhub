/**
 * Table Detection and Reconstruction for PDF Documents
 * Analyzes text positioning to detect tables and reconstructs them as HTML
 */

export interface TableCell {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fontWeight: string;
  fontSize: number;
  rowIndex: number;
  colIndex: number;
}

export interface TableStructure {
  rows: TableCell[][];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  columnCount: number;
  rowCount: number;
}

export interface ShapeData {
  type: 'line' | 'rectangle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
}

/**
 * Group text items into rows based on Y-position clustering
 */
function groupIntoRows(items: any[], viewport: any) {
  const positioned = items
    .filter(item => item.str && item.str.trim())
    .map(item => {
      const tx = item.transform;
      const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);
      return {
        text: item.str.trim(),
        x: tx[4],
        y: viewport.height - tx[5] - fontHeight,
        width: item.width || 0,
        height: fontHeight,
        fontSize: fontHeight,
        fontName: item.fontName || '',
        color: item.color,
        item: item,
      };
    })
    .sort((a, b) => a.y - b.y || a.x - b.x);
  
  const rows: typeof positioned[] = [];
  let currentRow: typeof positioned = [];
  let lastY = -Infinity;
  const rowThreshold = 5; // Pixels tolerance for same row
  
  for (const item of positioned) {
    if (Math.abs(item.y - lastY) > rowThreshold) {
      if (currentRow.length > 0) {
        rows.push([...currentRow]);
      }
      currentRow = [item];
      lastY = item.y;
    } else {
      currentRow.push(item);
      lastY = (lastY + item.y) / 2; // Average Y position
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);
  
  return rows;
}

/**
 * Find sequences of rows that look like tables
 */
function findTableRanges(rows: any[][]) {
  const ranges: { start: number; end: number }[] = [];
  let start = -1;
  let lastColumnCount = 0;
  
  for (let i = 0; i < rows.length; i++) {
    const colCount = rows[i].length;
    
    if (colCount >= 2) { // Tables need at least 2 columns
      if (start < 0) {
        start = i;
        lastColumnCount = colCount;
      } else if (Math.abs(colCount - lastColumnCount) <= 2) {
        // Similar column count (allow ±2 variation for merged cells)
        continue;
      } else {
        // Column count changed significantly, end table
        if (i - start >= 2) { // Need at least 2 rows
          ranges.push({ start, end: i });
        }
        start = i;
        lastColumnCount = colCount;
      }
    } else {
      // Not table-like, reset
      if (start >= 0 && i - start >= 2) {
        ranges.push({ start, end: i });
      }
      start = -1;
    }
  }
  
  // Handle last range
  if (start >= 0 && rows.length - start >= 2) {
    ranges.push({ start, end: rows.length });
  }
  
  return ranges;
}

/**
 * Validate if detected table candidate has table-like characteristics
 */
function validateTableCandidate(rows: any[][], viewport: any): boolean {
  // Must have at least 3 rows (header + 2 data rows minimum)
  if (rows.length < 3) return false;
  
  // Must have at least 2 columns consistently
  if (rows[0].length < 2) return false;
  
  // Check column consistency (at least 70% of rows should have similar column count)
  const colCounts = rows.map(r => r.length);
  const avgColCount = colCounts.reduce((a, b) => a + b, 0) / colCounts.length;
  const consistentRows = colCounts.filter(c => Math.abs(c - avgColCount) <= 1).length;
  if (consistentRows / rows.length < 0.7) return false;
  
  // Check for grid-like alignment (X positions should align vertically)
  const allXPositions = rows.flatMap(row => row.map(item => item.x));
  const uniqueXPositions = [...new Set(allXPositions.map(x => Math.round(x / 10) * 10))];
  if (uniqueXPositions.length < 2) return false;
  
  // Check for consistent row heights (table rows are usually similar height)
  const rowHeights = rows.map(row => row[0]?.height || 0).filter(h => h > 0);
  if (rowHeights.length === 0) return false;
  const avgHeight = rowHeights.reduce((a, b) => a + b, 0) / rowHeights.length;
  const heightVariance = rowHeights.every(h => Math.abs(h - avgHeight) < avgHeight * 0.5);
  if (!heightVariance) return false;
  
  return true;
}

/**
 * Check if table area has visible borders from PDF shapes
 */
export function hasTableBorders(
  tableBounds: { x: number; y: number; width: number; height: number },
  shapes: ShapeData[]
): boolean {
  if (!shapes || shapes.length === 0) return false;
  
  const tolerance = 15; // Pixels tolerance for border matching
  
  // Look for rectangles that overlap with table bounds
  return shapes.some(shape => {
    if (shape.type === 'rectangle' && shape.width && shape.height) {
      const overlapsX = Math.abs(shape.x - tableBounds.x) < tolerance;
      const overlapsY = Math.abs(shape.y - tableBounds.y) < tolerance;
      const overlapsWidth = Math.abs(shape.width - tableBounds.width) < tolerance * 2;
      const overlapsHeight = Math.abs(shape.height - tableBounds.height) < tolerance * 2;
      
      return overlapsX && overlapsY && overlapsWidth && overlapsHeight;
    }
    return false;
  });
}

/**
 * Enhanced table detection with strict validation and border checking
 */
export function detectTables(textItems: any[], viewport: any, shapes: ShapeData[] = []): TableStructure[] {
  if (!textItems || textItems.length < 9) return []; // Minimum 3x3 table
  
  // Group items into rows
  const rows = groupIntoRows(textItems, viewport);
  
  // Find sequences that look like tables
  const tableRanges = findTableRanges(rows);
  
  // Build table structures with strict validation
  const tables: TableStructure[] = [];
  for (const range of tableRanges) {
    const rowsSlice = rows.slice(range.start, range.end);
    
    // Validate table characteristics before building
    if (!validateTableCandidate(rowsSlice, viewport)) continue;
    
    const table = buildTableStructure(rowsSlice, viewport);
    if (!table) continue;
    
    // If shapes data is available, validate borders
    if (shapes.length > 0) {
      if (hasTableBorders(table.bounds, shapes)) {
        tables.push(table);
      }
    } else {
      // No shape data available, use validated table
      tables.push(table);
    }
  }
  
  return tables;
}

/**
 * Build structured table from detected rows
 */
function buildTableStructure(rows: any[][], viewport: any): TableStructure | null {
  if (rows.length < 2) return null;
  
  // Detect column boundaries by analyzing X positions across all rows
  const allXPositions = rows.flatMap(row => row.map(item => item.x)).sort((a, b) => a - b);
  const columnBoundaries = detectColumnBoundaries(allXPositions);
  
  if (columnBoundaries.length < 2) return null;
  
  // Assign each text item to a column
  const gridCells: TableCell[][] = [];
  
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const gridRow: TableCell[] = [];
    
    // Initialize all columns with empty cells
    for (let colIndex = 0; colIndex < columnBoundaries.length; colIndex++) {
      gridRow.push({
        text: '',
        x: columnBoundaries[colIndex],
        y: row[0]?.y || 0,
        width: 0,
        height: row[0]?.height || 12,
        color: 'rgb(0, 0, 0)',
        fontWeight: 'normal',
        fontSize: row[0]?.fontSize || 12,
        rowIndex,
        colIndex,
      });
    }
    
    // Fill in cells with actual content
    for (const item of row) {
      const colIndex = findColumnIndex(item.x, columnBoundaries);
      if (colIndex >= 0 && colIndex < gridRow.length) {
        const cell = gridRow[colIndex];
        
        // Extract styling from PDF item
        let color = 'rgb(0, 0, 0)';
        if (item.item.color && Array.isArray(item.item.color)) {
          const r = Math.round(item.item.color[0] * 255);
          const g = Math.round(item.item.color[1] * 255);
          const b = Math.round(item.item.color[2] * 255);
          color = `rgb(${r}, ${g}, ${b})`;
        }
        
        let fontWeight = 'normal';
        if (item.item.fontName) {
          const fontNameLower = item.item.fontName.toLowerCase();
          if (fontNameLower.includes('bold')) fontWeight = 'bold';
        }
        
        cell.text = item.text;
        cell.x = item.x;
        cell.y = item.y;
        cell.width = item.width;
        cell.height = item.height;
        cell.color = color;
        cell.fontWeight = fontWeight;
        cell.fontSize = item.fontSize;
      }
    }
    
    gridCells.push(gridRow);
  }
  
  // Calculate table bounds
  const allX = gridCells.flatMap(row => row.map(cell => cell.x));
  const allY = gridCells.map(row => row[0].y);
  const minX = Math.min(...allX);
  const maxX = Math.max(...gridCells.flatMap(row => row.map(cell => cell.x + cell.width)));
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY) + (gridCells[0][0]?.height || 12);
  
  return {
    rows: gridCells,
    bounds: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
    columnCount: columnBoundaries.length,
    rowCount: gridCells.length,
  };
}

/**
 * Detect column boundaries from X positions
 */
function detectColumnBoundaries(xPositions: number[]): number[] {
  if (xPositions.length === 0) return [];
  
  const threshold = 20; // Pixels to consider same column
  const boundaries: number[] = [xPositions[0]];
  
  for (let i = 1; i < xPositions.length; i++) {
    const x = xPositions[i];
    const lastBoundary = boundaries[boundaries.length - 1];
    
    if (Math.abs(x - lastBoundary) > threshold) {
      boundaries.push(x);
    }
  }
  
  return boundaries;
}

/**
 * Find which column an X position belongs to
 */
function findColumnIndex(x: number, boundaries: number[]): number {
  const threshold = 30; // Tolerance for column assignment
  
  for (let i = 0; i < boundaries.length; i++) {
    if (Math.abs(x - boundaries[i]) < threshold) {
      return i;
    }
  }
  
  // If not found, find nearest column
  let nearestIndex = 0;
  let minDistance = Math.abs(x - boundaries[0]);
  
  for (let i = 1; i < boundaries.length; i++) {
    const distance = Math.abs(x - boundaries[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }
  
  return nearestIndex;
}

/**
 * Render table as HTML with pixel-perfect cell dimensions
 */
export function renderTableAsHTML(table: TableStructure, scale: number = 1): string {
  const cellPadding = 6;
  const borderColor = '#999999';
  const borderWidth = 1;
  
  // Calculate exact column widths from cell positions
  const columnWidths: number[] = [];
  const firstRow = table.rows[0];
  
  for (let col = 0; col < firstRow.length; col++) {
    let maxWidth = 0;
    for (const row of table.rows) {
      if (row[col] && row[col].width > maxWidth) {
        maxWidth = row[col].width;
      }
    }
    // Add padding for exact sizing
    columnWidths.push(maxWidth + cellPadding * 2);
  }
  
  // Calculate exact row heights
  const rowHeights: number[] = [];
  for (const row of table.rows) {
    const maxHeight = Math.max(...row.map(cell => cell.height || 12));
    rowHeights.push(maxHeight + cellPadding * 2);
  }
  
  let html = `
    <div class="pdf-reconstructed-table" style="
      position: absolute;
      left: ${table.bounds.x}px;
      top: ${table.bounds.y}px;
      width: ${table.bounds.width}px;
      height: ${table.bounds.height}px;
      background: white;
      z-index: 10;
      border: ${borderWidth}px solid ${borderColor};
      box-sizing: border-box;
    ">
      <table style="
        width: 100%;
        height: 100%;
        border-collapse: collapse;
        font-family: Arial, sans-serif;
        background: white;
        table-layout: fixed;
      ">
  `;
  
  // Set column widths using colgroup for pixel-perfect layout
  html += '<colgroup>';
  for (const width of columnWidths) {
    html += `<col style="width: ${width}px;">`;
  }
  html += '</colgroup>';
  
  // Render header row (first row with bold styling)
  const hasHeader = firstRow.some(cell => cell.fontWeight === 'bold');
  
  if (hasHeader) {
    html += `<thead><tr style="height: ${rowHeights[0]}px;">`;
    for (let col = 0; col < firstRow.length; col++) {
      const cell = firstRow[col];
      html += `
        <th contenteditable="true" style="
          border: ${borderWidth}px solid ${borderColor};
          padding: ${cellPadding}px;
          text-align: left;
          font-weight: ${cell.fontWeight};
          font-size: ${cell.fontSize}px;
          color: ${cell.color};
          background: #f8f9fa;
          cursor: text;
          width: ${columnWidths[col]}px;
          height: ${rowHeights[0]}px;
          box-sizing: border-box;
          vertical-align: top;
        ">${escapeHtml(cell.text)}</th>
      `;
    }
    html += '</tr></thead>';
  }
  
  // Render body rows with exact heights
  html += '<tbody>';
  const startRow = hasHeader ? 1 : 0;
  
  for (let i = startRow; i < table.rows.length; i++) {
    const row = table.rows[i];
    html += `<tr style="height: ${rowHeights[i]}px;">`;
    
    for (let col = 0; col < row.length; col++) {
      const cell = row[col];
      html += `
        <td contenteditable="true" style="
          border: ${borderWidth}px solid ${borderColor};
          padding: ${cellPadding}px;
          font-size: ${cell.fontSize}px;
          font-weight: ${cell.fontWeight};
          color: ${cell.color};
          cursor: text;
          white-space: pre-wrap;
          vertical-align: top;
          width: ${columnWidths[col]}px;
          height: ${rowHeights[i]}px;
          box-sizing: border-box;
        ">${escapeHtml(cell.text)}</td>
      `;
    }
    
    html += '</tr>';
  }
  
  html += '</tbody></table></div>';
  
  return html;
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
 * Check if a text item is within a table boundary
 */
export function isTextInTable(x: number, y: number, tables: TableStructure[]): boolean {
  return tables.some(table => {
    return x >= table.bounds.x && 
           x <= table.bounds.x + table.bounds.width &&
           y >= table.bounds.y && 
           y <= table.bounds.y + table.bounds.height;
  });
}
