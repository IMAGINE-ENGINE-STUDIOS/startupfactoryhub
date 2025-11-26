import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, Upload, Calculator, BookOpen, FileText, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, Keyboard, Undo, Redo } from "lucide-react";
import { toast } from "sonner";
import { FormulaBuilder } from "./FormulaBuilder";
import { FormulaEngine } from "@/lib/formulaEngine";
import { ScientificCalculator } from "@/components/ScientificCalculator";
import { ShortcutsDialog } from "./ShortcutsDialog";
import * as XLSX from "xlsx";
import CollapsibleToolbar from "./CollapsibleToolbar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useIsMobile } from "@/hooks/use-mobile";

// Generate column names: A, B, C, ... Z, AA, AB, ...
const generateColumns = (count: number): string[] => {
  const cols: string[] = [];
  for (let i = 0; i < count; i++) {
    let col = "";
    let num = i;
    while (num >= 0) {
      col = String.fromCharCode(65 + (num % 26)) + col;
      num = Math.floor(num / 26) - 1;
    }
    cols.push(col);
  }
  return cols;
};

const TOTAL_COLUMNS = 26; // A-Z columns (optimized from 50)
const INITIAL_ROWS = 100;
const COLUMN_WIDTH = 120;

interface Cell {
  value: string;
  formula?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
}

