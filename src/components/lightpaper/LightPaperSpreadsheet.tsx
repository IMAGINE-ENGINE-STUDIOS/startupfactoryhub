import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Download, Upload, Calculator } from "lucide-react";
import { toast } from "sonner";

const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const INITIAL_ROWS = 20;

interface Cell {
  value: string;
  formula?: string;
}

export function LightPaperSpreadsheet() {
  const [data, setData] = useState<{ [key: string]: Cell }>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  const getCellId = (col: string, row: number) => `${col}${row}`;

  const handleCellChange = (cellId: string, value: string) => {
    setData((prev) => ({
      ...prev,
      [cellId]: { value, formula: value.startsWith("=") ? value : undefined }
    }));
  };

  const evaluateFormula = (formula: string): string => {
    try {
      // Simple formula evaluation (e.g., =A1+B1)
      if (formula.startsWith("=")) {
        const expression = formula.slice(1);
        // Replace cell references with their values
        let evalExpression = expression;
        Object.keys(data).forEach((cellId) => {
          const cellValue = data[cellId].value;
          if (!cellValue.startsWith("=")) {
            evalExpression = evalExpression.replace(new RegExp(cellId, "g"), cellValue || "0");
          }
        });
        // Basic math evaluation
        const result = eval(evalExpression);
        return result.toString();
      }
      return formula;
    } catch {
      return "#ERROR";
    }
  };

  const getCellDisplay = (cellId: string): string => {
    const cell = data[cellId];
    if (!cell) return "";
    if (cell.formula) {
      return evaluateFormula(cell.formula);
    }
    return cell.value;
  };

  const handleExport = () => {
    const csv = [];
    for (let row = 1; row <= INITIAL_ROWS; row++) {
      const rowData = COLUMNS.map((col) => {
        const cellId = getCellId(col, row);
        return `"${getCellDisplay(cellId)}"`;
      });
      csv.push(rowData.join(","));
    }
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spreadsheet.csv";
    a.click();
    toast.success("Spreadsheet exported successfully!");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const csv = e.target?.result as string;
          const rows = csv.split("\n");
          const newData: { [key: string]: Cell } = {};
          rows.forEach((row, rowIndex) => {
            const cells = row.split(",");
            cells.forEach((cell, colIndex) => {
              if (colIndex < COLUMNS.length) {
                const cellId = getCellId(COLUMNS[colIndex], rowIndex + 1);
                newData[cellId] = { value: cell.replace(/"/g, "") };
              }
            });
          });
          setData(newData);
          toast.success("Spreadsheet imported successfully!");
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const calculateSum = () => {
    if (!selectedCell) {
      toast.error("Please select a cell first");
      return;
    }
    const formula = prompt("Enter range (e.g., A1:A5):");
    if (formula) {
      handleCellChange(selectedCell, `=SUM(${formula})`);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={handleImport}>
          <Upload className="h-4 w-4 mr-1" />
          Import CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={calculateSum}>
          <Calculator className="h-4 w-4 mr-1" />
          Calculate
        </Button>
      </div>

      <div className="overflow-auto border rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border bg-muted p-2 w-12 text-xs font-medium">#</th>
              {COLUMNS.map((col) => (
                <th key={col} className="border bg-muted p-2 min-w-[120px] text-xs font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: INITIAL_ROWS }, (_, rowIndex) => {
              const row = rowIndex + 1;
              return (
                <tr key={row}>
                  <td className="border bg-muted p-2 text-xs font-medium text-center">
                    {row}
                  </td>
                  {COLUMNS.map((col) => {
                    const cellId = getCellId(col, row);
                    return (
                      <td key={cellId} className="border p-0">
                        <Input
                          value={selectedCell === cellId ? (data[cellId]?.value || "") : getCellDisplay(cellId)}
                          onChange={(e) => handleCellChange(cellId, e.target.value)}
                          onFocus={() => setSelectedCell(cellId)}
                          className="border-0 rounded-none h-8 text-sm"
                        />
                      </td>
                    );
                  })}
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
  );
}