export function LightPaperSpreadsheet() {
  const [data, setData] = useState<{ [key: string]: Cell }>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [showFormulas, setShowFormulas] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Spreadsheet");
  const [visibleRows, setVisibleRows] = useState(INITIAL_ROWS);
  const [columns] = useState(() => generateColumns(TOTAL_COLUMNS));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'Delete', handler: () => { if (selectedCell) handleCellChange(selectedCell, ''); }, description: 'Clear cell' },
    { key: '/', ctrl: true, handler: (e) => { e.preventDefault(); setShowShortcutsDialog(true); }, description: 'Shortcuts' },
  ], true);

  const getCellId = (col: string, row: number) => `${col}${row}`;

  const handleCellChange = (cellId: string, value: string) => {
    setData((prev) => ({
      ...prev,
      [cellId]: { 
        ...prev[cellId],
        value, 
        formula: value.startsWith("=") ? value : undefined 
      }
    }));
  };

  const applyFormatting = (format: 'bold' | 'italic' | 'underline' | 'alignLeft' | 'alignCenter' | 'alignRight') => {
    if (!selectedCell) {
      toast.error("Please select a cell first");
      return;
    }

    setData((prev) => {
      const currentCell = prev[selectedCell] || { value: "" };
      let updatedCell = { ...currentCell };

      switch (format) {
        case 'bold':
          updatedCell.bold = !currentCell.bold;
          break;
        case 'italic':
          updatedCell.italic = !currentCell.italic;
          break;
        case 'underline':
          updatedCell.underline = !currentCell.underline;
          break;
        case 'alignLeft':
          updatedCell.align = 'left';
          break;
        case 'alignCenter':
          updatedCell.align = 'center';
          break;
        case 'alignRight':
          updatedCell.align = 'right';
          break;
      }

      return {
        ...prev,
        [selectedCell]: updatedCell
      };
    });

    toast.success("Formatting applied");
  };

  // Infinite scroll handler - load more rows on demand
  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        setVisibleRows(prev => Math.min(prev + 50, 1000));
      }
    };

    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const getCellDisplay = (cellId: string): string => {
    const engine = new FormulaEngine(data);
    return engine.evaluate(cellId);
  };


  const handleInsertFormula = (formula: string) => {
    if (selectedCell) {
      handleCellChange(selectedCell, formula);
      toast.success("Formula inserted!");
    } else {
      toast.error("Please select a cell first");
    }
  };

  const insertCalculatorResult = (value: string) => {
    if (selectedCell) {
      handleCellChange(selectedCell, value);
    }
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([]);
    
    Object.keys(data).forEach((cellId) => {
      const col = cellId.match(/[A-Z]+/)?.[0] || "";
      const row = parseInt(cellId.match(/\d+/)?.[0] || "0");
      const colIndex = columns.indexOf(col);
      
      if (!worksheet[cellId]) {
        worksheet[cellId] = { v: getCellDisplay(cellId), t: "s" };
      }
    });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      XLSX.writeFile(workbook, `${projectTitle}.xlsx`);
      toast.success("Exported to Excel!");
    };

  const handleExportCSV = () => {
    const csv = [];
    for (let row = 1; row <= visibleRows; row++) {
      const rowData = columns.map((col) => {
        const cellId = getCellId(col, row);
        return `"${getCellDisplay(cellId)}"`;
      });
      csv.push(rowData.join(","));
    }
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectTitle}.csv`;
    a.click();
    toast.success("Exported to CSV!");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,.xlsx,.xls";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const fileData = e.target?.result;
          let workbook: XLSX.WorkBook;

          if (file.name.endsWith('.csv')) {
            const text = fileData as string;
            workbook = XLSX.read(text, { type: 'string' });
          } else {
            workbook = XLSX.read(fileData, { type: 'array' });
          }

          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          const newData: { [key: string]: Cell } = {};
          jsonData.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
              if (colIndex < columns.length && cell !== undefined) {
                const cellId = getCellId(columns[colIndex], rowIndex + 1);
                newData[cellId] = { value: String(cell) };
              }
            });
          });

          setData(newData);
          toast.success("File imported successfully!");
        } catch (error) {
          toast.error("Failed to import file");
        }
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  };

  // Memoized cell display for better performance
  const getCellDisplayMemo = useCallback((cellId: string) => {
    return getCellDisplay(cellId);
  }, [data]);

  // Virtualize cells - only render visible cells
  const visibleColumns = isMobile ? columns.slice(0, 10) : columns;

  // Render cells using memo for performance
  const renderCell = useCallback((col: string, row: number) => {
    const cellId = getCellId(col, row);
    const cellData = data[cellId];
    const cellStyle = {
      fontWeight: cellData?.bold ? 'bold' : 'normal',
      fontStyle: cellData?.italic ? 'italic' : 'normal',
      textDecoration: cellData?.underline ? 'underline' : 'none',
      textAlign: (cellData?.align || 'left') as any,
    };

    return (
      <td key={cellId} className="border p-0">
        <Input
          value={selectedCell === cellId ? (data[cellId]?.value || "") : getCellDisplayMemo(cellId)}
          onChange={(e) => handleCellChange(cellId, e.target.value)}
          onFocus={() => setSelectedCell(cellId)}
          className="border-0 rounded-none h-8 text-sm"
          style={cellStyle}
        />
      </td>
    );
  }, [data, selectedCell, getCellDisplayMemo]);

  return (
    <>
      <Card className="p-6">
        <CollapsibleToolbar>
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {/* Formatting */}
            <div className="flex gap-0.5 items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                title="Bold"
                onClick={() => applyFormatting('bold')}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                title="Italic"
                onClick={() => applyFormatting('italic')}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                title="Underline"
                onClick={() => applyFormatting('underline')}
              >
                <Underline className="h-4 w-4" />
              </Button>
            </div>

            {/* Alignment */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                title="Align Left"
                onClick={() => applyFormatting('alignLeft')}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                title="Align Center"
                onClick={() => applyFormatting('alignCenter')}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                title="Align Right"
                onClick={() => applyFormatting('alignRight')}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Formulas */}
            <div className="flex gap-0.5 border-l pl-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Formulas">
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-background z-50" side="right">
                  <FormulaBuilder onSelectFormula={handleInsertFormula} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Calculator */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowCalculator(true)} title="Calculator">
                <Calculator className="h-4 w-4" />
              </Button>
            </div>

            {/* Import/Export */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleImport} title="Import">
                <Upload className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Export">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background z-50">
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Shortcuts Button */}
            <div className="flex gap-0.5 border-l pl-1 ml-auto shrink-0">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowShortcutsDialog(true)} title="Keyboard Shortcuts (Ctrl+/)">
                <Keyboard className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CollapsibleToolbar>

        {/* Optimized Spreadsheet with infinite scroll */}
        <div 
          ref={scrollContainerRef}
          className={`overflow-auto border rounded-lg mt-4 ${isMobile ? 'text-sm' : ''}`} 
          style={{ maxHeight: isMobile ? '400px' : '600px' }}
        >
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="border bg-muted p-2 w-12 text-xs font-medium sticky left-0 z-20">#</th>
                {visibleColumns.map((col) => (
                  <th key={col} className="border bg-muted p-2 min-w-[120px] text-xs font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: visibleRows }, (_, rowIndex) => {
                const row = rowIndex + 1;
                return (
                  <tr key={row}>
                    <td className="border bg-muted p-2 text-xs font-medium text-center sticky left-0 z-10">
                      {row}
                    </td>
                    {visibleColumns.map((col) => renderCell(col, row))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selectedCell && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-1">Selected Cell: {selectedCell}</div>
            <div className="text-xs text-muted-foreground">
              {data[selectedCell]?.formula ? `Formula: ${data[selectedCell].formula}` : "Enter = to start a formula"}
            </div>
          </div>
        )}
      </Card>

      <ScientificCalculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        onInsertResult={insertCalculatorResult}
      />

      <ShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
        type="spreadsheet"
      />
    </>
  );
}
